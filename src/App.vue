<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  Clipboard,
  Globe2,
  Headphones,
  Languages,
  LoaderCircle,
  Mic,
  Moon,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  X,
} from '@lucide/vue'

type UiLanguage = 'en' | 'th'

interface Language {
  code: string
  name: string
  nativeName: string
  speechCode: string
}

interface ModelTokenUsage {
  model: string
  inputTokens: number
  outputTokens: number
  requests: number
}

interface ModelUsageRow extends ModelTokenUsage {
  label: string
  share: number
}

interface ModelConfiguration {
  translation: string
  transcription: string
  textToSpeech: string
}

type ModelRole = keyof ModelConfiguration

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-US' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', speechCode: 'th-TH' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', speechCode: 'vi-VN' },
  { code: 'fil', name: 'Filipino (Philippines)', nativeName: 'Filipino', speechCode: 'fil-PH' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', speechCode: 'id-ID' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', speechCode: 'fr-FR' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', speechCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', speechCode: 'zh-CN' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', speechCode: 'de-DE' },
]

const defaultModels: ModelConfiguration = {
  translation: 'gemini-4-hydrogen',
  transcription: 'gemini-3.5-transcribe',
  textToSpeech: 'gemini-3.8-flash-lite-tts',
}

const modelDefinitions: Array<{ key: ModelRole; label: string }> = [
  { key: 'translation', label: 'Translation' },
  { key: 'transcription', label: 'Speech to text' },
  { key: 'textToSpeech', label: 'Text to speech' },
]

