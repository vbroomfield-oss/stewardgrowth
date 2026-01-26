/**
 * AI Marketing Advisor
 *
 * Provides intelligent recommendations and explanations for marketing spend decisions.
 * Used in the approval workflow to help users understand why each spend is (or isn't) a good investment.
 */

import { type MarketingKPIs, INDUSTRY_BENCHMARKS } from '@/lib/analytics/kpi-calculator'

export type SpendRecommendation = 'strongly_recommend' | 'recommend' | 'neutral' | 'caution' | 'not_recommended'

export interface SpendAnalysis {
  recommendation: SpendRecommendation
  confidenceScore: number // 0-100
  summary: string
  reasoning: string[]
  risks: string[]
  opportunities: string[]
  alternativeActions?: string[]
  expectedOutcomes: {
    optimistic: string
    realistic: string
    pessimistic: string
  }
  roiProjection: {
    expectedROI: number
    breakEvenDays: number
    confidenceLevel: 'high' | 'medium' | 'low'
  }
}

export interface ChannelAnalysis {
  channel: string
  performanceScore: number // 0-100
  trend: 'improving' | 'stable' | 'declining'
  recommendation: string
  insights: string[]
  suggestedBudgetPercent: number
}

export interface MarketingSpendRequest {
  brandId: string
  amount: number
  channel: string
  campaignType: string
  targetAudience?: string
  duration?: number // days
  objective?: string
  creativeBrief?: string
}

/**
 * Analyze a marketing spend request and provide AI-powered recommendation
 */
export async function analyzeSpendRequest(
  request: MarketingSpendRequest,
  historicalKPIs: MarketingKPIs,
  brandContext: {
    industry: string
    currentMRR: number
    monthlyBudget: number
    growthStage: 'early' | 'growth' | 'mature'
  }
): Promise<SpendAnalysis> {
  const { amount, channel, campaignType, duration = 30 } = request
  const { industry, currentMRR, monthlyBudget, growthStage } = brandContext

  // Get industry benchmarks
  const benchmarks = INDUSTRY_BENCHMARKS[industry as keyof typeof INDUSTRY_BENCHMARKS] || INDUSTRY_BENCHMARKS.b2b_saas

  // Analyze channel historical performance
  const channelData = historicalKPIs.channelBreakdown[channel]
  const channelROAS = channelData?.roas || 0
  const channelCPA = channelData?.cpa || benchmarks.cpaTarget

  // Calculate expected outcomes
  const dailyBudget = amount / duration
  const expectedClicks = amount / (historicalKPIs.cpc || 2.5)
  const expectedConversions = expectedClicks * (benchmarks.leadConversionTarget / 100)
  const expectedRevenue = expectedConversions * (currentMRR / 100) // Simplified LTV

  // Build reasoning
  const reasoning: string[] = []
  const risks: string[] = []
  const opportunities: string[] = []

  // Budget analysis
  const budgetPercent = (amount / monthlyBudget) * 100
  if (budgetPercent > 50) {
    risks.push(`This spend represents ${budgetPercent.toFixed(0)}% of your monthly budget - consider diversification`)
  } else if (budgetPercent < 10) {
    reasoning.push(`Conservative spend (${budgetPercent.toFixed(0)}% of budget) - low risk`)
  }

  // Channel performance analysis
  if (channelROAS > benchmarks.roasTarget) {
    reasoning.push(`${channel} has historically delivered ${channelROAS.toFixed(1)}x ROAS, exceeding the ${benchmarks.roasTarget}x target`)
    opportunities.push(`Strong channel performance suggests potential for scaling`)
  } else if (channelROAS > 1) {
    reasoning.push(`${channel} is profitable with ${channelROAS.toFixed(1)}x ROAS but below target`)
  } else if (channelROAS > 0) {
    risks.push(`${channel} is currently underperforming with ${channelROAS.toFixed(1)}x ROAS`)
  }

  // CPA analysis
  if (channelCPA < benchmarks.cpaTarget) {
    reasoning.push(`CPA of $${channelCPA.toFixed(0)} is below the $${benchmarks.cpaTarget} target - efficient acquisition`)
  } else {
    risks.push(`CPA of $${channelCPA.toFixed(0)} exceeds the $${benchmarks.cpaTarget} target`)
  }

  // Campaign type analysis
  const campaignInsights = analyzeCampaignType(campaignType, growthStage)
  reasoning.push(...campaignInsights.positives)
  risks.push(...campaignInsights.negatives)

  // Growth stage considerations
  if (growthStage === 'early' && channel === 'paid_search') {
    opportunities.push(`Paid search is excellent for early-stage brands to capture high-intent traffic`)
  }
  if (growthStage === 'growth' && channel === 'paid_social') {
    opportunities.push(`Paid social can accelerate brand awareness during growth phase`)
  }

  // Determine recommendation
  let recommendation: SpendRecommendation = 'neutral'
  let confidenceScore = 50

  const positiveSignals = reasoning.length + opportunities.length
  const negativeSignals = risks.length

  if (channelROAS > benchmarks.roasTarget && channelCPA < benchmarks.cpaTarget) {
    recommendation = 'strongly_recommend'
    confidenceScore = 85
  } else if (channelROAS > 1 || positiveSignals > negativeSignals * 2) {
    recommendation = 'recommend'
    confidenceScore = 70
  } else if (channelROAS < 0.5 || negativeSignals > positiveSignals * 2) {
    recommendation = 'not_recommended'
    confidenceScore = 75
  } else if (negativeSignals > positiveSignals) {
    recommendation = 'caution'
    confidenceScore = 60
  }

  // Generate summary
  const summary = generateSummary(recommendation, amount, channel, reasoning, risks)

  // Calculate ROI projection
  const expectedROI = expectedRevenue > 0 ? ((expectedRevenue - amount) / amount) * 100 : -100
  const breakEvenDays = expectedRevenue > 0 ? Math.ceil((amount / expectedRevenue) * duration) : duration * 2

  return {
    recommendation,
    confidenceScore,
    summary,
    reasoning,
    risks,
    opportunities,
    alternativeActions: generateAlternatives(recommendation, channel, amount),
    expectedOutcomes: {
      optimistic: `${Math.ceil(expectedConversions * 1.3)} conversions, $${Math.ceil(expectedRevenue * 1.3)} revenue`,
      realistic: `${Math.ceil(expectedConversions)} conversions, $${Math.ceil(expectedRevenue)} revenue`,
      pessimistic: `${Math.ceil(expectedConversions * 0.5)} conversions, $${Math.ceil(expectedRevenue * 0.5)} revenue`,
    },
    roiProjection: {
      expectedROI: Math.round(expectedROI),
      breakEvenDays,
      confidenceLevel: confidenceScore > 70 ? 'high' : confidenceScore > 50 ? 'medium' : 'low',
    },
  }
}

