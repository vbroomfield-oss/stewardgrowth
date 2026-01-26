import { Card, CardContent } from '@/components/ui/card'
import { cn, formatNumber, formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  previousValue?: number
  format?: 'number' | 'currency' | 'percent'
  icon?: LucideIcon
  iconColor?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  icon: Icon,
  iconColor = 'text-primary',
  className,
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percent':
        return formatPercent(val)
      default:
        return formatNumber(val)
    }
  }

  const change = previousValue
    ? ((value - previousValue) / previousValue) * 100
    : 0

  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <Card className={cn('card-hover', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className={cn('p-2 rounded-lg bg-primary/10', iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight">{formatValue(value)}</p>
        {previousValue !== undefined && (
          <div className="flex items-center gap-1 text-sm mt-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : isNegative ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                'font-medium',
                isPositive && 'text-green-500',
                isNegative && 'text-red-500',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive && '+'}
              {change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
