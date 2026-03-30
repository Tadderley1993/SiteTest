import { Router, Request, Response } from 'express'
import { GoogleGenAI } from '@google/genai'
import { logger } from '../lib/logger.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, numberOfImages = 2, aspectRatio = '1:1' } = req.body

    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'GOOGLE_AI_API_KEY is not set in .env' })
    }

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt.trim(),
      config: {
        numberOfImages: Math.min(Math.max(numberOfImages, 1), 4),
        aspectRatio,
      },
    })

    const images = (response.generatedImages ?? []).map(img => ({
      data: img.image?.imageBytes ?? '',
      mimeType: 'image/jpeg',
    }))

    res.json({ images })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    logger.error({ err: message }, 'Image generation error')
    res.status(500).json({ error: message })
  }
})

export { router as imageGenRouter }
