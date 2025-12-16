import { NextResponse } from 'next/server'

type OkInit = number | ResponseInit | undefined

export function ok<T>(data: T, init?: OkInit) {
  const responseInit = typeof init === 'number' ? { status: init } : init
  return NextResponse.json({ ok: true, data }, responseInit)
}

export function err(message: string, status: number = 400, code: string = 'error', details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status })
}
