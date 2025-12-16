import { NextResponse } from 'next/server'

type OkInit = number | ResponseInit | undefined

export function ok<T>(data: T, init?: OkInit) {
  return NextResponse.json({ ok: true, data }, init)
}

export function err(message: string, status: number = 400, code: string = 'error', details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status })
}
