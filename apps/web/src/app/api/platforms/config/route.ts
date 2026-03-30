export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export async function GET() {
  // Check which platforms have credentials configured
  const platforms = {
    twitter: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
    facebook: !!(process.env.META_APP_ID && process.env.META_APP_SECRET),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    instagram: !!(process.env.META_APP_ID && process.env.META_APP_SECRET),
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    youtube: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    tiktok: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
    pinterest: !!(process.env.PINTEREST_APP_ID && process.env.PINTEREST_APP_SECRET),
    threads: !!(process.env.META_APP_ID && process.env.META_APP_SECRET),
  }
  return NextResponse.json({ platforms })
}
