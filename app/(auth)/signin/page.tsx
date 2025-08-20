'use client'

import React from 'react'
import { signIn } from 'next-auth/react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <h2 className="text-3xl font-bold text-center">Sign in to Smart Semester Planner</h2>
        <p className="text-center text-sm text-gray-600">
          Use your campus account or continue as a guest for local dev.
        </p>

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => signIn()}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700"
            type="button"
          >
            Sign in
          </button>

          <button
            onClick={() => {
              // lightweight local guest fallback during dev
              // in real app replace with proper guest flow
              void (async () => {
                localStorage.setItem('dev-guest', 'true')
                location.href = '/'
              })()
            }}
            className="w-full border border-gray-300 py-2 rounded-md"
            type="button"
          >
            Continue as guest (dev)
          </button>
        </div>
      </div>
    </div>
  )
}
