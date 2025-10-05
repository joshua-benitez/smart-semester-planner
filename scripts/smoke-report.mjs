const checklist = [
  {
    title: 'Launch production build locally',
    steps: [
      'Start the built app: npm run start',
      'Wait for "Ready" output (defaults to http://localhost:3000)',
    ],
  },
  {
    title: 'Verify API health',
    steps: [
      'In another terminal, run: curl -i http://localhost:3000/api/assignments',
      'Expect 401 Unauthorized when no session cookie is present',
      'Sign in via the UI or reuse a session cookie, then repeat to confirm 200 OK with JSON payload',
    ],
  },
  {
    title: 'Check authentication flows',
    steps: [
      'Visit http://localhost:3000/auth/signup and create a test user',
      'Sign out and sign back in at /auth/signin to confirm credentials are accepted',
      'Visit /dashboard and ensure protected pages load for the signed-in user',
    ],
  },
  {
    title: 'Assignment lifecycle',
    steps: [
      'Create a course and assignment from the dashboard',
      'Mark it complete, then reopen it to verify ladder updates and status changes',
      'Delete the assignment and confirm it disappears from the list and ladder ties are reverted',
    ],
  },
  {
    title: 'Calendar and parser sanity checks',
    steps: [
      'Open /calendar to confirm newly-created assignments appear on the correct dates',
      'Use the syllabus parser to import at least one item and ensure it matches expectations',
    ],
  },
]

function printHeading(title) {
  console.log('\n' + title)
  console.log('-'.repeat(title.length))
}

function printStepList(item, index) {
  printHeading(`${index + 1}. ${item.title}`)
  item.steps.forEach((step, stepIndex) => {
    console.log(`  ${index + 1}.${stepIndex + 1} ${step}`)
  })
}

console.log('✅ Build succeeded. Complete the manual smoke checklist before deploy:')
checklist.forEach((item, index) => {
  printStepList(item, index)
})
console.log('\nTip: once the checks pass locally, replicate the same commands against your Vercel preview URL to finalize the release.')