const copy = {
  en: {
    tagline: 'Words connect us.',
    badge: 'YOUR PERSONAL TRANSLATOR',
    headline: 'Say it in any language.',
    subtitle: 'A little help finding just the right words.',
    from: 'Translate from',
    to: 'Translate to',
    placeholder: 'Type something to translate...',
    resultPlaceholder: 'Your translation will appear here',
    translate: 'Translate',
    translating: 'Translating...',
    listen: 'Listen',
    generatingAudio: 'Generating audio...',
    recording: 'Recording...',
    stopRecording: 'Stop recording',
    cancel: 'Cancel',
    cancelRecording: 'Cancel recording',
    transcribing: 'Transcribing...',
    clear: 'Clear',
    paste: 'Paste',
    copy: 'Copy',
    copied: 'Copied!',
    speechInput: 'Record speech',
    speechHint: 'Tap the mic and start speaking',
    poweredBy: 'Powered by Gemini',
    apiTitle: 'Google AI Studio key',
    apiHint: 'Your key stays in this tab and is sent only to Google AI Studio.',
    apiPlaceholder: 'Paste your Gemini API key',
    saveKey: 'Save key',
    keySaved: 'Key saved for this session',
    removeKey: 'Remove key',
    customize: 'Customize',
    modelSettings: 'Customize models',
    modelHint: 'Enter the Gemini model IDs to use for each task. Changes apply immediately after saving.',
    translationModel: 'Translation model',
    transcriptionModel: 'Speech-to-text model',
    textToSpeechModel: 'Text-to-speech model',
    modelPlaceholder: 'Gemini model ID',
    saveModels: 'Save models',
    resetModels: 'Restore defaults',
    modelsSaved: 'Models saved for this session',
    invalidModels: 'Enter a model ID for all three tasks.',
    needKey: 'Add your Google AI Studio key to get started.',
    emptyInput: 'Type or speak something to translate first.',
    translationError: 'Translation failed. Check your key and try again.',
    speechUnsupported: 'Speech recognition is not available in this browser. Try Chrome or Edge.',
    speechError: 'Could not start speech recognition. Check microphone permissions.',
    speechPlaybackUnsupported: 'Speech playback is not available in this browser.',
    source: 'Original',
    translation: 'Translation',
    switchLanguages: 'Switch languages',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
    uiLanguage: 'Interface language',
    privacyNote: 'Your words go directly to Google AI Studio for translation.',
    enterKey: 'Enter an API key first.',
    invalidKey: 'Could not save an empty API key.',
    recordingUnsupported: 'Audio recording is not supported in this browser.',
    silenceDetectionUnsupported: 'Automatic silence detection is not supported in this browser.',
    microphoneError: 'Could not access your microphone. Check browser permissions.',
    audioTooLarge: 'This recording is too large to transcribe. Please record a shorter clip.',
    emptyTranscript: 'No speech was detected. Try recording again.',
    tokenUsage: 'Token usage',
    sessionUsage: 'This session',
    trackedTokens: 'tracked tokens',
    inputTokens: 'Input',
    outputTokens: 'Output',
    totalTokens: 'Total',
    requests: 'requests',
    noUsage: 'Token usage will appear after the first request.',
    usageUnavailable: 'Token details unavailable',
    usageBarHint: 'Bars show each model’s share of tracked tokens, not a quota.',
    ttsError: 'Could not generate speech audio.',
    ttsQuotaError: 'Google rejected TTS because your account has no free-tier quota for this model. Enable billing or choose a model with quota available to your account.',
    autoplayBlocked: 'Audio is ready. Press play in the audio player if your browser blocks autoplay.',
    quotaDocs: 'Rate limits and billing',
    quotaDashboard: 'Usage dashboard',
    footer: 'Thoughtful translations, one conversation at a time.',
  },
  th: {
    tagline: 'ภาษาเชื่อมโยงเราเข้าด้วยกัน',
    badge: 'ผู้ช่วยแปลภาษาส่วนตัว',
    headline: 'พูดได้ทุกภาษา',
    subtitle: 'ช่วยคุณค้นหาคำที่ใช่ในทุกบทสนทนา',
    from: 'แปลจาก',
    to: 'แปลเป็น',
    placeholder: 'พิมพ์ข้อความที่ต้องการแปล...',
    resultPlaceholder: 'คำแปลจะแสดงที่นี่',
    translate: 'แปลภาษา',
    translating: 'กำลังแปล...',
    listen: 'ฟัง',
    generatingAudio: 'กำลังสร้างเสียง...',
    recording: 'กำลังบันทึก...',
    stopRecording: 'หยุดบันทึก',
    cancel: 'ยกเลิก',
    cancelRecording: 'ยกเลิกการบันทึก',
    transcribing: 'กำลังถอดเสียง...',
    clear: 'ล้าง',
    paste: 'วาง',
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว!',
    speechInput: 'บันทึกเสียงพูด',
    speechHint: 'แตะไมโครโฟนแล้วเริ่มพูด',
    poweredBy: 'ขับเคลื่อนด้วย Gemini',
    apiTitle: 'คีย์ Google AI Studio',
    apiHint: 'คีย์จะอยู่ในแท็บนี้และส่งไปยัง Google AI Studio เท่านั้น',
    apiPlaceholder: 'วาง Gemini API key ของคุณ',
    saveKey: 'บันทึกคีย์',
    keySaved: 'บันทึกคีย์ไว้สำหรับเซสชันนี้แล้ว',
    removeKey: 'ลบคีย์',
    customize: 'ปรับแต่ง',
    modelSettings: 'ปรับแต่งโมเดล',
    modelHint: 'ป้อน Gemini model ID สำหรับแต่ละงาน การเปลี่ยนแปลงจะมีผลหลังบันทึก',
    translationModel: 'โมเดลแปลภาษา',
    transcriptionModel: 'โมเดลแปลงเสียงเป็นข้อความ',
    textToSpeechModel: 'โมเดลแปลงข้อความเป็นเสียง',
    modelPlaceholder: 'Gemini model ID',
    saveModels: 'บันทึกโมเดล',
    resetModels: 'คืนค่าเริ่มต้น',
    modelsSaved: 'บันทึกโมเดลไว้สำหรับเซสชันนี้แล้ว',
    invalidModels: 'กรุณาป้อน model ID ให้ครบทั้งสามงาน',
    needKey: 'เพิ่มคีย์ Google AI Studio เพื่อเริ่มใช้งาน',
    emptyInput: 'พิมพ์หรือพูดข้อความที่ต้องการแปลก่อน',
    translationError: 'แปลไม่สำเร็จ ตรวจสอบคีย์แล้วลองอีกครั้ง',
    speechUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการรู้จำเสียง ลองใช้ Chrome หรือ Edge',
    speechError: 'เริ่มการรู้จำเสียงไม่ได้ โปรดตรวจสอบสิทธิ์ไมโครโฟน',
    speechPlaybackUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการเล่นเสียงพูด',
    source: 'ข้อความต้นฉบับ',
    translation: 'คำแปล',
    switchLanguages: 'สลับภาษา',
    themeLight: 'เปลี่ยนเป็นโหมดสว่าง',
    themeDark: 'เปลี่ยนเป็นโหมดมืด',
    uiLanguage: 'ภาษาของหน้าจอ',
    privacyNote: 'ข้อความของคุณจะส่งตรงไปยัง Google AI Studio เพื่อแปลภาษา',
    enterKey: 'กรุณาใส่ API key ก่อน',
    invalidKey: 'ไม่สามารถบันทึก API key ที่ว่างเปล่าได้',
    recordingUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการบันทึกเสียง',
    silenceDetectionUnsupported: 'เบราว์เซอร์นี้ไม่รองรับการตรวจจับช่วงเงียบอัตโนมัติ',
    microphoneError: 'เข้าถึงไมโครโฟนไม่ได้ โปรดตรวจสอบสิทธิ์ของเบราว์เซอร์',
    audioTooLarge: 'ไฟล์บันทึกเสียงใหญ่เกินไป โปรดบันทึกคลิปที่สั้นลง',
    emptyTranscript: 'ไม่พบเสียงพูด ลองบันทึกอีกครั้ง',
    tokenUsage: 'การใช้โทเค็น',
    sessionUsage: 'เซสชันนี้',
    trackedTokens: 'โทเค็นที่ติดตาม',
    inputTokens: 'นำเข้า',
    outputTokens: 'ส่งออก',
    totalTokens: 'รวม',
    requests: 'คำขอ',
    noUsage: 'การใช้โทเค็นจะแสดงหลังจากส่งคำขอแรก',
    usageUnavailable: 'ไม่มีรายละเอียดโทเค็น',
    usageBarHint: 'แถบแสดงสัดส่วนโทเค็นของแต่ละโมเดล ไม่ใช่โควตา',
    ttsError: 'สร้างเสียงพูดไม่สำเร็จ',
    ttsQuotaError: 'Google ปฏิเสธคำขอเสียงพูดเนื่องจากบัญชีไม่มีโควตาฟรีสำหรับโมเดลนี้ เปิดการเรียกเก็บเงินหรือเลือกโมเดลที่บัญชีของคุณมีโควตา',
    autoplayBlocked: 'เสียงพร้อมแล้ว หากเบราว์เซอร์ไม่เล่นอัตโนมัติ ให้กดเล่นในเครื่องเล่นเสียง',
    quotaDocs: 'ขีดจำกัดและการเรียกเก็บเงิน',
    quotaDashboard: 'แดชบอร์ดการใช้งาน',
    footer: 'ทุกบทสนทนาเริ่มต้นด้วยคำแปลที่เข้าใจความหมาย',
  },
} satisfies Record<UiLanguage, Record<string, string>>

