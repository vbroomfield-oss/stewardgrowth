import { Card, CardContent } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

interface PortalStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
}

export function PortalStatsCard({ title, value, icon: Icon, color = 'text-primary' }: PortalStatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`p-2 rounded-lg bg-primary/10 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}
