'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number | string
  format?: 'number' | 'currency' | 'percent' | 'decimal'
  change?: number
  changeLabel?: string
  sparklineData?: number[]
  trend?: 'up' | 'down' | 'neutral'
  trendIsPositive?: boolean // Whether up is good
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function MetricCard({
  title,
  value,
  format = 'number',
  change,
  changeLabel = 'vs last period',
  sparklineData,
  trend,
  trendIsPositive = true,
  className,
  size = 'md',
}: MetricCardProps) {
  const formattedValue = useMemo(() => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'percent':
        return `${value.toFixed(1)}%`
      case 'decimal':
        return value.toFixed(2)
      default:
        return value.toLocaleString()
    }
  }, [value, format])

  const effectiveTrend = trend || (change !== undefined
    ? change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    : 'neutral')

  const isPositiveTrend = trendIsPositive
    ? effectiveTrend === 'up'
    : effectiveTrend === 'down'

  const trendColor = effectiveTrend === 'neutral'
    ? 'text-gray-500'
    : isPositiveTrend
      ? 'text-green-500'
      : 'text-red-500'

  const sparklineColor = isPositiveTrend || effectiveTrend === 'neutral'
    ? '#22c55e'
    : '#ef4444'

  const chartData = sparklineData?.map((value, index) => ({ value, index })) || []

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const valueClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-xl border shadow-sm',
      sizeClasses[size],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className={cn('font-bold mt-1', valueClasses[size])}>
            {formattedValue}
          </p>

          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1', trendColor)}>
              {effectiveTrend === 'up' && <ArrowUpRight className="h-4 w-4" />}
              {effectiveTrend === 'down' && <ArrowDownRight className="h-4 w-4" />}
              {effectiveTrend === 'neutral' && <Minus className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">
                {changeLabel}
              </span>
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="w-20 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-xs">
                          {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function MetricGrid({
  children,
  columns = 4,
  className,
}: MetricGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
  }

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  )
}
