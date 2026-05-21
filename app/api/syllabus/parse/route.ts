import { UnauthorizedError } from '@/lib/errors'
import { requireAuth } from '@/lib/get-current-user'
import { parseSyllabusHybrid } from '@/lib/syllabus-ai'
import { err, ok } from '@/server/responses'
import { z } from 'zod'

const SyllabusParseRequestSchema = z.object({
  text: z.string().min(1).max(120_000),
  timezone: z.string().optional(),
  referenceDate: z.string().optional(),
  defaultDueTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  assumeAcademicYear: z.number().int().min(2000).max(2100).optional(),
})

export async function POST(request: Request) {
  try {
    await requireAuth()

    const json = await request.json()
    const parsed = SyllabusParseRequestSchema.safeParse(json)
    if (!parsed.success) {
      return err('Invalid syllabus parse payload', 400, 'validation_error', parsed.error.flatten())
    }

    const referenceDate = parsed.data.referenceDate ? new Date(parsed.data.referenceDate) : new Date()
    if (isNaN(referenceDate.getTime())) {
      return err('Invalid referenceDate', 400, 'validation_error')
    }

    const result = await parseSyllabusHybrid(parsed.data.text, {
      timezone: parsed.data.timezone,
      referenceDate,
      defaultDueTime: parsed.data.defaultDueTime ?? '23:59',
      assumeAcademicYear: parsed.data.assumeAcademicYear ?? referenceDate.getFullYear(),
      acceptPastDates: true,
    })

    return ok(result)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }

    console.error('Syllabus parser API error:', error)
    return err('Failed to parse syllabus', 500, 'server_error')
  }
}
