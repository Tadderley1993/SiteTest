import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      passwordHash,
      isActive: true,
      role: 'ADMIN',
    },
    update: {
      passwordHash,
      isActive: true,
      role: 'ADMIN',
    },
  })

  console.log({ admin })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