/**
 * Analyze campaign type for the growth stage
 */
function analyzeCampaignType(
  campaignType: string,
  growthStage: 'early' | 'growth' | 'mature'
): { positives: string[]; negatives: string[] } {
  const positives: string[] = []
  const negatives: string[] = []

  const campaignFit: Record<string, Record<string, { fit: 'excellent' | 'good' | 'poor'; reason: string }>> = {
    brand_awareness: {
      early: { fit: 'poor', reason: 'Early stage should focus on direct response' },
      growth: { fit: 'excellent', reason: 'Brand awareness accelerates growth phase scaling' },
      mature: { fit: 'good', reason: 'Maintains market position' },
    },
    lead_generation: {
      early: { fit: 'excellent', reason: 'Direct lead gen is critical for early validation' },
      growth: { fit: 'excellent', reason: 'Lead gen fuels growth pipeline' },
      mature: { fit: 'good', reason: 'Maintains steady acquisition' },
    },
    retargeting: {
      early: { fit: 'good', reason: 'Efficient use of limited budget on warm audiences' },
      growth: { fit: 'excellent', reason: 'High ROI channel for converting existing traffic' },
      mature: { fit: 'excellent', reason: 'Critical for maintaining conversion rates' },
    },
    content_promotion: {
      early: { fit: 'good', reason: 'Builds authority and SEO foundation' },
      growth: { fit: 'good', reason: 'Supports multi-touch attribution' },
      mature: { fit: 'excellent', reason: 'Differentiates from competitors' },
    },
  }

  const analysis = campaignFit[campaignType]?.[growthStage]
  if (analysis) {
    if (analysis.fit === 'excellent' || analysis.fit === 'good') {
      positives.push(analysis.reason)
    } else {
      negatives.push(analysis.reason)
    }
  }

  return { positives, negatives }
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  recommendation: SpendRecommendation,
  amount: number,
  channel: string,
  reasoning: string[],
  risks: string[]
): string {
  const recommendationText: Record<SpendRecommendation, string> = {
    strongly_recommend: `This $${amount.toLocaleString()} ${channel} spend is highly recommended.`,
    recommend: `This $${amount.toLocaleString()} ${channel} spend looks promising.`,
    neutral: `This $${amount.toLocaleString()} ${channel} spend has mixed signals.`,
    caution: `Proceed with caution on this $${amount.toLocaleString()} ${channel} spend.`,
    not_recommended: `This $${amount.toLocaleString()} ${channel} spend is not recommended at this time.`,
  }

  let summary = recommendationText[recommendation]

  if (reasoning.length > 0) {
    summary += ` ${reasoning[0]}.`
  }

  if (risks.length > 0 && recommendation !== 'strongly_recommend') {
    summary += ` Key concern: ${risks[0]}.`
  }

  return summary
}

/**
 * Generate alternative actions if the main recommendation is cautionary
 */
