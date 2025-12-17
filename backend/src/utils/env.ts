import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

declare global {
  // eslint-disable-next-line no-var
  var __OPTIOHIRE_ENV_LOADED__: boolean | undefined
}

/**
 * Loads `backend/.env` once, early, for ESM execution.
 * Many modules in this codebase read env at import-time; preloading avoids production-only failures.
 */
const loadEnvOnce = () => {
  if (globalThis.__OPTIOHIRE_ENV_LOADED__) return

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const envPath = path.resolve(__dirname, '../../.env')

  dotenv.config({ path: envPath })
  globalThis.__OPTIOHIRE_ENV_LOADED__ = true
}

loadEnvOnce()


