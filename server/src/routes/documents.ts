import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'
import { createNotification } from '../lib/notify.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '../../uploads')

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const stored = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, stored)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.xlsx', '.xls', '.txt']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

// POST /api/admin/clients/:id/documents
router.post('/:clientId/documents', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const { docType } = req.body
    const doc = await prisma.clientDocument.create({
      data: {
        clientId: parseInt(req.params.clientId),
        fileName: req.file.originalname,
        storedName: req.file.filename,
        docType: docType || 'other',
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    })
    await createNotification(
      'file_uploaded',
      'File uploaded',
      `"${req.file.originalname}" uploaded for client #${req.params.clientId}`,
    )
    res.json(doc)
  } catch (error) {
    console.error('Error uploading document:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// GET /api/admin/clients/:id/documents
router.get('/:clientId/documents', async (req, res) => {
  try {
    const docs = await prisma.clientDocument.findMany({
      where: { clientId: parseInt(req.params.clientId) },
      orderBy: { createdAt: 'desc' },
    })
    res.json(docs)
  } catch {
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

// GET /api/admin/documents/:docId/download
router.get('/download/:docId', async (req, res) => {
  try {
    const doc = await prisma.clientDocument.findUnique({
      where: { id: parseInt(req.params.docId) },
    })
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    const filePath = path.join(uploadsDir, doc.storedName)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' })
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`)
    res.setHeader('Content-Type', doc.mimeType)
    fs.createReadStream(filePath).pipe(res)
  } catch {
    res.status(500).json({ error: 'Download failed' })
  }
})

// DELETE /api/admin/clients/:clientId/documents/:docId
router.delete('/:clientId/documents/:docId', async (req, res) => {
  try {
    const doc = await prisma.clientDocument.findUnique({
      where: { id: parseInt(req.params.docId) },
    })
    if (doc) {
      const filePath = path.join(uploadsDir, doc.storedName)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      await prisma.clientDocument.delete({ where: { id: doc.id } })
    }
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Delete failed' })
  }
})

export { router as documentsRouter }
