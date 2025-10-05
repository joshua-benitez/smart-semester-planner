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

// date extraction via chrono; lot of edge cases so we massage the result
function extractISO(dateText: string, opts: Required<ParseOptions>): string | null {
  // run chrono relative to the reference date (usually semester start)
  const results = chrono.parse(dateText, opts.referenceDate, { forwardDate: true });
  if (!results.length) return null;
  // grab the last date on the line since profs love "opens X, due Y"
  const last = results[results.length - 1];
  const d = last.start.date(); // JS Date

  if (!last.start.isCertain('year')) {
    const month = last.start.get('month') ?? (d.getMonth() + 1);
    const assumedStartYear = opts.assumeAcademicYear;
    let inferredYear = assumedStartYear;
    if (opts.semesterStartMonth && month < opts.semesterStartMonth) {
      inferredYear = assumedStartYear + 1;
    }
    d.setFullYear(inferredYear);
  }
  // assume a default due time if the prof only gave a date
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

// main parse entry point used by the syllabus modal
export function parseSyllabus(input: string, options?: ParseOptions): ParsedAssignment[] {
  const opts = { ...DEFAULTS, ...(options || {}) };
  const text = normalizeText(input);
  const lines = splitKeepIndex(text).filter(({ line }) => !isHeaderNoise(line));
  const blocks = segmentBlocks(lines);

  const out: ParsedAssignment[] = [];

  for (const block of blocks) {
    const raw = block.text;
    const type = detectType(raw) ?? "homework";
    const iso = extractISO(raw, opts);          // first try to grab a date in the same block

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
