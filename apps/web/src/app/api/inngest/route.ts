import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { functions } from '@/inngest/functions'

// Serve Inngest functions via Next.js API route
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
})
