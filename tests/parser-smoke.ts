import assert from 'node:assert'
import { parseSyllabus } from '@/lib/parser'

const referenceDate = new Date('2024-08-20T12:00:00Z')
const sample = `Week 1
- Homework 1: Limits (due Aug 28)
Week 2
Quiz 1 – Sept 2 at 11:59pm
Project kickoff due Sept 15
Project kickoff due Sept 15
`

const parsed = parseSyllabus(sample, {
  referenceDate,
  defaultDueTime: '23:59',
  timezone: 'America/New_York',
  acceptPastDates: true,
})

assert.ok(parsed.length >= 2, 'expected at least two assignments')

const homework = parsed.find(item => item.title.includes('Homework 1'))
assert.ok(homework, 'homework item should be detected')
assert.notStrictEqual(homework?.dueDate, 'TBD', 'homework should have a due date')
assert.strictEqual(homework?.type, 'homework')

const quiz = parsed.find(item => item.type === 'quiz')
assert.ok(quiz, 'quiz item should be detected')
assert.ok((quiz?.confidence ?? 0) > 0.3, 'quiz confidence should be reasonable')

const uniqueTitles = new Set(parsed.map(item => item.title.toLowerCase()))
assert.strictEqual(uniqueTitles.size, parsed.length, 'duplicate assignments should be removed')

console.log('✅ parser smoke check passed with', parsed.length, 'assignments')
