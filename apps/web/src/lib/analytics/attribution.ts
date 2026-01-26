/**
 * Attribution Engine
 *
 * Multi-touch attribution modeling to understand which marketing
 * channels and campaigns drive conversions.
 *
 * Models supported:
 * - First Touch: 100% credit to first interaction
 * - Last Touch: 100% credit to last interaction before conversion
 * - Linear: Equal credit across all touchpoints
 * - Time Decay: More credit to recent touchpoints
 * - Position Based (U-shaped): 40% first, 40% last, 20% middle
 * - Data-Driven: ML-based (requires significant data)
 */

import { type ProcessedEvent } from './event-processor'

export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'data_driven'

export interface Touchpoint {
  timestamp: Date
  channel: string
  source: string
  medium?: string
  campaign?: string
  adGroup?: string
  keyword?: string
  content?: string
  landingPage?: string
}

export interface ConversionJourney {
  visitorId: string
  conversionId: string
  conversionType: string
  conversionValue: number
  conversionTime: Date
  touchpoints: Touchpoint[]
  timeToConversion: number // milliseconds from first touch
}

export interface AttributionResult {
  channel: string
  source: string
  campaign?: string
  conversions: number
  revenue: number
  credit: number // Attribution credit (0-1)
  assistedConversions: number
  firstTouchConversions: number
  lastTouchConversions: number
}

export interface ChannelAttribution {
  channel: string
  firstTouch: number
  lastTouch: number
  linear: number
  timeDecay: number
  positionBased: number
  conversions: number
  revenue: number
  avgTouchpoints: number
  avgTimeToConversion: number
}

/**
 * Build conversion journeys from events
 */
export function buildConversionJourneys(
  events: ProcessedEvent[],
  conversionEventTypes: string[] = ['subscription_started', 'trial_converted', 'payment_completed']
): ConversionJourney[] {
  // Group events by visitor
  const visitorEvents = new Map<string, ProcessedEvent[]>()

  for (const event of events) {
    if (!event.visitorId) continue

    const existing = visitorEvents.get(event.visitorId) || []
    existing.push(event)
    visitorEvents.set(event.visitorId, existing)
  }

  const journeys: ConversionJourney[] = []

  // Build journey for each visitor with a conversion
  for (const [visitorId, visitorEventList] of visitorEvents) {
    // Sort by timestamp
    const sorted = visitorEventList.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Find conversions
    const conversions = sorted.filter(e => conversionEventTypes.includes(e.eventType))

    for (const conversion of conversions) {
      const conversionTime = new Date(conversion.timestamp)

      // Get all touchpoints before conversion
      const touchpointEvents = sorted.filter(
        e => new Date(e.timestamp) < conversionTime && e.channel
      )

      if (touchpointEvents.length === 0) continue

      const touchpoints: Touchpoint[] = touchpointEvents.map(e => ({
        timestamp: new Date(e.timestamp),
        channel: e.channel,
        source: e.source || e.channel,
        medium: e.medium,
        campaign: e.utm?.campaign,
        keyword: e.keyword,
        landingPage: e.pageUrl,
      }))

      const firstTouchTime = touchpoints[0].timestamp.getTime()

      journeys.push({
        visitorId,
        conversionId: conversion.id,
        conversionType: conversion.eventType,
        conversionValue: conversion.revenue || 0,
        conversionTime,
        touchpoints,
        timeToConversion: conversionTime.getTime() - firstTouchTime,
      })
    }
  }

  return journeys
}

/**
 * First Touch Attribution
 * 100% credit to the first touchpoint
 */
function firstTouchAttribution(journey: ConversionJourney): Map<string, number> {
  const credits = new Map<string, number>()

  if (journey.touchpoints.length > 0) {
    const first = journey.touchpoints[0]
    credits.set(first.channel, 1.0)
  }

  return credits
}

/**
 * Last Touch Attribution
 * 100% credit to the last touchpoint before conversion
 */
function lastTouchAttribution(journey: ConversionJourney): Map<string, number> {
  const credits = new Map<string, number>()

  if (journey.touchpoints.length > 0) {
    const last = journey.touchpoints[journey.touchpoints.length - 1]
    credits.set(last.channel, 1.0)
  }

  return credits
}

/**
 * Linear Attribution
 * Equal credit across all touchpoints
 */
function linearAttribution(journey: ConversionJourney): Map<string, number> {
  const credits = new Map<string, number>()
  const creditPerTouch = 1.0 / journey.touchpoints.length

  for (const touchpoint of journey.touchpoints) {
    const existing = credits.get(touchpoint.channel) || 0
    credits.set(touchpoint.channel, existing + creditPerTouch)
  }

  return credits
}

/**
 * Time Decay Attribution
 * More credit to touchpoints closer to conversion
 * Uses a half-life decay model (default 7 days)
 */
