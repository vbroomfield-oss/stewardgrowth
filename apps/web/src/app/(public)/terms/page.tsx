import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | StewardGrowth',
  description: 'StewardGrowth Terms of Service',
}

export default function TermsPage() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">
        Last updated: February 2026
      </p>
      <p className="text-sm bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg">
        [CUSTOMIZE BEFORE LAUNCH] — This document should be reviewed by legal counsel before going live.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using StewardGrowth (&quot;the Service&quot;), operated by B.Ent Group (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
        you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        StewardGrowth is an AI-powered marketing command center and growth platform designed for SaaS founders
        and businesses managing multiple brands. The Service provides:
      </p>
      <ul>
        <li>AI-powered content generation across multiple platforms</li>
        <li>Multi-brand marketing management</li>
        <li>Analytics, attribution, and KPI tracking</li>
        <li>Social media scheduling and publishing</li>
        <li>SEO automation and optimization tools</li>
        <li>Paid advertising campaign management</li>
        <li>Content approval workflows</li>
      </ul>

      <h2>3. User Accounts and Responsibilities</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activities
        that occur under your account. You agree to:
      </p>
      <ul>
        <li>Provide accurate and complete registration information</li>
        <li>Maintain the security of your password and account</li>
        <li>Notify us immediately of any unauthorized use of your account</li>
        <li>Not share your account credentials with unauthorized individuals</li>
        <li>Comply with all applicable laws and regulations in your use of the Service</li>
      </ul>

      <h2>4. Subscription and Billing</h2>
      <p>
        StewardGrowth offers multiple subscription tiers. By subscribing to a paid plan, you agree to pay the
        applicable fees. Subscriptions automatically renew unless cancelled before the end of the current billing period.
        Refunds are handled on a case-by-case basis and are at our sole discretion.
      </p>

      <h2>5. AI-Generated Content Disclaimer</h2>
      <p>
        The Service uses artificial intelligence (including OpenAI and Anthropic technologies) to generate marketing
        content, recommendations, and insights. You acknowledge that:
      </p>
      <ul>
        <li>AI-generated content may require review and editing before publication</li>
        <li>We do not guarantee the accuracy, completeness, or suitability of AI-generated content</li>
        <li>You are solely responsible for reviewing and approving all content before it is published</li>
        <li>AI-generated content should not be relied upon as legal, financial, or medical advice</li>
        <li>You retain full ownership and responsibility for any content published through the Service</li>
      </ul>

      <h2>6. Data Privacy and Security</h2>
      <p>
        Your use of the Service is also governed by our{' '}
        <a href="/privacy">Privacy Policy</a>. We implement commercially reasonable security measures to protect
        your data. However, no method of transmission over the Internet is 100% secure.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        The Service, including its design, features, and underlying technology, is owned by B.Ent Group.
        Content you create or generate through the Service remains your intellectual property.
        You grant us a limited license to store, process, and display your content solely for the purpose
        of providing the Service.
      </p>

      <h2>8. Third-Party Integrations</h2>
      <p>
        The Service integrates with third-party platforms including but not limited to Meta (Facebook, Instagram),
        Google (Ads, Analytics, YouTube), Twitter/X, LinkedIn, TikTok, Pinterest, Stripe, and others.
        Your use of these integrations is subject to the respective third party&apos;s terms of service.
        We are not responsible for the actions, policies, or practices of any third-party services.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, B.Ent Group shall not be liable for any indirect, incidental,
        special, consequential, or punitive damages resulting from your use of or inability to use the Service.
        Our total liability shall not exceed the amount you paid to us in the twelve (12) months preceding
        the claim.
      </p>

      <h2>10. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account at our discretion if you violate these terms.
        You may cancel your account at any time through the Service settings. Upon termination, your right to
        use the Service ceases immediately. We may retain your data for a reasonable period in accordance with
        our Privacy Policy.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the State of Georgia,
        United States, without regard to its conflict of law provisions. Any disputes shall be resolved in the
        courts located in the State of Georgia.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions about these Terms of Service, please contact us at:{' '}
        <a href="mailto:legal@bentgroup.co">legal@bentgroup.co</a>
      </p>
    </div>
  )
}
