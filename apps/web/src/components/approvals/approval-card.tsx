'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type SpendAnalysis,
  type SpendRecommendation,
  formatApprovalExplanation,
} from '@/lib/ai/marketing-advisor'

interface AIInsight {
  recommendation: SpendRecommendation
  confidenceScore: number
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

interface ApprovalCardProps {
  id: string
  type: 'content' | 'budget' | 'campaign'
  title: string
  description: string
  brand: string
  amount?: number
  createdAt: string
  requestedBy: string
  aiInsight?: AIInsight
  onApprove: () => void
  onReject: (reason: string) => void
}

const typeConfig = {
  content: {
    icon: FileText,
    label: 'Content',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  budget: {
    icon: DollarSign,
    label: 'Budget',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  campaign: {
    icon: Target,
    label: 'Campaign',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
}

const recommendationConfig: Record<SpendRecommendation, {
  badge: string
  color: string
  bgColor: string
  icon: typeof TrendingUp
}> = {
  strongly_recommend: {
    badge: 'STRONG BUY',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: TrendingUp,
  },
  recommend: {
    badge: 'RECOMMENDED',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: TrendingUp,
  },
  neutral: {
    badge: 'MIXED SIGNALS',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: AlertTriangle,
  },
  caution: {
    badge: 'CAUTION',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: AlertTriangle,
  },
  not_recommended: {
    badge: 'NOT RECOMMENDED',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: TrendingDown,
  },
}

export function ApprovalCard({
  id,
  type,
  title,
  description,
  brand,
  amount,
  createdAt,
  requestedBy,
  aiInsight,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const config = typeConfig[type]
  const Icon = config.icon
  const recommendation = aiInsight ? recommendationConfig[aiInsight.recommendation] : null
  const RecommendationIcon = recommendation?.icon || Sparkles

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Main Content */}
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Type Icon */}
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {brand}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
                {amount !== undefined && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className={cn(
                      'text-xs font-medium',
                      amount >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {amount >= 0 ? '+' : ''}{amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </>
                )}
              </div>

              <h4 className="font-medium mb-1">{title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{createdAt}</span>
                <span>•</span>
                <span>by {requestedBy}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={onApprove}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        </div>

        {/* AI Insight Section */}
        {aiInsight && (
          <div className="border-t">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">AI Marketing Advisor</span>
                {recommendation && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-bold',
                    recommendation.bgColor,
                    recommendation.color
                  )}>
                    {recommendation.badge}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {aiInsight.confidenceScore}% confidence
                </span>
              </div>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expanded && (
              <div className="px-4 pb-4 space-y-4">
                {/* Summary */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">{aiInsight.summary}</p>
                </div>

                {/* Key Points */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Positive Points */}
                  {(aiInsight.reasoning.length > 0 || aiInsight.opportunities.length > 0) && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Why This Is Good
                      </h5>
                      <ul className="space-y-1">
                        {aiInsight.reasoning.slice(0, 3).map((point, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            {point}
                          </li>
                        ))}
                        {aiInsight.opportunities.slice(0, 2).map((point, i) => (
                          <li key={`opp-${i}`} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Lightbulb className="h-3 w-3 text-yellow-500 mt-1" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risks */}
                  {aiInsight.risks.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Risks to Consider
                      </h5>
                      <ul className="space-y-1">
                        {aiInsight.risks.map((risk, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-500 mt-1">!</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* ROI Projection */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Expected ROI</p>
                    <p className={cn(
                      'text-lg font-bold',
                      aiInsight.roiProjection.expectedROI > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {aiInsight.roiProjection.expectedROI > 0 ? '+' : ''}
                      {aiInsight.roiProjection.expectedROI}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Break-even</p>
                    <p className="text-lg font-bold">{aiInsight.roiProjection.breakEvenDays} days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className={cn(
                      'text-lg font-bold capitalize',
                      aiInsight.roiProjection.confidenceLevel === 'high' ? 'text-green-600' :
                      aiInsight.roiProjection.confidenceLevel === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    )}>
                      {aiInsight.roiProjection.confidenceLevel}
                    </p>
                  </div>
                </div>

                {/* Expected Outcomes */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Expected Outcomes</h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
                      <p className="text-muted-foreground">Optimistic</p>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        {aiInsight.expectedOutcomes.optimistic}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-center">
                      <p className="text-muted-foreground">Realistic</p>
                      <p className="font-medium text-blue-700 dark:text-blue-400">
                        {aiInsight.expectedOutcomes.realistic}
                      </p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
                      <p className="text-muted-foreground">Pessimistic</p>
                      <p className="font-medium text-red-700 dark:text-red-400">
                        {aiInsight.expectedOutcomes.pessimistic}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alternative Actions */}
                {aiInsight.alternativeActions && aiInsight.alternativeActions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-yellow-600">Alternative Actions</h5>
                    <ul className="space-y-1">
                      {aiInsight.alternativeActions.map((action, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">→</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="border-t p-4 bg-red-50/50 dark:bg-red-900/10">
            <p className="text-sm font-medium mb-2">Reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2 text-sm border rounded-lg resize-none"
              rows={3}
              placeholder="Enter reason for rejection..."
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onReject(rejectReason)
                  setShowRejectDialog(false)
                  setRejectReason('')
                }}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