function timeDecayAttribution(
  journey: ConversionJourney,
  halfLifeDays: number = 7
): Map<string, number> {
  const credits = new Map<string, number>()
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000
  const conversionTime = journey.conversionTime.getTime()

  // Calculate raw weights
  const weights: { channel: string; weight: number }[] = []
  let totalWeight = 0

  for (const touchpoint of journey.touchpoints) {
    const timeDiff = conversionTime - touchpoint.timestamp.getTime()
    const weight = Math.pow(2, -timeDiff / halfLifeMs)
    weights.push({ channel: touchpoint.channel, weight })
    totalWeight += weight
  }

  // Normalize to sum to 1
  for (const { channel, weight } of weights) {
    const normalizedWeight = weight / totalWeight
    const existing = credits.get(channel) || 0
    credits.set(channel, existing + normalizedWeight)
  }

  return credits
}

/**
 * Position Based (U-shaped) Attribution
 * 40% to first touch, 40% to last touch, 20% distributed among middle
 */
function positionBasedAttribution(journey: ConversionJourney): Map<string, number> {
  const credits = new Map<string, number>()
  const touchpoints = journey.touchpoints

  if (touchpoints.length === 0) return credits

  if (touchpoints.length === 1) {
    credits.set(touchpoints[0].channel, 1.0)
    return credits
  }

  if (touchpoints.length === 2) {
    // Split 50/50 between first and last
    const firstCredit = credits.get(touchpoints[0].channel) || 0
    credits.set(touchpoints[0].channel, firstCredit + 0.5)

    const lastCredit = credits.get(touchpoints[1].channel) || 0
    credits.set(touchpoints[1].channel, lastCredit + 0.5)

    return credits
  }

  // First touch: 40%
  const firstCredit = credits.get(touchpoints[0].channel) || 0
  credits.set(touchpoints[0].channel, firstCredit + 0.4)

  // Last touch: 40%
  const last = touchpoints[touchpoints.length - 1]
  const lastCredit = credits.get(last.channel) || 0
  credits.set(last.channel, lastCredit + 0.4)

  // Middle touches: 20% split evenly
  const middleCount = touchpoints.length - 2
  const middleCredit = 0.2 / middleCount

  for (let i = 1; i < touchpoints.length - 1; i++) {
    const existing = credits.get(touchpoints[i].channel) || 0
    credits.set(touchpoints[i].channel, existing + middleCredit)
  }

  return credits
}

/**
 * Apply attribution model to a journey
 */
export function attributeJourney(
  journey: ConversionJourney,
  model: AttributionModel
): Map<string, number> {
  switch (model) {
    case 'first_touch':
      return firstTouchAttribution(journey)
    case 'last_touch':
      return lastTouchAttribution(journey)
    case 'linear':
      return linearAttribution(journey)
    case 'time_decay':
      return timeDecayAttribution(journey)
    case 'position_based':
      return positionBasedAttribution(journey)
    case 'data_driven':
      // Data-driven requires ML model - fall back to position-based
      return positionBasedAttribution(journey)
    default:
      return lastTouchAttribution(journey)
  }
}

/**
 * Calculate attribution across all journeys
 */
export function calculateAttribution(
  journeys: ConversionJourney[],
  model: AttributionModel = 'position_based'
): AttributionResult[] {
  const channelResults = new Map<string, AttributionResult>()

  for (const journey of journeys) {
    const credits = attributeJourney(journey, model)

    // Track first and last touch
    const firstChannel = journey.touchpoints[0]?.channel
    const lastChannel = journey.touchpoints[journey.touchpoints.length - 1]?.channel

    for (const [channel, credit] of credits) {
      let result = channelResults.get(channel)

      if (!result) {
        result = {
          channel,
          source: channel,
          conversions: 0,
          revenue: 0,
          credit: 0,
          assistedConversions: 0,
          firstTouchConversions: 0,
          lastTouchConversions: 0,
        }
        channelResults.set(channel, result)
      }

      result.credit += credit
      result.conversions += credit // Fractional conversions
      result.revenue += journey.conversionValue * credit

      // Track assisted vs. direct conversions
      if (credit < 1 && credit > 0) {
        result.assistedConversions += 1
      }

      if (channel === firstChannel) {
        result.firstTouchConversions += 1
      }

      if (channel === lastChannel) {
        result.lastTouchConversions += 1
      }
    }
  }

  return Array.from(channelResults.values()).sort((a, b) => b.credit - a.credit)
}

/**
 * Compare attribution across all models
 */
