/**
 * Video Generation Library
 *
 * Creates automated slideshow videos using:
 * - OpenAI DALL-E for images
 * - ElevenLabs for voiceover
 * - Shotstack for video compilation
 */

export * from './elevenlabs'
export * from './shotstack'

import { generateSpeechBase64, RECOMMENDED_VOICES } from './elevenlabs'
import { createSlideshowVideo, getRenderStatus, FREE_MUSIC, type RenderStatus } from './shotstack'
import OpenAI from 'openai'

export interface VideoContentOptions {
  script: string
  platform: 'tiktok' | 'youtube' | 'instagram'
  brandName: string
  brandVoice?: 'professional' | 'friendly' | 'authoritative' | 'youthful'
  gender?: 'male' | 'female'
  voiceId?: string
  imagePrompts?: string[] // Custom image prompts, or auto-generate from script
  musicStyle?: 'upbeat' | 'inspirational' | 'corporate' | 'calm'
}

/**
 * Generate images for video using DALL-E
 */
async function generateVideoImages(
  script: string,
  brandName: string,
  count: number = 4
): Promise<string[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Extract key points from script for image prompts
  const promptResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You create image prompts for DALL-E. Return only a JSON array of strings.',
      },
      {
        role: 'user',
        content: `Create ${count} image prompts for a video about: "${script.substring(0, 500)}"

Brand: ${brandName}
Style: Professional, modern, clean backgrounds suitable for social media
Each prompt should visualize a different key point from the script.

Return JSON array: ["prompt1", "prompt2", ...]`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const prompts = JSON.parse(promptResponse.choices[0].message.content || '{"prompts":[]}')
  const imagePrompts = prompts.prompts || prompts || []

  // Generate images
  const imageUrls: string[] = []
  for (const prompt of imagePrompts.slice(0, count)) {
    try {
      const image = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `${prompt}. Style: Clean, professional, suitable for ${brandName} social media. Vertical format.`,
        n: 1,
        size: '1024x1792', // Vertical for social media
        quality: 'standard',
      })
      if (image.data && image.data[0]?.url) {
        imageUrls.push(image.data[0].url)
      }
    } catch (error) {
      console.error(`[Video] Failed to generate image:`, error)
    }
  }

  return imageUrls
}

/**
 * Upload audio to a public URL (using a simple approach with base64 data URL)
 * Note: For production, you'd want to upload to cloud storage
 */
async function generateVoiceoverUrl(
  script: string,
  voiceId?: string
): Promise<string | undefined> {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log('[Video] ElevenLabs not configured, skipping voiceover')
    return undefined
  }

  try {
    const audioBase64 = await generateSpeechBase64({
      text: script,
      voiceId,
    })

    // For Shotstack, we need a public URL
    // In production, upload to S3/Cloudinary/etc
    // For now, we'll use a data URL (works for testing)
    return `data:audio/mpeg;base64,${audioBase64}`
  } catch (error) {
    console.error('[Video] Failed to generate voiceover:', error)
    return undefined
  }
}

/**
 * Generate a complete short-form video for social media
 *
 * This creates slideshow-style videos with:
 * - AI-generated images (DALL-E)
 * - AI voiceover (ElevenLabs)
 * - Background music
 * - Text overlays
 */
export async function createSocialVideo(options: VideoContentOptions): Promise<{
  renderId: string
  status: 'queued' | 'processing'
}> {
  const {
    script,
    platform,
    brandName,
    brandVoice = 'professional',
    gender = 'female',
    voiceId,
    musicStyle = 'inspirational',
  } = options

  console.log(`[Video] Creating ${platform} video for ${brandName}...`)
  console.log(`[Video] Script: ${script.split(/\s+/).length} words`)

  // 1. Generate images from script
  console.log('[Video] Generating images...')
  const images = await generateVideoImages(script, brandName, 4)

  if (images.length === 0) {
    throw new Error('Failed to generate any images for video')
  }
  console.log(`[Video] Generated ${images.length} images`)

  // 2. Generate voiceover
  console.log('[Video] Generating voiceover...')
  const selectedVoiceId = voiceId || RECOMMENDED_VOICES[brandVoice]?.[gender]
  const voiceoverUrl = await generateVoiceoverUrl(script, selectedVoiceId)

  // 3. Extract key text overlays from script
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const textOverlays = sentences.slice(0, images.length).map(s => s.trim().substring(0, 80))

  // 4. Compile video with Shotstack
  console.log('[Video] Compiling video...')
  const { renderId } = await createSlideshowVideo({
    images,
    script,
    voiceoverUrl,
    textOverlays,
    platform,
    musicUrl: FREE_MUSIC[musicStyle],
  })

  console.log(`[Video] Render started: ${renderId}`)

  return {
    renderId,
    status: 'queued',
  }
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(renderId: string): Promise<RenderStatus> {
  return getRenderStatus(renderId)
}

/**
 * Estimate video duration from script word count
 * Average speaking rate is ~150 words per minute
 */
export function estimateVideoDuration(script: string): number {
  const wordCount = script.split(/\s+/).length
  const minutes = wordCount / 150
  return Math.ceil(minutes * 60) // Return seconds
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

  return {
    valid: true,
    wordCount,
    estimatedSeconds,
  }
}
