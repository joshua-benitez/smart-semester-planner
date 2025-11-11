import * as chrono from "chrono-node";
import { z } from "zod";

export type AssignmentType = "homework" | "quiz" | "project" | "exam";
export type Difficulty = "easy" | "moderate" | "crushing" | "brutal";

export interface ParsedAssignment {
  title: string;
  dueDate: string; // ISO "YYYY-MM-DDTHH:mm" or "TBD"
  type: AssignmentType;
  difficulty: Difficulty;
  confidence: number;       // 0..1
  sourceLines: number[];    // which lines contributed
}

export interface ParseOptions {
  timezone?: string;            // e.g., "America/New_York"
  referenceDate?: Date;         // used by chrono (e.g., start of semester)
  defaultDueTime?: string;      // "23:59"
  semesterStartMonth?: number;  // e.g., 8 (August)
  assumeAcademicYear?: number;  // if month/day only, fill year
  acceptPastDates?: boolean;    // drop obviously ancient dates
}

const DEFAULTS: Required<ParseOptions> = {
  timezone: "America/New_York",
  referenceDate: new Date(),
  defaultDueTime: "23:59",
  semesterStartMonth: 8,
  assumeAcademicYear: new Date().getFullYear(),
  acceptPastDates: true,
};

// clean up the raw syllabus text before parsing
function normalizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")                  // windows newlines -> \n
    .replace(/[–—]/g, "-")                    // en/em dash -> hyphen
    .replace(/\s+\n/g, "\n")                  // trim trailing spaces
    .replace(/\u00A0/g, " ");                 // NBSP -> space
}

function splitKeepIndex(text: string): { line: string; index: number }[] {
  return text
    .split("\n")
    .map((raw, idx) => ({ line: raw.trim(), index: idx }))
    .filter(x => x.line.length > 0);
}

// merge obvious continuation lines so chrono sees the full sentence
function segmentBlocks(lines: { line: string; index: number }[]): { text: string; indices: number[] }[] {
  const blocks: { text: string; indices: number[] }[] = [];
  let buf: string[] = [];
  let idxs: number[] = [];

  const isContinuation = (prev: string, curr: string) => {
    if (!prev) return false;
    if (/[,;–—-]$/.test(prev)) return true;                    // trailing punctuation
    if (/^(\s*[-*•\u2022]|[a-z]\)|\(\w+\)|\d+\.)/.test(curr)) return false; // starts a bullet/list
    if (/^\s{2,}/.test(curr)) return true;                     // indented
    if (/^(\(|:)/.test(curr)) return true;                     // line begins with '(' or ':'
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const { line, index } = lines[i];
    if (buf.length === 0) {
      buf.push(line);
      idxs.push(index);
      continue;
    }
    const prev = buf[buf.length - 1];
    if (isContinuation(prev, line)) {
      buf.push(line);
      idxs.push(index);
    } else {
      blocks.push({ text: buf.join(" "), indices: idxs.slice() });
      buf = [line];
      idxs = [index];
    }
  }
  if (buf.length) blocks.push({ text: buf.join(" "), indices: idxs });
  return blocks;
}

// my quick keyword map so the parser has a clue what type we're dealing with
const KEYWORD_MAP: Record<AssignmentType, string[]> = {
  quiz: ["quiz", "content quiz", "practice quiz"],
  project: ["project", "programming project", "research assignment", "speech", "presentation", "slides"],
  exam: ["exam", "midterm", "final", "test"],
  homework: [
    "assignment", "hw", "lab", "lab assignment",
    "webassign", "reading", "chapter", "participation", "challenge questions",
    "attendance", "worksheet"
  ],
};

const STOP_HEADERS = [
  "due date calendar",
  "assignment opens",
  "alert:",
  "policies", "policy", "late work", "grading", "rubric", "schedule (tentative)"
];

const PLATFORM_KEYWORDS = [
  'brightspace',
  'zybook',
  'webassign',
  'gradescope',
  'canvas',
  'blackboard',
];

function isHeaderNoise(line: string): boolean {
  const lower = line.toLowerCase();
  return STOP_HEADERS.some(h => lower.includes(h));
}

function detectType(line: string): AssignmentType | null {
  const lower = line.toLowerCase();
  for (const [type, words] of Object.entries(KEYWORD_MAP)) {
    if (words.some(w => lower.includes(w))) return type as AssignmentType;
  }
  return null;
}