export function compareAttributionModels(
  journeys: ConversionJourney[]
): ChannelAttribution[] {
  const models: AttributionModel[] = [
    'first_touch',
    'last_touch',
    'linear',
    'time_decay',
    'position_based',
  ]

  // Calculate attribution for each model
  const resultsByModel = new Map<AttributionModel, AttributionResult[]>()
  for (const model of models) {
    resultsByModel.set(model, calculateAttribution(journeys, model))
  }

  // Merge into channel comparison
  const channels = new Set<string>()
  for (const results of resultsByModel.values()) {
    for (const result of results) {
      channels.add(result.channel)
    }
  }

  const comparison: ChannelAttribution[] = []

  for (const channel of channels) {
    // Calculate averages for this channel
    const channelJourneys = journeys.filter(j =>
      j.touchpoints.some(t => t.channel === channel)
    )

    const avgTouchpoints = channelJourneys.length > 0
      ? channelJourneys.reduce((sum, j) => sum + j.touchpoints.length, 0) / channelJourneys.length
      : 0

    const avgTimeToConversion = channelJourneys.length > 0
      ? channelJourneys.reduce((sum, j) => sum + j.timeToConversion, 0) / channelJourneys.length / (24 * 60 * 60 * 1000) // Convert to days
      : 0

    const totalRevenue = channelJourneys.reduce((sum, j) => sum + j.conversionValue, 0)

    comparison.push({
      channel,
      firstTouch: resultsByModel.get('first_touch')?.find(r => r.channel === channel)?.credit || 0,
      lastTouch: resultsByModel.get('last_touch')?.find(r => r.channel === channel)?.credit || 0,
      linear: resultsByModel.get('linear')?.find(r => r.channel === channel)?.credit || 0,
      timeDecay: resultsByModel.get('time_decay')?.find(r => r.channel === channel)?.credit || 0,
      positionBased: resultsByModel.get('position_based')?.find(r => r.channel === channel)?.credit || 0,
      conversions: channelJourneys.length,
      revenue: totalRevenue,
      avgTouchpoints,
      avgTimeToConversion,
    })
  }

  return comparison.sort((a, b) => b.positionBased - a.positionBased)
}

/**
 * Get conversion paths (common sequences)
 */
export function getConversionPaths(
  journeys: ConversionJourney[],
  maxLength: number = 5
): Array<{ path: string[]; count: number; revenue: number; avgTouchpoints: number }> {
  const pathCounts = new Map<string, { count: number; revenue: number; touchpoints: number[] }>()

  for (const journey of journeys) {
    // Truncate path to maxLength
    const channels = journey.touchpoints.slice(0, maxLength).map(t => t.channel)
    const pathKey = channels.join(' → ')

    const existing = pathCounts.get(pathKey) || { count: 0, revenue: 0, touchpoints: [] }
    existing.count += 1
    existing.revenue += journey.conversionValue
    existing.touchpoints.push(journey.touchpoints.length)
    pathCounts.set(pathKey, existing)
  }

  return Array.from(pathCounts.entries())
    .map(([pathKey, data]) => ({
      path: pathKey.split(' → '),
      count: data.count,
      revenue: data.revenue,
      avgTouchpoints: data.touchpoints.reduce((a, b) => a + b, 0) / data.touchpoints.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20) // Top 20 paths
}

/**
 * Attribution insights generator
 */
export function generateAttributionInsights(
  comparison: ChannelAttribution[],
  paths: Array<{ path: string[]; count: number }>
): string[] {
  const insights: string[] = []

  // Find top performing channel
  const topChannel = comparison[0]
  if (topChannel) {
    insights.push(
      `${topChannel.channel} is your top-performing channel with ${topChannel.positionBased.toFixed(1)} attributed conversions`
    )
  }

  // Find channels that perform better on first vs last touch
  for (const channel of comparison) {
    if (channel.firstTouch > channel.lastTouch * 1.5) {
      insights.push(
        `${channel.channel} excels at awareness (${channel.firstTouch.toFixed(1)} first-touch vs ${channel.lastTouch.toFixed(1)} last-touch)`
      )
    }
    if (channel.lastTouch > channel.firstTouch * 1.5) {
      insights.push(
        `${channel.channel} excels at closing (${channel.lastTouch.toFixed(1)} last-touch vs ${channel.firstTouch.toFixed(1)} first-touch)`
      )
    }
  }

  // Find common conversion paths
  const topPath = paths[0]
  if (topPath) {
    insights.push(
      `Most common conversion path: ${topPath.path.join(' → ')} (${topPath.count} conversions)`
    )
  }

  // Multi-touch insights
  const multiTouchChannels = comparison.filter(c => c.avgTouchpoints > 2)
  if (multiTouchChannels.length > 0) {
    insights.push(
      `Channels like ${multiTouchChannels[0].channel} typically require ${multiTouchChannels[0].avgTouchpoints.toFixed(1)} touchpoints before conversion`
    )
  }

  return insights
}
