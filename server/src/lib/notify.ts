import { prisma } from './prisma.js'

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
    console.error('[notify] Failed to create notification:', e)
  }
}
