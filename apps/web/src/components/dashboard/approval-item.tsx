'use client'

import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import { Check, X, Clock, FileText, Megaphone, DollarSign } from 'lucide-react'

type ApprovalType = 'content' | 'campaign' | 'budget'

interface ApprovalItemProps {
  type: ApprovalType
  title: string
  description: string
  brand: string
  amount?: number
  createdAt: string
  onApprove?: () => void
  onReject?: () => void
}

const typeConfig = {
  content: {
    icon: FileText,
    label: 'Content',
    color: 'text-blue-500 bg-blue-500/10',
  },
  campaign: {
    icon: Megaphone,
    label: 'Campaign',
    color: 'text-purple-500 bg-purple-500/10',
  },
  budget: {
    icon: DollarSign,
    label: 'Budget',
    color: 'text-green-500 bg-green-500/10',
  },
}

export function ApprovalItem({
  type,
  title,
  description,
  brand,
  amount,
  createdAt,
  onApprove,
  onReject,
}: ApprovalItemProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className={cn('p-2 rounded-lg', config.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {brand}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{config.label}</span>
        </div>
        <h4 className="font-medium truncate">{title}</h4>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{createdAt}</span>
          {amount !== undefined && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium">{formatCurrency(amount)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onReject}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
          onClick={onApprove}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
