'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { type ChannelAttribution } from '@/lib/analytics/attribution'

interface AttributionChartProps {
  data: ChannelAttribution[]
  height?: number
}

type ViewMode = 'bar' | 'radar' | 'comparison'

export function AttributionChart({
  data,
  height = 400,
}: AttributionChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bar')
  const [selectedModel, setSelectedModel] = useState<'positionBased' | 'firstTouch' | 'lastTouch' | 'linear' | 'timeDecay'>('positionBased')

  const chartData = useMemo(() => {
    return data.map(channel => ({
      channel: channel.channel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      'First Touch': channel.firstTouch,
      'Last Touch': channel.lastTouch,
      'Linear': channel.linear,
      'Time Decay': channel.timeDecay,
      'Position Based': channel.positionBased,
      conversions: channel.conversions,
      revenue: channel.revenue,
      avgTouchpoints: channel.avgTouchpoints,
    }))
  }, [data])

  const modelLabels: Record<string, string> = {
    positionBased: 'Position Based',
    firstTouch: 'First Touch',
    lastTouch: 'Last Touch',
    linear: 'Linear',
    timeDecay: 'Time Decay',
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
          <div className="flex rounded-lg border overflow-hidden">
            {(['bar', 'radar', 'comparison'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm capitalize ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'bar' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
              className="px-3 py-1 text-sm border rounded-lg bg-white dark:bg-gray-800"
            >
              {Object.entries(modelLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bar Chart View */}
      {viewMode === 'bar' && (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="channel"
              angle={-45}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                      <p className="font-medium">{data.channel}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {modelLabels[selectedModel]}: {data[modelLabels[selectedModel]]?.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Conversions: {data.conversions}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Revenue: ${data.revenue.toLocaleString()}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey={modelLabels[selectedModel]}
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Radar Chart View */}
      {viewMode === 'radar' && (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="channel" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
            <Radar
              name="First Touch"
              dataKey="First Touch"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.1}
            />
            <Radar
              name="Last Touch"
              dataKey="Last Touch"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.1}
            />
            <Radar
              name="Position Based"
              dataKey="Position Based"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="channel"
              angle={-45}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="First Touch" fill="#ef4444" />
            <Bar dataKey="Last Touch" fill="#22c55e" />
            <Bar dataKey="Position Based" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Channel Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map((channel) => (
          <div
            key={channel.channel}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {channel.channel.replace('_', ' ')}
            </p>
            <p className="text-xl font-semibold">
              {channel.positionBased.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">
              Avg {channel.avgTouchpoints.toFixed(1)} touchpoints
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