function defaultDifficulty(type: AssignmentType): Difficulty {
  if (type === "exam") return "crushing";
  if (type === "project") return "brutal";
  return "moderate";
}

// Enhanced date extraction with regex patterns + chrono fallback
function extractISO(dateText: string, opts: Required<ParseOptions>): string | null {
  // Try regex patterns first for common formats that chrono might miss
  const regexPatterns = [
    // MM/DD/YYYY or MM/DD/YY
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    // MM-DD-YYYY or MM-DD-YY
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
    // Month DD, YYYY (e.g., "January 15, 2025")
    /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2}),?\s+(\d{4})/i,
    // Month DD (e.g., "Jan 15" or "January 15")
    /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})(?!\d)/i,
    // DD Month (e.g., "15 Jan" or "15 January")
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?/i,
  ];

  for (const pattern of regexPatterns) {
    const match = dateText.match(pattern);
    if (match) {
      try {
        let d: Date | null = null;

        if (pattern.source.includes('January|February')) {
          // Month name patterns
          if (match[3] && match[3].length === 4) {
            // Full date with year
            d = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
          } else {
            // Month + day only, infer year
            const monthDay = `${match[1]} ${match[2]}`;
            d = new Date(`${monthDay}, ${opts.assumeAcademicYear}`);
            const monthNum = d.getMonth() + 1;
            if (opts.semesterStartMonth && monthNum < opts.semesterStartMonth) {
              d.setFullYear(opts.assumeAcademicYear + 1);
            }
          }
        } else if (pattern.source.includes('\\d{1,2})\\s+')) {
          // DD Month format
          const monthMap: Record<string, number> = {
            jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
            apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
            aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
            nov: 10, november: 10, dec: 11, december: 11,
          };
          const day = parseInt(match[1], 10);
          const month = monthMap[match[2].toLowerCase()];
          d = new Date(opts.assumeAcademicYear, month, day);
          if (opts.semesterStartMonth && month < opts.semesterStartMonth - 1) {
            d.setFullYear(opts.assumeAcademicYear + 1);
          }
        } else {
          // Numeric formats (MM/DD/YYYY or MM-DD-YYYY)
          const month = parseInt(match[1], 10);
          const day = parseInt(match[2], 10);
          let year = parseInt(match[3], 10);
          if (year < 100) year += 2000; // Handle 2-digit years
          d = new Date(year, month - 1, day);
        }

        if (d && !isNaN(d.getTime())) {
          const [hh, mm] = opts.defaultDueTime.split(":").map(Number);
          d.setHours(hh, mm, 0, 0);
          const iso = toLocalISO(d);
          if (!opts.acceptPastDates && new Date(iso) < new Date()) continue;
          return iso;
        }
      } catch (e) {
        // Continue to next pattern or chrono
        continue;
      }
    }
  }

  // Fallback to chrono for natural language dates
  const results = chrono.parse(dateText, opts.referenceDate, { forwardDate: true });
  if (!results.length) return null;
  const last = results[results.length - 1];
  const d = last.start.date();

  if (!last.start.isCertain('year')) {
    const month = last.start.get('month') ?? (d.getMonth() + 1);
    const assumedStartYear = opts.assumeAcademicYear;
    let inferredYear = assumedStartYear;
    if (opts.semesterStartMonth && month < opts.semesterStartMonth) {
      inferredYear = assumedStartYear + 1;
    }
    d.setFullYear(inferredYear);
  }
  const [hh, mm] = opts.defaultDueTime.split(":").map(Number);
  d.setHours(hh, mm, 0, 0);
  const iso = toLocalISO(d);
  if (!opts.acceptPastDates && new Date(iso) < new Date()) return null;
  return iso;
}