function generateAlternatives(
  recommendation: SpendRecommendation,
  channel: string,
  amount: number
): string[] | undefined {
  if (recommendation === 'strongly_recommend' || recommendation === 'recommend') {
    return undefined
  }

  const alternatives: string[] = []

  if (recommendation === 'caution' || recommendation === 'not_recommended') {
    alternatives.push(`Consider a smaller test budget of $${Math.round(amount * 0.3).toLocaleString()} first`)
    alternatives.push(`Try reallocating to a higher-performing channel`)

    if (channel === 'paid_social') {
      alternatives.push(`Focus on organic social engagement before scaling paid`)
    }
    if (channel === 'paid_search') {
      alternatives.push(`Review and optimize keywords before increasing spend`)
    }
  }

  if (recommendation === 'neutral') {
    alternatives.push(`Run an A/B test with 50% of this budget`)
    alternatives.push(`Set a 2-week checkpoint to evaluate performance`)
  }

  return alternatives
}

/**
 * Analyze all channels and recommend budget allocation
 */
export async function analyzeChannelAllocation(
  historicalKPIs: MarketingKPIs,
  totalBudget: number
): Promise<ChannelAnalysis[]> {
  const channels = Object.entries(historicalKPIs.channelBreakdown)
  const totalVisitors = channels.reduce((sum, [, data]) => sum + data.visitors, 0)

  return channels.map(([channel, data]) => {
    const performanceScore = calculateChannelScore(data)
    const trend = determineChannelTrend(data) // Would use historical data in production

    // Recommend budget based on performance
    let suggestedBudgetPercent: number
    if (performanceScore > 80) {
      suggestedBudgetPercent = 35
    } else if (performanceScore > 60) {
      suggestedBudgetPercent = 25
    } else if (performanceScore > 40) {
      suggestedBudgetPercent = 15
    } else {
      suggestedBudgetPercent = 5
    }

    const insights: string[] = []
    if (data.roas > 2) {
      insights.push(`Strong ROAS of ${data.roas.toFixed(1)}x - consider scaling`)
    }
    if (data.cpa < 100) {
      insights.push(`Efficient CPA of $${data.cpa.toFixed(0)}`)
    }
    if (data.visitors / totalVisitors > 0.3) {
      insights.push(`Major traffic driver (${((data.visitors / totalVisitors) * 100).toFixed(0)}% of visitors)`)
    }

    return {
      channel,
      performanceScore,
      trend,
      recommendation: generateChannelRecommendation(performanceScore, trend),
      insights,
      suggestedBudgetPercent,
    }
  }).sort((a, b) => b.performanceScore - a.performanceScore)
}

function calculateChannelScore(data: { roas: number; cpa: number; conversions: number; trend?: number }): number {
  // Weighted scoring
  let score = 50 // Base score

  // ROAS contribution (max 25 points)
  score += Math.min(data.roas * 10, 25)

  // CPA efficiency (max 15 points)
  if (data.cpa < 50) score += 15
  else if (data.cpa < 100) score += 10
  else if (data.cpa < 150) score += 5

  // Volume bonus (max 10 points)
  if (data.conversions > 10) score += 10
  else if (data.conversions > 5) score += 5

  return Math.min(score, 100)
}

function determineChannelTrend(data: unknown): 'improving' | 'stable' | 'declining' {
  // In production, compare to historical periods
  return 'stable'
}

function generateChannelRecommendation(score: number, trend: string): string {
  if (score > 80 && trend === 'improving') {
    return 'Scale aggressively - this channel is performing exceptionally'
  }
  if (score > 60) {
    return 'Maintain or slightly increase investment'
  }
  if (score > 40) {
    return 'Optimize before scaling - potential but needs work'
  }
  return 'Consider reducing spend or pausing to investigate issues'
}

/**
 * Generate approval explanation for UI display
 */
export function formatApprovalExplanation(analysis: SpendAnalysis): {
  badge: { text: string; color: string }
  headline: string
  bullets: Array<{ type: 'positive' | 'negative' | 'neutral'; text: string }>
  bottomLine: string
} {
  const badgeConfig: Record<SpendRecommendation, { text: string; color: string }> = {
    strongly_recommend: { text: 'STRONG BUY', color: 'green' },
    recommend: { text: 'RECOMMENDED', color: 'blue' },
    neutral: { text: 'MIXED SIGNALS', color: 'yellow' },
    caution: { text: 'PROCEED WITH CAUTION', color: 'orange' },
    not_recommended: { text: 'NOT RECOMMENDED', color: 'red' },
  }

  const bullets: Array<{ type: 'positive' | 'negative' | 'neutral'; text: string }> = []

  // Add reasoning as positive bullets
  analysis.reasoning.slice(0, 3).forEach(r => {
    bullets.push({ type: 'positive', text: r })
  })

  // Add opportunities
  analysis.opportunities.slice(0, 2).forEach(o => {
    bullets.push({ type: 'positive', text: o })
  })

  // Add risks as negative bullets
  analysis.risks.slice(0, 2).forEach(r => {
    bullets.push({ type: 'negative', text: r })
  })

  const bottomLine = `Expected ROI: ${analysis.roiProjection.expectedROI > 0 ? '+' : ''}${analysis.roiProjection.expectedROI}% | ` +
    `Break-even: ${analysis.roiProjection.breakEvenDays} days | ` +
    `Confidence: ${analysis.roiProjection.confidenceLevel}`

  return {
    badge: badgeConfig[analysis.recommendation],
    headline: analysis.summary,
    bullets,
    bottomLine,
  }
}
