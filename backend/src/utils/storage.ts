import fs from 'fs/promises'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const baseDir = process.env.FILE_STORAGE_DIR || './storage'

let s3Client: S3Client | null = null

/**
 * Initialize S3 client if credentials are provided
 */
function getS3Client(): S3Client | null {
  const s3Bucket = process.env.S3_BUCKET
  const s3AccessKey = process.env.S3_ACCESS_KEY
  const s3SecretKey = process.env.S3_SECRET_KEY

  if (!s3Bucket || !s3AccessKey || !s3SecretKey) {
    return null
  }

  if (!s3Client) {
    const s3Config: any = {
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey
      }
    }

    // Add custom endpoint for Supabase or other S3-compatible services
    if (process.env.S3_ENDPOINT) {
      s3Config.endpoint = process.env.S3_ENDPOINT
      s3Config.forcePathStyle = true // Required for Supabase storage
    }

    s3Client = new S3Client(s3Config)
  }

  return s3Client
}

export async function ensureStorageDir() {
  await fs.mkdir(baseDir, { recursive: true })
}

/**
 * Save file to local storage or S3
 * Returns URL or file path
 */
export async function saveFile(filename: string, data: Buffer): Promise<string> {
  const s3Client = getS3Client()
  const s3Bucket = process.env.S3_BUCKET

  // If S3 is configured, upload to S3
  if (s3Client && s3Bucket) {
    try {
      const command = new PutObjectCommand({
        Bucket: s3Bucket,
        Key: filename,
        Body: data,
        ContentType: filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
      })

      await s3Client.send(command)

      // Return S3 URL
      const s3Url = process.env.S3_BUCKET_URL || `https://${s3Bucket}.s3.amazonaws.com`
      return `${s3Url}/${filename}`
    } catch (error) {
      console.error('Failed to upload to S3, falling back to local storage:', error)
      // Fall through to local storage
    }
  }

  // Fallback to local storage
  await ensureStorageDir()
  const filePath = path.join(baseDir, filename)
  
  // Ensure the directory for the file exists (including subdirectories)
  const dirPath = path.dirname(filePath)
  await fs.mkdir(dirPath, { recursive: true })
  
  await fs.writeFile(filePath, data)
  return filePath
}


