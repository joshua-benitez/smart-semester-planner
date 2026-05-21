import assert from 'node:assert'
import { parseSyllabus } from '@/lib/parser'

type Fixture = {
  name: string
  text: string
  expectedTitles: string[]
}

const referenceDate = new Date('2026-08-20T12:00:00Z')

const fixtures: Fixture[] = [
  {
    name: 'week schedule',
    text: `Week 1
- Homework 1: Limits (due Aug 28)
Week 2
Quiz 1 - Sept 2 at 11:59pm
Project kickoff due Sept 15`,
    expectedTitles: ['Homework 1: Limits', 'Quiz 1', 'Project kickoff'],
  },
  {
    name: 'markdown table',
    text: `| Assignment | Type | Due Date |
| --- | --- | --- |
| Essay Draft | homework | Oct 4 |
| Midterm Exam | exam | Oct 18 |
| Final Project | project | Dec 6 |`,
    expectedTitles: ['Essay Draft', 'Midterm Exam', 'Final Project'],
  },
  {
    name: 'grouped date lines',
    text: `September 10
Reading Quiz 2
Lab Assignment: Data Cleaning

September 24
Discussion Post 3
Unit Test`,
    expectedTitles: ['Reading Quiz 2', 'Lab Assignment: Data Cleaning', 'Discussion Post 3', 'Unit Test'],
  },
  {
    name: 'noisy policy text',
    text: `Late work loses 10% per day.
Office hours are Monday and Wednesday.
11/14 - Unit Test
Final Paper due Dec 2 by 11:59pm
Read Chapter 8 before class.`,
    expectedTitles: ['Unit Test', 'Final Paper'],
  },
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

let expectedTotal = 0
let matchedTotal = 0
let parsedTotal = 0
let datedTotal = 0
let duplicateTotal = 0

const rows = fixtures.map((fixture) => {
  const parsed = parseSyllabus(fixture.text, {
    referenceDate,
    assumeAcademicYear: referenceDate.getFullYear(),
    defaultDueTime: '23:59',
    timezone: 'America/New_York',
    acceptPastDates: true,
  })
  const parsedTitles = parsed.map((item) => normalize(item.title))
  const matched = fixture.expectedTitles.filter((title) => parsedTitles.includes(normalize(title))).length
  const uniqueKeys = new Set(parsed.map((item) => `${normalize(item.title)}|${item.dueDate}`))
  const duplicates = parsed.length - uniqueKeys.size
  const dated = parsed.filter((item) => item.dueDate !== 'TBD').length

  expectedTotal += fixture.expectedTitles.length
  matchedTotal += matched
  parsedTotal += parsed.length
  datedTotal += dated
  duplicateTotal += duplicates

  return {
    fixture: fixture.name,
    expected: fixture.expectedTitles.length,
    matched,
    parsed: parsed.length,
    dated,
    duplicates,
  }
})

const recall = matchedTotal / expectedTotal
const precision = matchedTotal / parsedTotal
const datedRate = parsedTotal > 0 ? datedTotal / parsedTotal : 0

console.table(rows)
console.log(`Parser eval recall: ${matchedTotal}/${expectedTotal} (${Math.round(recall * 100)}%)`)
console.log(`Parser eval precision: ${matchedTotal}/${parsedTotal} (${Math.round(precision * 100)}%)`)
console.log(`Parsed items with due dates: ${datedTotal}/${parsedTotal} (${Math.round(datedRate * 100)}%)`)
console.log(`Duplicate rows: ${duplicateTotal}`)

assert.ok(recall >= 0.8, 'expected parser recall to stay at or above 80% on eval fixtures')
assert.ok(precision >= 0.8, 'expected parser precision to stay at or above 80% on eval fixtures')
assert.strictEqual(duplicateTotal, 0, 'expected no duplicate parser rows')
