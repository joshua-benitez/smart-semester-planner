import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { validateSignUp } from '@/lib/validations'
import { ok, err } from '@/server/responses'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const validationError = validateSignUp(payload)
    if (validationError) {
      return err(validationError, 400, 'validation_error')
    }

    const name = typeof payload.name === 'string' ? payload.name.trim() : undefined
    const email = payload.email.trim()
    const password = payload.password

    // make sure we don't double-create the same email
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    })

    if (existingUser) {
      return err('User already exists with this email', 400, 'conflict')
    }

    // hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 12)

    // save the user record
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
    }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return err('Internal server error', 500, 'server_error')
  }
}
