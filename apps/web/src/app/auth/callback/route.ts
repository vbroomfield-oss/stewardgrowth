import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const inviteOrgId = searchParams.get('invite')
  const inviteRole = searchParams.get('role')

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is an OAuth signup via invite link, store invite info in user metadata
      if (inviteOrgId && data.user) {
        await supabase.auth.updateUser({
          data: {
            invite_org_id: inviteOrgId,
            invite_role: inviteRole || 'OWNER',
          },
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