const uiLanguage = ref<UiLanguage>((localStorage.getItem('lingua-ui-language') as UiLanguage) || 'en')
const darkMode = ref(localStorage.getItem('lingua-theme') === 'dark')
const sourceLanguage = ref('en')
const targetLanguage = ref('th')
const sourceText = ref('')
const translatedText = ref('')
const audioUrl = ref('')
const audioPlayer = ref<HTMLAudioElement | null>(null)
const translationNeedsSpeech = ref(false)
const apiKey = ref(sessionStorage.getItem('lingua-gemini-api-key') || '')
const apiKeyDraft = ref(apiKey.value)
const configuredModels = ref(loadModelConfiguration())
const modelDraft = ref({ ...configuredModels.value })
const isTranslating = ref(false)
const isRecording = ref(false)
const isTranscribing = ref(false)
const isGeneratingAudio = ref(false)
const keySaved = ref(false)
const modelsSaved = ref(false)
const copied = ref(false)
const errorMessage = ref('')
const isTtsQuotaExceeded = ref(false)
const playbackNeedsUserAction = ref(false)
const showSettings = ref(false)
const showModelSettings = ref(false)
const modelSettingsError = ref('')
const modelUsage = ref(loadModelUsage())
let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let recordingAudioContext: AudioContext | null = null
let silenceDetectionTimer: ReturnType<typeof setInterval> | undefined
let discardRecording = false
let keySavedTimer: ReturnType<typeof setTimeout> | undefined
let modelsSavedTimer: ReturnType<typeof setTimeout> | undefined
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const t = computed(() => copy[uiLanguage.value])
const sourceLanguageOption = computed(() => languages.find((language) => language.code === sourceLanguage.value) ?? languages[0]!)
const targetLanguageOption = computed(() => languages.find((language) => language.code === targetLanguage.value) ?? languages[1]!)
const uiLanguageName = computed(() => (uiLanguage.value === 'en' ? 'ไทย' : 'EN'))
const usageRows = computed<ModelUsageRow[]>(() => {
  const knownModels = modelDefinitions.map((definition) => ({
    model: configuredModels.value[definition.key],
    label: definition.label,
    usage: modelUsage.value.find((usage) => usage.model === configuredModels.value[definition.key]),
  }))
  const configuredIds = modelDefinitions.map((definition) => configuredModels.value[definition.key])
  const otherModels = modelUsage.value
    .filter((usage) => !configuredIds.includes(usage.model))
    .map((usage) => ({ model: usage.model, label: usage.model, usage }))
  const rows = [...knownModels, ...otherModels]
  const totalTokens = modelUsage.value.reduce((sum, usage) => sum + usage.inputTokens + usage.outputTokens, 0)

  return rows.map(({ model, label, usage }) => ({
    model,
    label,
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    requests: usage?.requests ?? 0,
    share: totalTokens > 0 ? ((usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)) / totalTokens * 100 : 0,
  }))
})
const totalInputTokens = computed(() => modelUsage.value.reduce((sum, usage) => sum + usage.inputTokens, 0))
const totalOutputTokens = computed(() => modelUsage.value.reduce((sum, usage) => sum + usage.outputTokens, 0))
const totalTokens = computed(() => totalInputTokens.value + totalOutputTokens.value)
const totalRequests = computed(() => modelUsage.value.reduce((sum, usage) => sum + usage.requests, 0))

function formatTokens(count: number): string {
  return new Intl.NumberFormat(uiLanguage.value === 'th' ? 'th-TH' : 'en-US').format(count)
}

function loadModelConfiguration(): ModelConfiguration {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem('lingua-gemini-models') || 'null')
    if (typeof stored !== 'object' || stored === null) return { ...defaultModels }
    const record = stored as Record<string, unknown>
    return {
      translation: typeof record.translation === 'string' && record.translation.trim()
        ? record.translation
        : defaultModels.translation,
      transcription: typeof record.transcription === 'string' && record.transcription.trim()
        ? record.transcription
        : defaultModels.transcription,
      textToSpeech: typeof record.textToSpeech === 'string' && record.textToSpeech.trim()
        ? record.textToSpeech
        : defaultModels.textToSpeech,
    }
  } catch {
    return { ...defaultModels }
  }
}

function loadModelUsage(): ModelTokenUsage[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem('lingua-model-token-usage') || '[]')
    if (!Array.isArray(stored)) return []
    return stored.filter((entry): entry is ModelTokenUsage =>
      typeof entry === 'object' &&
      entry !== null &&
      'model' in entry &&
      typeof entry.model === 'string' &&
      'inputTokens' in entry &&
      typeof entry.inputTokens === 'number' &&
      'outputTokens' in entry &&
      typeof entry.outputTokens === 'number' &&
      'requests' in entry &&
      typeof entry.requests === 'number',
    )
  } catch {
    return []
  }
}

function readObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  }
  return undefined
}

function trackModelUsage(model: string, response: unknown) {
  const responseObject = readObject(response)
  const usageObject = readObject(responseObject?.usage) ?? readObject(responseObject?.usageMetadata)
  const inputTokens = usageObject
    ? readNumber(usageObject, 'total_input_tokens', 'totalInputTokens', 'promptTokenCount', 'inputTokenCount') ?? 0
    : 0
  const outputTokens = usageObject
    ? readNumber(usageObject, 'total_output_tokens', 'totalOutputTokens', 'candidatesTokenCount', 'outputTokenCount') ?? 0
    : 0
  const total = usageObject ? readNumber(usageObject, 'total_tokens', 'totalTokens', 'totalTokenCount') : undefined
  const normalizedInput = inputTokens === 0 && outputTokens === 0 && total !== undefined ? total : inputTokens
  const normalizedOutput = inputTokens === 0 && outputTokens === 0 && total !== undefined ? 0 : outputTokens
  const existing = modelUsage.value.find((usage) => usage.model === model)

  if (existing) {
    existing.inputTokens += normalizedInput
    existing.outputTokens += normalizedOutput
    existing.requests += 1
  } else {
    modelUsage.value.push({
      model,
      inputTokens: normalizedInput,
      outputTokens: normalizedOutput,
      requests: 1,
    })
  }
  sessionStorage.setItem('lingua-model-token-usage', JSON.stringify(modelUsage.value))
}

