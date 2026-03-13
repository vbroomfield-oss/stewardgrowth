/**
 * Shotstack Video Generation Client — Ecommerce Ad Templates
 *
 * Creates professional ecommerce-style ad videos with:
 * - Dynamic motion effects & transitions
 * - Bold animated text with brand colors
 * - Product highlight screens
 * - CTA end screens
 * - Professional typography & overlays
 *
 * Free tier: 20 videos/month
 * Docs: https://shotstack.io/docs/api/
 */

const SHOTSTACK_API_URL = 'https://api.shotstack.io/stage' // Use 'v1' for production

interface ShotstackConfig {
  apiKey: string
}

// --- Template Types ---

export type VideoTemplate =
  | 'product-showcase'  // Hero product shots with bold text + price + CTA
  | 'promo-ad'          // Sale/discount style with urgency text + countdown feel
  | 'testimonial'       // Customer quote over lifestyle imagery
  | 'brand-story'       // Brand narrative with cinematic feel
  | 'before-after'      // Side-by-side or sequential transformation

export interface BrandStyle {
  primaryColor: string   // Hex, e.g. "#FF6B35"
  secondaryColor: string // Hex
  accentColor: string    // Hex for CTAs / highlights
  fontFamily?: string    // "Montserrat" | "Poppins" | "Inter" | "Playfair Display"
  logoUrl?: string       // Overlay brand logo
}

export interface SlideOptions {
  imageUrl: string
  duration: number
  headline?: string          // Big bold text
  subtext?: string           // Smaller supporting text
  price?: string             // "$29.99" — triggers price badge
  ctaText?: string           // "Shop Now" — triggers CTA button
  overlayColor?: string      // Semi-transparent color overlay
  textPosition?: 'top' | 'bottom' | 'center' | 'top-left' | 'bottom-right'
  effect?: 'zoomIn' | 'zoomOut' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'none'
  transition?: 'fade' | 'wipeRight' | 'wipeLeft' | 'slideLeft' | 'slideRight' | 'carouselRight' | 'zoom'
}

export interface VideoGenerationOptions {
  slides: SlideOptions[]
  voiceoverUrl?: string
  musicUrl?: string
  musicVolume?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  title?: string
  template?: VideoTemplate
  brand?: BrandStyle
  ctaScreen?: {
    text: string           // "Shop Now" / "Get Started" / "Limited Time"
    subtext?: string       // "Use code SAVE20"
    url?: string           // Displayed as text
  }
  introScreen?: {
    logoUrl?: string
    brandName?: string
    tagline?: string
  }
}

export interface RenderStatus {
  renderId: string
  status: 'queued' | 'rendering' | 'done' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
}

// --- Config ---

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

// --- Helper: Color with opacity ---

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// --- HTML Builders for Rich Text Overlays ---

function buildHeadlineHtml(
  text: string,
  brand: BrandStyle,
  width: number,
  position: string,
): string {
  const fontFamily = brand.fontFamily || 'Montserrat'
  const fontSize = text.length > 30 ? 42 : text.length > 20 ? 52 : 64
  return `<div style="
    font-family: '${fontFamily}', sans-serif;
    font-size: ${fontSize}px;
    font-weight: 800;
    color: white;
    text-transform: uppercase;
    letter-spacing: 2px;
    line-height: 1.1;
    text-align: ${position.includes('left') ? 'left' : 'center'};
    padding: 24px 32px;
    text-shadow: 0 4px 12px rgba(0,0,0,0.6);
  ">${text}</div>`
}

function buildSubtextHtml(text: string, brand: BrandStyle, width: number): string {
  const fontFamily = brand.fontFamily || 'Montserrat'
  return `<div style="
    font-family: '${fontFamily}', sans-serif;
    font-size: 28px;
    font-weight: 400;
    color: rgba(255,255,255,0.9);
    text-align: center;
    padding: 8px 32px;
    letter-spacing: 1px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  ">${text}</div>`
}

function buildPriceBadgeHtml(price: string, brand: BrandStyle): string {
  return `<div style="
    display: inline-block;
    background: ${brand.accentColor};
    color: white;
    font-family: 'Montserrat', sans-serif;
    font-size: 48px;
    font-weight: 900;
    padding: 16px 32px;
    border-radius: 8px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  ">${price}</div>`
}

