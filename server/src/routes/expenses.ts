import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authMiddleware } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const router = Router()
router.use(authMiddleware)

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.heic']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
})

router.get('/', async (_req, res) => {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } })
    res.json(expenses)
  } catch { res.status(500).json({ error: 'Failed to fetch expenses' }) }
})

router.post('/', async (req, res) => {
  try {
    const expense = await prisma.expense.create({ data: req.body })
    res.json(expense)
  } catch { res.status(500).json({ error: 'Failed to create expense' }) }
})

router.put('/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.update({ where: { id: parseInt(req.params.id) }, data: req.body })
    res.json(expense)
  } catch { res.status(500).json({ error: 'Failed to update expense' }) }
})

router.delete('/:id', async (req, res) => {
  try {
    // Clean up receipt file if exists
    const exp = await prisma.expense.findUnique({ where: { id: parseInt(req.params.id) } })
    if (exp?.receiptPath) {
      const fp = path.join(uploadsDir, exp.receiptPath)
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
    }
    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Failed to delete expense' }) }
})

// POST /api/admin/expenses/:id/receipt
router.post('/:id/receipt', receiptUpload.single('receipt'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // Delete old receipt if exists
    const existing = await prisma.expense.findUnique({ where: { id: parseInt(req.params.id) } })
    if (existing?.receiptPath) {
      const old = path.join(uploadsDir, existing.receiptPath)
      if (fs.existsSync(old)) fs.unlinkSync(old)
    }

    const updated = await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data: { receiptPath: req.file.filename, receiptName: req.file.originalname },
    })
    res.json(updated)
  } catch (error) {
    console.error('Receipt upload error:', error)
    res.status(500).json({ error: 'Receipt upload failed' })
  }
})

// GET /api/admin/expenses/:id/receipt
router.get('/:id/receipt', async (req, res) => {
  try {
    const exp = await prisma.expense.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!exp?.receiptPath) return res.status(404).json({ error: 'No receipt' })
    const fp = path.join(uploadsDir, exp.receiptPath)
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' })
    res.setHeader('Content-Disposition', `inline; filename="${exp.receiptName ?? 'receipt'}"`)
    res.setHeader('Content-Type', exp.receiptPath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
    fs.createReadStream(fp).pipe(res)
  } catch { res.status(500).json({ error: 'Failed to get receipt' }) }
})

// DELETE /api/admin/expenses/:id/receipt
router.delete('/:id/receipt', async (req, res) => {
  try {
    const exp = await prisma.expense.findUnique({ where: { id: parseInt(req.params.id) } })
    if (exp?.receiptPath) {
      const fp = path.join(uploadsDir, exp.receiptPath)
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
    }
    const updated = await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data: { receiptPath: null, receiptName: null },
    })
    res.json(updated)
  } catch { res.status(500).json({ error: 'Failed to delete receipt' }) }
})

export { router as expensesRouter }