function collectText(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => collectText(item))
  const record = readObject(value)
  if (!record) return []

  const textParts: string[] = []
  for (const key of ['output_text', 'outputText', 'text']) {
    if (typeof record[key] === 'string' && record[key].trim()) textParts.push(record[key].trim())
  }
  for (const key of ['candidates', 'content', 'parts', 'outputs', 'steps', 'delta']) {
    if (record[key] !== undefined) textParts.push(...collectText(record[key]))
  }
  return textParts
}

function responseText(response: unknown): string {
  return [...new Set(collectText(response))].join('\n').trim()
}

function findAudioPart(value: unknown): { data: string; mimeType: string } | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const audio = findAudioPart(item)
      if (audio) return audio
    }
    return null
  }
  const record = readObject(value)
  if (!record) return null

  const directAudio = readObject(record.output_audio) ?? readObject(record.outputAudio)
  if (typeof directAudio?.data === 'string') {
    return {
      data: directAudio.data,
      mimeType: typeof directAudio.mime_type === 'string'
        ? directAudio.mime_type
        : typeof directAudio.mimeType === 'string'
          ? directAudio.mimeType
          : 'audio/wav',
    }
  }
  const inlineAudio = readObject(record.inline_data) ?? readObject(record.inlineData)
  if (typeof inlineAudio?.data === 'string') {
    return {
      data: inlineAudio.data,
      mimeType: typeof inlineAudio.mime_type === 'string'
        ? inlineAudio.mime_type
        : typeof inlineAudio.mimeType === 'string'
          ? inlineAudio.mimeType
          : 'audio/wav',
    }
  }
  if (record.type === 'audio' && typeof record.data === 'string') {
    return {
      data: record.data,
      mimeType: typeof record.mime_type === 'string'
        ? record.mime_type
        : typeof record.mimeType === 'string'
          ? record.mimeType
          : 'audio/wav',
    }
  }
  for (const key of ['candidates', 'outputs', 'steps', 'content', 'parts']) {
    if (record[key] !== undefined) {
      const audio = findAudioPart(record[key])
      if (audio) return audio
    }
  }
  return null
}

function pcmAsWav(pcm: Uint8Array, sampleRate: number): Blob {
  const sampleCount = Math.floor(pcm.byteLength / 2)
  const wav = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(wav)
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + sampleCount * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, sampleCount * 2, true)
  new Uint8Array(wav, 44).set(pcm.subarray(0, sampleCount * 2))
  return new Blob([wav], { type: 'audio/wav' })
}

function apiError(response: Response, body: unknown): Error {
  const error = readObject(readObject(body)?.error)
  return new Error(typeof error?.message === 'string' ? error.message : `Google AI Studio returned ${response.status}`)
}

async function createInteraction(model: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey.value,
    },
    body: JSON.stringify({ model, store: false, ...body }),
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) throw apiError(response, result)
  return result
}

function audioBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the recorded audio.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read the recorded audio.'))
        return
      }
      const separator = reader.result.indexOf(',')
      if (separator < 0) {
        reject(new Error('Could not encode the recorded audio.'))
        return
      }
      resolve(reader.result.slice(separator + 1))
    }
    reader.readAsDataURL(blob)
  })
}

async function normalizeAudioForTranscription(blob: Blob): Promise<Blob> {
  const context = new AudioContext()
  let audio: AudioBuffer
  try {
    audio = await context.decodeAudioData(await blob.arrayBuffer())
  } finally {
    await context.close()
  }

  const sampleRate = 24000
  const sampleCount = Math.ceil(audio.length * sampleRate / audio.sampleRate)
  const wav = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(wav)
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + sampleCount * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, sampleCount * 2, true)

  const channels = Array.from({ length: audio.numberOfChannels }, (_, index) => audio.getChannelData(index))
  for (let index = 0; index < sampleCount; index += 1) {
    const sourcePosition = index * audio.sampleRate / sampleRate
    const leftIndex = Math.floor(sourcePosition)
    const rightIndex = Math.min(leftIndex + 1, audio.length - 1)
    const fraction = sourcePosition - leftIndex
    const sample = channels.reduce((sum, channel) => {
      const left = channel[leftIndex] ?? 0
      const right = channel[rightIndex] ?? left
      return sum + left + (right - left) * fraction
    }, 0) / channels.length
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
  }
  return new Blob([wav], { type: 'audio/wav' })
}

function revokeAudioUrl() {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
}

watch(uiLanguage, (value) => {
  localStorage.setItem('lingua-ui-language', value)
  document.documentElement.lang = value
  document.title = value === 'en' ? 'langTTY — Translator' : 'langTTY — แอปแปลภาษา'
}, { immediate: true })
watch(darkMode, (value) => {
  localStorage.setItem('lingua-theme', value ? 'dark' : 'light')
  document.documentElement.dataset.theme = value ? 'dark' : 'light'
}, { immediate: true })
watch(sourceLanguage, () => {
  errorMessage.value = ''
})

function toggleUiLanguage() {
  uiLanguage.value = uiLanguage.value === 'en' ? 'th' : 'en'
}

function switchLanguages() {
  if (isTranslating.value || isGeneratingAudio.value) return
  const previousTranslation = translatedText.value
  const previousSource = sourceLanguage.value
  sourceLanguage.value = targetLanguage.value
  targetLanguage.value = previousSource
  sourceText.value = previousTranslation
  translatedText.value = ''
  translationNeedsSpeech.value = false
  playbackNeedsUserAction.value = false
  errorMessage.value = ''
  revokeAudioUrl()
}

function handleTranslationEdit() {
  translationNeedsSpeech.value = true
  playbackNeedsUserAction.value = false
  revokeAudioUrl()
}

function saveApiKey() {
  const key = apiKeyDraft.value.trim()
  if (!key) {
    errorMessage.value = t.value.invalidKey
    return
  }
  apiKey.value = key
  sessionStorage.setItem('lingua-gemini-api-key', key)
  errorMessage.value = ''
  keySaved.value = true
  if (keySavedTimer) clearTimeout(keySavedTimer)
  keySavedTimer = setTimeout(() => {
    keySaved.value = false
  }, 2500)
}

