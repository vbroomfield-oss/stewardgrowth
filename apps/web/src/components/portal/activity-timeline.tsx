import { FileText, CheckCircle2, XCircle, Clock, Send } from 'lucide-react'

interface Activity {
  id: string
  title: string
  type: 'published' | 'approved' | 'rejected' | 'scheduled' | 'created'
  platform?: string
  date: string
}

interface ActivityTimelineProps {
  activities: Activity[]
}

const typeConfig = {
  published: { icon: Send, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Published' },
  approved: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Rejected' },
  scheduled: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Scheduled' },
  created: { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Created' },
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No recent activity
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = typeConfig[activity.type]
        const Icon = config.icon
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`p-1.5 rounded-full ${config.bg} ${config.color} mt-0.5`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{activity.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{config.label}</span>
                {activity.platform && (
                  <span className="text-xs text-muted-foreground capitalize">· {activity.platform}</span>
                )}
                <span className="text-xs text-muted-foreground">· {new Date(activity.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
