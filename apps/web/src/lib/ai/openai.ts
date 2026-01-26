/**
 * OpenAI Client
 *
 * Handles all OpenAI API interactions for content generation.
 * Used for: blog posts, social media, ad copy, email content.
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type ContentTone =
  | 'professional'
  | 'friendly'
  | 'inspirational'
  | 'educational'
  | 'urgent'
  | 'conversational'

export type ContentLength = 'short' | 'medium' | 'long'

export interface ContentGenerationOptions {
  brandName: string
  brandVoice?: BrandVoice
  tone?: ContentTone
  length?: ContentLength
  targetAudience?: string
  keywords?: string[]
  callToAction?: string
  includeEmoji?: boolean
  language?: string
}

export interface BrandVoice {
  personality: string[] // e.g., ['friendly', 'professional', 'helpful']
  doSay: string[] // Phrases/words to use
  dontSay: string[] // Phrases/words to avoid
  valuePropositions: string[] // Key benefits to highlight
  targetAudience: string
  industry: string
  competitors?: string[]
}

export interface GeneratedContent {
  content: string
  alternates?: string[]
  hashtags?: string[]
  suggestedMedia?: string
  seoScore?: number
  readabilityScore?: number
  tokens: {
    prompt: number
    completion: number
    total: number
  }
}

/**
 * Build a system prompt for content generation based on brand voice
 */
function buildSystemPrompt(options: ContentGenerationOptions): string {
  const { brandName, brandVoice, tone = 'professional', targetAudience } = options

  let prompt = `You are an expert marketing content writer for ${brandName}.`

  if (brandVoice) {
    prompt += `\n\nBrand Voice Guidelines:
- Personality: ${brandVoice.personality.join(', ')}
- Industry: ${brandVoice.industry}
- Target Audience: ${brandVoice.targetAudience}
- Key Value Propositions: ${brandVoice.valuePropositions.join('; ')}
- Phrases to use: ${brandVoice.doSay.join(', ')}
- Phrases to avoid: ${brandVoice.dontSay.join(', ')}`
  }

  prompt += `\n\nContent Requirements:
- Tone: ${tone}
- Target audience: ${targetAudience || 'general'}
- Always be authentic and avoid generic marketing speak
- Focus on benefits, not just features
- Include a clear call-to-action when appropriate`

  if (options.includeEmoji) {
    prompt += '\n- Use relevant emojis sparingly to enhance engagement'
  } else {
    prompt += '\n- Do not use emojis'
  }

  return prompt
}

/**
 * Generate a blog post
 */
export async function generateBlogPost(
  topic: string,
  options: ContentGenerationOptions
): Promise<GeneratedContent> {
  const wordCount = {
    short: 500,
    medium: 1000,
    long: 2000,
  }[options.length || 'medium']

  const systemPrompt = buildSystemPrompt(options)
  const userPrompt = `Write a ${wordCount}-word blog post about: "${topic}"

${options.keywords?.length ? `Target SEO keywords: ${options.keywords.join(', ')}` : ''}
${options.callToAction ? `Call-to-action: ${options.callToAction}` : ''}

Structure the post with:
1. An engaging headline (H1)
2. A compelling introduction
3. 3-5 main sections with subheadings (H2)
4. Actionable takeaways
5. A conclusion with CTA

Write in markdown format.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  })

  const content = response.choices[0].message.content || ''

  return {
    content,
    tokens: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0,
    },
  }
}

/**
 * Generate social media post
 */
export async function generateSocialPost(
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram',
  topic: string,
  options: ContentGenerationOptions
): Promise<GeneratedContent> {
  const platformConfig = {
    twitter: { maxLength: 280, name: 'Twitter/X', hashtagCount: 2 },
    linkedin: { maxLength: 3000, name: 'LinkedIn', hashtagCount: 5 },
    facebook: { maxLength: 500, name: 'Facebook', hashtagCount: 3 },
    instagram: { maxLength: 2200, name: 'Instagram', hashtagCount: 10 },
  }

  const config = platformConfig[platform]
  const systemPrompt = buildSystemPrompt(options)

  const userPrompt = `Write a ${config.name} post about: "${topic}"

Requirements:
- Maximum ${config.maxLength} characters
- Optimized for ${config.name} engagement
- Include ${config.hashtagCount} relevant hashtags
${options.callToAction ? `- Call-to-action: ${options.callToAction}` : ''}

Also provide:
1. Two alternative versions
2. Suggested image/media description

Format your response as JSON:
{
  "mainPost": "...",
  "alternates": ["...", "..."],
  "hashtags": ["...", "..."],
  "suggestedMedia": "..."
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  return {
    content: result.mainPost,
    alternates: result.alternates,
    hashtags: result.hashtags,
    suggestedMedia: result.suggestedMedia,
    tokens: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0,
    },
  }
}