function removeApiKey() {
  apiKey.value = ''
  apiKeyDraft.value = ''
  sessionStorage.removeItem('lingua-gemini-api-key')
  keySaved.value = false
}

function saveModelConfiguration() {
  const models: ModelConfiguration = {
    translation: modelDraft.value.translation.trim(),
    transcription: modelDraft.value.transcription.trim(),
    textToSpeech: modelDraft.value.textToSpeech.trim(),
  }
  if (Object.values(models).some((model) => !model)) {
    modelSettingsError.value = t.value.invalidModels
    return
  }

  configuredModels.value = models
  modelDraft.value = { ...models }
  sessionStorage.setItem('lingua-gemini-models', JSON.stringify(models))
  modelSettingsError.value = ''
  modelsSaved.value = true
  if (modelsSavedTimer) clearTimeout(modelsSavedTimer)
  modelsSavedTimer = setTimeout(() => {
    modelsSaved.value = false
  }, 2500)
}

function restoreDefaultModels() {
  modelDraft.value = { ...defaultModels }
  modelSettingsError.value = ''
  modelsSaved.value = false
}

function stopSilenceDetection() {
  if (silenceDetectionTimer) {
    clearInterval(silenceDetectionTimer)
    silenceDetectionTimer = undefined
  }
  if (recordingAudioContext) {
    const audioContext = recordingAudioContext
    recordingAudioContext = null
    if (audioContext.state !== 'closed') void audioContext.close()
  }
}

function monitorRecordingSilence(stream: MediaStream, recorder: MediaRecorder) {
  const audioContext = recordingAudioContext
  if (!audioContext) throw new Error(t.value.silenceDetectionUnsupported)

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  audioContext.createMediaStreamSource(stream).connect(analyser)
  const samples = new Float32Array(analyser.fftSize)
  let speechDetected = false
  let silenceStartedAt: number | undefined

  silenceDetectionTimer = setInterval(() => {
    if (recorder.state !== 'recording') {
      stopSilenceDetection()
      return
    }

    analyser.getFloatTimeDomainData(samples)
    const meanSquare = samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length
    const now = Date.now()
    if (Math.sqrt(meanSquare) >= 0.018) {
      speechDetected = true
      silenceStartedAt = undefined
      return
    }
    if (!speechDetected) return

    silenceStartedAt ??= now
    if (now - silenceStartedAt >= 1500) {
      isRecording.value = false
      stopSilenceDetection()
      recorder.stop()
    }
  }, 100)
}

async function translateText() {
  if (isTranslating.value || isGeneratingAudio.value) return
  const text = sourceText.value.trim()
  if (!apiKey.value) {
    errorMessage.value = t.value.needKey
    showSettings.value = true
    return
  }
  if (!text) {
    errorMessage.value = t.value.emptyInput
    return
  }

  isTranslating.value = true
  errorMessage.value = ''
  isTtsQuotaExceeded.value = false
  playbackNeedsUserAction.value = false
  translationNeedsSpeech.value = false
  translatedText.value = ''
  revokeAudioUrl()
  let shouldGenerateSpeech = false

  try {
    const model = configuredModels.value.translation
    const result = await createInteraction(model, {
      input: [
        {
          type: 'text',
          text: `Translate the following text from ${sourceLanguageOption.value.name} to ${targetLanguageOption.value.name}. Return only the translation, preserving its meaning, tone, and formatting. Do not explain or add quotation marks.`,
        },
        { type: 'text', text },
      ],
    })
    trackModelUsage(model, result)
    const translated = responseText(result)

    if (!translated) throw new Error('The translation service returned an empty response.')
    translatedText.value = translated
    shouldGenerateSpeech = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t.value.translationError
  } finally {
    isTranslating.value = false
  }
  if (shouldGenerateSpeech) await generateSpeech(true)
}

async function transcribeAudio(blob: Blob) {
  if (!apiKey.value) {
    errorMessage.value = t.value.needKey
    showSettings.value = true
    return
  }
  if (blob.size > 14 * 1024 * 1024) {
    errorMessage.value = t.value.audioTooLarge
    return
  }

  isTranscribing.value = true
  errorMessage.value = ''
  isTtsQuotaExceeded.value = false
  try {
    const normalizedAudio = await normalizeAudioForTranscription(blob)
    if (normalizedAudio.size > 14 * 1024 * 1024) {
      errorMessage.value = t.value.audioTooLarge
      return
    }
    const model = configuredModels.value.transcription
    const result = await createInteraction(model, {
      input: [{
        type: 'audio',
        data: await audioBase64(normalizedAudio),
        mime_type: 'audio/wav',
      }],
      generation_config: {
        transcription_config: { language_codes: [sourceLanguageOption.value.speechCode] },
      },
    })
    trackModelUsage(model, result)
    const transcript = responseText(result)
    if (!transcript) {
      errorMessage.value = t.value.emptyTranscript
      return
    }
    sourceText.value = sourceText.value.trim()
      ? `${sourceText.value.trim()} ${transcript}`
      : transcript
    translatedText.value = ''
    translationNeedsSpeech.value = false
    revokeAudioUrl()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t.value.translationError
  } finally {
    isTranscribing.value = false
  }
}

