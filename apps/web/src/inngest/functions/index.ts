import { generateWeeklyContent } from './generate-weekly-content'
import { publishScheduledContent } from './publish-scheduled-content'
import { analyzePerformance } from './analyze-performance'

// Export all Inngest functions
export const functions = [
  generateWeeklyContent,
  publishScheduledContent,
  analyzePerformance,
]
