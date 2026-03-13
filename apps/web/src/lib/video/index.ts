/**
 * Video Generation Library — Ecommerce Ad Videos
 *
 * Creates professional ecommerce-style ad videos using:
 * - OpenAI DALL-E 3 for product/lifestyle imagery
 * - ElevenLabs for professional voiceover
 * - Shotstack for video compilation with motion graphics
 *
 * Templates: product-showcase, promo-ad, testimonial, brand-story, before-after
 */

export * from './elevenlabs'
export * from './shotstack'

import { generateSpeechBase64, RECOMMENDED_VOICES } from './elevenlabs'
import {
  createEcommerceVideo,
  createSlideshowVideo,
  getRenderStatus,
  ECOMMERCE_MUSIC,
  FREE_MUSIC,
  type RenderStatus,
  type VideoTemplate,
  type BrandStyle,
} from './shotstack'
import OpenAI from 'openai'

export interface VideoContentOptions {
  script: string
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook'
  brandName: string
  brandColor?: string           // Primary brand hex color
  brandSecondaryColor?: string  // Secondary hex color
  brandAccentColor?: string     // CTA / highlight hex color
  brandLogoUrl?: string
  brandVoice?: 'professional' | 'friendly' | 'authoritative' | 'youthful'
  gender?: 'male' | 'female'
  voiceId?: string
  imagePrompts?: string[]
  musicStyle?: 'energetic' | 'modern' | 'luxury' | 'hype' | 'minimal'
  template?: VideoTemplate
  ctaText?: string
  ctaSubtext?: string
  productName?: string
  price?: string
  tagline?: string
}

// --- Image Prompt Generation ---

const TEMPLATE_IMAGE_STYLES: Record<VideoTemplate, string> = {
  'product-showcase': `Professional ecommerce product photography style:
    - Clean, minimal backgrounds (white, light gray, or subtle gradient)
    - Product hero shots with dramatic lighting
    - Lifestyle shots showing the product in use
    - Close-up detail shots highlighting premium quality
    - Studio-quality with soft shadows and reflections`,
  'promo-ad': `Bold promotional ad style:
    - Vibrant, eye-catching backgrounds with energy
    - Product shown prominently with dynamic angles
    - Sale/discount feel — urgency and excitement
    - Bright lighting, saturated colors
    - Flat lay or action shots`,
  'testimonial': `Lifestyle and people-focused style:
    - Warm, authentic lifestyle photography
    - People using or enjoying the product naturally
    - Soft, natural lighting
    - Comfortable, relatable settings (home, office, outdoors)
    - Genuine, candid feel`,
  'brand-story': `Cinematic brand narrative style:
    - Wide, dramatic compositions
    - Rich color grading with depth
    - Behind-the-scenes or origin story visuals
    - Atmospheric lighting (golden hour, dramatic shadows)
    - Storytelling through visual sequences`,
  'before-after': `Transformation comparison style:
    - Clear before and after visuals
    - Consistent framing for comparison
    - Dramatic improvement shown visually
    - Clean, well-lit shots
    - Side-by-side or sequential transformation`,
}

async function generateEcommerceImages(
  script: string,
  brandName: string,
  template: VideoTemplate = 'product-showcase',
  productName?: string,
  count: number = 4,
): Promise<string[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const imageStyle = TEMPLATE_IMAGE_STYLES[template]

  const promptResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You create image prompts for DALL-E that produce professional ecommerce ad visuals. Return only a JSON object with a "prompts" array of strings.`,
      },
      {
        role: 'user',
        content: `Create ${count} image prompts for a professional ecommerce video ad.

Brand: ${brandName}
${productName ? `Product: ${productName}` : ''}
Script context: "${script.substring(0, 600)}"
Template style: ${template}

Image style guidelines:
${imageStyle}

Requirements:
- Each image should be a DIFFERENT scene/angle that tells a visual story
- Image 1: Attention-grabbing hero shot
- Image 2: Product in context / lifestyle usage
- Image 3: Detail or feature highlight
- Image 4: Aspirational / outcome shot
- All images should look like they belong in a premium ad campaign
- NO text in images — text will be added as overlays
- Professional studio or lifestyle photography quality
- Vertical format (portrait orientation)

Return JSON: {"prompts": ["prompt1", "prompt2", ...]}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(promptResponse.choices[0].message.content || '{"prompts":[]}')
  const imagePrompts: string[] = parsed.prompts || []

  const imageUrls: string[] = []
  for (const prompt of imagePrompts.slice(0, count)) {
    try {
      const image = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `${prompt}. Style: Premium ecommerce product photography for ${brandName}. Professional studio quality. No text or watermarks. Vertical portrait format.`,
        n: 1,
        size: '1024x1792',
        quality: 'hd',
      })
      if (image.data?.[0]?.url) {
        imageUrls.push(image.data[0].url)
      }
    } catch (error) {
      console.error('[Video] Failed to generate image:', error)
    }
  }

  return imageUrls
}