async function toggleRecording() {
  if (isRecording.value) {
    stopSilenceDetection()
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
    isRecording.value = false
    return
  }
  if (!apiKey.value) {
    errorMessage.value = t.value.needKey
    showSettings.value = true
    return
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    errorMessage.value = t.value.recordingUnsupported
    return
  }
  if (typeof window.AudioContext === 'undefined') {
    errorMessage.value = t.value.silenceDetectionUnsupported
    return
  }

  try {
    recordingAudioContext = new AudioContext()
    await recordingAudioContext.resume()
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStream = stream
    const preferredType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      .find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
    const recorder = preferredType
      ? new MediaRecorder(stream, { mimeType: preferredType })
      : new MediaRecorder(stream)
    const chunks: Blob[] = []
    mediaRecorder = recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onerror = () => {
      stopSilenceDetection()
      stream.getTracks().forEach((track) => track.stop())
      mediaStream = null
      mediaRecorder = null
      isRecording.value = false
      errorMessage.value = t.value.microphoneError
    }
    recorder.onstop = () => {
      stopSilenceDetection()
      stream.getTracks().forEach((track) => track.stop())
      mediaStream = null
      mediaRecorder = null
      isRecording.value = false
      const shouldTranscribe = !discardRecording
      discardRecording = false
      if (shouldTranscribe && chunks.length > 0) {
        void transcribeAudio(new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' }))
      }
    }
    errorMessage.value = ''
    recorder.start()
    isRecording.value = true
    monitorRecordingSilence(stream, recorder)
  } catch (error) {
    stopSilenceDetection()
    if (mediaRecorder?.state === 'recording') {
      discardRecording = true
      mediaRecorder.stop()
    }
    mediaStream?.getTracks().forEach((track) => track.stop())
    mediaStream = null
    mediaRecorder = null
    isRecording.value = false
    errorMessage.value = error instanceof Error ? `${t.value.microphoneError} (${error.message})` : t.value.microphoneError
  }
}

function cancelRecording() {
  const recorder = mediaRecorder
  if (!recorder || recorder.state !== 'recording') return

  discardRecording = true
  stopSilenceDetection()
  recorder.stop()
  isRecording.value = false
  errorMessage.value = ''
}

async function generateSpeech(autoPlay = false) {
  if (!translatedText.value || isGeneratingAudio.value) return
  if (!apiKey.value) {
    errorMessage.value = t.value.needKey
    showSettings.value = true
    return
  }

  isGeneratingAudio.value = true
  errorMessage.value = ''
  isTtsQuotaExceeded.value = false
  playbackNeedsUserAction.value = false
  revokeAudioUrl()
  try {
    const model = configuredModels.value.textToSpeech
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.value,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: translatedText.value }],
          }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        }),
      },
    )
    const result: unknown = await response.json().catch(() => null)
    if (!response.ok) throw apiError(response, result)
    trackModelUsage(model, result)
    const audio = findAudioPart(result)
    if (!audio) throw new Error('The speech service returned no audio data.')
    const base64 = audio.data.replace(/^data:[^,]*;base64,/, '')
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))
    const mimeType = audio.mimeType.toLowerCase()
    const pcmRate = Number(mimeType.match(/rate=(\d+)/i)?.[1]) || 24000
    const audioBlob = mimeType.includes('pcm') || mimeType.includes('l16')
      ? pcmAsWav(bytes, pcmRate)
      : new Blob([bytes], { type: audio.mimeType })
    audioUrl.value = URL.createObjectURL(audioBlob)
    translationNeedsSpeech.value = false
    if (autoPlay) {
      await nextTick()
      try {
        await audioPlayer.value?.play()
      } catch {
        playbackNeedsUserAction.value = true
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : t.value.ttsError
    isTtsQuotaExceeded.value = /quota exceeded|free tier|rate limit|429/i.test(message)
    errorMessage.value = isTtsQuotaExceeded.value ? t.value.ttsQuotaError : message
  } finally {
    isGeneratingAudio.value = false
  }
}

async function copyTranslation() {
  if (!translatedText.value) return
  try {
    await navigator.clipboard.writeText(translatedText.value)
    copied.value = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    errorMessage.value = 'Clipboard access was denied by the browser.'
  }
}

async function pasteText() {
  try {
    sourceText.value = await navigator.clipboard.readText()
    errorMessage.value = ''
  } catch {
    errorMessage.value = 'Clipboard access was denied by the browser.'
  }
}

function clearText() {
  if (mediaRecorder?.state === 'recording') {
    discardRecording = true
    stopSilenceDetection()
    mediaRecorder.stop()
    isRecording.value = false
  }
  sourceText.value = ''
  translatedText.value = ''
  translationNeedsSpeech.value = false
  errorMessage.value = ''
  playbackNeedsUserAction.value = false
  revokeAudioUrl()
}