function toLocalISO(d: Date): string {
  // local "YYYY-MM-DDTHH:mm" without timezone noise
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// clean up the noisy title text so the UI looks decent
function cleanTitle(raw: string): string {
  let t = raw;
  // ditch trailing "Due..." wording
  t = t.replace(/\b(due|by|deadline)[:\s].*$/i, "").trim();
  // also strip dates inside parentheses
  t = t.replace(/\((?:[^()]*\d[^()]*)\)$/g, "").trim();
  // collapse random spacing
  t = t.replace(/\s{2,}/g, " ");
  // capitalize the front so cards look consistent
  if (t.length) t = t[0].toUpperCase() + t.slice(1);
  return t;
}

// score how confident I am this block is a real assignment
function scoreLine(line: string, hasDate: boolean, type: AssignmentType | null): number {
  let s = 0;
  const lower = line.toLowerCase();
  if (type) s += 0.5;
  if (hasDate) s += 0.3;
  if (/\bchapter\b|\blab\b|\bassign(ment)?\b|\bunit\b/.test(lower)) s += 0.1;
  if (/^[-*•\u2022] /.test(line)) s += 0.05;
  if (/\bquiz|exam|project|hw\b/.test(lower)) s += 0.05;
  return Math.min(1, s);
}

// Detect table/structured formats with Week numbers
function parseWeekBasedFormat(lines: { line: string; index: number }[], opts: Required<ParseOptions>): ParsedAssignment[] {
  const results: ParsedAssignment[] = [];
  let currentWeekStart: Date | null = null;

  for (const { line, index } of lines) {
    // Check for week headers like "Week 1", "Week 2:", etc.
    const weekMatch = line.match(/week\s+(\d+)[:\s-]*(.*)/i);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1], 10);
      // Estimate week start date (assuming semester starts on referenceDate)
      currentWeekStart = new Date(opts.referenceDate);
      currentWeekStart.setDate(currentWeekStart.getDate() + (weekNum - 1) * 7);

      // Check if there's an assignment on the same line
      const restOfLine = weekMatch[2].trim();
      if (restOfLine.length > 10) {
        const type = detectType(restOfLine) ?? "homework";
        const iso = extractISO(restOfLine, opts);
        const title = cleanTitle(restOfLine);

        if (title && (iso || currentWeekStart)) {
          const dueISO = iso || toLocalISO(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)); // End of week
          results.push({
            title,
            dueDate: dueISO,
            type,
            difficulty: defaultDifficulty(type),
            confidence: iso ? 0.8 : 0.5,
            sourceLines: [index],
          });
        }
      }
    } else if (currentWeekStart) {
      // This line might be an assignment for the current week
      const type = detectType(line);
      if (type || line.length > 15) {
        const iso = extractISO(line, opts);
        const title = cleanTitle(line);

        if (title) {
          const dueISO = iso || toLocalISO(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
          results.push({
            title,
            dueDate: dueISO,
            type: type ?? "homework",
            difficulty: defaultDifficulty(type ?? "homework"),
            confidence: iso ? 0.8 : 0.4,
            sourceLines: [index],
          });
        }
      }
    }
  }

  return results;
}

// Detect pipe-separated table formats (| Assignment | Due Date |)
function parseTableFormat(text: string, opts: Required<ParseOptions>): ParsedAssignment[] {
  const results: ParsedAssignment[] = [];
  const lines = text.split('\n');

  let titleCol = -1;
  let dateCol = -1;
  let typeCol = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.includes('|')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);

    // Detect header row
    if (titleCol === -1) {
      for (let j = 0; j < cells.length; j++) {
        const lower = cells[j].toLowerCase();
        if (/assignment|task|work|topic/.test(lower)) titleCol = j;
        if (/due|date|deadline/.test(lower)) dateCol = j;
        if (/type|kind|category/.test(lower)) typeCol = j;
      }
      continue; // Skip header row
    }

    // Skip separator rows (----)
    if (cells.every(c => /^[-:=\s]+$/.test(c))) continue;

    // Parse data row
    if (cells.length > Math.max(titleCol, dateCol)) {
      const titleText = titleCol >= 0 && cells[titleCol] ? cells[titleCol] : '';
      const dateText = dateCol >= 0 && cells[dateCol] ? cells[dateCol] : '';
      const typeText = typeCol >= 0 && cells[typeCol] ? cells[typeCol] : '';

      if (titleText && titleText.length > 2) {
        const iso = dateText ? extractISO(dateText, opts) : null;
        const type = detectType(typeText || titleText) ?? "homework";
        const title = cleanTitle(titleText);

        results.push({
          title,
          dueDate: iso ?? "TBD",
          type,
          difficulty: defaultDifficulty(type),
          confidence: iso ? 0.9 : 0.3,
          sourceLines: [i],
        });
      }
    }
  }

  return results;
}

