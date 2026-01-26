'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Sparkles,
  CheckCircle,
  Clock,
  Target,
  FileText,
  Megaphone,
  Search,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const weeklyPlan = {
  week: 'Jan 20 - Jan 26, 2025',
  status: 'in_progress',
  completedTasks: 8,
  totalTasks: 15,
  tasks: [
    { category: 'SEO', task: 'Publish blog post: "5 Church Management Trends for 2025"', brand: 'StewardMAX', status: 'completed', priority: 'high' },
    { category: 'SEO', task: 'Update meta descriptions for pricing pages', brand: 'StewardRing', status: 'completed', priority: 'medium' },
    { category: 'Content', task: 'Create LinkedIn post about AI in ministry', brand: 'StewardMAX', status: 'completed', priority: 'high' },
    { category: 'Content', task: 'Write email newsletter for trial users', brand: 'All', status: 'in_progress', priority: 'high' },
    { category: 'Ads', task: 'Launch "VoIP for Churches" Google campaign', brand: 'StewardRing', status: 'pending', priority: 'high' },
    { category: 'Ads', task: 'A/B test new ad creative for Meta', brand: 'StewardMAX', status: 'pending', priority: 'medium' },
    { category: 'SEO', task: 'Build backlinks from church tech blogs', brand: 'StewardMAX', status: 'pending', priority: 'medium' },
  ],
}

const upcomingPlans = [
  { week: 'Jan 27 - Feb 2', focus: 'Product Launch Campaign', status: 'draft' },
  { week: 'Feb 3 - Feb 9', focus: 'Valentine\'s Giving Campaign', status: 'scheduled' },
  { week: 'Feb 10 - Feb 16', focus: 'Webinar Promotion', status: 'scheduled' },
]

export default function WeeklyPlansPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-500" />
            Weekly Marketing Plans
          </h1>
          <p className="text-muted-foreground">
            AI-generated weekly action plans
          </p>
        </div>
        <Button>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate New Plan
        </Button>
      </div>

      {/* Current Week */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>This Week: {weeklyPlan.week}</CardTitle>
              <CardDescription>
                {weeklyPlan.completedTasks} of {weeklyPlan.totalTasks} tasks completed
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(weeklyPlan.completedTasks / weeklyPlan.totalTasks) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round((weeklyPlan.completedTasks / weeklyPlan.totalTasks) * 100)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyPlan.tasks.map((task, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-4 p-3 border rounded-lg',
                  task.status === 'completed' && 'bg-green-50 dark:bg-green-900/10 border-green-200'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  task.category === 'SEO' && 'bg-blue-100 dark:bg-blue-900/30',
                  task.category === 'Content' && 'bg-green-100 dark:bg-green-900/30',
                  task.category === 'Ads' && 'bg-purple-100 dark:bg-purple-900/30',
                )}>
                  {task.category === 'SEO' && <Search className="h-4 w-4 text-blue-600" />}
                  {task.category === 'Content' && <FileText className="h-4 w-4 text-green-600" />}
                  {task.category === 'Ads' && <Megaphone className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    'font-medium text-sm',
                    task.status === 'completed' && 'line-through text-muted-foreground'
                  )}>
                    {task.task}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.brand}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.priority === 'high' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">High</span>
                  )}
                  {task.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {task.status === 'in_progress' && <Clock className="h-5 w-5 text-yellow-500" />}
                  {task.status === 'pending' && (
                    <Button size="sm" variant="outline">Start</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Plans</CardTitle>
          <CardDescription>AI-generated plans for future weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingPlans.map((plan, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{plan.week}</p>
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded',
                    plan.status === 'draft' && 'bg-yellow-100 text-yellow-700',
                    plan.status === 'scheduled' && 'bg-green-100 text-green-700',
                  )}>
                    {plan.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.focus}</p>
                <Button size="sm" variant="ghost" className="mt-2 w-full">View Plan</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
