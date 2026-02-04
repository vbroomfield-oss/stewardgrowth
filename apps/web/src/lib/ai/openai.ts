/**
 * OpenAI Client
 *
 * Handles all OpenAI API interactions for content generation.
 * Used for: blog posts, social media, ad copy, email content.
 */

import OpenAI from 'openai'

// Lazy-initialize OpenAI client to avoid build-time errors
let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    _openai = new OpenAI({ apiKey })
  }
  return _openai
}

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
 * Generate a blog post with title and meta description
 */
export async function generateBlogPost(
  topic: string,
  options: ContentGenerationOptions
): Promise<GeneratedContent & { title: string; metaDescription: string; suggestedTags: string[] }> {
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

Format your response as JSON:
{
  "title": "Blog Post Title",
  "content": "Full markdown content...",
  "metaDescription": "SEO meta description (max 155 chars)",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  return {
    content: result.content,
    title: result.title,
    metaDescription: result.metaDescription,
    suggestedTags: result.suggestedTags || [],
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
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube' | 'pinterest',
  topic: string,
  options: ContentGenerationOptions
): Promise<GeneratedContent & { videoScript?: string; hook?: string; mediaRecommendation?: string }> {
  const platformConfig = {
    twitter: { maxLength: 280, name: 'Twitter/X', hashtagCount: 2, isVideo: false },
    linkedin: { maxLength: 3000, name: 'LinkedIn', hashtagCount: 5, isVideo: false },
    facebook: { maxLength: 500, name: 'Facebook', hashtagCount: 3, isVideo: false },
    instagram: { maxLength: 2200, name: 'Instagram', hashtagCount: 10, isVideo: false },
    tiktok: { maxLength: 2200, name: 'TikTok', hashtagCount: 5, isVideo: true },
    threads: { maxLength: 500, name: 'Threads', hashtagCount: 3, isVideo: false },
    youtube: { maxLength: 5000, name: 'YouTube Shorts', hashtagCount: 3, isVideo: true },
    pinterest: { maxLength: 500, name: 'Pinterest', hashtagCount: 10, isVideo: false },
  }

  const config = platformConfig[platform]
  const systemPrompt = buildSystemPrompt(options)

  // Different prompts for video vs text platforms
  const userPrompt = config.isVideo
    ? `Create a ${config.name} video for HeyGen AI avatar about: "${topic}"

Requirements:
- Caption: Maximum ${config.maxLength} characters for posting
- Include ${config.hashtagCount} relevant hashtags
- Write a 30-60 second script (75-150 words) ready to paste into HeyGen
${options.callToAction ? `- Call-to-action: ${options.callToAction}` : ''}

Script structure for HeyGen:
1. HOOK (0-3 sec): Attention-grabbing opening line
2. PROBLEM/CONTEXT (3-15 sec): Why this matters
3. VALUE/SOLUTION (15-45 sec): Main content, tips, or insights
4. CTA (45-60 sec): Clear call-to-action (follow, comment, visit)

The script should:
- Be written in first person, conversational tone
- Be ready to copy-paste directly into HeyGen
- Include [PAUSE] markers where natural pauses should occur
- Have clear sentence breaks for the AI avatar

Format your response as JSON:
{
  "mainPost": "caption for posting with emojis...",
  "hook": "The exact opening line (first sentence)...",
  "videoScript": "Complete HeyGen-ready script with [PAUSE] markers...",
  "estimatedDuration": "45 seconds",
  "wordCount": 120,
  "alternates": ["alt caption 1", "alt caption 2"],
  "hashtags": ["...", "..."],
  "suggestedBackground": "Suggested HeyGen background (office, studio, etc.)",
  "suggestedAvatar": "Suggested avatar style (professional, casual, etc.)"
}`
    : `Write a ${config.name} post about: "${topic}"

Requirements:
- Maximum ${config.maxLength} characters
- Optimized for ${config.name} engagement
- Include ${config.hashtagCount} relevant hashtags
${options.callToAction ? `- Call-to-action: ${options.callToAction}` : ''}
${platform === 'pinterest' ? '- Include a compelling pin title and description optimized for Pinterest search' : ''}

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

  const response = await getOpenAI().chat.completions.create({
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
    videoScript: result.videoScript,
    hook: result.hook,
    mediaRecommendation: result.suggestedMedia || result.suggestedBackground,
    estimatedDuration: result.estimatedDuration,
    wordCount: result.wordCount,
    suggestedBackground: result.suggestedBackground,
    suggestedAvatar: result.suggestedAvatar,
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

  const response = await getOpenAI().chat.completions.create({
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
): Promise<{
  subject: string
  previewText: string
  body: string
  callToAction: { text: string; url: string }
  alternateSubjects: string[]
  tokens: { prompt: number; completion: number; total: number }
}> {
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
  "subject": "...",
  "previewText": "...",
  "body": "...",
  "alternateSubjects": ["...", "..."],
  "callToAction": {
    "text": "...",
    "url": "..."
  }
}`

  const response = await getOpenAI().chat.completions.create({
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
    subject: result.subject,
    previewText: result.previewText,
    body: result.body,
    callToAction: result.callToAction || { text: 'Learn More', url: '#' },
    alternateSubjects: result.alternateSubjects || [],
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

  const response = await getOpenAI().chat.completions.create({
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

  const response = await getOpenAI().chat.completions.create({
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

/**
 * Generate SEO-optimized blog post with full metadata
 */
export async function generateSEOBlogPost(
  topic: string,
  options: ContentGenerationOptions & { targetKeyword: string; secondaryKeywords?: string[] }
): Promise<{
  title: string
  content: string
  metaDescription: string
  metaTitle: string
  slug: string
  suggestedTags: string[]
  seoScore: number
  readingTime: number
  wordCount: number
  tokens: { prompt: number; completion: number; total: number }
}> {
  const systemPrompt = buildSystemPrompt(options)

  const userPrompt = `Write an SEO-optimized blog post about: "${topic}"

PRIMARY KEYWORD: ${options.targetKeyword}
SECONDARY KEYWORDS: ${options.secondaryKeywords?.join(', ') || 'none'}

SEO Requirements:
1. Title: Include primary keyword, max 60 characters
2. Meta description: Include keyword, max 155 characters, compelling CTA
3. URL slug: Short, keyword-rich, lowercase with hyphens
4. Content: 1500-2000 words, keyword density 1-2%
5. Structure: H1 (title), multiple H2s and H3s
6. Include internal linking suggestions
7. Add FAQ section with schema-ready Q&As

Content Structure:
- Compelling introduction with keyword in first 100 words
- Clear H2 sections addressing user intent
- Bullet points and numbered lists for readability
- Conclusion with call-to-action

Format your response as JSON:
{
  "title": "...",
  "metaTitle": "... | Brand Name",
  "metaDescription": "...",
  "slug": "keyword-rich-url-slug",
  "content": "full markdown content...",
  "suggestedTags": ["tag1", "tag2"],
  "faqSchema": [{"question": "...", "answer": "..."}],
  "internalLinkSuggestions": ["topic 1", "topic 2"],
  "seoScore": 85,
  "wordCount": 1800,
  "readingTime": 7
}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  return {
    title: result.title,
    content: result.content,
    metaDescription: result.metaDescription,
    metaTitle: result.metaTitle,
    slug: result.slug,
    suggestedTags: result.suggestedTags || [],
    seoScore: result.seoScore || 0,
    readingTime: result.readingTime || 0,
    wordCount: result.wordCount || 0,
    tokens: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
      total: response.usage?.total_tokens || 0,
    },
  }
}

/**
 * Analyze content for SEO and provide recommendations
 */
export async function analyzeSEO(
  content: string,
  targetKeyword: string,
  options: ContentGenerationOptions
): Promise<{
  score: number
  issues: Array<{ severity: 'high' | 'medium' | 'low'; issue: string; fix: string }>
  opportunities: string[]
  keywordAnalysis: { density: number; placement: string[]; missing: string[] }
}> {
  const userPrompt = `Analyze this content for SEO optimization:

TARGET KEYWORD: ${targetKeyword}

CONTENT:
---
${content}
---

Provide a comprehensive SEO analysis including:
1. Overall SEO score (0-100)
2. Critical issues that need fixing
3. Opportunities for improvement
4. Keyword analysis (density, placement, missing variations)

Format as JSON:
{
  "score": 75,
  "issues": [
    {"severity": "high", "issue": "Missing keyword in title", "fix": "Add primary keyword to H1"}
  ],
  "opportunities": ["Add FAQ section", "Include more internal links"],
  "keywordAnalysis": {
    "density": 1.5,
    "placement": ["title", "first paragraph", "H2"],
    "missing": ["meta description", "image alt"]
  }
}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You are an SEO expert analyzing content for search optimization.' },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

/**
 * Generate keyword research for a topic
 */
export async function generateKeywordResearch(
  topic: string,
  industry: string
): Promise<{
  primaryKeywords: Array<{ keyword: string; difficulty: string; intent: string }>
  longTailKeywords: string[]
  questions: string[]
  relatedTopics: string[]
}> {
  const userPrompt = `Generate keyword research for: "${topic}" in the ${industry} industry.

Provide:
1. 10 primary keywords with difficulty (low/medium/high) and search intent (informational/transactional/navigational)
2. 15 long-tail keyword variations
3. 10 question-based keywords (People Also Ask style)
4. 5 related topics for content clusters

Format as JSON:
{
  "primaryKeywords": [{"keyword": "...", "difficulty": "medium", "intent": "informational"}],
  "longTailKeywords": ["..."],
  "questions": ["How to...", "What is..."],
  "relatedTopics": ["..."]
}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You are an SEO keyword research specialist.' },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

export { getOpenAI }
