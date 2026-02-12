export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

// POST /api/brands/analyze-landing-page - Analyze a landing page to extract brand identity
export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { brandId, domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      )
    }

    // Verify the brand belongs to this organization
    if (brandId) {
      const brand = await db.saaSBrand.findFirst({
        where: {
          id: brandId,
          organizationId: userWithOrg.organizationId,
          deletedAt: null,
        },
      })

      if (!brand) {
        return NextResponse.json(
          { success: false, error: 'Brand not found' },
          { status: 404 }
        )
      }
    }

    // Normalize domain to URL
    let url = domain
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }

    console.log('[Analyze Landing Page] Fetching:', url)

    // Fetch the landing page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StewardGrowth/1.0; +https://stewardgrowth.com)',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch landing page: ${response.status}` },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Extract basic info with regex first (fallback data)
    const extractedData = extractBasicInfo(html, url)

    // Use Claude to analyze the page content for deeper insights
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        })

        // Clean HTML for analysis (remove scripts, styles, etc.)
        const cleanedHtml = cleanHtmlForAnalysis(html)

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Analyze this landing page HTML and extract brand identity information. Return a JSON object with these fields:

{
  "logoUrl": "direct URL to the logo image if found",
  "primaryColor": "hex color code of the primary brand color",
  "description": "one-sentence description of what the product/service does",
  "brandVoice": "2-3 sentence description of the brand's tone and personality based on the copy",
  "tagline": "the main tagline or value proposition",
  "targetAudience": "who this product/service is for"
}

Only include fields you can confidently extract. Use null for fields you can't determine.

Landing Page HTML:
${cleanedHtml.substring(0, 15000)}

URL: ${url}

Return ONLY the JSON object, no other text.`
            }
          ],
        })

        const aiContent = message.content[0]
        if (aiContent.type === 'text') {
          try {
            // Parse the JSON from Claude's response
            const jsonMatch = aiContent.text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const aiData = JSON.parse(jsonMatch[0])

              // Merge AI insights with extracted data
              extractedData.logoUrl = aiData.logoUrl || extractedData.logoUrl
              extractedData.primaryColor = aiData.primaryColor || extractedData.primaryColor
              extractedData.description = aiData.description || extractedData.description
              extractedData.brandVoice = aiData.brandVoice || extractedData.brandVoice
              extractedData.tagline = aiData.tagline
              extractedData.targetAudience = aiData.targetAudience
            }
          } catch (parseError) {
            console.log('[Analyze Landing Page] Could not parse AI response, using extracted data')
          }
        }
      } catch (aiError) {
        console.log('[Analyze Landing Page] AI analysis failed, using extracted data:', aiError)
      }
    }

    console.log('[Analyze Landing Page] Extracted data:', extractedData)

    return NextResponse.json({
      success: true,
      data: extractedData,
    })
  } catch (error) {
    console.error('[Analyze Landing Page] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze landing page' },
      { status: 500 }
    )
  }
}

function extractBasicInfo(html: string, baseUrl: string): Record<string, string | null> {
  const data: Record<string, string | null> = {
    logoUrl: null,
    primaryColor: null,
    description: null,
    brandVoice: null,
  }

  // Extract logo URL
  // Try common logo patterns
  const logoPatterns = [
    /<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+logo[^"']+)["']/i,
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  ]

  for (const pattern of logoPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      let logoUrl = match[1]
      // Make absolute URL if relative
      if (logoUrl.startsWith('/')) {
        const urlObj = new URL(baseUrl)
        logoUrl = `${urlObj.origin}${logoUrl}`
      } else if (!logoUrl.startsWith('http')) {
        logoUrl = new URL(logoUrl, baseUrl).href
      }
      data.logoUrl = logoUrl
      break
    }
  }

  // Extract primary color
  // Look for CSS variables or theme colors
  const colorPatterns = [
    /--primary[^:]*:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/i,
    /--brand[^:]*:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})/i,
    /<meta[^>]*name=["']theme-color["'][^>]*content=["'](#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})["']/i,
  ]

  for (const pattern of colorPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      data.primaryColor = match[1]
      break
    }
  }

  // Extract description
  const descPatterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
  ]

  for (const pattern of descPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      data.description = match[1].substring(0, 300)
      break
    }
  }

  return data
}

function cleanHtmlForAnalysis(html: string): string {
  // Remove script tags and their content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')

  // Remove SVG content (often very large)
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '[SVG]')

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ')

  return cleaned
}
