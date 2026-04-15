import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { getEnv } from '@/config/env'

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function createUploader(subfolder: 'logos' | 'avatars' | 'parts' | 'vehicles') {
  const env = getEnv()
  const root = path.resolve(env.UPLOADS_DIR)
  const dest = path.join(root, subfolder)
  ensureDir(dest)

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      cb(null, safe)
    },
  })

  const maxMb = env.UPLOAD_MAX_SIZE_MB
  return multer({
    storage,
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      if (!ok) {
        cb(new Error('Invalid file type'))
        return
      }
      cb(null, true)
    },
  })
}

export const uploadLogo = createUploader('logos').single('file')
export const uploadAvatar = createUploader('avatars').single('file')
export const uploadPartPhoto = createUploader('parts').single('file')
export const uploadVehiclePhoto = createUploader('vehicles').single('file')
