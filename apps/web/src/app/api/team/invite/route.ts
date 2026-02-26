import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { sendEmail } from '@/lib/email/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export async function POST(req: Request) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email } = body as { email: string }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const signupLink = `${APP_URL}/signup?invite=${user.organizationId}`

    const result = await sendEmail({
      to: email,
      subject: `You've been invited to join ${user.organizationName} on StewardGrowth`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #333; margin-top: 0;">You're Invited!</h1>
      <p style="color: #666; font-size: 16px;">
        <strong>${user.firstName} ${user.lastName}</strong> has invited you to join
        <strong>${user.organizationName}</strong> on StewardGrowth.
      </p>
      <p style="color: #666; font-size: 16px;">
        StewardGrowth is an AI-powered marketing platform that helps teams create, schedule,
        and optimize content across multiple channels.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${signupLink}"
           style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #999; font-size: 14px;">
        Or copy this link: ${signupLink}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
      <p style="color: #999; font-size: 14px; margin-bottom: 0;">
        This invitation was sent from StewardGrowth. If you didn't expect this, you can ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `${user.firstName} ${user.lastName} has invited you to join ${user.organizationName} on StewardGrowth. Accept the invitation here: ${signupLink}`,
    })

    return NextResponse.json({
      success: true,
      message: result ? 'Invitation sent successfully' : 'Email service not configured — invite link generated',
      inviteLink: signupLink,
    })
  } catch (err) {
    console.error('Failed to send invite:', err)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}
