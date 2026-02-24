# StewardGrowth Full Codebase Audit

**Date:** February 24, 2026
**App URL:** https://stewardgrowth.vercel.app
**Stack:** Next.js 14 + Prisma + Supabase + Vercel

---

## 1. Pages & Status

| Page Route | Purpose | Status | Notes |
|---|---|---|---|
| `/` (Dashboard) | Main dashboard with brand overview | Working | Shows empty state if no brands |
| `/brands` | All Brands list | Working | Search, filter, brand cards |
| `/brands/new` | New Brand wizard | Working | 6-step form, AI-assisted |
| `/brands/[slug]` | Brand detail | Working | Metrics, tracking setup |
| `/brands/[slug]/settings` | Brand settings | Working | Logo, branding, API keys |
| `/brands/[slug]/connect` | Tracking code setup | Working | Installation instructions |
| `/brands/[slug]/funding` | Marketing fund | Working | Budget management |
| `/brands/[slug]/readiness` | Launch readiness | Working | Readiness checklist |
| `/analytics` | Analytics overview | Working | All data shows 0 (no real integration) |
| `/analytics/events` | Event tracking | Working | Fetches from /api/events |
| `/analytics/kpis` | KPI dashboard | Working | Shows 0s, no real data source |
| `/analytics/attribution` | Attribution | Working | Shows 0s, no real data source |
| `/seo` | SEO Dashboard | Needs Work | Shows "Coming Soon" placeholder |
| `/content` | Content Hub | Working | Shows empty state properly |
| `/content/create` | Content creation | Working | AI content generation via OpenAI |
| `/ads` | Social & Ad Platforms | Working | OAuth connect/disconnect |
| `/books` | Books management | Working | CRUD for books |
| `/books/new` | Add new book | Working | Book creation form |
| `/books/[id]` | Book detail | Working | Book metrics |
| `/books/[id]/edit` | Edit book | Working | Edit form |
| `/ai` | AI Intelligence | Needs Fix | Chat is SIMULATED (fake responses) |
| `/ai/plans` | Weekly Plans | Needs Fix | "Generate Plan" button disabled |
| `/calls` | Call Analytics | Working | Empty state shown properly |
| `/approvals` | Content Approvals | Working | Approve/reject workflow |
| `/reports` | Reports | Working | Templates shown, no generation |
| `/settings` | Settings | Needs Fix | All buttons disabled, no API key management |
| `/help` | Help Center | Working | Static content, links non-functional |
| `/login` | Login | Working | Supabase auth |
| `/signup` | Signup | Working | Supabase auth |

---

## 2. API Routes & Status

| Route | Method | Purpose | Status |
|---|---|---|---|
| `/api/auth/me` | GET | Current user | Working |
| `/api/user` | GET | User + org data | Working |
| `/api/brands` | GET/POST | List/create brands | Working |
| `/api/brands/[slug]` | GET/PATCH/DELETE | Brand CRUD | Working |
| `/api/brands/analyze-landing-page` | POST | AI brand analysis | Working (needs ANTHROPIC_API_KEY) |
| `/api/books` | GET/POST | List/create books | Working |
| `/api/books/[id]` | GET/POST | Book detail | Working |
| `/api/content/generate` | POST | AI content gen | Working (needs OPENAI_API_KEY) |
| `/api/content/save` | GET/POST | Save content | Working |
| `/api/content/[id]/video` | GET/POST | Video management | Working |
| `/api/events/ingest` | POST/OPTIONS/GET | Event tracking | Working |
| `/api/events` | GET | List events | Working |
| `/api/kpis` | GET | KPI data | Working (mock data) |
| `/api/approvals` | GET | List approvals | Working |
| `/api/approvals/[id]` | GET/POST | Approval actions | Working |
| `/api/approvals/[id]/regenerate-image` | POST | Regenerate image | Working (needs OPENAI_API_KEY) |
| `/api/ai/suggest` | POST | Brand suggestions | Working (needs ANTHROPIC_API_KEY) |
| `/api/funding/balance` | GET | Fund balance | Working (mock) |
| `/api/funding/check` | POST | Check funds | Working (mock) |
| `/api/funding/deposit` | POST | Deposit funds | Working (mock) |
| `/api/platforms` | GET/DELETE | Platform connections | Working |
| `/api/oauth/[platform]/authorize` | GET | OAuth start | Working |
| `/api/oauth/[platform]/callback` | GET | OAuth callback | Working |
| `/api/upload` | POST | File upload | Working (needs SUPABASE_SERVICE_ROLE_KEY) |
| `/api/cron/generate-content` | GET | Daily content gen | Working |
| `/api/cron/publish-content` | GET | Publish approved | Working |
| `/api/cron/analyze-performance` | GET | Performance analysis | Working |
| `/api/cron/process-videos` | GET | Video processing | Working |
| `/api/inngest` | GET/POST/PUT | Background jobs | Working |

