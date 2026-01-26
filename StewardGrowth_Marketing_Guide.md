# StewardGrowth Marketing Guide
## Complete Setup & Operations Manual

---

# Table of Contents

1. [Introduction](#introduction)
2. [Phase 1: Connect Your SaaS Products](#phase-1-connect-your-saas-products)
3. [Phase 2: Manual Marketing Workflow](#phase-2-manual-marketing-workflow)
4. [Phase 3: Convert to Automated Marketing](#phase-3-convert-to-automated-marketing)
5. [Appendix: API Setup Guides](#appendix-api-setup-guides)

---

# Introduction

StewardGrowth is your AI-powered marketing command center for managing marketing across all your SaaS products (StewardMAX, StewardRing, etc.).

**What StewardGrowth Does:**
- Generates marketing content (blogs, social posts, emails, ad copy)
- Provides AI-driven marketing recommendations
- Tracks marketing performance across all brands
- Manages approval workflows for content and spend
- Coordinates campaigns across multiple platforms

**Two Operating Modes:**
1. **Manual Mode** - AI generates content, you publish manually
2. **Automated Mode** - Full integration with ad platforms for direct publishing

---

# Phase 1: Connect Your SaaS Products

## Step 1.1: Access StewardGrowth

1. Navigate to your StewardGrowth URL (e.g., `https://stewardgrowth.vercel.app`)
2. Log in with your Supabase credentials
3. You'll land on the Executive Dashboard

## Step 1.2: Add Your First Brand

1. Click **"Brands"** in the left sidebar
2. Click **"+ Add Brand"** button
3. Fill in the brand details:

| Field | Example for StewardMAX |
|-------|------------------------|
| Brand Name | StewardMAX |
| Slug | stewardmax |
| Website URL | https://stewardmax.com |
| Description | Church management software |
| Industry | Church/Nonprofit Technology |
| Target Audience | Church administrators, pastors |

4. Click **"Create Brand"**

## Step 1.3: Configure Brand Voice

For each brand, set up the AI voice profile:

1. Go to **Brands → [Brand Name] → Settings**
2. Click the **"Branding"** tab
3. Configure:

**Personality Traits** (select 3-5):
- Professional
- Friendly
- Helpful
- Inspirational
- Educational

**Phrases to Use:**
- "Transform your ministry"
- "Save time, serve more"
- "Built for churches"

**Phrases to Avoid:**
- "Cheap"
- "Basic"
- "Religious software"

**Value Propositions:**
- All-in-one church management
- Save 10+ hours per week
- Trusted by 500+ churches

4. Click **"Save Changes"**

## Step 1.4: Set Up Event Tracking (Optional)

To track website visitors and conversions:

1. Go to **Brands → [Brand Name] → Connect**
2. Copy the tracking script:

```html
<script src="https://your-stewardgrowth-url.vercel.app/sdk/sg.js"></script>
<script>
  StewardGrowth.init('YOUR_BRAND_ID');
</script>
```

3. Add to your SaaS product's website `<head>` section

**Track Custom Events:**
```javascript
// Track a signup
StewardGrowth.track('signup_started', { plan: 'trial' });

// Track a conversion
StewardGrowth.track('subscription_started', {
  plan: 'pro',
  value: 49.99
});
```

## Step 1.5: Repeat for All Brands

Add each of your SaaS products:
- StewardMAX (Church Management)
- StewardRing (Communication Platform)
- StewardPro (Professional Services)
- Any other products

---

# Phase 2: Manual Marketing Workflow

## Daily Workflow Overview

```
┌─────────────────────────────────────────────────────┐
│                  DAILY ROUTINE                       │
├─────────────────────────────────────────────────────┤
│  Morning (15 min)                                   │
│  ├── Check AI Recommendations                       │
│  ├── Review pending approvals                       │
│  └── Check campaign performance                     │
│                                                     │
│  Content Creation (30-60 min)                       │
│  ├── Generate content for the day                   │
│  ├── Review and edit AI output                      │
│  └── Queue for publishing                           │
│                                                     │
│  Publishing (15-30 min)                             │
│  ├── Post to social media platforms                 │
│  ├── Schedule email campaigns                       │
│  └── Update ad campaigns                            │
│                                                     │
│  End of Day (10 min)                                │
│  └── Log results in StewardGrowth                   │
└─────────────────────────────────────────────────────┘
```

## Step 2.1: Generate Content

### Blog Posts

1. Go to **Content → Create**
2. Select **"Blog Post"**
3. Fill in:
   - **Brand**: Select your brand
   - **Topic**: "5 Ways Church Software Saves Time"
   - **Keywords**: church software, ministry management, save time
   - **Tone**: Professional
   - **Call to Action**: Start your free trial
4. Click **"Generate with AI"**
5. Review the generated content
6. Click **"Save as Draft"** or **"Submit for Approval"**

### Social Media Posts

1. Go to **Content → Create**
2. Select **"Social Media"**
3. Choose platform: Twitter, LinkedIn, Facebook, or Instagram
4. Fill in topic and generate
5. AI provides:
   - Main post
   - 2 alternative versions
   - Suggested hashtags
   - Image description

### Email Campaigns

1. Go to **Content → Create**
2. Select **"Email"**
3. Choose type: Newsletter, Promotional, Nurture, or Announcement
4. Generate content
5. AI provides:
   - Subject line (+ alternatives)
   - Preview text
   - Email body
   - CTA button text

### Ad Copy

1. Go to **Content → Create**
2. Select **"Ad Copy"**
3. Choose platform: Google, Meta, or LinkedIn
4. Select objective: Awareness, Consideration, or Conversion
5. AI generates platform-specific ad variations

## Step 2.2: Publish Manually

### Social Media Publishing

**Twitter/X:**
1. Go to https://twitter.com/compose/tweet
2. Paste your generated content
3. Add image if suggested
4. Post or schedule

**LinkedIn:**
1. Go to https://linkedin.com
2. Click "Start a post"
3. Paste content
4. Add relevant image
5. Post

**Facebook:**
1. Go to your business page
2. Click "Create post"
3. Paste content
4. Schedule or publish

**Instagram:**
1. Use Meta Business Suite or mobile app
2. Create new post
3. Add image (required)
4. Paste caption
5. Add hashtags
6. Post

### Email Publishing

**Using Mailchimp/ConvertKit/etc:**
1. Create new campaign
2. Paste subject line
3. Paste email body
4. Design email template
5. Select audience
6. Schedule or send

### Ad Publishing

**Google Ads:**
1. Go to https://ads.google.com
2. Create new campaign
3. Paste headlines and descriptions from StewardGrowth
4. Set budget and targeting
5. Launch

**Meta Ads:**
1. Go to https://business.facebook.com/adsmanager
2. Create campaign
3. Paste primary text, headline, description
4. Upload creative
5. Set audience and budget
6. Publish

## Step 2.3: Track Results

### Manual Tracking in StewardGrowth

After campaigns run, log results:

1. Go to **Analytics → Events**
2. Click **"+ Log Event"**
3. Enter:
   - Event type (ad_click, signup, conversion)
   - Source (google_ads, facebook, linkedin)
   - Campaign name
   - Value (if applicable)

### Key Metrics to Track

| Metric | Where to Find | Log in StewardGrowth |
|--------|---------------|----------------------|
| Ad Clicks | Google/Meta Ads dashboard | Analytics → Events |
| Signups | Your SaaS admin panel | Analytics → Events |
| Conversions | Stripe/Payment provider | Analytics → Events |
| Social Engagement | Platform analytics | Analytics → Events |
| Email Opens | Email provider | Analytics → Events |

### Weekly Review

Every week, review:

1. **Analytics → KPIs** - Overall performance
2. **Analytics → Attribution** - Which channels drive conversions
3. **AI → Recommendations** - AI-suggested optimizations
4. **Reports** - Generate weekly summary

---

# Phase 3: Convert to Automated Marketing

## Prerequisites Checklist

Before automating, you need:

- [ ] Registered business (LLC or Corp)
- [ ] EIN (Employer Identification Number)
- [ ] Business bank account
- [ ] Business website with privacy policy
- [ ] Verified business on each platform

## Step 3.1: Google Ads API Setup

### Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click **"Create Project"**
3. Name: "StewardGrowth Marketing"
4. Click **"Create"**

### Enable Google Ads API

1. Go to **APIs & Services → Library**
2. Search "Google Ads API"
3. Click **"Enable"**

### Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ Create Credentials" → "OAuth client ID"**
3. Application type: **Web application**
4. Name: "StewardGrowth"
5. Authorized redirect URIs:
   - `https://your-stewardgrowth-url.vercel.app/api/integrations/google/callback`
6. Click **"Create"**
7. Save the **Client ID** and **Client Secret**

### Get Google Ads Developer Token

1. Go to https://ads.google.com/
2. Sign in with your Google Ads Manager account
3. Go to **Tools & Settings → API Center**
4. Apply for API access (may require review)
5. Once approved, copy your **Developer Token**

### Add to StewardGrowth

Add to Vercel Environment Variables:
```
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
```

### Connect in StewardGrowth

1. Go to **Settings → Integrations**
2. Click **"Connect"** next to Google Ads
3. Sign in with your Google account
4. Authorize access
5. Select your Google Ads account

## Step 3.2: Meta (Facebook/Instagram) API Setup

### Create Meta Developer Account

1. Go to https://developers.facebook.com/
2. Click **"Get Started"**
3. Complete developer registration

### Create Meta App

1. Click **"Create App"**
2. Select **"Business"** type
3. App name: "StewardGrowth Marketing"
4. Click **"Create App"**

### Add Marketing API

1. In your app dashboard, click **"Add Products"**
2. Find **"Marketing API"** and click **"Set Up"**
3. Complete the required steps

### Configure OAuth

1. Go to **Settings → Basic**
2. Copy **App ID** and **App Secret**
3. Go to **Facebook Login → Settings**
4. Add Valid OAuth Redirect URIs:
   - `https://your-stewardgrowth-url.vercel.app/api/integrations/meta/callback`

### Connect Business Manager

1. Go to https://business.facebook.com/
2. Create or select your business
3. Go to **Business Settings → Accounts → Apps**
4. Add your Meta app

### Add to StewardGrowth

Add to Vercel Environment Variables:
```
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
```

### Connect in StewardGrowth

1. Go to **Settings → Integrations**
2. Click **"Connect"** next to Meta Ads
3. Sign in with Facebook
4. Select your Business Manager
5. Grant required permissions

## Step 3.3: LinkedIn Marketing API Setup

### Create LinkedIn Developer App

1. Go to https://www.linkedin.com/developers/
2. Click **"Create App"**
3. Fill in:
   - App name: "StewardGrowth Marketing"
   - LinkedIn Page: Your company page
   - App logo: Upload logo
4. Click **"Create App"**

### Request Marketing Developer Platform Access

1. In your app, go to **Products** tab
2. Find **"Marketing Developer Platform"**
3. Click **"Request Access"**
4. Fill out the application form
5. Wait for approval (can take 1-2 weeks)

### Configure OAuth

1. Go to **Auth** tab
2. Copy **Client ID** and **Client Secret**
3. Add OAuth 2.0 redirect URLs:
   - `https://your-stewardgrowth-url.vercel.app/api/integrations/linkedin/callback`

### Add to StewardGrowth

Add to Vercel Environment Variables:
```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

### Connect in StewardGrowth

1. Go to **Settings → Integrations**
2. Click **"Connect"** next to LinkedIn Ads
3. Sign in with LinkedIn
4. Authorize access
5. Select your Ad Accounts

## Step 3.4: Enable Automated Features

Once all platforms are connected:

### Automated Campaign Creation

1. Go to **Ads → New Campaign**
2. Select brand and platforms
3. Set budget and targeting
4. AI generates creative
5. Click **"Launch Campaign"**
6. Campaigns are created directly in ad platforms

### Automated Reporting

1. Go to **Analytics**
2. Data now pulls automatically from all platforms
3. Real-time performance tracking
4. Automated attribution

### Automated Optimization

1. Go to **AI → Recommendations**
2. AI analyzes real performance data
3. Suggests budget reallocations
4. One-click to apply changes

### Automated Approvals

1. Go to **Approvals**
2. Set spending thresholds
3. Auto-approve under threshold
4. Review only large spends

---

# Appendix: API Setup Guides

## Timeline Expectations

| Platform | Application Time | Approval Time |
|----------|-----------------|---------------|
| Google Ads API | 30 minutes | Instant to 7 days |
| Meta Marketing API | 1 hour | Instant to 14 days |
| LinkedIn Marketing API | 1 hour | 7-14 days |

## Required Permissions by Platform

### Google Ads
- `https://www.googleapis.com/auth/adwords`

### Meta
- `ads_management`
- `ads_read`
- `business_management`
- `pages_read_engagement`

### LinkedIn
- `r_ads`
- `r_ads_reporting`
- `w_organization_social`
- `rw_ads`

## Troubleshooting

### "API Access Denied"
- Verify business is registered
- Check all permissions granted
- Ensure app is in "Live" mode (not development)

### "Rate Limit Exceeded"
- Reduce API call frequency
- Implement caching
- Contact platform for higher limits

### "Invalid Token"
- Reconnect the integration
- Tokens expire - may need refresh

## Support Resources

- **Google Ads API**: https://developers.google.com/google-ads/api/docs
- **Meta Marketing API**: https://developers.facebook.com/docs/marketing-apis
- **LinkedIn Marketing API**: https://docs.microsoft.com/en-us/linkedin/marketing/

---

# Quick Reference Card

## Daily Tasks
1. Check AI recommendations (5 min)
2. Generate content (15 min)
3. Publish to platforms (15 min)
4. Log results (5 min)

## Weekly Tasks
1. Review Analytics → KPIs
2. Check Attribution reports
3. Adjust budgets based on AI suggestions
4. Plan next week's content

## Monthly Tasks
1. Generate monthly reports
2. Review brand voice settings
3. Update keywords and targeting
4. Analyze competitor positioning

---

*Document Version: 1.0*
*Last Updated: January 2026*
*StewardGrowth AI Marketing Platform*