// --- Ad Copy Generation ---

async function generateAdCopy(
  script: string,
  brandName: string,
  template: VideoTemplate,
  imageCount: number,
  productName?: string,
  price?: string,
): Promise<{ headlines: string[]; subtexts: string[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You write punchy, bold ecommerce ad copy. Return JSON only.',
      },
      {
        role: 'user',
        content: `Create ${imageCount} headline + subtext pairs for a ${template} ecommerce video ad.

Brand: ${brandName}
${productName ? `Product: ${productName}` : ''}
${price ? `Price: ${price}` : ''}
Script: "${script.substring(0, 500)}"

Rules:
- Headlines: 2-6 words, BOLD and punchy (e.g., "REDEFINE YOUR STYLE", "BUILT DIFFERENT", "LIMITED DROP")
- Subtexts: 5-12 words, supporting the headline (e.g., "Premium materials. Unmatched quality.", "Free shipping on orders over $50")
- Match the ${template} template vibe
- Slide 1 should hook attention
- Last slide should drive action
- Use power words: Transform, Unlock, Discover, Elevate, Premium, Exclusive

Return JSON: {"headlines": ["..."], "subtexts": ["..."]}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content || '{"headlines":[],"subtexts":[]}')
  return {
    headlines: parsed.headlines || [],
    subtexts: parsed.subtexts || [],
  }
}

// --- Voiceover ---

async function generateVoiceoverUrl(
  script: string,
  voiceId?: string,
): Promise<string | undefined> {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log('[Video] ElevenLabs not configured, skipping voiceover')
    return undefined
  }

  try {
    const audioBase64 = await generateSpeechBase64({
      text: script,
      voiceId,
      stability: 0.6,
      similarityBoost: 0.8,
      style: 0.3,
    })

    // For Shotstack, we need a public URL
    // In production, upload to S3/Cloudinary/etc
    return `data:audio/mpeg;base64,${audioBase64}`
  } catch (error) {
    console.error('[Video] Failed to generate voiceover:', error)
    return undefined
  }
}

// --- Main Entry Point ---

/**
 * Generate a professional ecommerce-style ad video for social media
 *
 * Creates videos with dynamic motion, bold typography, product highlights,
 * brand colors, and professional CTA screens.
 */
export async function createSocialVideo(options: VideoContentOptions): Promise<{
  renderId: string
  status: 'queued' | 'processing'
}> {
  const {
    script,
    platform,
    brandName,
    brandColor = '#1a1a2e',
    brandSecondaryColor = '#16213e',
    brandAccentColor = '#e94560',
    brandLogoUrl,
    brandVoice = 'professional',
    gender = 'female',
    voiceId,
    musicStyle = 'energetic',
    template = 'product-showcase',
    ctaText = 'Shop Now',
    ctaSubtext,
    productName,
    price,
    tagline,
  } = options

  console.log(`[Video] Creating ${template} ${platform} ad for ${brandName}...`)
  console.log(`[Video] Script: ${script.split(/\s+/).length} words`)

  const brand: BrandStyle = {
    primaryColor: brandColor,
    secondaryColor: brandSecondaryColor,
    accentColor: brandAccentColor,
    fontFamily: 'Montserrat',
    logoUrl: brandLogoUrl,
  }

  // 1. Generate ecommerce-style images
  console.log('[Video] Generating product/lifestyle images...')
  const images = options.imagePrompts
    ? await generateCustomImages(options.imagePrompts)
    : await generateEcommerceImages(script, brandName, template, productName, 4)

  if (images.length === 0) {
    throw new Error('Failed to generate any images for video')
  }
  console.log(`[Video] Generated ${images.length} images`)

  // 2. Generate ad copy (headlines + subtexts)
  console.log('[Video] Generating ad copy...')
  const { headlines, subtexts } = await generateAdCopy(
    script, brandName, template, images.length, productName, price,
  )

  // 3. Generate voiceover
  console.log('[Video] Generating voiceover...')
  const selectedVoiceId = voiceId || RECOMMENDED_VOICES[brandVoice]?.[gender]
  const voiceoverUrl = await generateVoiceoverUrl(script, selectedVoiceId)

  // 4. Build price array (only for product-showcase and promo-ad)
  const prices: string[] = []
  if (price && (template === 'product-showcase' || template === 'promo-ad')) {
    // Show price on 2nd or 3rd slide
    prices[Math.min(2, images.length - 1)] = price
  }

  // 5. Compile video
  console.log('[Video] Compiling ecommerce video...')
  const musicMap: Record<string, string> = ECOMMERCE_MUSIC
  const { renderId } = await createEcommerceVideo({
    images,
    headlines: headlines.slice(0, images.length),
    subtexts: subtexts.slice(0, images.length),
    prices,
    platform,
    template,
    brand,
    voiceoverUrl,
    musicUrl: musicMap[musicStyle] || ECOMMERCE_MUSIC.energetic,
    ctaText,
    ctaSubtext,
    brandName,
    brandTagline: tagline,
    script,
  })

  console.log(`[Video] Render started: ${renderId}`)

  return {
    renderId,
    status: 'queued',
  }
}

// --- Helpers ---

async function generateCustomImages(prompts: string[]): Promise<string[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const urls: string[] = []

  for (const prompt of prompts) {
    try {
      const image = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `${prompt}. Professional ecommerce photography. No text or watermarks. Vertical portrait.`,
        n: 1,
        size: '1024x1792',
        quality: 'hd',
      })
      if (image.data?.[0]?.url) {
        urls.push(image.data[0].url)
      }
    } catch (error) {
      console.error('[Video] Failed to generate custom image:', error)
    }
  }

  return urls
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(renderId: string): Promise<RenderStatus> {
  return getRenderStatus(renderId)
}

/**
 * Estimate video duration from script word count
 */
export function estimateVideoDuration(script: string): number {
  const wordCount = script.split(/\s+/).length
  const minutes = wordCount / 150
  return Math.ceil(minutes * 60)
}

/**
 * Validate script length for short-form content
 */
export function validateShortFormScript(script: string): {
  valid: boolean
  wordCount: number
  estimatedSeconds: number
  warning?: string
} {
  const wordCount = script.split(/\s+/).length
  const estimatedSeconds = estimateVideoDuration(script)

  if (wordCount < 30) {
    return {
      valid: false,
      wordCount,
      estimatedSeconds,
      warning: 'Script too short. Aim for at least 30 words (~12 seconds).',
    }
  }

  if (wordCount > 180) {
    return {
      valid: false,
      wordCount,
      estimatedSeconds,
      warning: 'Script too long for short-form. Maximum ~180 words (~72 seconds).',
    }
  }

  if (wordCount > 150) {
    return {
      valid: true,
      wordCount,
      estimatedSeconds,
      warning: 'Script is on the longer side. Consider shortening for better engagement.',
    }
  }

  return { valid: true, wordCount, estimatedSeconds }
}

// Re-export for backward compatibility
export { createSlideshowVideo, FREE_MUSIC, ECOMMERCE_MUSIC }
export type { VideoTemplate, BrandStyle }
