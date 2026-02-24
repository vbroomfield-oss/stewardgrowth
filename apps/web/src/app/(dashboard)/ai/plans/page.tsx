'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Sparkles,
  Plus,
  Loader2,
  CheckCircle,
  ArrowRight,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
}

interface DayAction {
  day: string
  tasks: Array<{
    category: string
    task: string
    priority: string
  }>
}

interface Plan {
  id: string
  brandId: string
  weekStart: string
  weekEnd: string
  goals: string[]
  actions: DayAction[]
  budgetAllocation: Record<string, number>
  focusAreas: string[]
  aiAnalysis: string | null
  status: string
  brand: { name: string; slug: string }
}

export default function WeeklyPlansPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [brandsRes, plansRes] = await Promise.all([
          fetch('/api/brands', { credentials: 'include' }),
          fetch('/api/ai/plans', { credentials: 'include' }),
        ])

        if (brandsRes.ok) {
          const data = await brandsRes.json()
          const brandList = data.brands || []
          setBrands(brandList)
          if (brandList.length > 0) {
            setSelectedBrand(brandList[0].id)
          }
        }

        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data.plans || [])
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGenerate = async () => {
    if (!selectedBrand) return
    setGenerating(true)

    try {
      const res = await fetch('/api/ai/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ brandId: selectedBrand }),
      })

      if (res.ok) {
        // Refresh plans
        const plansRes = await fetch('/api/ai/plans', { credentials: 'include' })
        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data.plans || [])
        }
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to generate plan')
      }
    } catch {
      alert('Failed to generate plan')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categoryColors: Record<string, string> = {
    Content: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    SEO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Ads: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Outreach: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Analytics: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    Social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    Email: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  }

  const priorityDots: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  }

  // Filter plans for selected brand
  const filteredPlans = selectedBrand
    ? plans.filter((p) => p.brandId === selectedBrand)
    : plans

  const currentPlan = filteredPlans[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-500" />
            Weekly Marketing Plans
          </h1>
          <p className="text-muted-foreground">
            AI-generated weekly action plans for your brands
          </p>
        </div>
        <div className="flex items-center gap-3">
          {brands.length > 0 && (
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedBrand}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-indigo-500/10 p-4 mb-4">
              <Calendar className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start generating AI-powered weekly marketing plans.
            </p>
            <Button asChild size="lg">
              <Link href="/brands/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Brand
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : currentPlan ? (
        <>
          {/* Plan Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Week</p>
                <p className="font-semibold">
                  {new Date(currentPlan.weekStart).toLocaleDateString()} -{' '}
                  {new Date(currentPlan.weekEnd).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Focus Areas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(currentPlan.focusAreas || []).map((area) => (
                    <span
                      key={area}
                      className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-semibold">{currentPlan.brand.name}</p>
              </CardContent>
            </Card>
          </div>

          {/* Goals */}
          {currentPlan.goals && (currentPlan.goals as string[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(currentPlan.goals as string[]).map((goal, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Daily Actions */}
          {currentPlan.actions && (currentPlan.actions as DayAction[]).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Daily Action Plan</h2>
              {(currentPlan.actions as DayAction[]).map((dayAction, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{dayAction.day}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(dayAction.tasks || []).map((task, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full mt-1.5 shrink-0',
                              priorityDots[task.priority] || priorityDots.MEDIUM
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{task.task}</p>
                          </div>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full shrink-0',
                              categoryColors[task.category] || 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {task.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          {currentPlan.aiAnalysis && (
            <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-indigo-900 dark:text-indigo-300 mb-1">
                      AI Strategy Analysis
                    </p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-400">
                      {currentPlan.aiAnalysis}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous Plans */}
          {filteredPlans.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredPlans.slice(1).map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(plan.weekStart).toLocaleDateString()} -{' '}
                          {new Date(plan.weekEnd).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.brand.name} - {plan.status}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          plan.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {plan.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* No Plans Yet */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-indigo-500/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Plans Generated Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Select a brand above and click "Generate Plan" to create an
              AI-powered 7-day marketing action plan.
            </p>
            <p className="text-sm text-muted-foreground">
              Requires an Anthropic API key in{' '}
              <Link href="/settings" className="text-primary hover:underline">
                Settings
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