onBeforeUnmount(() => {
  discardRecording = true
  stopSilenceDetection()
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.onstop = null
    mediaRecorder.ondataavailable = null
    mediaRecorder.stop()
  }
  mediaStream?.getTracks().forEach((track) => track.stop())
  revokeAudioUrl()
  if (keySavedTimer) clearTimeout(keySavedTimer)
  if (modelsSavedTimer) clearTimeout(modelsSavedTimer)
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<template>
  <div class="app-shell min-h-screen transition-colors duration-300">
    <header class="app-header">
      <a class="brand" href="#" aria-label="langTTY home" @click.prevent="clearText">
        <span class="brand-mark"><Globe2 :size="21" :stroke-width="2.1" /></span>
        <span class="brand-name">langTTY<span>.</span></span>
      </a>
      <p class="header-tagline hidden sm:block">{{ t.tagline }}</p>
      <div class="header-actions">
        <span class="powered-badge hidden md:inline-flex"><Sparkles :size="13" /> {{ t.poweredBy }}</span>
        <button class="icon-button language-toggle" :aria-label="t.uiLanguage" :title="t.uiLanguage" @click="toggleUiLanguage">
          <Languages :size="17" /><span>{{ uiLanguageName }}</span>
        </button>
        <button class="icon-button" :aria-label="darkMode ? t.themeLight : t.themeDark" :title="darkMode ? t.themeLight : t.themeDark" @click="darkMode = !darkMode">
          <Sun v-if="darkMode" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <button class="icon-button customize-button" :aria-label="t.customize" :title="t.customize" @click="showModelSettings = !showModelSettings">
          <SlidersHorizontal :size="17" /><span class="customize-label">{{ t.customize }}</span>
        </button>
        <button class="icon-button settings-button" :aria-label="t.apiTitle" :title="t.apiTitle" @click="showSettings = !showSettings">
          <Settings2 :size="18" />
          <span v-if="apiKey" class="key-indicator" />
        </button>
      </div>
    </header>

    <main class="main-content">
      <section class="intro">
        <span class="eyebrow"><span class="eyebrow-dot" />{{ t.badge }}</span>
        <h1>{{ t.headline }}</h1>
        <p>{{ t.subtitle }}</p>
      </section>

      <section v-if="showSettings" class="settings-card" aria-label="API key settings">
        <div class="settings-icon"><ShieldCheck :size="19" /></div>
        <div class="settings-content">
          <div class="settings-heading">
            <div>
              <h2>{{ t.apiTitle }}</h2>
              <p>{{ t.apiHint }}</p>
            </div>
            <button class="close-settings" :aria-label="t.clear" @click="showSettings = false"><X :size="17" /></button>
          </div>
          <form class="key-form" @submit.prevent="saveApiKey">
            <input
              v-model="apiKeyDraft"
              type="password"
              autocomplete="off"
              spellcheck="false"
              class="key-input"
              :placeholder="t.apiPlaceholder"
              aria-label="Google AI Studio API key"
            />
            <button type="submit" class="save-key-button">{{ keySaved ? t.keySaved : t.saveKey }}</button>
            <button v-if="apiKey" type="button" class="remove-key-button" @click="removeApiKey">{{ t.removeKey }}</button>
          </form>
          <p v-if="keySaved" class="key-saved-note"><Check :size="13" /> {{ t.keySaved }}</p>
        </div>
      </section>

      <section v-if="showModelSettings" class="settings-card model-settings-card" aria-label="Model customization">
        <div class="settings-icon"><Settings2 :size="19" /></div>
        <div class="settings-content">
          <div class="settings-heading">
            <div>
              <h2>{{ t.modelSettings }}</h2>
              <p>{{ t.modelHint }}</p>
            </div>
            <button class="close-settings" :aria-label="t.clear" @click="showModelSettings = false"><X :size="17" /></button>
          </div>
          <form class="model-form" @submit.prevent="saveModelConfiguration">
            <label class="model-field">
              <span>{{ t.translationModel }}</span>
              <input v-model="modelDraft.translation" required spellcheck="false" :placeholder="t.modelPlaceholder" />
            </label>
            <label class="model-field">
              <span>{{ t.transcriptionModel }}</span>
              <input v-model="modelDraft.transcription" required spellcheck="false" :placeholder="t.modelPlaceholder" />
            </label>
            <label class="model-field">
              <span>{{ t.textToSpeechModel }}</span>
              <input v-model="modelDraft.textToSpeech" required spellcheck="false" :placeholder="t.modelPlaceholder" />
            </label>
            <div class="model-form-actions">
              <button type="button" class="remove-key-button" @click="restoreDefaultModels">{{ t.resetModels }}</button>
              <button type="submit" class="save-key-button">{{ modelsSaved ? t.modelsSaved : t.saveModels }}</button>
            </div>
          </form>
          <p v-if="modelSettingsError" class="model-settings-error" role="alert">{{ modelSettingsError }}</p>
          <p v-if="modelsSaved" class="key-saved-note"><Check :size="13" /> {{ t.modelsSaved }}</p>
        </div>
      </section>

      <section class="translator-card" aria-label="Translation tool">
        <div class="language-bar">
          <label class="language-picker">
            <span class="language-caption">{{ t.from }}</span>
            <span class="select-wrap">
              <select v-model="sourceLanguage" :aria-label="t.from">
                <option v-for="language in languages" :key="language.code" :value="language.code">{{ language.nativeName }}</option>
              </select>
              <ChevronDown :size="15" />
            </span>
          </label>
          <button class="swap-button" :disabled="isTranslating || isGeneratingAudio" :aria-label="t.switchLanguages" :title="t.switchLanguages" @click="switchLanguages"><ArrowDownUp :size="16" /></button>
          <label class="language-picker">
            <span class="language-caption">{{ t.to }}</span>
            <span class="select-wrap">
              <select v-model="targetLanguage" :aria-label="t.to">
                <option v-for="language in languages" :key="language.code" :value="language.code">{{ language.nativeName }}</option>
              </select>
              <ChevronDown :size="15" />
            </span>
          </label>
        </div>

        <div class="translation-panels">
          <div class="text-panel source-panel">
            <div class="panel-topline">
              <span class="panel-language">{{ sourceLanguageOption.name }}</span>
              <div class="panel-tools">
                <button class="text-tool" :title="t.paste" @click="pasteText"><Clipboard :size="14" /><span>{{ t.paste }}</span></button>
                <button v-if="sourceText" class="text-tool" :title="t.clear" @click="clearText"><X :size="14" /><span>{{ t.clear }}</span></button>
              </div>
            </div>
            <textarea
              v-model="sourceText"
              maxlength="5000"
              :placeholder="t.placeholder"
              :aria-label="t.source"
              @keydown.ctrl.enter="translateText"
              @keydown.meta.enter="translateText"
            />
            <div class="panel-footer">
              <div class="speech-controls">
                <button class="mic-button" :class="{ 'mic-active': isRecording }" :disabled="isTranscribing" :aria-label="isRecording ? t.stopRecording : t.speechInput" @click="toggleRecording">
                  <span class="mic-icon">
                    <LoaderCircle v-if="isTranscribing" :size="15" class="spin" />
                    <Mic v-else :size="16" />
                  </span>
                  <span>{{ isTranscribing ? t.transcribing : isRecording ? t.stopRecording : t.speechInput }}</span>
                  <span v-if="isRecording" class="recording-dot" />
                </button>
                <button v-if="isRecording" type="button" class="cancel-recording-button" :aria-label="t.cancelRecording" :title="t.cancelRecording" @click="cancelRecording">
                  <X :size="14" /><span>{{ t.cancel }}</span>
                </button>
              </div>
              <span class="character-count">{{ sourceText.length }} / 5000</span>
            </div>
          </div>

          <div class="text-panel result-panel" aria-live="polite">
            <div class="panel-topline">
              <span class="panel-language">{{ targetLanguageOption.name }}</span>
              <div class="panel-tools">
                <button v-if="translatedText" class="text-tool" :title="copied ? t.copied : t.copy" @click="copyTranslation">
                  <Check v-if="copied" :size="14" /><Clipboard v-else :size="14" />
                  <span>{{ copied ? t.copied : t.copy }}</span>
                </button>
              </div>
            </div>
            <div class="translation-output">
              <div v-if="isTranslating" class="loading-state"><LoaderCircle :size="19" class="spin" /><span>{{ t.translating }}</span></div>
              <textarea
                v-else-if="translatedText || translationNeedsSpeech"
                v-model="translatedText"
                class="translated-input"
                :aria-label="t.translation"
                :placeholder="t.resultPlaceholder"
                :disabled="isGeneratingAudio"
                @input="handleTranslationEdit"
              />
              <p v-else class="result-placeholder">{{ t.resultPlaceholder }}</p>
              <audio v-if="audioUrl" ref="audioPlayer" class="tts-audio" :src="audioUrl" controls />
              <p v-if="playbackNeedsUserAction" class="playback-hint">{{ t.autoplayBlocked }}</p>
            </div>
            <div class="panel-footer result-footer">
              <button
                v-if="translationNeedsSpeech && translatedText"
                class="mic-button"
                :disabled="isGeneratingAudio"
                :aria-label="t.listen"
                @click="generateSpeech(true)"
              >
                <span class="speaker-icon">
                  <LoaderCircle v-if="isGeneratingAudio" :size="15" class="spin" />
                  <Volume2 v-else :size="16" />
                </span>
                <span>{{ isGeneratingAudio ? t.generatingAudio : t.listen }}</span>
              </button>
              <span class="character-count">{{ translatedText.length ? `${translatedText.length} chars` : '' }}</span>
            </div>
          </div>
        </div>

        <div class="translate-row">
          <span class="privacy-note"><ShieldCheck :size="14" />{{ t.privacyNote }}</span>
          <button class="translate-button" :disabled="isTranslating || isGeneratingAudio" @click="translateText">
            <LoaderCircle v-if="isTranslating" :size="16" class="spin" />
            <Sparkles v-else :size="16" />
            {{ isTranslating ? t.translating : t.translate }}
          </button>
        </div>
      </section>

      <section class="usage-card" aria-label="Gemini model token usage">
        <div class="usage-heading">
          <div class="usage-title-group">
            <span class="usage-icon"><Sparkles :size="16" /></span>
            <div>
              <h2>{{ t.tokenUsage }}</h2>
              <p>{{ t.sessionUsage }} · {{ totalRequests }} {{ t.requests }}</p>
            </div>
          </div>
          <div class="usage-total">
            <strong>{{ formatTokens(totalTokens) }}</strong>
            <span>{{ t.trackedTokens }}</span>
          </div>
        </div>
        <div class="usage-summary">
          <span><i class="usage-legend input-legend" />{{ t.inputTokens }} <strong>{{ formatTokens(totalInputTokens) }}</strong></span>
          <span><i class="usage-legend output-legend" />{{ t.outputTokens }} <strong>{{ formatTokens(totalOutputTokens) }}</strong></span>
        </div>
        <div class="usage-model-list">
          <div v-for="row in usageRows" :key="row.model" class="usage-model">
            <div class="usage-model-heading">
              <span class="usage-model-name">{{ row.label }}</span>
              <span class="usage-model-id">{{ row.model }}</span>
              <span class="usage-model-total">{{ formatTokens(row.inputTokens + row.outputTokens) }}</span>
            </div>
            <div class="usage-track" role="progressbar" :aria-label="`${row.model} token usage share`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(row.share)">
              <span class="usage-fill" :style="{ width: `${row.share}%` }" />
            </div>
            <div class="usage-model-details">
              <span>{{ t.inputTokens }} {{ formatTokens(row.inputTokens) }}</span>
              <span>{{ t.outputTokens }} {{ formatTokens(row.outputTokens) }}</span>
              <span v-if="row.requests">{{ row.requests }} {{ t.requests }}</span>
              <span v-if="row.requests && row.inputTokens + row.outputTokens === 0">{{ t.usageUnavailable }}</span>
              <span v-else-if="!row.requests">{{ t.noUsage }}</span>
            </div>
          </div>
        </div>
        <p class="usage-footnote">{{ t.usageBarHint }}</p>
      </section>

      <p v-if="errorMessage" class="error-message" role="alert">
        {{ errorMessage }}
        <span v-if="isTtsQuotaExceeded" class="quota-links">
          <a href="https://aistudio.google.com/docs/rate-limits" target="_blank" rel="noopener noreferrer">{{ t.quotaDocs }}</a>
          <a href="https://ai.dev/rate-limit" target="_blank" rel="noopener noreferrer">{{ t.quotaDashboard }}</a>
        </span>
      </p>

      <section class="feature-row">
        <div class="feature-item"><span class="feature-icon feature-violet"><Mic :size="17" /></span><span>{{ t.speechInput }}</span></div>
        <span class="feature-divider" />
        <div class="feature-item"><span class="feature-icon feature-mint"><Headphones :size="17" /></span><span>{{ t.listen }}</span></div>
        <span class="feature-divider" />
        <div class="feature-item"><span class="feature-icon feature-amber"><ShieldCheck :size="17" /></span><span>{{ uiLanguage === 'en' ? 'Private by design' : 'ออกแบบโดยคำนึงถึงความเป็นส่วนตัว' }}</span></div>
      </section>
    </main>

    <footer class="app-footer">
      <span>{{ t.footer }}</span>
      <span class="footer-language"><Globe2 :size="13" /> English · ไทย</span>
    </footer>
  </div>
</template>
