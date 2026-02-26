import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | StewardGrowth',
  description: 'StewardGrowth Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">
        Last updated: February 2026
      </p>
      <p className="text-sm bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg">
        [CUSTOMIZE BEFORE LAUNCH] — This document should be reviewed by legal counsel before going live.
      </p>

      <h2>What Data We Collect</h2>
      <p>
        StewardGrowth, operated by B.Ent Group, collects the following types of information:
      </p>
      <h3>Account Information</h3>
      <ul>
        <li>Name, email address, and password (stored securely via Supabase Auth)</li>
        <li>Organization name and team member information</li>
        <li>Billing information processed through Stripe (we do not store credit card numbers)</li>
      </ul>
      <h3>Usage Data</h3>
      <ul>
        <li>Pages visited, features used, and actions taken within the platform</li>
        <li>Content you create, generate, or upload</li>
        <li>Brand profiles, marketing goals, and audience data you provide</li>
        <li>Analytics events tracked through our SDK on your websites</li>
      </ul>
      <h3>Social Platform Tokens</h3>
      <ul>
        <li>OAuth access tokens and refresh tokens for connected social platforms (Twitter/X, LinkedIn, Facebook, Instagram, TikTok, YouTube, Pinterest)</li>
        <li>These tokens are stored encrypted and are used solely to post content and retrieve analytics on your behalf</li>
      </ul>
      <h3>AI Interaction Data</h3>
      <ul>
        <li>Prompts and content sent to AI services for content generation</li>
        <li>Chat conversations with the AI marketing advisor</li>
      </ul>

      <h2>How We Use Your Data</h2>
      <ul>
        <li>To provide, maintain, and improve the Service</li>
        <li>To generate AI-powered content, recommendations, and marketing insights</li>
        <li>To publish content to connected social media platforms on your behalf</li>
        <li>To track analytics events and compute marketing attribution</li>
        <li>To send transactional emails (password resets, approval notifications, weekly digests)</li>
        <li>To process payments and manage subscriptions</li>
        <li>To provide customer support</li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>
        We use the following third-party services that may process your data:
      </p>
      <ul>
        <li><strong>Supabase</strong> — Authentication, database hosting, and file storage</li>
        <li><strong>OpenAI</strong> — AI content generation (GPT-4o, DALL-E image generation)</li>
        <li><strong>Anthropic</strong> — AI marketing advisor and recommendations (Claude)</li>
        <li><strong>Meta</strong> — Facebook and Instagram integration</li>
        <li><strong>Google</strong> — Google Ads, Analytics, YouTube, and Search Console integration</li>
        <li><strong>Resend</strong> — Transactional email delivery</li>
        <li><strong>Stripe</strong> — Payment processing</li>
        <li><strong>Vercel</strong> — Application hosting</li>
        <li><strong>Inngest</strong> — Background job processing</li>
      </ul>
      <p>
        Each of these services has their own privacy policies. We encourage you to review them.
      </p>

      <h2>Data Retention</h2>
      <ul>
        <li>Active account data is retained for as long as your account is active</li>
        <li>Upon account deletion, personal data is removed within 30 days</li>
        <li>Analytics event data may be retained in anonymized form for aggregate reporting</li>
        <li>Backup data may be retained for up to 90 days after deletion</li>
        <li>We may retain certain data as required by law or for legitimate business purposes</li>
      </ul>

      <h2>Your Rights</h2>
      <h3>For all users</h3>
      <ul>
        <li>Access your personal data stored in the Service</li>
        <li>Correct inaccurate personal data</li>
        <li>Delete your account and associated data</li>
        <li>Export your data in a portable format</li>
        <li>Disconnect third-party platform integrations at any time</li>
      </ul>
      <h3>GDPR (European Economic Area)</h3>
      <p>
        If you are located in the EEA, you have additional rights under the General Data Protection Regulation,
        including the right to data portability, the right to restrict processing, and the right to object to
        processing. To exercise these rights, contact us at{' '}
        <a href="mailto:privacy@bentgroup.co">privacy@bentgroup.co</a>.
      </p>
      <h3>CCPA (California)</h3>
      <p>
        If you are a California resident, you have the right to know what personal information we collect,
        request deletion of your data, and opt out of the sale of your personal information.
        We do not sell personal information. To exercise your rights, contact us at{' '}
        <a href="mailto:privacy@bentgroup.co">privacy@bentgroup.co</a>.
      </p>

      <h2>Cookies and Tracking</h2>
      <p>
        We use cookies and similar technologies for:
      </p>
      <ul>
        <li><strong>Authentication</strong> — Session cookies to keep you logged in (essential)</li>
        <li><strong>Preferences</strong> — Remembering your settings like theme and sidebar state</li>
        <li><strong>Analytics</strong> — Understanding how the Service is used to improve it</li>
      </ul>
      <p>
        The StewardGrowth tracking SDK that you install on your own websites will set cookies to track
        visitor sessions and attribution. You are responsible for disclosing this tracking in your own
        website&apos;s privacy policy and cookie consent mechanisms.
      </p>

      <h2>Security</h2>
      <p>
        We implement commercially reasonable technical and organizational security measures including:
      </p>
      <ul>
        <li>Encrypted data in transit (TLS/HTTPS) and at rest</li>
        <li>Secure authentication via Supabase with row-level security</li>
        <li>API key encryption for stored third-party credentials</li>
        <li>Role-based access control within organizations</li>
        <li>Audit logging for sensitive operations</li>
      </ul>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes by
        email or through a notice on the Service. Your continued use of the Service after changes become
        effective constitutes acceptance of the updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about this Privacy Policy or to exercise your data rights, contact us at:{' '}
        <a href="mailto:privacy@bentgroup.co">privacy@bentgroup.co</a>
      </p>
      <p>
        B.Ent Group<br />
        Georgia, United States
      </p>
    </div>
  )
}
