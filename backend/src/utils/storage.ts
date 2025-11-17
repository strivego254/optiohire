import fs from 'fs/promises'
import path from 'path'

const baseDir = process.env.FILE_STORAGE_DIR || './storage'

export async function ensureStorageDir() {
  await fs.mkdir(baseDir, { recursive: true })
}

export async function saveFile(filename: string, data: Buffer): Promise<string> {
  await ensureStorageDir()
  const filePath = path.join(baseDir, filename)
  await fs.writeFile(filePath, data)
  return filePath
}


