export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log('[INFO]', msg, meta || ''),
  error: (msg: string, meta?: Record<string, unknown>) => console.error('[ERROR]', msg, meta || ''),
  warn: (msg: string, meta?: Record<string, unknown>) => console.warn('[WARN]', msg, meta || ''),
  debug: (msg: string, meta?: Record<string, unknown>) => console.debug('[DEBUG]', msg, meta || '')
}


