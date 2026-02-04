/**
 * HeyGen Video Generation Client
 *
 * Creates AI avatar videos from scripts for TikTok, YouTube Shorts, etc.
 * Docs: https://docs.heygen.com/reference/
 */

const HEYGEN_API_URL = 'https://api.heygen.com'

interface HeyGenConfig {
  apiKey: string
}

interface VideoGenerationOptions {
  script: string
  avatarId?: string
  voiceId?: string
  aspectRatio?: '16:9' | '9:16' | '1:1' // 9:16 for TikTok/Shorts
  title?: string
  backgroundUrl?: string
  test?: boolean // Use test mode (watermarked but free)
}

interface VideoStatus {
  videoId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
}

interface Avatar {
  avatarId: string
  avatarName: string
  gender: string
  previewUrl: string
}

interface Voice {
  voiceId: string
  name: string
  language: string
  gender: string
  previewUrl?: string
}

let _config: HeyGenConfig | null = null

function getConfig(): HeyGenConfig {
  if (!_config) {
    const apiKey = process.env.HEYGEN_API_KEY
    if (!apiKey) {
      throw new Error('HEYGEN_API_KEY environment variable is not set')
    }
    _config = { apiKey }
  }
  return _config
}

async function heygenFetch(endpoint: string, options: RequestInit = {}) {
  const config = getConfig()
  const response = await fetch(`${HEYGEN_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-Api-Key': config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HeyGen API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * List available avatars
 */
export async function listAvatars(): Promise<Avatar[]> {
  const response = await heygenFetch('/v2/avatars')
  return response.data?.avatars || []
}

/**
 * List available voices
 */
export async function listVoices(): Promise<Voice[]> {
  const response = await heygenFetch('/v2/voices')
  return response.data?.voices || []
}

/**
 * Generate a video with AI avatar
 */
export async function generateVideo(options: VideoGenerationOptions): Promise<{ videoId: string }> {
  const {
    script,
    avatarId = process.env.HEYGEN_DEFAULT_AVATAR_ID || 'Daisy-inskirt-20220818',
    voiceId = process.env.HEYGEN_DEFAULT_VOICE_ID,
    aspectRatio = '9:16', // Default to vertical for social media
    title = 'AI Generated Video',
    test = false,
  } = options

  // Build the video generation request
  const payload = {
    test, // Set to true for watermarked test videos (saves credits)
    caption: false,
    title,
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: avatarId,
          avatar_style: 'normal',
        },
        voice: voiceId ? {
          type: 'text',
          input_text: script,
          voice_id: voiceId,
        } : {
          type: 'text',
          input_text: script,
        },
        background: options.backgroundUrl ? {
          type: 'image',
          url: options.backgroundUrl,
        } : {
          type: 'color',
          value: '#FFFFFF',
        },
      },
    ],
    dimension: aspectRatio === '9:16'
      ? { width: 1080, height: 1920 }
      : aspectRatio === '1:1'
        ? { width: 1080, height: 1080 }
        : { width: 1920, height: 1080 },
  }

  const response = await heygenFetch('/v2/video/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return { videoId: response.data?.video_id }
}

/**
 * Check video generation status
 */
export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const response = await heygenFetch(`/v1/video_status.get?video_id=${videoId}`)

  const data = response.data

  return {
    videoId,
    status: data?.status === 'completed' ? 'completed'
      : data?.status === 'failed' ? 'failed'
      : data?.status === 'processing' ? 'processing'
      : 'pending',
    videoUrl: data?.video_url,
    thumbnailUrl: data?.thumbnail_url,
    duration: data?.duration,
    error: data?.error,
  }
}

/**
 * Wait for video to complete (polls status)
 */
export async function waitForVideo(
  videoId: string,
  maxWaitMs: number = 300000, // 5 minutes default
  pollIntervalMs: number = 10000 // 10 seconds
): Promise<VideoStatus> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getVideoStatus(videoId)

    if (status.status === 'completed' || status.status === 'failed') {
      return status
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(`Video generation timed out after ${maxWaitMs / 1000} seconds`)
}

/**
 * Generate video and wait for completion
 */
export async function generateAndWaitForVideo(
  options: VideoGenerationOptions
): Promise<VideoStatus> {
  const { videoId } = await generateVideo(options)
  return waitForVideo(videoId)
}

/**
 * Generate a short-form video for social media (TikTok, YouTube Shorts, Reels)
 */
export async function generateShortVideo(
  script: string,
  options: {
    platform: 'tiktok' | 'youtube' | 'instagram'
    brandName?: string
    avatarId?: string
    voiceId?: string
    test?: boolean
  }
): Promise<VideoStatus> {
  // Ensure script is appropriate length for short-form (30-60 seconds ~75-150 words)
  const words = script.split(/\s+/).length
  if (words > 200) {
    console.warn(`Script has ${words} words, may exceed 60 seconds. Consider shortening.`)
  }

  const video = await generateAndWaitForVideo({
    script,
    avatarId: options.avatarId,
    voiceId: options.voiceId,
    aspectRatio: '9:16', // Vertical for all short-form platforms
    title: `${options.brandName || 'Brand'} - ${options.platform} Short`,
    test: options.test,
  })

  return video
}

export type { VideoGenerationOptions, VideoStatus, Avatar, Voice }
