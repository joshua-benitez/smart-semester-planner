import { z } from 'zod'
import { parseSyllabus, type ParseOptions, type ParsedAssignment } from '@/lib/parser'

type ParseSource = 'ai' | 'heuristic'

export type SyllabusParseDiagnostics = {
  source: ParseSource
  aiAvailable: boolean
  fallbackUsed: boolean
  model?: string
  reason?: string
  aiCount: number
  heuristicCount: number
}

export type SyllabusParseResult = {
  assignments: ParsedAssignment[]
  diagnostics: SyllabusParseDiagnostics
}

const AiAssignmentSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().min(3),
  type: z.enum(['homework', 'quiz', 'project', 'exam']),
  difficulty: z.enum(['easy', 'moderate', 'crushing', 'brutal']),
  confidence: z.number(),
  sourceText: z.string(),
})

const AiSyllabusSchema = z.object({
  assignments: z.array(AiAssignmentSchema),
})

const OPENAI_SYLLABUS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    assignments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: {
            type: 'string',
            description: 'Clean assignment name without dates, week labels, or due-date wording.',
          },
          dueDate: {
            type: 'string',
            description: "YYYY-MM-DDTHH:mm using the user's local timezone, or TBD when no due date is stated.",
          },
          type: {
            type: 'string',
            enum: ['homework', 'quiz', 'project', 'exam'],
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'moderate', 'crushing', 'brutal'],
          },
          confidence: {
            type: 'number',
            description: '0 to 1 confidence that this is a graded item and the due date is correct.',
          },
          sourceText: {
            type: 'string',
            description: 'Short source phrase from the syllabus that supports this item.',
          },
        },
        required: ['title', 'dueDate', 'type', 'difficulty', 'confidence', 'sourceText'],
      },
    },
  },
  required: ['assignments'],
} as const

function normalizeDueDate(raw: string): string {
  const value = raw.trim()
  if (!value || value.toUpperCase() === 'TBD') return 'TBD'

  const localDateTime = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (localDateTime) return `${localDateTime[1]}T${localDateTime[2]}:${localDateTime[3]}`

  const parsed = new Date(value)
  if (isNaN(parsed.getTime())) return 'TBD'

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

function normalizeTitle(title: string): string {
  const normalized = title.replace(/\s{2,}/g, ' ').trim()
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : ''
}

function normalizeAiAssignments(assignments: z.infer<typeof AiAssignmentSchema>[]): ParsedAssignment[] {
  return assignments
    .map((item) => ({
      title: normalizeTitle(item.title),
      dueDate: normalizeDueDate(item.dueDate),
      type: item.type,
      difficulty: item.difficulty,
      confidence: Math.max(0, Math.min(1, item.confidence)),
      sourceLines: [],
    }))
    .filter((item) => item.title.length > 2)
}

function assignmentKey(item: ParsedAssignment): string {
  const title = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return `${title}|${item.dueDate}`
}

function mergeAssignments(primary: ParsedAssignment[], fallback: ParsedAssignment[]) {
  const merged: ParsedAssignment[] = []
  const seen = new Set<string>()

  for (const item of [...primary, ...fallback]) {
    const key = assignmentKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }

  return merged.sort((a, b) => {
    if (a.dueDate === 'TBD' && b.dueDate !== 'TBD') return 1
    if (a.dueDate !== 'TBD' && b.dueDate === 'TBD') return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
}

function extractOutputText(body: any): string | null {
  if (typeof body?.output_text === 'string') return body.output_text

  const chunks: string[] = []
  for (const output of body?.output ?? []) {
    for (const content of output?.content ?? []) {
      if (typeof content?.refusal === 'string') {
        throw new Error(content.refusal)
      }
      if (typeof content?.text === 'string') {
        chunks.push(content.text)
      }
    }
  }

  return chunks.length ? chunks.join('') : null
}

async function parseWithOpenAI(input: string, opts: Required<ParseOptions>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { assignments: [], reason: 'OPENAI_API_KEY is not configured' }

  const model = process.env.OPENAI_SYLLABUS_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [
            'You extract graded coursework from college syllabi.',
            'Return only assignments, quizzes, projects, exams, labs, papers, and other graded deliverables.',
            'Ignore policies, grading scales, readings without a graded deliverable, office hours, and instructor information.',
            'Do not invent due dates. Use TBD if the syllabus does not state a due date.',
            'Default missing times to the provided default due time.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Academic year for missing years: ${opts.assumeAcademicYear}`,
            `Reference date: ${opts.referenceDate.toISOString()}`,
            `Timezone: ${opts.timezone}`,
            `Default due time: ${opts.defaultDueTime}`,
            'Syllabus text:',
            input,
          ].join('\n'),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'syllabus_assignments',
          strict: true,
          schema: OPENAI_SYLLABUS_SCHEMA,
        },
      },
      max_output_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`OpenAI syllabus parse failed: ${message}`)
  }

  const body = await response.json()
  const outputText = extractOutputText(body)
  if (!outputText) throw new Error('OpenAI syllabus parse returned no text output')

  const parsedJson = JSON.parse(outputText)
  const parsed = AiSyllabusSchema.parse(parsedJson)

  return {
    assignments: normalizeAiAssignments(parsed.assignments),
    model,
  }
}

export async function parseSyllabusHybrid(input: string, options?: ParseOptions): Promise<SyllabusParseResult> {
  const opts = {
    timezone: options?.timezone ?? 'America/New_York',
    referenceDate: options?.referenceDate ?? new Date(),
    defaultDueTime: options?.defaultDueTime ?? '23:59',
    semesterStartMonth: options?.semesterStartMonth ?? 8,
    assumeAcademicYear: options?.assumeAcademicYear ?? options?.referenceDate?.getFullYear() ?? new Date().getFullYear(),
    acceptPastDates: options?.acceptPastDates ?? true,
  }

  const heuristicAssignments = parseSyllabus(input, opts)

  try {
    const aiResult = await parseWithOpenAI(input, opts)
    if (!aiResult.assignments.length) {
      return {
        assignments: heuristicAssignments,
        diagnostics: {
          source: 'heuristic',
          aiAvailable: Boolean(process.env.OPENAI_API_KEY),
          fallbackUsed: true,
          model: aiResult.model,
          reason: aiResult.reason ?? 'AI returned no assignments',
          aiCount: 0,
          heuristicCount: heuristicAssignments.length,
        },
      }
    }

    const merged = mergeAssignments(aiResult.assignments, heuristicAssignments)
    return {
      assignments: merged,
      diagnostics: {
        source: 'ai',
        aiAvailable: true,
        fallbackUsed: merged.length > aiResult.assignments.length,
        model: aiResult.model,
        aiCount: aiResult.assignments.length,
        heuristicCount: heuristicAssignments.length,
      },
    }
  } catch (error) {
    return {
      assignments: heuristicAssignments,
      diagnostics: {
        source: 'heuristic',
        aiAvailable: Boolean(process.env.OPENAI_API_KEY),
        fallbackUsed: true,
        reason: error instanceof Error ? error.message : 'AI parsing failed',
        aiCount: 0,
        heuristicCount: heuristicAssignments.length,
      },
    }
  }
}
