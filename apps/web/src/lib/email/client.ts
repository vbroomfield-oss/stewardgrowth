import { Resend } from 'resend'

// Initialize Resend client
// Will be null if RESEND_API_KEY is not set
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

/**
 * Send an email using Resend
 * Returns null if Resend is not configured
 */
export async function sendEmail(options: EmailOptions) {
  if (!resend) {
    console.warn('[Email] Resend not configured - email not sent:', options.subject)
    return null
  }

  try {
    const result = await resend.emails.send({
      from: options.from || 'StewardGrowth <noreply@stewardgrowth.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    })

    console.log('[Email] Sent:', options.subject, 'to', options.to)
    return result
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    throw error
  }
}

/**
 * Send approval notification email
 */
export async function sendApprovalNotification(options: {
  to: string
  userName: string
  pendingCount: number
  approvalItems: Array<{
    title: string
    brandName: string
    type: string
  }>
}) {
  const { to, userName, pendingCount, approvalItems } = options

  const itemsHtml = approvalItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.brandName} - ${item.type}</span>
      </td>
    </tr>
  `
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #333; margin-top: 0;">Content Ready for Review</h1>

      <p style="color: #666; font-size: 16px;">
        Hi ${userName},
      </p>

      <p style="color: #666; font-size: 16px;">
        You have <strong>${pendingCount} item${pendingCount !== 1 ? 's' : ''}</strong> waiting for your approval.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        ${itemsHtml}
      </table>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://stewardgrowth.vercel.app/approvals"
           style="display: inline-block; background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Review Content
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

      <p style="color: #999; font-size: 14px; margin-bottom: 0;">
        This is an automated message from StewardGrowth AI Marketing.
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `${pendingCount} content item${pendingCount !== 1 ? 's' : ''} ready for review`,
    html,
  })
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigest(options: {
  to: string
  userName: string
  stats: {
    contentGenerated: number
    contentPublished: number
    totalImpressions: number
    topPerforming: string
  }
  recommendations: Array<{
    title: string
    description: string
  }>
}) {
  const { to, userName, stats, recommendations } = options

  const recommendationsHtml = recommendations
    .map(
      (rec) => `
    <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin-bottom: 12px;">
      <strong style="color: #333;">${rec.title}</strong>
      <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">${rec.description}</p>
    </div>
  `
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #333; margin-top: 0;">Weekly Marketing Digest</h1>

      <p style="color: #666; font-size: 16px;">
        Hi ${userName}, here's your weekly marketing summary:
      </p>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0;">
        <div style="background-color: #f0f9ff; padding: 16px; border-radius: 6px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #0284c7;">${stats.contentGenerated}</div>
          <div style="color: #666; font-size: 14px;">Content Generated</div>
        </div>
        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 6px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${stats.contentPublished}</div>
          <div style="color: #666; font-size: 14px;">Published</div>
        </div>
        <div style="background-color: #fefce8; padding: 16px; border-radius: 6px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #ca8a04;">${stats.totalImpressions.toLocaleString()}</div>
          <div style="color: #666; font-size: 14px;">Total Impressions</div>
        </div>
        <div style="background-color: #fdf4ff; padding: 16px; border-radius: 6px; text-align: center;">
          <div style="font-size: 14px; font-weight: bold; color: #a855f7;">${stats.topPerforming}</div>
          <div style="color: #666; font-size: 14px;">Top Performing</div>
        </div>
      </div>

      ${recommendations.length > 0 ? `
      <h2 style="color: #333; margin-top: 32px;">AI Recommendations</h2>
      ${recommendationsHtml}
      ` : ''}

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://stewardgrowth.vercel.app"
           style="display: inline-block; background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Dashboard
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

      <p style="color: #999; font-size: 14px; margin-bottom: 0;">
        This is your weekly digest from StewardGrowth AI Marketing.
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: `Weekly Marketing Digest - ${stats.contentPublished} posts published`,
    html,
  })
}

export { resend }
