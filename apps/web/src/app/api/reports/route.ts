export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

/**
 * GET /api/reports
 *
 * List previously generated reports.
 * For now returns an empty list — the Report model will be added in Phase 4.
 */
export async function GET() {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Phase 4 — query the Report model from the database
    // const reports = await db.report.findMany({
    //   where: { brand: { organizationId: user.organizationId } },
    //   orderBy: { createdAt: 'desc' },
    //   take: 50,
    // })

    return NextResponse.json({
      success: true,
      reports: [],
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
