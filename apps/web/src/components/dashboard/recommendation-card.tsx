import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  X,
  ArrowRight,
} from 'lucide-react'

type RecommendationType = 'opportunity' | 'warning' | 'insight' | 'action'

interface RecommendationCardProps {
  type: RecommendationType
  title: string
  description: string
  impact?: string
  brand?: string
  onAccept?: () => void
  onDismiss?: () => void
}

const typeConfig = {
  opportunity: {
    icon: TrendingUp,
    bgColor: 'bg-success/10',
    iconColor: 'text-success',
    borderColor: 'border-success/20',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-warning/10',
    iconColor: 'text-warning',
    borderColor: 'border-warning/20',
  },
  insight: {
    icon: Lightbulb,
    bgColor: 'bg-info/10',
    iconColor: 'text-info',
    borderColor: 'border-info/20',
  },
  action: {
    icon: Sparkles,
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
  },
}

export function RecommendationCard({
  type,
  title,
  description,
  impact,
  brand,
  onAccept,
  onDismiss,
}: RecommendationCardProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Card className={cn('border-l-4', config.borderColor)}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className={cn('p-2 rounded-lg h-fit', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                {brand && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {brand}
                  </span>
                )}
                <h4 className="font-medium">{title}</h4>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            {impact && (
              <p className="text-sm font-medium text-success mt-2">
                Estimated impact: {impact}
              </p>
            )}
            {onAccept && (
              <Button size="sm" className="mt-3" onClick={onAccept}>
                Take Action
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
