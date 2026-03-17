import { sendEmail } from './client'

export interface ServiceQuota {
  name: string
  used: number
  limit: number
  remaining: number
  unit: string
  status: 'ok' | 'warning' | 'critical'
  error?: string
}

/**
 * Send a quota alert email when services are running low
 */
export async function sendQuotaAlert(options: {
  to: string
  userName: string
  services: ServiceQuota[]
}) {
  const { to, userName, services } = options

  const criticalServices = services.filter(s => s.status === 'critical')
  const warningServices = services.filter(s => s.status === 'warning')

  if (criticalServices.length === 0 && warningServices.length === 0) return null

  const serviceRows = services
    .filter(s => s.status !== 'ok')
    .map(s => {
      const pct = s.limit > 0 ? Math.round((s.remaining / s.limit) * 100) : 0
      const color = s.status === 'critical' ? '#dc2626' : '#ca8a04'
      const bgColor = s.status === 'critical' ? '#fef2f2' : '#fefce8'
      const barColor = s.status === 'critical' ? '#dc2626' : '#eab308'

      return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #eee;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div>
              <strong style="color: ${color};">${s.name}</strong>
              <div style="color: #666; font-size: 13px; margin-top: 4px;">
                ${s.remaining.toLocaleString()} ${s.unit} remaining of ${s.limit.toLocaleString()}
              </div>
              ${s.error ? `<div style="color: #dc2626; font-size: 12px; margin-top: 4px;">${s.error}</div>` : ''}
            </div>
          </div>
          <div style="margin-top: 8px; background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="background: ${barColor}; height: 100%; width: ${Math.max(pct, 2)}%; border-radius: 4px;"></div>
          </div>
          <div style="text-align: right; font-size: 12px; color: ${color}; margin-top: 4px; font-weight: 600;">
            ${pct}% remaining
          </div>
        </td>
      </tr>`
    })
    .join('')

  const subject = criticalServices.length > 0
    ? `CRITICAL: ${criticalServices.map(s => s.name).join(', ')} quota nearly exhausted`
    : `Warning: ${warningServices.map(s => s.name).join(', ')} quota running low`

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

      ${criticalServices.length > 0 ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #dc2626; margin: 0 0 8px 0; font-size: 18px;">&#9888; Critical: Service Quota Alert</h2>
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          ${criticalServices.length} service${criticalServices.length > 1 ? 's are' : ' is'} nearly out of quota.
          Video and content generation may fail until credits are replenished.
        </p>
      </div>
      ` : `
      <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #ca8a04; margin: 0 0 8px 0; font-size: 18px;">&#9888; Warning: Service Quota Low</h2>
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          ${warningServices.length} service${warningServices.length > 1 ? 's are' : ' is'} running low on quota.
        </p>
      </div>
      `}

      <p style="color: #666; font-size: 16px;">Hi ${userName},</p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        ${serviceRows}
      </table>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="color: #333; margin: 0 0 8px 0; font-weight: 600;">What to do:</p>
        <ul style="color: #666; margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 4px;">Check your subscription plans and upgrade if needed</li>
          <li style="margin-bottom: 4px;">ElevenLabs: <a href="https://elevenlabs.io/subscription" style="color: #2563eb;">Manage subscription</a></li>
          <li style="margin-bottom: 4px;">Shotstack: <a href="https://dashboard.shotstack.io" style="color: #2563eb;">View dashboard</a></li>
          <li style="margin-bottom: 4px;">HeyGen: <a href="https://app.heygen.com/settings" style="color: #2563eb;">View settings</a></li>
        </ul>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

      <p style="color: #999; font-size: 14px; margin-bottom: 0;">
        This is an automated quota alert from StewardGrowth. Checks run daily at 7 AM UTC.
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to,
    subject,
    html,
  })
}
