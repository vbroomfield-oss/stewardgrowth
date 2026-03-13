export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

interface ReportSection {
  heading: string
  content: string
  data?: Array<{ label: string; value: string; change?: string }>
}

interface ExportRequest {
  report: {
    title: string
    type?: string
    brandName?: string
    generatedAt?: string
    dateRange?: { start: string; end: string }
    sections: ReportSection[]
  }
  format: 'csv'
}

/**
 * Escape a value for CSV — wraps in quotes if it contains commas,
 * newlines, or double-quotes, and doubles internal quotes.
 */
function csvEscape(value: string): string {
  if (!value) return ''
  const needsQuoting = value.includes(',') || value.includes('\n') || value.includes('"')
  if (needsQuoting) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * POST /api/reports/export
 *
 * Export a generated report as a CSV download.
 *
 * Body:
 * {
 *   "report": { "title": "...", "sections": [...] },
 *   "format": "csv"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as ExportRequest
    const { report, format } = body

    if (!report || !report.sections || !Array.isArray(report.sections)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid report data' },
        { status: 400 }
      )
    }

    if (format !== 'csv') {
      return NextResponse.json(
        { success: false, error: 'Unsupported format. Currently only "csv" is supported. PDF export coming soon.' },
        { status: 400 }
      )
    }

    // ---- Build CSV ----
    const rows: string[] = []

    // Header metadata
    rows.push(`${csvEscape('Report Title')},${csvEscape(report.title)}`)
    if (report.brandName) {
      rows.push(`${csvEscape('Brand')},${csvEscape(report.brandName)}`)
    }
    if (report.generatedAt) {
      rows.push(`${csvEscape('Generated At')},${csvEscape(new Date(report.generatedAt).toLocaleString())}`)
    }
    if (report.dateRange) {
      rows.push(`${csvEscape('Date Range')},${csvEscape(`${report.dateRange.start} to ${report.dateRange.end}`)}`)
    }
    rows.push('') // blank line separator

    // Column headers for the sections data
    rows.push(`${csvEscape('Section')},${csvEscape('Content')},${csvEscape('Metric')},${csvEscape('Value')},${csvEscape('Change')}`)

    for (const section of report.sections) {
      // Add the section content as a row
      rows.push(
        `${csvEscape(section.heading)},${csvEscape(section.content)},,,`
      )

      // If the section has data metrics, add each as a sub-row
      if (section.data && Array.isArray(section.data)) {
        for (const item of section.data) {
          rows.push(
            `${csvEscape(section.heading)},,${csvEscape(item.label)},${csvEscape(item.value)},${csvEscape(item.change || '')}`
          )
        }
      }
    }

    const csvContent = rows.join('\n')

    // Generate a filename from the report title
    const filename = report.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '.csv'

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Report export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    )
  }
}