function buildCtaButtonHtml(text: string, brand: BrandStyle, subtext?: string): string {
  return `<div style="text-align: center;">
    <div style="
      display: inline-block;
      background: ${brand.accentColor};
      color: white;
      font-family: 'Montserrat', sans-serif;
      font-size: 40px;
      font-weight: 800;
      padding: 20px 48px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 3px;
      box-shadow: 0 8px 32px ${hexToRgba(brand.accentColor, 0.5)};
    ">${text}</div>
    ${subtext ? `<div style="
      font-family: 'Montserrat', sans-serif;
      font-size: 24px;
      color: rgba(255,255,255,0.8);
      margin-top: 16px;
      letter-spacing: 1px;
    ">${subtext}</div>` : ''}
  </div>`
}

function buildColorOverlayHtml(
  color: string,
  opacity: number,
  width: number,
  height: number,
  gradient: 'bottom' | 'top' | 'full' | 'radial' = 'bottom',
): string {
  const bg =
    gradient === 'bottom'
      ? `linear-gradient(to top, ${hexToRgba(color, opacity)}, transparent)`
      : gradient === 'top'
        ? `linear-gradient(to bottom, ${hexToRgba(color, opacity)}, transparent)`
        : gradient === 'radial'
          ? `radial-gradient(ellipse at center, transparent 30%, ${hexToRgba(color, opacity)} 100%)`
          : hexToRgba(color, opacity)
  return `<div style="width:${width}px;height:${height}px;background:${bg};"></div>`
}

function buildIntroScreenHtml(
  brandName: string,
  tagline: string,
  brand: BrandStyle,
  width: number,
  height: number,
): string {
  const fontFamily = brand.fontFamily || 'Montserrat'
  return `<div style="
    width: ${width}px;
    height: ${height}px;
    background: linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor});
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  ">
    <div style="
      font-family: '${fontFamily}', sans-serif;
      font-size: 72px;
      font-weight: 900;
      color: white;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 16px;
    ">${brandName}</div>
    <div style="
      font-family: '${fontFamily}', sans-serif;
      font-size: 28px;
      color: rgba(255,255,255,0.85);
      letter-spacing: 2px;
    ">${tagline}</div>
  </div>`
}

function buildCtaScreenHtml(
  text: string,
  subtext: string,
  brand: BrandStyle,
  width: number,
  height: number,
): string {
  const fontFamily = brand.fontFamily || 'Montserrat'
  return `<div style="
    width: ${width}px;
    height: ${height}px;
    background: linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor});
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  ">
    <div style="
      display: inline-block;
      background: ${brand.accentColor};
      color: white;
      font-family: '${fontFamily}', sans-serif;
      font-size: 52px;
      font-weight: 900;
      padding: 24px 56px;
      border-radius: 16px;
      text-transform: uppercase;
      letter-spacing: 4px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
      margin-bottom: 24px;
    ">${text}</div>
    ${subtext ? `<div style="
      font-family: '${fontFamily}', sans-serif;
      font-size: 28px;
      color: rgba(255,255,255,0.85);
      letter-spacing: 2px;
    ">${subtext}</div>` : ''}
  </div>`
}

// --- Template-Specific Effect Presets ---

const TEMPLATE_EFFECTS: Record<VideoTemplate, {
  defaultEffect: string
  transitions: string[]
  slideDurations: { intro: number; main: number; cta: number }
  overlayOpacity: number
  overlayGradient: 'bottom' | 'top' | 'full' | 'radial'
}> = {
  'product-showcase': {
    defaultEffect: 'zoomIn',
    transitions: ['zoom', 'slideLeft', 'wipeRight', 'slideRight'],
    slideDurations: { intro: 2, main: 3.5, cta: 3 },
    overlayOpacity: 0.45,
    overlayGradient: 'bottom',
  },
  'promo-ad': {
    defaultEffect: 'zoomOut',
    transitions: ['wipeRight', 'carouselRight', 'slideLeft', 'zoom'],
    slideDurations: { intro: 1.5, main: 2.5, cta: 3 },
    overlayOpacity: 0.5,
    overlayGradient: 'full',
  },
  'testimonial': {
    defaultEffect: 'zoomIn',
    transitions: ['fade', 'fade', 'fade', 'fade'],
    slideDurations: { intro: 2, main: 4, cta: 3 },
    overlayOpacity: 0.55,
    overlayGradient: 'radial',
  },
  'brand-story': {
    defaultEffect: 'slideRight',
    transitions: ['fade', 'slideLeft', 'slideRight', 'fade'],
    slideDurations: { intro: 2.5, main: 4, cta: 3 },
    overlayOpacity: 0.4,
    overlayGradient: 'bottom',
  },
  'before-after': {
    defaultEffect: 'slideLeft',
    transitions: ['wipeRight', 'wipeLeft', 'wipeRight', 'fade'],
    slideDurations: { intro: 2, main: 3, cta: 3 },
    overlayOpacity: 0.4,
    overlayGradient: 'bottom',
  },
}

// --- Timeline Builder ---

function getOutputDimensions(aspectRatio: '16:9' | '9:16' | '1:1'): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16': return { width: 1080, height: 1920 }
    case '1:1': return { width: 1080, height: 1080 }
    default: return { width: 1920, height: 1080 }
  }
}

function buildTimeline(options: VideoGenerationOptions) {
  const {
    slides,
    voiceoverUrl,
    musicUrl,
    musicVolume = 0.25,
    aspectRatio = '9:16',
    template = 'product-showcase',
    brand = { primaryColor: '#1a1a2e', secondaryColor: '#16213e', accentColor: '#e94560' },
    ctaScreen,
    introScreen,
  } = options

  const dims = getOutputDimensions(aspectRatio)
  const effects = TEMPLATE_EFFECTS[template]

  // --- Build tracks ---
  const imageClips: any[] = []
  const overlayClips: any[] = []
  const headlineClips: any[] = []
  const subtextClips: any[] = []
  const badgeClips: any[] = []

  let currentTime = 0

  // --- Intro Screen ---
  if (introScreen) {
    const introDuration = effects.slideDurations.intro

    // Branded gradient background
    imageClips.push({
      asset: {
        type: 'html',
        html: buildIntroScreenHtml(
          introScreen.brandName || '',
          introScreen.tagline || '',
          brand,
          dims.width,
          dims.height,
        ),
        width: dims.width,
        height: dims.height,
      },
      start: currentTime,
      length: introDuration,
      transition: { in: 'fade', out: 'fade' },
    })

    // Logo overlay if available
    if (introScreen.logoUrl) {
      imageClips.push({
        asset: {
          type: 'image',
          src: introScreen.logoUrl,
        },
        start: currentTime + 0.3,
        length: introDuration - 0.5,
        fit: 'none',
        scale: 0.3,
        position: 'center',
        offset: { x: 0, y: -0.15 },
        transition: { in: 'fade', out: 'fade' },
      })
    }

    currentTime += introDuration
  }

  // --- Main Content Slides ---
  slides.forEach((slide, index) => {
    const duration = slide.duration || effects.slideDurations.main
    const effect = slide.effect || effects.defaultEffect
    const transition = slide.transition || effects.transitions[index % effects.transitions.length]
    const textPos = slide.textPosition || 'bottom'

    // Product/scene image
    imageClips.push({
      asset: {
        type: 'image',
        src: slide.imageUrl,
      },
      start: currentTime,
      length: duration,
      effect,
      transition: {
        in: index === 0 && !introScreen ? 'fade' : transition,
        out: 'fade',
      },
      fit: 'crop',
    })

    // Color overlay for text readability
    const overlayColor = slide.overlayColor || brand.primaryColor
    overlayClips.push({
      asset: {
        type: 'html',
        html: buildColorOverlayHtml(
          overlayColor,
          effects.overlayOpacity,
          dims.width,
          dims.height,
          effects.overlayGradient,
        ),
        width: dims.width,
        height: dims.height,
      },
      start: currentTime,
      length: duration,
      transition: { in: 'fade', out: 'fade' },
    })

    // Headline text — bold animated
    if (slide.headline) {
      const yOffset =
        textPos === 'top' ? -0.3
          : textPos === 'center' ? 0
            : textPos === 'top-left' ? -0.3
              : textPos === 'bottom-right' ? 0.25
                : 0.2

      headlineClips.push({
        asset: {
          type: 'html',
          html: buildHeadlineHtml(slide.headline, brand, dims.width, textPos),
          width: dims.width,
          height: 200,
        },
        start: currentTime + 0.2,
        length: duration - 0.3,
        position: 'center',
        offset: { x: 0, y: yOffset },
        transition: {
          in: 'slideUp',
          out: 'fade',
        },
      })
    }

    // Subtext — smaller supporting copy
    if (slide.subtext) {
      const yOffset = textPos === 'top' ? -0.15 : 0.32
      subtextClips.push({
        asset: {
          type: 'html',
          html: buildSubtextHtml(slide.subtext, brand, dims.width),
          width: dims.width,
          height: 120,
        },
        start: currentTime + 0.5,
        length: duration - 0.6,
        position: 'center',
        offset: { x: 0, y: yOffset },
        transition: {
          in: 'fade',
          out: 'fade',
        },
      })
    }

    // Price badge
    if (slide.price) {
      badgeClips.push({
        asset: {
          type: 'html',
          html: buildPriceBadgeHtml(slide.price, brand),
          width: 400,
          height: 120,
        },
        start: currentTime + 0.4,
        length: duration - 0.5,
        position: 'center',
        offset: { x: 0.25, y: -0.35 },
        transition: {
          in: 'zoom',
          out: 'fade',
        },
      })
    }

    // Per-slide CTA button
    if (slide.ctaText) {
      badgeClips.push({
        asset: {
          type: 'html',
          html: buildCtaButtonHtml(slide.ctaText, brand),
          width: dims.width,
          height: 160,
        },
        start: currentTime + 0.6,
        length: duration - 0.7,
        position: 'center',
        offset: { x: 0, y: 0.38 },
        transition: {
          in: 'slideUp',
          out: 'fade',
        },
      })
    }

    currentTime += duration
  })

  // --- CTA End Screen ---
  if (ctaScreen) {
    const ctaDuration = effects.slideDurations.cta

    imageClips.push({
      asset: {
        type: 'html',
        html: buildCtaScreenHtml(
          ctaScreen.text,
          ctaScreen.subtext || '',
          brand,
          dims.width,
          dims.height,
        ),
        width: dims.width,
        height: dims.height,
      },
      start: currentTime,
      length: ctaDuration,
      transition: {
        in: 'zoom',
        out: 'fade',
      },
    })

    // Logo on CTA screen
    if (brand.logoUrl) {
      badgeClips.push({
        asset: {
          type: 'image',
          src: brand.logoUrl,
        },
        start: currentTime + 0.3,
        length: ctaDuration - 0.5,
        fit: 'none',
        scale: 0.2,
        position: 'center',
        offset: { x: 0, y: 0.35 },
        transition: { in: 'fade', out: 'fade' },
      })
    }

    currentTime += ctaDuration
  }

  const totalDuration = currentTime

  // --- Audio Tracks ---
  const audioTracks: any[] = []

  if (voiceoverUrl) {
    audioTracks.push({
      clips: [{
        asset: { type: 'audio', src: voiceoverUrl },
        start: 0,
        length: totalDuration,
      }],
    })
  }

  if (musicUrl) {
    audioTracks.push({
      clips: [{
        asset: { type: 'audio', src: musicUrl, volume: musicVolume },
        start: 0,
        length: totalDuration,
      }],
    })
  }

  // --- Assemble Timeline ---
  // Tracks are layered top-to-bottom: badges > headlines > subtext > overlays > images
  const tracks: any[] = []

  if (badgeClips.length > 0) tracks.push({ clips: badgeClips })
  if (headlineClips.length > 0) tracks.push({ clips: headlineClips })
  if (subtextClips.length > 0) tracks.push({ clips: subtextClips })
  if (overlayClips.length > 0) tracks.push({ clips: overlayClips })
  tracks.push({ clips: imageClips })
  tracks.push(...audioTracks)

  return {
    timeline: {
      background: '#000000',
      tracks,
    },
    output: {
      format: 'mp4',
      resolution: 'hd',
      aspectRatio: aspectRatio,
    },
  }
}

// --- Public API ---

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
      data.status === 'done' ? 'done'
        : data.status === 'failed' ? 'failed'
          : data.status === 'rendering' ? 'rendering'
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
 * Create a professional ecommerce ad video
 */
export async function createEcommerceVideo(options: {
  images: string[]
  headlines: string[]
  subtexts?: string[]
  prices?: string[]
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook'
  template?: VideoTemplate
  brand?: BrandStyle
  voiceoverUrl?: string
  musicUrl?: string
  ctaText?: string
  ctaSubtext?: string
  brandName?: string
  brandTagline?: string
  script?: string
}): Promise<{ renderId: string }> {
  const {
    images,
    headlines,
    subtexts = [],
    prices = [],
    platform,
    template = 'product-showcase',
    brand = { primaryColor: '#1a1a2e', secondaryColor: '#16213e', accentColor: '#e94560' },
    voiceoverUrl,
    musicUrl,
    ctaText = 'Shop Now',
    ctaSubtext,
    brandName,
    brandTagline,
    script,
  } = options

  const effects = TEMPLATE_EFFECTS[template]

  // Calculate duration per slide based on script or defaults
  let durationPerSlide = effects.slideDurations.main
  if (script) {
    const wordCount = script.split(/\s+/).length
    const totalScriptDuration = Math.max(12, Math.min(55, (wordCount / 150) * 60))
    const introDuration = brandName ? effects.slideDurations.intro : 0
    const ctaDuration = effects.slideDurations.cta
    const availableDuration = totalScriptDuration - introDuration - ctaDuration
    durationPerSlide = Math.max(2, availableDuration / images.length)
  }

  // Build slides with alternating text positions for visual variety
  const textPositions: Array<'bottom' | 'center' | 'top'> =
    template === 'promo-ad' ? ['center', 'center', 'center', 'center']
      : ['bottom', 'center', 'bottom', 'center']

  const slides: SlideOptions[] = images.map((imageUrl, i) => ({
    imageUrl,
    duration: durationPerSlide,
    headline: headlines[i],
    subtext: subtexts[i],
    price: prices[i],
    textPosition: textPositions[i % textPositions.length],
    ctaText: i === images.length - 1 && !ctaText ? undefined : undefined, // CTA goes on end screen
  }))

  const aspectRatio: '9:16' | '16:9' | '1:1' =
    platform === 'youtube' ? '16:9' : '9:16'

  return renderVideo({
    slides,
    voiceoverUrl,
    musicUrl: musicUrl || ECOMMERCE_MUSIC.energetic,
    musicVolume: voiceoverUrl ? 0.15 : 0.35,
    aspectRatio,
    template,
    brand,
    introScreen: brandName ? {
      brandName,
      tagline: brandTagline || '',
      logoUrl: brand.logoUrl,
    } : undefined,
    ctaScreen: {
      text: ctaText,
      subtext: ctaSubtext,
    },
  })
}

// --- Legacy Compatibility ---

/**
 * @deprecated Use createEcommerceVideo instead.
 * Kept for backward compatibility with existing cron jobs.
 */
export async function createSlideshowVideo(options: {
  images: string[]
  script: string
  voiceoverUrl?: string
  textOverlays?: string[]
  platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook'
  musicUrl?: string
}): Promise<{ renderId: string }> {
  const { images, script, voiceoverUrl, textOverlays = [], platform, musicUrl } = options

  return createEcommerceVideo({
    images,
    headlines: textOverlays,
    script,
    voiceoverUrl,
    musicUrl,
    platform,
    template: 'product-showcase',
    ctaText: 'Learn More',
  })
}

// --- Ecommerce-optimized background music ---

export const ECOMMERCE_MUSIC = {
  energetic: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  modern: 'https://assets.mixkit.co/music/preview/mixkit-raising-me-higher-34.mp3',
  luxury: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
  hype: 'https://assets.mixkit.co/music/preview/mixkit-spirit-of-the-west-125.mp3',
  minimal: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
}

/** @deprecated Use ECOMMERCE_MUSIC instead */
export const FREE_MUSIC = {
  upbeat: ECOMMERCE_MUSIC.energetic,
  inspirational: ECOMMERCE_MUSIC.hype,
  corporate: ECOMMERCE_MUSIC.modern,
  calm: ECOMMERCE_MUSIC.luxury,
}
