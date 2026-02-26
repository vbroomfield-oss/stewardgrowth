import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body as { name: string }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
    }

    // Generate the full API key
    const fullKey = `sg_${crypto.randomUUID().replace(/-/g, '')}`

    // Extract prefix (first 8 chars after sg_) for display
    const keyPrefix = fullKey.slice(0, 11) // "sg_" + first 8 chars

    // Hash the full key for secure storage
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex')

    // Store in database
    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        keyPrefix,
        keyHash,
        organizationId: user.organizationId,
        createdById: user.id,
      },
    })

    // Log the action
    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'API_KEY_CREATED',
        resource: 'apiKey',
        resourceId: apiKey.id,
        success: true,
      },
    })

    return NextResponse.json({
      success: true,
      key: fullKey, // Return the full key once — it won't be shown again
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt,
      },
    })
  } catch (err) {
    console.error('Failed to create API key:', err)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
