/**
 * ElevenLabs Voice Generation Client
 *
 * Creates AI voiceovers from text for video content.
 * Can be used standalone or in combination with video generation.
 * Docs: https://docs.elevenlabs.io/api-reference
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

interface ElevenLabsConfig {
  apiKey: string
}

interface VoiceGenerationOptions {
  text: string
  voiceId?: string
  modelId?: string
  stability?: number // 0-1, higher = more consistent
  similarityBoost?: number // 0-1, higher = more similar to original voice
  style?: number // 0-1, for expressive models
  speakerBoost?: boolean
}

interface Voice {
  voiceId: string
  name: string
  category: string
  labels: Record<string, string>
  previewUrl: string
}

interface GenerationResult {
  audioBuffer: Buffer
  contentType: string
}

let _config: ElevenLabsConfig | null = null

function getConfig(): ElevenLabsConfig {
  if (!_config) {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set')
    }
    _config = { apiKey }
  }
  return _config
}

async function elevenLabsFetch(endpoint: string, options: RequestInit = {}) {
  const config = getConfig()
  const response = await fetch(`${ELEVENLABS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'xi-api-key': config.apiKey,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`)
  }

  return response
}

/**
 * List available voices
 */
export async function listVoices(): Promise<Voice[]> {
  const response = await elevenLabsFetch('/voices')
  const data = await response.json()

  return data.voices.map((v: any) => ({
    voiceId: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels || {},
    previewUrl: v.preview_url,
  }))
}

/**
 * Get voice by ID
 */
export async function getVoice(voiceId: string): Promise<Voice> {
  const response = await elevenLabsFetch(`/voices/${voiceId}`)
  const v = await response.json()

  return {
    voiceId: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels || {},
    previewUrl: v.preview_url,
  }
}

/**
 * Generate speech from text
 */
export async function generateSpeech(options: VoiceGenerationOptions): Promise<GenerationResult> {
  const {
    text,
    voiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // Rachel (default)
    modelId = 'eleven_monolingual_v1',
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    speakerBoost = true,
  } = options

  const response = await elevenLabsFetch(`/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: speakerBoost,
      },
    }),
  })

  const arrayBuffer = await response.arrayBuffer()

  return {
    audioBuffer: Buffer.from(arrayBuffer),
    contentType: 'audio/mpeg',
  }
}

/**
 * Generate speech and save to file (for local development/testing)
 */
export async function generateSpeechToFile(
  options: VoiceGenerationOptions,
  outputPath: string
): Promise<string> {
  const { audioBuffer } = await generateSpeech(options)

  // This would need fs module - for server-side only
  const fs = await import('fs/promises')
  await fs.writeFile(outputPath, audioBuffer)

  return outputPath
}

/**
 * Generate speech and return as base64 (for API responses)
 */
export async function generateSpeechBase64(options: VoiceGenerationOptions): Promise<string> {
  const { audioBuffer } = await generateSpeech(options)
  return audioBuffer.toString('base64')
}

/**
 * Get remaining character quota
 */
export async function getQuota(): Promise<{
  characterCount: number
  characterLimit: number
  remainingCharacters: number
}> {
  const response = await elevenLabsFetch('/user/subscription')
  const data = await response.json()

  return {
    characterCount: data.character_count || 0,
    characterLimit: data.character_limit || 0,
    remainingCharacters: (data.character_limit || 0) - (data.character_count || 0),
  }
}

/**
 * Recommended voices for different content types
 */
export const RECOMMENDED_VOICES = {
  professional: {
    male: 'pNInz6obpgDQGcFmaJgB', // Adam
    female: '21m00Tcm4TlvDq8ikWAM', // Rachel
  },
  friendly: {
    male: 'TxGEqnHWrfWFTfGW9XjX', // Josh
    female: 'EXAVITQu4vr4xnSDxMaL', // Bella
  },
  authoritative: {
    male: 'VR6AewLTigWG4xSOukaG', // Arnold
    female: 'ThT5KcBeYPX3keUQqHPh', // Dorothy
  },
  youthful: {
    male: 'ODq5zmih8GrVes37Dizd', // Patrick
    female: 'MF3mGyEYCl7XYWbV9V6O', // Emily
  },
}

export type { VoiceGenerationOptions, Voice, GenerationResult }
