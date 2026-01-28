# Claude Session Log - StewardGrowth

## Last Updated: January 27, 2025 - 9:15 PM

## Current Status: IN PROGRESS - Auth Cookie Issue

### Summary
Removed all mock data from dashboard pages and connected app to real Supabase database. Currently debugging authentication issue where Supabase session cookies aren't being passed to API routes on Vercel production.

---

## Work Completed This Session

### 1. Mock Data Removal (COMPLETE)
Removed all hardcoded mock data from these pages:
- `/analytics/attribution` - Removed mock channels and conversion paths
- `/books` - Removed mock books, campaigns, launches, reviews
- `/ai/plans` - Removed mock weekly plan with StewardMAX/StewardRing
- `/reports` - Removed mock recent/scheduled reports
- `/settings` - Removed mock org/team/integrations/API keys, now fetches real user data

### 2. New API Endpoint (COMPLETE)
- Created `/api/user` endpoint to fetch current user info for Settings page

### 3. Database Connection Fix (COMPLETE)
**Problem:** `FATAL: Tenant or user not found` error on Vercel

**Root Cause:** Wrong DATABASE_URL format for Supabase pooler

**Fix:** Updated Vercel environment variables:
- `DATABASE_URL`: Changed from port 6543 (transaction mode) to port 5432 (session mode)
  ```
  postgresql://postgres.fjvotmtgxkwybehjrkef:VXdZ1x7UXB9JHlyK@aws-0-us-west-1.pooler.supabase.com:5432/postgres
  ```
- `DIRECT_URL`:
  ```
  postgresql://postgres:VXdZ1x7UXB9JHlyK@db.fjvotmtgxkwybehjrkef.supabase.co:5432/postgres
  ```

### 4. Prisma Client Generation (COMPLETE)
- Added `postinstall` script to root `package.json` to run `prisma generate` during Vercel build
- Added `prisma` as root dev dependency

### 5. API Fetch Credentials (COMPLETE)
- Added `credentials: 'include'` to all API fetch calls to ensure cookies are sent

---

## Current Issue: Auth Cookies Not Working

### Symptom
API routes return `401 Unauthorized - no user session` on Vercel production

### Logs Show
```
[API /api/brands] Unauthorized - no user session
```

### What This Means
- Database connection is now working (no more "Tenant not found" errors)
- Supabase auth cookies are not being passed from browser to API routes
- User is logged in on client-side (can see dashboard UI) but server doesn't see session

### Files Involved
- `apps/web/src/lib/supabase/server.ts` - Server-side Supabase client
- `apps/web/src/lib/supabase/middleware.ts` - Session refresh middleware
- `apps/web/src/lib/auth/get-user-org.ts` - Gets authenticated user + organization
- `apps/web/src/middleware.ts` - Next.js middleware

### Debug Logging Added
Added console logs to `get-user-org.ts`:
- Logs available cookies
- Logs Supabase auth result

---

## Next Steps to Try

1. **Test after latest deployment**
   - Hard refresh https://stewardgrowth.vercel.app
   - Log out completely, log back in
   - Check Vercel Logs for updated error messages

2. **If still failing, investigate:**
   - Check if cookies are actually being set in browser (DevTools > Application > Cookies)
   - Look for `sb-fjvotmtgxkwybehjrkef-auth-token` cookie
   - Verify Supabase URL Configuration matches production domain

3. **Potential fixes to try:**
   - Check Supabase cookie settings (httpOnly, secure, sameSite)
   - Verify middleware is running on API routes
   - Consider using Route Handler specific Supabase client

---

## Environment Configuration

### Vercel Environment Variables (confirmed set)
- `NEXT_PUBLIC_SUPABASE_URL` - https://fjvotmtgxkwybehjrkef.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - (set)
- `DATABASE_URL` - postgresql://postgres.fjvotmtgxkwybehjrkef:...@aws-0-us-west-1.pooler.supabase.com:5432/postgres
- `DIRECT_URL` - postgresql://postgres:...@db.fjvotmtgxkwybehjrkef.supabase.co:5432/postgres
- `OPENAI_API_KEY` - (set)
- `ANTHROPIC_API_KEY` - (set)
- `FOUNDER_CODE` - (set)

### Supabase Configuration (confirmed)
- Site URL: https://stewardgrowth.vercel.app/
- Redirect URLs: https://stewardgrowth.vercel.app/

---

## Recent Commits
- `fabafce` - Fix: Add credentials include to all API fetch calls
- `5447d66` - Force fresh build with new env vars
- `1771a99` - Trigger redeploy for env var changes
- `a39bc66` - Debug: Log available cookies in auth check
- `60a9a4f` - Add debug logging to diagnose API failures
- `d8dc7fe` - Fix: Add postinstall script for Prisma client generation on Vercel
- `8f96dcb` - Remove remaining mock data from all dashboard pages

---

## Key Files Modified
- `apps/web/src/app/(dashboard)/page.tsx` - Dashboard
- `apps/web/src/app/(dashboard)/brands/page.tsx` - All Brands
- `apps/web/src/app/(dashboard)/analytics/attribution/page.tsx`
- `apps/web/src/app/(dashboard)/analytics/events/page.tsx`
- `apps/web/src/app/(dashboard)/books/page.tsx`
- `apps/web/src/app/(dashboard)/ai/plans/page.tsx`
- `apps/web/src/app/(dashboard)/reports/page.tsx`
- `apps/web/src/app/(dashboard)/settings/page.tsx`
- `apps/web/src/app/api/user/route.ts` (new)
- `apps/web/src/lib/auth/get-user-org.ts`
- `package.json` (root - added postinstall)
