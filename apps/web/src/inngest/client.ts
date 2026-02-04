import { Inngest } from 'inngest'

// Create the Inngest client for StewardGrowth automation
export const inngest = new Inngest({
  id: 'stewardgrowth',
  name: 'StewardGrowth Marketing Automation',
})

// Event types for type safety
export type Events = {
  'content/generate.weekly': {
    data: {
      brandId?: string // Optional: generate for specific brand only
    }
  }
  'content/publish.scheduled': {
    data: {
      contentId: string
    }
  }
  'content/approved': {
    data: {
      contentId: string
      approvedBy: string
    }
  }
  'brand/analyze.performance': {
    data: {
      brandId: string
    }
  }
  'notification/send': {
    data: {
      type: 'approval_request' | 'content_published' | 'weekly_digest' | 'performance_alert'
      userId: string
      data: Record<string, unknown>
    }
  }
}
