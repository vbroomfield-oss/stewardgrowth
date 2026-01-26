'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  Globe,
  FileText,
  Key,
  CreditCard,
  Shield,
  Megaphone,
  Target,
  Palette,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'

interface ReadinessItem {
  id: string
  category: string
  title: string
  description: string
  status: 'complete' | 'incomplete' | 'warning'
  action?: string
  actionUrl?: string
}

interface ReadinessChecklistProps {
  brandName: string
  items: ReadinessItem[]
  onItemClick?: (itemId: string) => void
}

const categoryIcons: Record<string, React.ElementType> = {
  website: Globe,
  content: FileText,
  integrations: Key,
  payments: CreditCard,
  legal: Shield,
  advertising: Megaphone,
  targeting: Target,
  branding: Palette,
  support: MessageSquare,
}

const statusConfig = {
  complete: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Complete',
  },
  incomplete: {
    icon: Circle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Incomplete',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Needs Attention',
  },
}

export function ReadinessChecklist({ brandName, items, onItemClick }: ReadinessChecklistProps) {
  const completeCount = items.filter((i) => i.status === 'complete').length
  const totalCount = items.length
  const isReady = completeCount === totalCount
  const readinessPercent = Math.round((completeCount / totalCount) * 100)

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, ReadinessItem[]>)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Readiness Checklist</CardTitle>
            <CardDescription>
              Complete all items before {brandName} can be actively marketed
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={cn(
              'text-2xl font-bold',
              isReady ? 'text-success' : 'text-warning'
            )}>
              {readinessPercent}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completeCount} of {totalCount} complete
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mt-4">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isReady ? 'bg-success' : 'bg-warning'
            )}
            style={{ width: `${readinessPercent}%` }}
          />
        </div>

        {!isReady && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-warning">
              Marketing is paused until all requirements are met
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const CategoryIcon = categoryIcons[category] || FileText
          const categoryComplete = categoryItems.every((i) => i.status === 'complete')

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <CategoryIcon className={cn(
                  'h-4 w-4',
                  categoryComplete ? 'text-success' : 'text-muted-foreground'
                )} />
                <h4 className="font-medium capitalize">{category}</h4>
                {categoryComplete && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>

              <div className="space-y-2 ml-6">
                {categoryItems.map((item) => {
                  const config = statusConfig[item.status]
                  const StatusIcon = config.icon

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        item.status === 'complete' && 'bg-success/5 border-success/20',
                        item.status === 'warning' && 'bg-warning/5 border-warning/20',
                        item.status === 'incomplete' && 'bg-muted/50 border-border'
                      )}
                    >
                      <StatusIcon className={cn('h-5 w-5 mt-0.5', config.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      {item.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onItemClick?.(item.id)}
                        >
                          {item.action}
                          {item.actionUrl && <ExternalLink className="ml-1 h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Default readiness checklist items
export const defaultReadinessItems: ReadinessItem[] = [
  // Website
  {
    id: 'website-live',
    category: 'website',
    title: 'Website is live and accessible',
    description: 'Domain is configured and website loads properly',
    status: 'incomplete',
    action: 'Verify',
  },
  {
    id: 'landing-page-approved',
    category: 'website',
    title: 'Landing page approved',
    description: 'Primary landing page has been reviewed and approved for marketing',
    status: 'incomplete',
    action: 'Review',
  },
  {
    id: 'pricing-page',
    category: 'website',
    title: 'Pricing page complete',
    description: 'Clear pricing with all plans and features listed',
    status: 'incomplete',
    action: 'Review',
  },
  {
    id: 'ssl-configured',
    category: 'website',
    title: 'SSL certificate active',
    description: 'HTTPS is properly configured for security',
    status: 'incomplete',
  },

  // Content
  {
    id: 'brand-voice',
    category: 'content',
    title: 'Brand voice defined',
    description: 'Tone, personality, and messaging guidelines set for AI content',
    status: 'incomplete',
    action: 'Configure',
  },
  {
    id: 'sample-content',
    category: 'content',
    title: 'Sample content approved',
    description: 'At least 3 sample posts approved for each platform',
    status: 'incomplete',
    action: 'Create',
  },

  // Integrations (API Keys)
  {
    id: 'analytics-connected',
    category: 'integrations',
    title: 'Analytics tracking active',
    description: 'Event tracking SDK installed and sending data',
    status: 'incomplete',
    action: 'Setup',
  },
  {
    id: 'google-ads-connected',
    category: 'integrations',
    title: 'Google Ads connected',
    description: 'API credentials configured and account linked',
    status: 'incomplete',
    action: 'Connect',
  },
  {
    id: 'meta-ads-connected',
    category: 'integrations',
    title: 'Meta Ads connected',
    description: 'Facebook/Instagram business account linked',
    status: 'incomplete',
    action: 'Connect',
  },

  // Payments
  {
    id: 'payment-processing',
    category: 'payments',
    title: 'Payment processing active',
    description: 'Stripe/payment gateway configured and tested',
    status: 'incomplete',
  },
  {
    id: 'subscription-plans',
    category: 'payments',
    title: 'Subscription plans configured',
    description: 'All pricing tiers set up in payment system',
    status: 'incomplete',
  },

  // Legal
  {
    id: 'privacy-policy',
    category: 'legal',
    title: 'Privacy policy published',
    description: 'GDPR/CCPA compliant privacy policy on website',
    status: 'incomplete',
    action: 'Verify',
  },
  {
    id: 'terms-of-service',
    category: 'legal',
    title: 'Terms of service published',
    description: 'Legal terms and conditions available',
    status: 'incomplete',
    action: 'Verify',
  },
  {
    id: 'cookie-consent',
    category: 'legal',
    title: 'Cookie consent configured',
    description: 'Cookie banner and consent management active',
    status: 'incomplete',
  },

  // Advertising
  {
    id: 'ad-budget-set',
    category: 'advertising',
    title: 'Ad budget defined',
    description: 'Monthly and daily spend limits configured',
    status: 'incomplete',
    action: 'Set Budget',
  },
  {
    id: 'conversion-tracking',
    category: 'advertising',
    title: 'Conversion tracking configured',
    description: 'Pixel/tag installed for tracking ad conversions',
    status: 'incomplete',
  },

  // Targeting
  {
    id: 'target-audience',
    category: 'targeting',
    title: 'Target audiences defined',
    description: 'At least one target audience segment configured',
    status: 'incomplete',
    action: 'Define',
  },
  {
    id: 'goals-set',
    category: 'targeting',
    title: 'Marketing goals set',
    description: 'Monthly lead, trial, and revenue targets defined',
    status: 'incomplete',
    action: 'Set Goals',
  },

  // Branding
  {
    id: 'logo-uploaded',
    category: 'branding',
    title: 'Logo uploaded',
    description: 'Brand logo available for marketing materials',
    status: 'incomplete',
    action: 'Upload',
  },
  {
    id: 'brand-colors',
    category: 'branding',
    title: 'Brand colors configured',
    description: 'Primary and secondary colors set',
    status: 'incomplete',
  },

  // Support
  {
    id: 'support-email',
    category: 'support',
    title: 'Support email configured',
    description: 'Customer support contact available',
    status: 'incomplete',
  },
]
