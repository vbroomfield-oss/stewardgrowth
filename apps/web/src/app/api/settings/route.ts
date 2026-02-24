import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// GET /api/settings — Retrieve org settings (API keys stored as JSON)
export async function GET() {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
      select: { settings: true },
    })

    const settings = (org?.settings as Record<string, string>) || {}

    // Mask sensitive values — only return whether they are set
    const masked: Record<string, { isSet: boolean; preview: string }> = {}
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string' && value.length > 0) {
        masked[key] = {
          isSet: true,
          preview: value.slice(0, 6) + '••••••' + value.slice(-4),
        }
      } else {
        masked[key] = { isSet: false, preview: '' }
      }
    }

    return NextResponse.json({ success: true, settings: masked })
  } catch (err) {
    console.error('Failed to load settings:', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

// POST /api/settings — Save org settings (API keys)
export async function POST(req: Request) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { key, value } = body as { key: string; value: string }

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Allowed keys
    const allowedKeys = [
      'ANTHROPIC_API_KEY',
      'GOOGLE_ANALYTICS_MEASUREMENT_ID',
      'GOOGLE_ANALYTICS_API_CREDENTIALS',
      'GOOGLE_SEARCH_CONSOLE_SITE_URL',
      'GOOGLE_ADS_CUSTOMER_ID',
      'META_ADS_ACCESS_TOKEN',
      'META_ADS_ACCOUNT_ID',
      'AHREFS_API_KEY',
      'SEMRUSH_API_KEY',
      'STRIPE_SECRET_KEY',
      'RESEND_API_KEY',
      'SENDGRID_API_KEY',
      'AMAZON_KDP',
      'TELNYX_API_KEY',
      'OPENAI_API_KEY',
    ]

    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: `Key "${key}" is not allowed` }, { status: 400 })
    }

    // Get current settings
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
      select: { settings: true },
    })

    const currentSettings = (org?.settings as Record<string, string>) || {}

    // Update the specific key (empty string removes it)
    if (value && value.trim().length > 0) {
      currentSettings[key] = value.trim()
    } else {
      delete currentSettings[key]
    }

    await db.organization.update({
      where: { id: user.organizationId },
      data: { settings: currentSettings },
    })

    // Log the action
    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: value ? 'API_KEY_SET' : 'API_KEY_REMOVED',
        resource: 'settings',
        resourceId: key,
        success: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: value ? `${key} saved successfully` : `${key} removed`,
    })
  } catch (err) {
    console.error('Failed to save setting:', err)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
}