// Handles grouped formats where dates/platforms are on their own lines
function parseGroupedFormat(lines: { line: string; index: number }[], opts: Required<ParseOptions>): ParsedAssignment[] {
  const results: ParsedAssignment[] = []
  let currentDateIso: string | null = null
  const pending: number[] = []

  const platformRegex = new RegExp(`\\b(${PLATFORM_KEYWORDS.join('|')})\\b`, 'i')
  const assignmentHintRegex = /(assignment|quiz|project|exam|lab|participation|challenge|practice|attendance)/i

  for (const { line, index } of lines) {
    const iso = extractISO(line, opts)
    const platformMatch = platformRegex.exec(line)
    const type = detectType(line)
    const looksLikeAssignment = !!type || assignmentHintRegex.test(line)

    if (iso && !looksLikeAssignment && line.length <= 40) {
      currentDateIso = iso
      // Update any pending assignments that were waiting for a date
      for (const pendingIndex of pending) {
        results[pendingIndex].dueDate = iso
        results[pendingIndex].confidence = Math.min(1, results[pendingIndex].confidence + 0.3)
      }
      pending.length = 0
      continue
    }

    if (!looksLikeAssignment) {
      continue
    }

    const dueISO = iso ?? currentDateIso
    const title = cleanTitle(line)
    const resolvedType = type ?? 'homework'
    const confidence = scoreLine(line, !!dueISO, type ?? null)

    const record: ParsedAssignment = {
      title: title || line,
      dueDate: dueISO ?? 'TBD',
      type: resolvedType,
      difficulty: defaultDifficulty(resolvedType),
      confidence,
      sourceLines: [index],
    }

    const recordIndex = results.push(record) - 1
    if (!dueISO) {
      pending.push(recordIndex)
    }

  }

  return results
}

// main parse entry point used by the syllabus modal
export function parseSyllabus(input: string, options?: ParseOptions): ParsedAssignment[] {
  const opts = { ...DEFAULTS, ...(options || {}) };
  const text = normalizeText(input);

  // Try specialized parsers first
  const out: ParsedAssignment[] = [];
  const lines = splitKeepIndex(text).filter(({ line }) => !isHeaderNoise(line));

  const groupedResults = parseGroupedFormat(lines, opts)
  if (groupedResults.length > 0) {
    out.push(...groupedResults)
  }

  // Check for table format
  if (out.length === 0 && text.includes('|') && text.split('|').length > 10) {
    const tableResults = parseTableFormat(text, opts);
    if (tableResults.length > 0) {
      out.push(...tableResults);
    }
  }

  // Check for week-based format
  if (out.length === 0 && text.match(/week\s+\d+/i)) {
    const weekResults = parseWeekBasedFormat(lines, opts);
    if (weekResults.length > 0) {
      out.push(...weekResults);
    }
  }

  // Fallback to original block-based parsing
  if (out.length === 0) {
    const blocks = segmentBlocks(lines);

    for (const block of blocks) {
      const raw = block.text;
      const type = detectType(raw) ?? "homework";
      const iso = extractISO(raw, opts);

      // if the date wasn't in the block, take a second pass for trailing "due:" text
      let dueISO = iso;
      if (!dueISO) {
        const match = raw.match(/(?:due|by)[:\s]+([^.;]+)[.;]?/i);
        if (match) {
          dueISO = extractISO(match[1], opts);
        }
      }

      // skip anything that doesn't feel like an assignment
      const looksLikeAssignment = detectType(raw) !== null || !!dueISO || /\bchapter\b|\bchapter\s*\d+\b/i.test(raw);
      if (!looksLikeAssignment) continue;

      const title = cleanTitle(raw);
      const dueDate = dueISO ?? "TBD";
      const confidence = scoreLine(raw, !!dueISO, detectType(raw));

      out.push({
        title: title || raw.slice(0, 140),
        dueDate,
        type,
        difficulty: defaultDifficulty(type),
        confidence,
        sourceLines: block.indices,
      });
    }
  }

  // remove accidental duplicates caused by syllabus formatting quirks
  const seen = new Set<string>();
  const deduped: ParsedAssignment[] = [];
  for (const a of out) {
    const key = `${a.title.toLowerCase()}|${a.dueDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(a);
  }
  return deduped;
}

// schema keeps downstream consumers honest without trusting my string parsing
export const ParsedAssignmentSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().min(3),
  type: z.enum(["homework", "quiz", "project", "exam"]),
  difficulty: z.enum(["easy", "moderate", "crushing", "brutal"]),
  confidence: z.number().min(0).max(1),
  sourceLines: z.array(z.number()),
});
