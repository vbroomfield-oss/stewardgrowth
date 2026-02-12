import { PrismaClient } from '@stewardgrowth/database'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Cache Prisma client in BOTH development and production
// This prevents connection pool exhaustion in serverless environments
globalForPrisma.prisma = db

export default db
