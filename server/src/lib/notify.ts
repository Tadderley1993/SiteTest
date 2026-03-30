import { prisma } from './prisma.js'
import { logger } from './logger.js'

/**
 * Creates a notification record. Non-fatal — errors are swallowed so they
 * never break the calling operation.
 */
export async function createNotification(
  type: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Notification" (type, title, body, read, "createdAt") VALUES ($1, $2, $3, false, NOW())`,
      type, title, body,
    )
  } catch (e) {
    logger.error({ err: e }, '[notify] Failed to create notification')
  }
}
