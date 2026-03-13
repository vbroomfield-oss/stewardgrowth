import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | StewardGrowth',
  description: 'StewardGrowth Internal Tool Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">
        Last updated: March 2026
      </p>

      <h2>1. Overview</h2>
      <p>
        This Privacy Policy describes how StewardGrowth, an internal marketing and growth tool operated by
        B.Ent Group (&quot;the Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), collects,
        stores, and processes data. This policy applies to all authorized users of the Platform, including
        employees, contractors, and designated personnel.
      </p>

      <h2>2. Data We Collect</h2>

      <h3>Account Information</h3>
      <ul>
        <li>Name and email address (authenticated via Supabase Auth)</li>
        <li>Organization role and team membership</li>
        <li>User preferences and Platform settings</li>
      </ul>

      <h3>Brand and Marketing Data</h3>
      <ul>
        <li>Brand profiles, voice settings, and marketing goals</li>
        <li>Content drafts, published posts, and campaign data</li>
        <li>Analytics metrics, KPIs, and attribution data collected from connected platforms</li>
        <li>Audience and engagement data retrieved from social media APIs</li>
      </ul>

      <h3>Social Media Credentials</h3>
      <ul>
        <li>OAuth access tokens and refresh tokens for connected social accounts (Facebook, Instagram, LinkedIn, Twitter/X, TikTok, YouTube, Threads)</li>
        <li>Social platform user IDs and page/account identifiers</li>
        <li>These credentials are stored in encrypted form within our database and are used exclusively for authorized content publishing and analytics retrieval</li>
      </ul>

      <h3>AI Interaction Data</h3>
      <ul>
        <li>Prompts, instructions, and content submitted to AI services for generation or analysis</li>
        <li>Conversations with the AI marketing advisor</li>
        <li>Generated outputs including text, images, audio, and video</li>
      </ul>

      <h3>Platform Usage Data</h3>
      <ul>
        <li>Pages visited and features used within the Platform</li>
        <li>Actions taken (content created, posts scheduled, approvals made)</li>
        <li>Session information and login timestamps</li>
      </ul>

      <h2>3. How Data Is Stored</h2>
      <p>
        All Platform data is stored in a Supabase-hosted PostgreSQL database with the following protections:
      </p>
      <ul>
        <li>Data encrypted in transit via TLS/HTTPS and at rest via database-level encryption</li>
        <li>Row-level security (RLS) policies enforcing organization-based data isolation</li>
        <li>Social media tokens and API credentials stored using application-level encryption</li>
        <li>Authentication managed through Supabase Auth with secure session handling</li>
        <li>File uploads (images, media assets) stored in Supabase Storage with access controls</li>
      </ul>

      <h2>4. Third-Party Services</h2>
      <p>
        The Platform transmits data to the following third-party services as part of its core functionality:
      </p>
      <ul>
        <li><strong>OpenAI</strong> -- Text generation (GPT-4o) and image generation (DALL-E). Content prompts and brand context are sent to OpenAI for processing.</li>
        <li><strong>Anthropic (Claude)</strong> -- AI marketing advisor, content analysis, and strategic recommendations. Conversation data and brand information are sent for processing.</li>
        <li><strong>ElevenLabs</strong> -- Voice synthesis and audio generation. Text scripts are sent for voice conversion.</li>
        <li><strong>Shotstack</strong> -- Video rendering and production. Media assets and composition instructions are sent for video creation.</li>
        <li><strong>Meta APIs (Facebook/Instagram)</strong> -- Content publishing, analytics retrieval, and ad management for connected Meta accounts.</li>
        <li><strong>LinkedIn API</strong> -- Content publishing and engagement data retrieval for connected LinkedIn accounts.</li>
        <li><strong>Google Analytics</strong> -- Website analytics tracking and reporting for connected properties.</li>
        <li><strong>Telnyx</strong> -- Telephony and SMS/messaging services for communication features.</li>
        <li><strong>Supabase</strong> -- Database hosting, authentication, file storage, and real-time features.</li>
        <li><strong>Vercel</strong> -- Application hosting and serverless function execution.</li>
        <li><strong>Inngest</strong> -- Background job processing for scheduled posts and async operations.</li>
      </ul>
      <p>
        Each third-party service processes data according to its own privacy policy and data handling terms.
        The Company selects third-party providers that maintain commercially reasonable security practices.
      </p>

      <h2>5. How We Use Your Data</h2>
      <ul>
        <li>To provide and operate the Platform&apos;s core features for authorized users</li>
        <li>To generate AI-powered content, media, and marketing recommendations</li>
        <li>To publish content to connected social media accounts on behalf of Company brands</li>
        <li>To retrieve and display analytics, engagement metrics, and performance data</li>
        <li>To manage content approval workflows and team collaboration</li>
        <li>To send system notifications (approval requests, scheduled post confirmations, error alerts)</li>
        <li>To maintain Platform security and audit access logs</li>
        <li>To improve Platform functionality and fix issues</li>
      </ul>

      <h2>6. Data Retention</h2>
      <ul>
        <li>Account data is retained for as long as the user has active access to the Platform</li>
        <li>Brand and campaign data is retained for as long as the associated brand is active within the Platform</li>
        <li>When user access is revoked, personal account data is removed within 30 days</li>
        <li>Analytics and performance data may be retained in aggregate form for historical reporting</li>
        <li>Audit logs are retained in accordance with the Company&apos;s internal data retention policies</li>
        <li>Database backups may retain data for up to 90 days after deletion from the live system</li>
      </ul>

      <h2>7. Security Measures</h2>
      <p>
        We implement the following security measures to protect data within the Platform:
      </p>
      <ul>
        <li>Encrypted data in transit (TLS/HTTPS) and at rest</li>
        <li>Supabase Auth with row-level security for data isolation between organizations</li>
        <li>Application-level encryption for stored third-party API credentials and OAuth tokens</li>
        <li>Role-based access control within organizations (owner, admin, member roles)</li>
        <li>Audit logging for sensitive operations including token connections and content publishing</li>
        <li>Secure environment variable management for all API keys and secrets</li>
      </ul>

      <h2>8. Cookies and Session Data</h2>
      <p>
        The Platform uses cookies and local storage for:
      </p>
      <ul>
        <li><strong>Authentication</strong> -- Session cookies managed by Supabase Auth to maintain login state</li>
        <li><strong>Preferences</strong> -- User interface settings such as theme, sidebar state, and display preferences</li>
      </ul>

      <h2>9. Changes to This Policy</h2>
      <p>
        This Privacy Policy may be updated as the Platform evolves or as new third-party services are
        integrated. Users will be notified of material changes through the Platform or via email.
        Continued use of the Platform after changes are communicated constitutes acceptance of the
        updated policy.
      </p>

      <h2>10. Contact</h2>
      <p>
        For questions about this Privacy Policy or data handling within the Platform, contact:{' '}
        <a href="mailto:legal@bentgroup.co">legal@bentgroup.co</a>
      </p>
      <p>
        B.Ent Group<br />
        Georgia, United States
      </p>
    </div>
  )
}