---

## 3. Required Environment Variables

### Already Set (Core)
| Variable | Service | Status |
|---|---|---|
| `DATABASE_URL` | PostgreSQL (Supabase) | Set |
| `DIRECT_URL` | PostgreSQL direct | Set |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Set |
| `OPENAI_API_KEY` | OpenAI (content + images) | Set |
| `ANTHROPIC_API_KEY` | Anthropic Claude (AI suggestions) | Set |

### Needs to be Set
| Variable | Service | Required For |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | File uploads (logos, book covers) |
| `RESEND_API_KEY` | Resend | Email notifications |
| `INNGEST_EVENT_KEY` | Inngest | Background jobs |
| `INNGEST_SIGNING_KEY` | Inngest | Background jobs |
| `CRON_SECRET` | Vercel Cron | Cron job authorization |
| `STRIPE_SECRET_KEY` | Stripe | Funding/payments |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth | Social publishing |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth | Social publishing |
| `TWITTER_CLIENT_ID` | Twitter OAuth | Social publishing |
| `TWITTER_CLIENT_SECRET` | Twitter OAuth | Social publishing |
| `META_APP_ID` | Meta (FB/IG) OAuth | Social publishing |
| `META_APP_SECRET` | Meta (FB/IG) OAuth | Social publishing |
| `TIKTOK_CLIENT_KEY` | TikTok OAuth | Social publishing |
| `TIKTOK_CLIENT_SECRET` | TikTok OAuth | Social publishing |
| `GOOGLE_CLIENT_ID` | YouTube OAuth | Social publishing |
| `GOOGLE_CLIENT_SECRET` | YouTube OAuth | Social publishing |
| `PINTEREST_APP_ID` | Pinterest OAuth | Social publishing |
| `PINTEREST_APP_SECRET` | Pinterest OAuth | Social publishing |
| `ELEVENLABS_API_KEY` | ElevenLabs | Video voiceovers |
| `SHOTSTACK_API_KEY` | Shotstack | Video rendering |
| `HEYGEN_API_KEY` | HeyGen | Avatar videos |
| `TELNYX_API_KEY` | Telnyx | Call tracking (StewardRing) |

### Not Currently Used (Requested by User)
| Variable | Service | Status |
|---|---|---|
| `GOOGLE_ANALYTICS_MEASUREMENT_ID` | Google Analytics | Not integrated |
| `GOOGLE_ANALYTICS_API_CREDENTIALS` | Google Analytics API | Not integrated |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Search Console | Not integrated |
| `GOOGLE_ADS_CUSTOMER_ID` | Google Ads | Not integrated |
| `META_ADS_ACCESS_TOKEN` | Meta Ads | Not integrated |
| `META_ADS_ACCOUNT_ID` | Meta Ads | Not integrated |
| `AHREFS_API_KEY` | Ahrefs SEO | Not integrated |
| `SEMRUSH_API_KEY` | SEMrush SEO | Not integrated |
| `AMAZON_KDP` | Amazon KDP | Not integrated |
| `SENDGRID_API_KEY` | SendGrid | Not integrated (using Resend) |

---

## 4. External Integrations

