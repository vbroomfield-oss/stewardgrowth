'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface FunnelStage {
  name: string
  value: number
  color?: string
}

interface FunnelChartProps {
  data: FunnelStage[]
  height?: number
  showConversionRates?: boolean
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
]

export function FunnelChart({
  data,
  height = 300,
  showConversionRates = true,
}: FunnelChartProps) {
  const chartData = useMemo(() => {
    return data.map((stage, index) => {
      const previousValue = index > 0 ? data[index - 1].value : stage.value
      const conversionRate = previousValue > 0
        ? ((stage.value / previousValue) * 100).toFixed(1)
        : '100.0'

      return {
        ...stage,
        conversionRate: `${conversionRate}%`,
        dropOff: previousValue - stage.value,
        color: stage.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      }
    })
  }, [data])

  const totalConversionRate = data.length > 1 && data[0].value > 0
    ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Count: {data.value.toLocaleString()}
                    </p>
                    {showConversionRates && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Conversion: {data.conversionRate}
                      </p>
                    )}
                    {data.dropOff > 0 && (
                      <p className="text-sm text-red-500">
                        Drop-off: {data.dropOff.toLocaleString()}
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {showConversionRates && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Overall Conversion Rate
          </span>
          <span className="text-lg font-semibold">
            {totalConversionRate}%
          </span>
        </div>
      )}
    </div>
  )
}
