export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

// ---- Report type keys ----
const REPORT_TYPES = [
  'executive_summary',
  'lead_generation',
  'revenue_attribution',
  'ad_performance',
  'seo_progress',
  'content_performance',
] as const

type ReportType = (typeof REPORT_TYPES)[number]

// ---- System prompts per report type ----
const SYSTEM_PROMPTS: Record<ReportType, string> = {
  executive_summary: `You are a senior marketing strategist generating an Executive Summary report.
Focus on high-level KPIs, overall trends, and strategic recommendations.
Structure the report with these sections: Overview, Key Metrics, Channel Performance, Trends & Insights, Recommendations.
For the Key Metrics section, include a "data" array with objects like { "label": "...", "value": "...", "change": "..." }.
Be specific and data-driven. Use the actual numbers provided.`,

  lead_generation: `You are a demand generation expert generating a Lead Generation report.
Focus on lead sources, conversion paths, funnel stages, and lead quality.
Structure the report with these sections: Overview, Lead Sources, Conversion Funnel, Lead Quality Analysis, Recommendations.
For data-heavy sections, include a "data" array with relevant metrics.
Be specific about which channels drive the best leads.`,

  revenue_attribution: `You are a revenue analytics expert generating a Revenue Attribution report.
Focus on which marketing channels, campaigns, and touchpoints drive revenue.
Structure the report with these sections: Overview, Revenue by Channel, Attribution Analysis, ROI by Campaign, Recommendations.
For data-heavy sections, include a "data" array with revenue breakdowns.
Highlight the highest-ROI channels and suggest budget reallocation if appropriate.`,

  ad_performance: `You are a paid media specialist generating an Ad Performance report.
Focus on campaign metrics, creative performance, audience targeting, and budget efficiency.
Structure the report with these sections: Overview, Campaign Summary, Platform Breakdown, Creative Performance, Budget Analysis, Recommendations.
For data-heavy sections, include a "data" array with campaign metrics.
Be specific about CPC, CTR, ROAS, and cost efficiency.`,

  seo_progress: `You are an SEO strategist generating an SEO Progress report.
Focus on keyword rankings, organic traffic, technical SEO health, and content optimization.
Structure the report with these sections: Overview, Ranking Changes, Organic Traffic, Technical Health, Content Gaps, Recommendations.
For data-heavy sections, include a "data" array with ranking/traffic metrics.
Prioritize actionable SEO improvements.`,

  content_performance: `You are a content marketing analyst generating a Content Performance report.
Focus on engagement metrics, top-performing content, audience reach, and content ROI.
Structure the report with these sections: Overview, Top Performing Content, Engagement Metrics, Platform Breakdown, Content Calendar Insights, Recommendations.
For data-heavy sections, include a "data" array with engagement metrics.
Highlight what content types and topics resonate most with the audience.`,
}

// ---- Friendly titles for report types ----
const REPORT_TITLES: Record<ReportType, string> = {
  executive_summary: 'Executive Summary',
  lead_generation: 'Lead Generation Report',
  revenue_attribution: 'Revenue Attribution Report',
  ad_performance: 'Ad Performance Report',
  seo_progress: 'SEO Progress Report',
  content_performance: 'Content Performance Report',
}

