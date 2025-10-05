import { readFileSync, existsSync } from 'fs'
import path from 'path'

const REQUIRED_ENV_VARS = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'DATABASE_URL']

function parseEnvFile(filePath) {
  const contents = readFileSync(filePath, 'utf8')
  const result = {}
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const equalsIndex = line.indexOf('=')
    if (equalsIndex === -1) continue
    const key = line.slice(0, equalsIndex).trim()
    let value = line.slice(equalsIndex + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function loadEnvCandidates(cwd, explicitFiles) {
  const envValues = {}
  const searchOrder = explicitFiles.length > 0
    ? explicitFiles
    : ['.env.production.local', '.env.production', '.env.local', '.env']

  for (const relative of searchOrder) {
    const filePath = path.isAbsolute(relative) ? relative : path.join(cwd, relative)
    if (!existsSync(filePath)) continue
    try {
      const parsed = parseEnvFile(filePath)
      for (const [key, value] of Object.entries(parsed)) {
        if (!(key in envValues)) {
          envValues[key] = value
        }
      }
    } catch (error) {
      console.warn(`⚠️  Skipped ${relative}: ${error.message}`)
    }
  }

  return envValues
}

function resolveEnvValues(requiredKeys) {
  const explicitArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  const cwd = process.cwd()
  const fileEnv = loadEnvCandidates(cwd, explicitArgs)
  const values = {}
  const missing = []

  for (const key of requiredKeys) {
    const runtimeValue = process.env[key]
    const resolved = runtimeValue ?? fileEnv[key]
    if (!resolved || resolved.trim().length === 0) {
      missing.push(key)
    } else {
      values[key] = resolved.trim()
    }
  }

  return { missing, values }
}

function maskSecret(secret) {
  if (!secret) return '[empty]'
  if (secret.length <= 8) return '[hidden]'
  return `${secret.slice(0, 4)}…${secret.slice(-4)}`
}

function maskConnectionString(conn) {
  if (!conn) return '[empty]'
  try {
    const url = new URL(conn)
    const host = url.host
    const db = url.pathname.replace('/', '') || '[database]'
    return `${url.protocol}//***:***@${host}/${db}`
  } catch (error) {
    return maskSecret(conn)
  }
}

function main() {
  const { missing, values } = resolveEnvValues(REQUIRED_ENV_VARS)

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    for (const key of missing) {
      console.error(`  - ${key}`)
    }
    console.error('\nPass the values via environment variables or provide an env file path, for example:')
    console.error('  NEXTAUTH_URL="https://app.example.com" NEXTAUTH_SECRET="..." DATABASE_URL="postgres://..." \\')
    console.error('    node scripts/check-env.mjs')
    console.error('\nOr specify a file to inspect:')
    console.error('  node scripts/check-env.mjs .env.production')
    process.exit(1)
  }

  console.log('✅ Required environment variables detected:')
  for (const key of REQUIRED_ENV_VARS) {
    const masked = key === 'DATABASE_URL' ? maskConnectionString(values[key]) : maskSecret(values[key])
    console.log(`  - ${key}: ${masked}`)
  }
}

main()