| Integration | Status | Notes |
|---|---|---|
| Supabase Auth | Connected | Login/signup working |
| Supabase Storage | Connected | File uploads (needs SERVICE_ROLE_KEY) |
| PostgreSQL (Prisma) | Connected | All CRUD operations |
| OpenAI GPT-4o | Connected | Content generation |
| OpenAI DALL-E | Connected | Image generation |
| Anthropic Claude | Connected | Brand analysis, AI suggestions |
| Resend Email | Disconnected | Needs RESEND_API_KEY |
| Inngest Jobs | Disconnected | Needs INNGEST keys |
| Stripe Payments | Not Built | Mock responses only |
| LinkedIn OAuth | Built | Needs OAuth credentials |
| Twitter OAuth | Built | Needs OAuth credentials |
| Facebook OAuth | Built | Needs META credentials |
| Instagram OAuth | Built | Needs META credentials |
| TikTok OAuth | Built | Needs OAuth credentials |
| YouTube OAuth | Built | Needs Google credentials |
| Pinterest OAuth | Built | Needs OAuth credentials |
| Threads OAuth | Built | Needs META credentials |
| ElevenLabs | Built | Needs API key |
| Shotstack | Built | Needs API key |
| HeyGen | Partial | Needs API key |
| Google Analytics | Not Built | No integration exists |
| Google Ads | Not Built | No integration exists |
| Google Search Console | Not Built | No integration exists |
| Ahrefs/SEMrush | Not Built | No integration exists |
| Telnyx | Not Built | No integration exists |
| Amazon KDP | Not Built | No integration exists |

---

## 5. Immediate Blockers

1. **Settings page** - No API key management UI; all buttons disabled
2. **AI Chat** - Simulated responses, not connected to Anthropic
3. **AI Recommendations** - Empty placeholder, no generation
4. **Weekly Plans** - Generate button disabled, no AI connection
5. **SEO page** - Shows "Coming Soon" instead of useful empty state

---

## 6. Post-Fix Status (Updated Feb 24, 2026)

### All Pages Final Status

| Page | Status | Notes |
|---|---|---|
| `/` Dashboard | Working | Shows "Pending" with connect links for MRR/Leads until Stripe connected |
| `/brands` | Working | Lists all 3 brands (StewardPro, StewardRing, Bfield Ministry) |
| `/brands/new` | Working | Full brand creation wizard |
| `/brands/[slug]` | Working | Brand detail with metrics |
| `/brands/[slug]/settings` | Working | Logo, branding, API keys |
| `/analytics` | Working | Shows empty state with tracking setup info |
| `/analytics/events` | Working | Real event data from tracking SDK |
| `/analytics/kpis` | Working | Shows connect-integrations banner |
| `/analytics/attribution` | Working | Shows empty state |
| `/seo` | Working | Shows setup-required banner with env var instructions |
| `/content` | Working | Content creation hub |
| `/content/create` | Working | AI content generation (OpenAI) |
| `/ads` | Working | OAuth platform connections |
| `/books` | Working | Book management, existing data preserved |
| `/ai` | Working | Real AI chat (Anthropic), recommendations with brand filters |
| `/ai/plans` | Working | Weekly plan generation per brand (Anthropic) |
| `/calls` | Working | Shows Telnyx setup banner |
| `/approvals` | Working | Content approval workflow |
| `/reports` | Working | Report templates |
| `/settings` | Working | Full API key management, shows connected services |
| `/help` | Working | Static help content |
| `/login` | Working | Supabase auth |
| `/signup` | Working | Supabase auth |

### What Was Fixed

1. **Settings page** — Complete rebuild with API key management UI for all integrations
2. **AI Chat** — Connected to real Anthropic API (was simulated/fake responses)
3. **AI Recommendations** — New engine generating 7 brand-specific recommendations with brand context
4. **Weekly Plans** — New generator creating 7-day action plans per brand using Anthropic
5. **Dashboard metrics** — Show "Pending" with connect links instead of misleading $0 values
6. **SEO page** — Replaced "Coming Soon" with setup-required banner and env var instructions
7. **Calls page** — Added Telnyx setup banner
8. **KPIs page** — Added analytics connection info
9. **Content generation** — Fixed to pull brand voice from database (was hardcoded to 2 brands)
10. **Brand voice** — Added StewardPro default voice, made all brands pull from DB

### New API Routes Created

- `POST /api/ai/chat` — Real AI chat using Anthropic Claude
- `GET/POST /api/ai/recommendations` — AI recommendation engine
- `GET/POST /api/ai/plans` — Weekly marketing plan generator
- `GET/POST /api/settings` — API key management with org settings storage