/**
 * POST /api/reports/generate
 *
 * Generate an AI-powered marketing report for a brand.
 *
 * Body:
 * {
 *   "brandId": "cuid...",
 *   "type": "executive_summary" | "lead_generation" | ... ,
 *   "dateRange": { "start": "2026-03-01", "end": "2026-03-13" }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { brandId, type, dateRange } = body as {
      brandId?: string
      type?: string
      dateRange?: { start?: string; end?: string }
    }

    // ---- Validate inputs ----
    if (!brandId || !type || !dateRange?.start || !dateRange?.end) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: brandId, type, dateRange.start, dateRange.end' },
        { status: 400 }
      )
    }

    if (!REPORT_TYPES.includes(type as ReportType)) {
      return NextResponse.json(
        { success: false, error: `Invalid report type. Must be one of: ${REPORT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const reportType = type as ReportType
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    // ---- Check Anthropic API key ----
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY not configured. Add it in Settings > Integrations.' },
        { status: 503 }
      )
    }

    // ---- Fetch brand & verify ownership ----
    const brand = await db.saaSBrand.findFirst({
      where: {
        id: brandId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        brandVoice: true,
        targetAudiences: true,
        goals: true,
        budgetConstraints: true,
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found or access denied' },
        { status: 404 }
      )
    }

    // ---- Gather data for the report ----

    // Content posts in the date range
    const contentPosts = await db.contentPost.findMany({
      where: {
        brandId: brand.id,
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        title: true,
        status: true,
        platforms: true,
        publishedAt: true,
        engagementMetrics: true,
        aiGenerated: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Platform connections
    const platformConnections = await db.adPlatformConnection.findMany({
      where: { brandId: brand.id },
      select: {
        platform: true,
        status: true,
        accountName: true,
        lastSyncAt: true,
      },
    })

    // KPI snapshots in the date range
    const kpiSnapshots = await db.kPISnapshot.findMany({
      where: {
        brandId: brand.id,
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
      },
      orderBy: { periodStart: 'desc' },
      take: 30,
    })

    // Marketing events summary
    const eventCounts = await db.marketingEvent.groupBy({
      by: ['eventName'],
      where: {
        brandId: brand.id,
        timestamp: { gte: startDate, lte: endDate },
      },
      _count: { eventName: true },
    })

    // Ad campaigns
    const adCampaigns = await db.adCampaign.findMany({
      where: {
        brandId: brand.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        name: true,
        platform: true,
        status: true,
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        ctr: true,
        cpc: true,
        cpa: true,
        roas: true,
      },
      take: 20,
    })

    // SEO audits (latest)
    const seoAudit = await db.sEOAudit.findFirst({
      where: { brandId: brand.id },
      orderBy: { createdAt: 'desc' },
      select: {
        overallScore: true,
        performanceScore: true,
        seoScore: true,
        pagesFound: true,
        brokenLinks: true,
        missingAltTags: true,
        pagesWithoutTitle: true,
        pagesWithoutMeta: true,
      },
    })

    // Revenue aggregation
    const revenueAgg = await db.marketingEvent.aggregate({
      where: {
        brandId: brand.id,
        eventName: { in: ['PAYMENT_SUCCEEDED', 'SUBSCRIPTION_STARTED'] },
        timestamp: { gte: startDate, lte: endDate },
        revenue: { not: null },
      },
      _sum: { revenue: true },
      _count: true,
    })

    // ---- Build context for AI ----
    const dateRangeLabel = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

    const dataContext = {
      brand: {
        name: brand.name,
        domain: brand.domain,
        brandVoice: brand.brandVoice,
        targetAudiences: brand.targetAudiences,
        goals: brand.goals,
        budgetConstraints: brand.budgetConstraints,
      },
      dateRange: dateRangeLabel,
      contentPosts: {
        total: contentPosts.length,
        published: contentPosts.filter(p => p.status === 'PUBLISHED').length,
        scheduled: contentPosts.filter(p => p.status === 'SCHEDULED').length,
        draft: contentPosts.filter(p => p.status === 'DRAFT').length,
        aiGenerated: contentPosts.filter(p => p.aiGenerated).length,
        platforms: [...new Set(contentPosts.flatMap(p => p.platforms))],
        recentPosts: contentPosts.slice(0, 10).map(p => ({
          title: p.title,
          status: p.status,
          platforms: p.platforms,
          publishedAt: p.publishedAt,
          engagement: p.engagementMetrics,
        })),
      },
      platformConnections: platformConnections.map(pc => ({
        platform: pc.platform,
        status: pc.status,
        accountName: pc.accountName,
      })),
      kpiSnapshots: kpiSnapshots.map(k => ({
        period: `${k.periodType}: ${k.periodStart.toISOString().split('T')[0]} - ${k.periodEnd.toISOString().split('T')[0]}`,
        pageViews: k.pageViews,
        uniqueVisitors: k.uniqueVisitors,
        leads: k.leads,
        trials: k.trials,
        mrr: Number(k.mrr),
        totalAdSpend: Number(k.totalAdSpend),
        churnRate: k.churnRate ? Number(k.churnRate) : null,
      })),
      events: eventCounts.map(e => ({
        type: e.eventName,
        count: e._count.eventName,
      })),
      adCampaigns: adCampaigns.map(c => ({
        name: c.name,
        platform: c.platform,
        status: c.status,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        spend: Number(c.spend),
        ctr: c.ctr ? Number(c.ctr) : null,
        cpc: c.cpc ? Number(c.cpc) : null,
        roas: c.roas ? Number(c.roas) : null,
      })),
      seoAudit: seoAudit || null,
      revenue: {
        total: Number(revenueAgg._sum.revenue || 0),
        transactionCount: revenueAgg._count,
      },
    }

    // ---- Call Claude AI ----
    const anthropic = new Anthropic({ apiKey })

    const userPrompt = `Generate a ${REPORT_TITLES[reportType]} for "${brand.name}" covering the period ${dateRangeLabel}.

Here is all the data available for this brand during this period:

${JSON.stringify(dataContext, null, 2)}

Generate a comprehensive report with actionable insights. If data is sparse or zero for certain metrics, acknowledge it and provide recommendations for improving data collection or those metrics.

Return your response as a JSON object with this exact structure:
{
  "sections": [
    {
      "heading": "Section Title",
      "content": "Paragraph text with insights and analysis...",
      "data": [{ "label": "Metric Name", "value": "123", "change": "+12%" }]
    }
  ]
}

The "data" array is optional per section — include it only when there are specific metrics to highlight. The "change" field in data items is also optional.

Make the content professional, specific to this brand, and data-driven. Use actual numbers from the data provided. Do not fabricate metrics that are not in the data.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPTS[reportType],
      messages: [{ role: 'user', content: userPrompt }],
    })

    // ---- Parse AI response ----
    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    let sections: Array<{
      heading: string
      content: string
      data?: Array<{ label: string; value: string; change?: string }>
    }> = []

    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
      let parsed: { sections: typeof sections }

      try {
        parsed = JSON.parse(cleaned)
      } catch {
        // Try to extract JSON object from the text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not extract JSON from AI response')
        }
      }

      sections = parsed.sections || []
    } catch (parseErr) {
      console.error('Failed to parse AI report response:', parseErr)
      // Fallback: return the raw text as a single section
      sections = [
        {
          heading: 'Report',
          content: text,
        },
      ]
    }

    // ---- Build the month label for the title ----
    const monthLabel = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const report = {
      title: `${REPORT_TITLES[reportType]} — ${monthLabel}`,
      type: reportType,
      brandId: brand.id,
      brandName: brand.name,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
      sections,
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Report generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('ANTHROPIC_API_KEY') || message.includes('API key') || message.includes('authentication')) {
      return NextResponse.json(
        { success: false, error: 'Anthropic API key not configured or invalid. Check Settings > Integrations.' },
        { status: 503 }
      )
    }

    if (message.includes('429') || message.includes('rate')) {
      return NextResponse.json(
        { success: false, error: 'AI rate limit reached. Please try again in a moment.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { success: false, error: `Failed to generate report: ${message}` },
      { status: 500 }
    )
  }
}
