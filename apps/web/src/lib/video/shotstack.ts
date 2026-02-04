/**
 * Shotstack Video Generation Client
 *
 * Creates slideshow-style videos from images + voiceover.
 * Free tier: 20 videos/month
 * Docs: https://shotstack.io/docs/api/
 */

const SHOTSTACK_API_URL = 'https://api.shotstack.io/stage' // Use 'v1' for production

interface ShotstackConfig {
  apiKey: string
}

interface SlideOptions {
  imageUrl: string
  duration: number // seconds
  text?: string
  textPosition?: 'top' | 'bottom' | 'center'
}

interface VideoGenerationOptions {
  slides: SlideOptions[]
  voiceoverUrl?: string // URL to audio file (from ElevenLabs)
  musicUrl?: string // Background music URL
  musicVolume?: number // 0-1
  aspectRatio?: '16:9' | '9:16' | '1:1'
  title?: string
}

interface RenderStatus {
  renderId: string
  status: 'queued' | 'rendering' | 'done' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
}

let _config: ShotstackConfig | null = null

function getConfig(): ShotstackConfig {
  if (!_config) {
    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      throw new Error('SHOTSTACK_API_KEY environment variable is not set')
    }
    _config = { apiKey }
  }
  return _config
}

async function shotstackFetch(endpoint: string, options: RequestInit = {}) {
  const config = getConfig()
  const response = await fetch(`${SHOTSTACK_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Shotstack API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Build a Shotstack timeline from slides
 */
function buildTimeline(options: VideoGenerationOptions) {
  const { slides, voiceoverUrl, musicUrl, musicVolume = 0.3, aspectRatio = '9:16' } = options

  // Calculate total duration
  const totalDuration = slides.reduce((sum, s) => sum + s.duration, 0)

  // Build image clips
  let currentTime = 0
  const imageClips = slides.map((slide) => {
    const clip: any = {
      asset: {
        type: 'image',
        src: slide.imageUrl,
      },
      start: currentTime,
      length: slide.duration,
      effect: 'zoomIn', // Ken Burns effect
      transition: {
        in: 'fade',
        out: 'fade',
      },
    }
    currentTime += slide.duration
    return clip
  })

  // Build text overlays
  currentTime = 0
  const textClips = slides
    .filter((s) => s.text)
    .map((slide) => {
      const yPosition = slide.textPosition === 'top' ? 0.1 : slide.textPosition === 'center' ? 0.5 : 0.85
      const clip = {
        asset: {
          type: 'html',
          html: `<p style="font-family: Arial; font-size: 48px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); text-align: center; padding: 20px;">${slide.text}</p>`,
          width: aspectRatio === '9:16' ? 1080 : 1920,
          height: 200,
        },
        start: currentTime,
        length: slide.duration,
        position: 'center',
        offset: { x: 0, y: yPosition - 0.5 },
        transition: {
          in: 'fadeIn',
          out: 'fadeOut',
        },
      }
      currentTime += slide.duration
      return clip
    })

  // Build audio tracks
  const audioTracks: any[] = []

  if (voiceoverUrl) {
    audioTracks.push({
      clips: [
        {
          asset: {
            type: 'audio',
            src: voiceoverUrl,
          },
          start: 0,
          length: totalDuration,
        },
      ],
    })
  }

  if (musicUrl) {
    audioTracks.push({
      clips: [
        {
          asset: {
            type: 'audio',
            src: musicUrl,
            volume: musicVolume,
          },
          start: 0,
          length: totalDuration,
        },
      ],
    })
  }

  // Determine output dimensions
  const output =
    aspectRatio === '9:16'
      ? { format: 'mp4', resolution: 'hd', aspectRatio: '9:16' }
      : aspectRatio === '1:1'
        ? { format: 'mp4', resolution: 'hd', aspectRatio: '1:1' }
        : { format: 'mp4', resolution: 'hd', aspectRatio: '16:9' }

  return {
    timeline: {
      tracks: [
        { clips: textClips }, // Text on top
        { clips: imageClips }, // Images below text
        ...audioTracks,
      ],
    },
    output,
  }
}

/**
 * Start video rendering
 */
export async function renderVideo(options: VideoGenerationOptions): Promise<{ renderId: string }> {
  const timeline = buildTimeline(options)

  const response = await shotstackFetch('/render', {
    method: 'POST',
    body: JSON.stringify(timeline),
  })

  return { renderId: response.response.id }
}

/**
 * Check render status
 */
export async function getRenderStatus(renderId: string): Promise<RenderStatus> {
  const response = await shotstackFetch(`/render/${renderId}`)

  const data = response.response

  return {
    renderId,
    status:
      data.status === 'done'
        ? 'done'
        : data.status === 'failed'
          ? 'failed'
          : data.status === 'rendering'
            ? 'rendering'
            : 'queued',
    videoUrl: data.url,
    thumbnailUrl: data.thumbnail,
    error: data.error,
  }
}

/**
 * Wait for render to complete
 */
export async function waitForRender(
  renderId: string,
  maxWaitMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<RenderStatus> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getRenderStatus(renderId)

    if (status.status === 'done' || status.status === 'failed') {
      return status
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(`Render timed out after ${maxWaitMs / 1000} seconds`)
}

/**
 * Generate a social media video from script and images
 *
 * This is the main function for creating slideshow videos.
 */
export async function createSlideshowVideo(options: {
  images: string[] // Array of image URLs
  script: string // Full script (for voiceover timing)
  voiceoverUrl?: string // Pre-generated voiceover URL
  textOverlays?: string[] // Text to show on each slide
  platform: 'tiktok' | 'youtube' | 'instagram'
  musicUrl?: string
}): Promise<{ renderId: string }> {
  const { images, script, voiceoverUrl, textOverlays = [], platform, musicUrl } = options

  // Calculate duration per slide based on script length
  // Assume ~150 words per minute speaking rate
  const wordCount = script.split(/\s+/).length
  const totalDuration = Math.max(15, Math.min(60, (wordCount / 150) * 60)) // 15-60 seconds
  const durationPerSlide = totalDuration / images.length

  const slides: SlideOptions[] = images.map((imageUrl, i) => ({
    imageUrl,
    duration: durationPerSlide,
    text: textOverlays[i],
    textPosition: 'bottom' as const,
  }))

  return renderVideo({
    slides,
    voiceoverUrl,
    musicUrl,
    aspectRatio: '9:16', // Vertical for all short-form
  })
}

// Free background music options (royalty-free)
export const FREE_MUSIC = {
  upbeat: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  inspirational: 'https://assets.mixkit.co/music/preview/mixkit-spirit-of-the-west-125.mp3',
  corporate: 'https://assets.mixkit.co/music/preview/mixkit-raising-me-higher-34.mp3',
  calm: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
}

export type { VideoGenerationOptions, RenderStatus, SlideOptions }