/**
 * Generate ad copy
 */
export async function generateAdCopy(
  platform: 'google' | 'meta' | 'linkedin' | 'tiktok',
  objective: 'awareness' | 'consideration' | 'conversion',
  productInfo: string,
  options: ContentGenerationOptions
): Promise<GeneratedContent> {
  const platformSpecs = {
    google: {
      headlines: { count: 15, maxLength: 30 },
      descriptions: { count: 4, maxLength: 90 },
    },
    meta: {
      primaryText: { maxLength: 125 },
      headline: { maxLength: 40 },
      description: { maxLength: 30 },
    },
    linkedin: {
      introText: { maxLength: 150 },
      headline: { maxLength: 70 },
    },
    tiktok: {
      text: { maxLength: 100 },
      callout: { maxLength: 20 },
    },
  }

  const specs = platformSpecs[platform]
  const systemPrompt = buildSystemPrompt(options)

  const userPrompt = `Create ${platform.toUpperCase()} ad copy for: "${productInfo}"

Campaign Objective: ${objective}
${options.keywords?.length ? `Keywords to incorporate: ${options.keywords.join(', ')}` : ''}
${options.callToAction ? `Primary CTA: ${options.callToAction}` : ''}

Platform specifications:
${JSON.stringify(specs, null, 2)}

Generate multiple variations optimized for the ${objective} objective.

Format your response as JSON with the appropriate fields for ${platform}.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  return {
    content: JSON.stringify(result, null, 2),
    tokens: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0,
    },
  }
}

/**
 * Generate email content
 */
export async function generateEmail(
  type: 'newsletter' | 'promotional' | 'nurture' | 'announcement',
  topic: string,
  options: ContentGenerationOptions
): Promise<GeneratedContent> {
  const systemPrompt = buildSystemPrompt(options)

  const userPrompt = `Write a ${type} email about: "${topic}"

Requirements:
- Compelling subject line (max 50 characters)
- Preview text (max 100 characters)
- Email body with clear sections
- Strong call-to-action
${options.callToAction ? `- Primary CTA: ${options.callToAction}` : ''}

Format your response as JSON:
{
  "subjectLine": "...",
  "previewText": "...",
  "body": "...",
  "alternateSubjects": ["...", "..."],
  "cta": {
    "text": "...",
    "url": "..."
  }
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  return {
    content: JSON.stringify(result, null, 2),
    alternates: result.alternateSubjects,
    tokens: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0,
    },
  }
}

/**
 * Improve existing content
 */
export async function improveContent(
  content: string,
  improvements: ('clarity' | 'engagement' | 'seo' | 'tone' | 'length')[],
  options: ContentGenerationOptions
): Promise<GeneratedContent> {
  const systemPrompt = buildSystemPrompt(options)

  const userPrompt = `Improve the following content:

---
${content}
---

Focus on these improvements: ${improvements.join(', ')}

Provide:
1. The improved content
2. A summary of changes made
3. A score (1-10) for each improvement area

Format as JSON:
{
  "improvedContent": "...",
  "changesSummary": ["..."],
  "scores": {
    "clarity": 0,
    "engagement": 0,
    "seo": 0,
    "tone": 0,
    "length": 0
  }
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  return {
    content: result.improvedContent,
    tokens: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0,
    },
  }
}

/**
 * Generate content ideas
 */
export async function generateContentIdeas(
  contentType: 'blog' | 'social' | 'email' | 'ad',
  topic: string,
  count: number = 10,
  options: ContentGenerationOptions
): Promise<{ ideas: Array<{ title: string; description: string; angle: string }> }> {
  const systemPrompt = buildSystemPrompt(options)

  const userPrompt = `Generate ${count} ${contentType} content ideas related to: "${topic}"

For each idea provide:
1. Title/headline
2. Brief description (1-2 sentences)
3. Unique angle or hook

Consider:
- Current trends
- Audience pain points
- Seasonal relevance
- SEO potential

Format as JSON:
{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "angle": "..."
    }
  ]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{"ideas": []}')
}

export { openai }
