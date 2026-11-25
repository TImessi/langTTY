<!-- src/App.vue -->
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
  Pause,
  Play,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Sun,
  Volume2,
  X,
} from '@lucide/vue'
import { useWebSpeechTts } from './composables/useWebSpeechTts'

type UiLanguage = 'en' | 'th'
type ProviderId = 'browser' | 'google' | 'openai' | 'groq' | 'openrouter'
type TaskRole = 'translation' | 'transcription' | 'textToSpeech'

interface Language {
  code: string
  name: string
  nameTh: string
  nativeName: string
  speechCode: string
}

interface ProviderDef {
  id: ProviderId
  name: string
  capabilities: TaskRole[]
  defaults: Record<TaskRole, string>
}

interface TaskConfig {
  provider: ProviderId
  model: string
}

interface ModelTokenUsage {
  model: string
  provider: ProviderId
  inputTokens: number
  outputTokens: number
  requests: number
}

interface ModelUsageRow extends ModelTokenUsage {
  label: string
  share: number
}

const languages: Language[] = [
  { code: 'en', name: 'English', nameTh: 'อังกฤษ', nativeName: 'English', speechCode: 'en-US' },
  { code: 'th', name: 'Thai', nameTh: 'ไทย', nativeName: 'ไทย', speechCode: 'th-TH' },
  { code: 'vi', name: 'Vietnamese', nameTh: 'เวียดนาม', nativeName: 'Tiếng Việt', speechCode: 'vi-VN' },
  { code: 'fil', name: 'Filipino', nameTh: 'ฟิลิปปินส์', nativeName: 'Filipino', speechCode: 'fil-PH' },
  { code: 'id', name: 'Indonesian', nameTh: 'อินโดนีเซีย', nativeName: 'Bahasa Indonesia', speechCode: 'id-ID' },
  { code: 'es', name: 'Spanish', nameTh: 'สเปน', nativeName: 'Español', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', nameTh: 'ฝรั่งเศส', nativeName: 'Français', speechCode: 'fr-FR' },
  { code: 'ja', name: 'Japanese', nameTh: 'ญี่ปุ่น', nativeName: '日本語', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nameTh: 'เกาหลี', nativeName: '한국어', speechCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese (Simplified)', nameTh: 'จีน (ตัวย่อ)', nativeName: '简体中文', speechCode: 'zh-CN' },
  { code: 'de', name: 'German', nameTh: 'เยอรมัน', nativeName: 'Deutsch', speechCode: 'de-DE' },
]

const providers: ProviderDef[] = [
  {
    id: 'browser',
    name: 'Browser Web Speech (Free / Offline)',
    capabilities: ['textToSpeech'],
    defaults: {
      translation: '',
      transcription: '',
      textToSpeech: 'web-speech-api',
    },
  },
  {
    id: 'google',
    name: 'Google Gemini',
    capabilities: ['translation', 'transcription', 'textToSpeech'],
    defaults: {
      translation: 'gemini-3.1-flash-lite',
      transcription: 'gemini-3.5-transcribe',
      textToSpeech: 'gemini-3.8-flash-lite-tts',
    },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    capabilities: ['translation', 'transcription', 'textToSpeech'],
    defaults: {
      translation: 'gpt-4.1-nano',
      transcription: 'gpt-4o-transcribe',
      textToSpeech: 'tts-1',
    },
  },
  {
    id: 'groq',
    name: 'Groq',
    capabilities: ['translation', 'transcription', 'textToSpeech'],
    defaults: {
      translation: 'llama-3.3-70b-versatile',
      transcription: 'whisper-large-v3',
      textToSpeech: 'playai-tts',
    },
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    capabilities: ['translation', 'transcription', 'textToSpeech'],
    defaults: {
      translation: 'google/gemini-2.5-flash',
      transcription: 'google/gemini-2.5-flash',
      textToSpeech: 'heygen/heygen-voice-1-turbo:free',
    },
  },
]

const apiKeyProviders = providers.filter((p) => p.id !== 'browser')

const taskLabels: Record<TaskRole, { en: string; th: string }> = {
  translation: { en: 'Translation', th: 'แปลภาษา' },
  transcription: { en: 'Speech to text', th: 'แปลงเสียงเป็นข้อความ' },
  textToSpeech: { en: 'Text to speech', th: 'แปลงข้อความเป็นเสียง' },
}

const defaultTasks: Record<TaskRole, TaskConfig> = {
  translation: { provider: 'google', model: 'gemini-4-hydrogen' },
  transcription: { provider: 'google', model: 'gemini-3.5-transcribe' },
  textToSpeech: { provider: 'browser', model: 'web-speech-api' },
}

function buildTranslationSystemPrompt(fromName: string, toName: string): string {
  return `Translate the following text from ${fromName} to ${toName}. Return only the translation, preserving its meaning, tone, and formatting. Do not explain or add quotation marks.`
}

function providerById(id: ProviderId): ProviderDef {
  return providers.find((p) => p.id === id) ?? providers[0]!
}

function providersForTask(role: TaskRole): ProviderDef[] {
  return providers.filter((p) => p.capabilities.includes(role))
}

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
    apiKeys: 'API keys',
    apiKeysHint: 'Add API keys for the providers you want to use. Keys stay in this tab.',
    apiPlaceholder: 'Paste API key',
    saveKey: 'Save',
    keySaved: 'Saved',
    removeKey: 'Remove',
    customize: 'Customize',
    modelSettings: 'Task configuration',
    modelHint: 'Choose a provider and model for each task. Browser TTS runs 100% locally without an API key.',
    providerLabel: 'Provider',
    modelLabel: 'Model',
    modelPlaceholder: 'Model ID',
    saveModels: 'Save config',
    resetModels: 'Restore defaults',
    modelsSaved: 'Config saved for this session',
    invalidModels: 'Enter a model ID for all three tasks.',
    needKey: 'Add at least one API key to get started.',
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
    privacyNote: 'Your words are sent directly to the selected API provider for processing.',
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
    usageBarHint: 'Bars show each model\'s share of tracked tokens, not a quota.',
    ttsError: 'Could not generate speech audio.',
    ttsQuotaError: 'The provider rejected TTS. Check your account quota or billing.',
    autoplayBlocked: 'Audio is ready. Press play in the audio player if your browser blocks autoplay.',
    quotaDocs: 'Rate limits and billing',
    quotaDashboard: 'Usage dashboard',
    footer: 'Thoughtful translations, one conversation at a time.',
    noProviderForTask: 'No provider with an API key supports this task.',
    unsupportedTask: 'The selected provider does not support this task.',
    voiceLabel: 'Voice',
    speedLabel: 'Speed',
    play: 'Play',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    statusIdle: 'Ready',
    statusSpeaking: 'Speaking',
    statusPaused: 'Paused',
    statusEnded: 'Finished',
    statusUnsupported: 'Not supported in this browser',
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
    apiKeys: 'คีย์ API',
    apiKeysHint: 'เพิ่ม API key ของผู้ให้บริการที่ต้องการใช้ คีย์จะอยู่ในแท็บนี้เท่านั้น',
    apiPlaceholder: 'วาง API key',
    saveKey: 'บันทึก',
    keySaved: 'บันทึกแล้ว',
    removeKey: 'ลบ',
    customize: 'ปรับแต่ง',
    modelSettings: 'ตั้งค่างาน',
    modelHint: 'เลือกผู้ให้บริการและโมเดลสำหรับแต่ละงาน (เสียงเบราว์เซอร์ทำงานในเครื่อง 100% ไม่ต้องใช้คีย์)',
    providerLabel: 'ผู้ให้บริการ',
    modelLabel: 'โมเดล',
    modelPlaceholder: 'Model ID',
    saveModels: 'บันทึกการตั้งค่า',
    resetModels: 'คืนค่าเริ่มต้น',
    modelsSaved: 'บันทึกการตั้งค่าไว้สำหรับเซสชันนี้แล้ว',
    invalidModels: 'กรุณาป้อน model ID ให้ครบทั้งสามงาน',
    needKey: 'เพิ่ม API key อย่างน้อยหนึ่งรายการเพื่อเริ่มใช้งาน',
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
    privacyNote: 'ข้อความของคุณจะส่งตรงไปยังผู้ให้บริการ API ที่เลือกเพื่อประมวลผล',
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
    ttsQuotaError: 'ผู้ให้บริการปฏิเสธคำขอเสียงพูด ตรวจสอบโควตาหรือการเรียกเก็บเงินของบัญชี',
    autoplayBlocked: 'เสียงพร้อมแล้ว หากเบราว์เซอร์ไม่เล่นอัตโนมัติ ให้กดเล่นในเครื่องเล่นเสียง',
    quotaDocs: 'ขีดจำกัดและการเรียกเก็บเงิน',
    quotaDashboard: 'แดชบอร์ดการใช้งาน',
    footer: 'ทุกบทสนทนาเริ่มต้นด้วยคำแปลที่เข้าใจความหมาย',
    noProviderForTask: 'ไม่มีผู้ให้บริการที่มี API key รองรับงานนี้',
    unsupportedTask: 'ผู้ให้บริการที่เลือกไม่รองรับงานนี้',
    voiceLabel: 'เสียงพูด',
    speedLabel: 'ความเร็ว',
    play: 'เล่น',
    pause: 'หยุดชั่วคราว',
    resume: 'เล่นต่อ',
    stop: 'หยุด',
    statusIdle: 'พร้อมอ่าน',
    statusSpeaking: 'กำลังอ่าน',
    statusPaused: 'หยุดชั่วคราว',
    statusEnded: 'อ่านจบแล้ว',
    statusUnsupported: 'เบราว์เซอร์ไม่รองรับ',
  },
} satisfies Record<UiLanguage, Record<string, string>>

const browserTts = useWebSpeechTts()

const uiLanguage = ref<UiLanguage>((localStorage.getItem('lingua-ui-language') as UiLanguage) || 'en')
const darkMode = ref(localStorage.getItem('lingua-theme') === 'dark')
const sourceLanguage = ref('en')
const targetLanguage = ref('th')
const sourceText = ref('')
const translatedText = ref('')
const audioUrl = ref('')
const audioPlayer = ref<HTMLAudioElement | null>(null)
const translationNeedsSpeech = ref(false)
const apiKeys = ref<Partial<Record<ProviderId, string>>>(loadApiKeys())
const apiKeyDrafts = ref<Partial<Record<ProviderId, string>>>({ ...apiKeys.value })
const taskConfigs = ref<Record<TaskRole, TaskConfig>>(loadTaskConfigs())
const taskDrafts = ref<Record<TaskRole, TaskConfig>>(cloneTasks(taskConfigs.value))
const isTranslating = ref(false)
const isRecording = ref(false)
const isTranscribing = ref(false)
const isGeneratingAudio = ref(false)
const keySavedFor = ref<ProviderId | null>(null)
const modelsSaved = ref(false)
const copied = ref(false)
const errorMessage = ref('')
const isTtsQuotaExceeded = ref(false)
const playbackNeedsUserAction = ref(false)
const showSettings = ref(false)
const showModelSettings = ref(false)
const modelSettingsError = ref('')
const modelUsage = ref<ModelTokenUsage[]>(loadModelUsage())

let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let recordingAudioContext: AudioContext | null = null
let silenceDetectionTimer: ReturnType<typeof setInterval> | undefined
let discardRecording = false
let isStoppingRecorder = false
let keySavedTimer: ReturnType<typeof setTimeout> | undefined
let modelsSavedTimer: ReturnType<typeof setTimeout> | undefined
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const t = computed(() => copy[uiLanguage.value])
const localizedName = (lang: Language) => (uiLanguage.value === 'th' ? lang.nameTh : lang.name)
const sourceLanguageOption = computed(() => languages.find((language) => language.code === sourceLanguage.value) ?? languages[0]!)
const targetLanguageOption = computed(() => languages.find((language) => language.code === targetLanguage.value) ?? languages[1]!)
const uiLanguageName = computed(() => (uiLanguage.value === 'en' ? 'ไทย' : 'EN'))
const hasAnyKey = computed(() => Object.values(apiKeys.value).some((k) => Boolean(k && k.trim())))
const isBrowserTtsSelected = computed(() => taskConfigs.value.textToSpeech.provider === 'browser')

const browserTtsStatusLabel = computed(() => {
  switch (browserTts.state.value) {
    case 'speaking':
      return browserTts.totalChunks.value > 1
        ? `${t.value.statusSpeaking} (${browserTts.currentChunkIndex.value}/${browserTts.totalChunks.value})`
        : t.value.statusSpeaking
    case 'paused':
      return t.value.statusPaused
    case 'ended':
      return t.value.statusEnded
    case 'unsupported':
      return t.value.statusUnsupported
    default:
      return t.value.statusIdle
  }
})

const taskRoles: TaskRole[] = ['translation', 'transcription', 'textToSpeech']

const usageRows = computed<ModelUsageRow[]>(() => {
  const knownModels = taskRoles.map((role) => ({
    model: taskConfigs.value[role].model,
    provider: taskConfigs.value[role].provider,
    label: taskLabels[role][uiLanguage.value],
    usage: modelUsage.value.find((u) => u.model === taskConfigs.value[role].model && u.provider === taskConfigs.value[role].provider),
  }))
  const configuredIds = taskRoles.map((role) => `${taskConfigs.value[role].provider}:${taskConfigs.value[role].model}`)
  const otherModels = modelUsage.value
    .filter((u) => !configuredIds.includes(`${u.provider}:${u.model}`))
    .map((u) => ({ model: u.model, provider: u.provider, label: `${providerById(u.provider).name} · ${u.model}`, usage: u }))
  const rows = [...knownModels, ...otherModels]
  const total = modelUsage.value.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0)

  return rows.map(({ model, provider, label, usage }) => ({
    model,
    provider,
    label,
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    requests: usage?.requests ?? 0,
    share: total > 0 ? (((usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0)) / total) * 100 : 0,
  }))
})

const totalInputTokens = computed(() => modelUsage.value.reduce((sum, u) => sum + u.inputTokens, 0))
const totalOutputTokens = computed(() => modelUsage.value.reduce((sum, u) => sum + u.outputTokens, 0))
const totalTokens = computed(() => totalInputTokens.value + totalOutputTokens.value)
const totalRequests = computed(() => modelUsage.value.reduce((sum, u) => sum + u.requests, 0))

function cloneTasks(tasks: Record<TaskRole, TaskConfig>): Record<TaskRole, TaskConfig> {
  return {
    translation: { ...tasks.translation },
    transcription: { ...tasks.transcription },
    textToSpeech: { ...tasks.textToSpeech },
  }
}

function formatTokens(count: number): string {
  return new Intl.NumberFormat(uiLanguage.value === 'th' ? 'th-TH' : 'en-US').format(count)
}

function loadApiKeys(): Partial<Record<ProviderId, string>> {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem('lingua-api-keys') || 'null')
    if (typeof stored !== 'object' || stored === null) {
      const oldKey = sessionStorage.getItem('lingua-gemini-api-key')
      if (oldKey?.trim()) return { google: oldKey.trim() }
      return {}
    }
    const result: Partial<Record<ProviderId, string>> = {}
    for (const p of apiKeyProviders) {
      const v = (stored as Record<string, unknown>)[p.id]
      if (typeof v === 'string' && v.trim()) result[p.id] = v.trim()
    }
    return result
  } catch {
    return {}
  }
}

function loadTaskConfigs(): Record<TaskRole, TaskConfig> {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem('lingua-task-configs') || 'null')
    if (typeof stored !== 'object' || stored === null) {
      const oldModels: unknown = JSON.parse(sessionStorage.getItem('lingua-gemini-models') || 'null')
      if (typeof oldModels === 'object' && oldModels !== null) {
        const m = oldModels as Record<string, unknown>
        return {
          translation: { provider: 'google', model: typeof m.translation === 'string' && m.translation.trim() ? m.translation.trim() : defaultTasks.translation.model },
          transcription: { provider: 'google', model: typeof m.transcription === 'string' && m.transcription.trim() ? m.transcription.trim() : defaultTasks.transcription.model },
          textToSpeech: { provider: 'browser', model: defaultTasks.textToSpeech.model },
        }
      }
      return cloneTasks(defaultTasks)
    }
    const s = stored as Record<string, unknown>
    const parse = (role: TaskRole): TaskConfig => {
      const entry = s[role]
      if (typeof entry === 'object' && entry !== null) {
        const e = entry as Record<string, unknown>
        const provider = typeof e.provider === 'string' && providers.some((p) => p.id === e.provider && p.capabilities.includes(role))
          ? (e.provider as ProviderId)
          : defaultTasks[role].provider
        const model = typeof e.model === 'string' && e.model.trim()
          ? e.model.trim()
          : providerById(provider).defaults[role] || defaultTasks[role].model
        return { provider, model }
      }
      return { ...defaultTasks[role] }
    }
    return { translation: parse('translation'), transcription: parse('transcription'), textToSpeech: parse('textToSpeech') }
  } catch {
    return cloneTasks(defaultTasks)
  }
}

function loadModelUsage(): ModelTokenUsage[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem('lingua-model-token-usage') || '[]')
    if (!Array.isArray(stored)) return []
    return stored
      .filter((entry): entry is ModelTokenUsage =>
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
      .map((entry) => ({
        ...entry,
        provider: typeof entry.provider === 'string' && providers.some((p) => p.id === entry.provider)
          ? (entry.provider as ProviderId)
          : 'google',
      }))
  } catch {
    return []
  }
}

function readObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  }
  return undefined
}

function getApiKey(providerId: ProviderId): string {
  if (providerId === 'browser') return 'client-side'
  return apiKeys.value[providerId]?.trim() || ''
}

function getTaskKey(role: TaskRole): string {
  return getApiKey(taskConfigs.value[role].provider)
}

function trackModelUsage(provider: ProviderId, model: string, response: unknown) {
  const responseObject = readObject(response)
  const usageObject = readObject(responseObject?.usage) ?? readObject(responseObject?.usageMetadata)
  const inputTokens = usageObject
    ? readNumber(usageObject, 'total_input_tokens', 'totalInputTokens', 'promptTokenCount', 'inputTokenCount', 'prompt_tokens') ?? 0
    : 0
  const outputTokens = usageObject
    ? readNumber(usageObject, 'total_output_tokens', 'totalOutputTokens', 'candidatesTokenCount', 'outputTokenCount', 'completion_tokens') ?? 0
    : 0
  const total = usageObject ? readNumber(usageObject, 'total_tokens', 'totalTokens', 'totalTokenCount') : undefined
  const normalizedInput = inputTokens === 0 && outputTokens === 0 && total !== undefined ? total : inputTokens
  const normalizedOutput = inputTokens === 0 && outputTokens === 0 && total !== undefined ? 0 : outputTokens
  const existing = modelUsage.value.find((u) => u.model === model && u.provider === provider)

  if (existing) {
    existing.inputTokens += normalizedInput
    existing.outputTokens += normalizedOutput
    existing.requests += 1
  } else {
    modelUsage.value.push({
      provider,
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

  const chatAudio = readObject(record.audio)
  if (typeof chatAudio?.data === 'string' && chatAudio.data) {
    return {
      data: chatAudio.data,
      mimeType: typeof chatAudio.mime_type === 'string'
        ? chatAudio.mime_type
        : typeof chatAudio.format === 'string'
          ? `audio/${chatAudio.format}`
          : 'audio/wav',
    }
  }
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
  for (const key of ['choices', 'message', 'candidates', 'outputs', 'steps', 'content', 'parts']) {
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
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return blob

  const context = new AudioCtx()
  let audio: AudioBuffer
  try {
    audio = await context.decodeAudioData(await blob.arrayBuffer())
  } catch {
    return blob
  } finally {
    if (context.state !== 'closed') {
      await context.close().catch(() => undefined)
    }
  }

  const sampleRate = 24000
  const sampleCount = Math.max(1, Math.ceil((audio.length * sampleRate) / audio.sampleRate))
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
    const sourcePosition = (index * audio.sampleRate) / sampleRate
    const leftIndex = Math.floor(sourcePosition)
    const rightIndex = Math.min(leftIndex + 1, audio.length - 1)
    const fraction = sourcePosition - leftIndex
    const sample =
      channels.reduce((sum, channel) => {
        const left = channel[leftIndex] ?? 0
        const right = channel[rightIndex] ?? left
        return sum + left + (right - left) * fraction
      }, 0) / Math.max(1, channels.length)
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
  }
  return new Blob([wav], { type: 'audio/wav' })
}

function revokeAudioUrl() {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
}

function apiError(response: Response, body: unknown): Error {
  const error = readObject(readObject(body)?.error)
  return new Error(typeof error?.message === 'string' ? error.message : `API returned ${response.status}`)
}

function decodeBase64AudioBlob(audio: { data: string; mimeType: string }): Blob {
  const base64 = audio.data.replace(/^data:[^,]*;base64,/, '')
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const mimeType = audio.mimeType.toLowerCase()
  const pcmRate = Number(mimeType.match(/rate=(\d+)/i)?.[1]) || 24000
  return mimeType.includes('pcm') || mimeType.includes('l16')
    ? pcmAsWav(bytes, pcmRate)
    : new Blob([bytes], { type: audio.mimeType })
}

async function googleInteraction(key: string, model: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ model, store: false, ...body }),
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) throw apiError(response, result)
  return result
}

async function googleTranslate(key: string, model: string, text: string, fromName: string, toName: string): Promise<{ text: string; response: unknown }> {
  const result = await googleInteraction(key, model, {
    input: [
      { type: 'text', text: buildTranslationSystemPrompt(fromName, toName) },
      { type: 'text', text },
    ],
  })
  return { text: responseText(result), response: result }
}

async function googleTranscribe(key: string, model: string, audioBlob: Blob, speechCode: string): Promise<{ text: string; response: unknown }> {
  const result = await googleInteraction(key, model, {
    input: [{ type: 'audio', data: await audioBase64(audioBlob), mime_type: audioBlob.type || 'audio/wav' }],
    generation_config: { transcription_config: { language_codes: [speechCode] } },
  })
  return { text: responseText(result), response: result }
}

async function googleTts(key: string, model: string, text: string): Promise<{ audioBlob: Blob; response: unknown }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      }),
    },
  )
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) throw apiError(response, result)
  const audio = findAudioPart(result)
  if (!audio) throw new Error('The speech service returned no audio data.')
  return { audioBlob: decodeBase64AudioBlob(audio), response: result }
}

function openaiBaseUrl(providerId: ProviderId): string {
  if (providerId === 'groq') return 'https://api.groq.com/openai'
  if (providerId === 'openrouter') return 'https://openrouter.ai/api'
  return 'https://api.openai.com'
}

function openaiHeaders(providerId: ProviderId, key: string, isJson = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
  }
  if (isJson) headers['Content-Type'] = 'application/json'
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'langTTY'
  }
  return headers
}

async function openaiChatTranslate(providerId: ProviderId, key: string, model: string, text: string, fromName: string, toName: string): Promise<{ text: string; response: unknown }> {
  const base = openaiBaseUrl(providerId)
  const response = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: openaiHeaders(providerId, key, true),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildTranslationSystemPrompt(fromName, toName) },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    }),
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) throw apiError(response, result)
  const choices = readObject(result)?.choices
  const firstChoice = Array.isArray(choices) && choices.length > 0 ? readObject(choices[0]) : null
  const content = readObject(firstChoice?.message)?.content
  const translated = typeof content === 'string' ? content.trim() : ''
  return { text: translated, response: result }
}

async function openaiTranscribe(providerId: ProviderId, key: string, model: string, audioBlob: Blob, langCode: string): Promise<{ text: string; response: unknown }> {
  const base = openaiBaseUrl(providerId)
  if (providerId === 'openrouter') {
    const base64 = await audioBase64(audioBlob)
    const format = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('webm') ? 'webm' : 'wav'
    const response = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: openaiHeaders(providerId, key, true),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `Transcribe this ${langCode} speech accurately. Return only the transcript text without explanation or quotation marks.` },
              { type: 'input_audio', input_audio: { data: base64, format } },
            ],
          },
        ],
      }),
    })
    const result: unknown = await response.json().catch(() => null)
    if (!response.ok) throw apiError(response, result)
    const choices = readObject(result)?.choices
    const firstChoice = Array.isArray(choices) && choices.length > 0 ? readObject(choices[0]) : null
    const content = readObject(firstChoice?.message)?.content
    return { text: typeof content === 'string' ? content.trim() : '', response: result }
  }

  const form = new FormData()
  const ext = audioBlob.type.includes('wav') ? 'wav' : audioBlob.type.includes('mp4') ? 'm4a' : 'webm'
  form.append('file', audioBlob, `recording.${ext}`)
  form.append('model', model)
  form.append('language', langCode.split('-')[0]!)
  const response = await fetch(`${base}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: openaiHeaders(providerId, key, false),
    body: form,
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) throw apiError(response, result)
  const rawText = readObject(result)?.text
  const text = typeof rawText === 'string' ? rawText.trim() : ''
  return { text, response: result }
}

async function openaiSpeechTts(providerId: ProviderId, key: string, model: string, text: string): Promise<{ audioBlob: Blob; response: unknown }> {
  const base = openaiBaseUrl(providerId)
  const voice = providerId === 'groq' ? 'Fritz-PlayAI' : 'alloy'
  const responseFormat = providerId === 'openrouter' ? 'mp3' : 'wav'
  const response = await fetch(`${base}/v1/audio/speech`, {
    method: 'POST',
    headers: openaiHeaders(providerId, key, true),
    body: JSON.stringify({ model, input: text, voice, response_format: responseFormat }),
  })
  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null)
    throw apiError(response, result)
  }
  const audioBlob = await response.blob()
  return { audioBlob, response: null }
}

async function openrouterTts(key: string, model: string, text: string): Promise<{ audioBlob: Blob; response: unknown }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: openaiHeaders('openrouter', key, true),
    body: JSON.stringify({
      model,
      modalities: ['text', 'audio'],
      audio: { voice: 'alloy', format: 'wav' },
      messages: [
        { role: 'system', content: 'Read the user text aloud naturally without adding commentary.' },
        { role: 'user', content: text },
      ],
    }),
  })
  const result: unknown = await response.json().catch(() => null)
  if (!response.ok) throw apiError(response, result)
  const audio = findAudioPart(result)
  if (!audio) throw new Error('The speech service returned no audio data.')
  return { audioBlob: decodeBase64AudioBlob(audio), response: result }
}

function isOpenrouterSpeechEndpointModel(model: string): boolean {
  return /(^|\/)(tts|.*voice.*|.*speech.*)/i.test(model) && !/audio-mini|gpt-4o|gemini/i.test(model)
}

async function dispatchTranslation(text: string, fromName: string, toName: string): Promise<{ text: string; response: unknown; provider: ProviderId; model: string }> {
  const { provider, model } = taskConfigs.value.translation
  const key = getApiKey(provider)
  if (!key) throw new Error(t.value.needKey)
  if (provider === 'google') {
    const r = await googleTranslate(key, model, text, fromName, toName)
    return { ...r, provider, model }
  }
  if (provider === 'browser') {
    throw new Error(t.value.unsupportedTask)
  }
  const r = await openaiChatTranslate(provider, key, model, text, fromName, toName)
  return { ...r, provider, model }
}

async function dispatchTranscription(audioBlob: Blob, speechCode: string, langCode: string): Promise<{ text: string; response: unknown; provider: ProviderId; model: string }> {
  const { provider, model } = taskConfigs.value.transcription
  const key = getApiKey(provider)
  if (!key) throw new Error(t.value.needKey)
  if (provider === 'google') {
    const r = await googleTranscribe(key, model, audioBlob, speechCode)
    return { ...r, provider, model }
  }
  if (provider === 'browser') {
    throw new Error(t.value.unsupportedTask)
  }
  const r = await openaiTranscribe(provider, key, model, audioBlob, langCode)
  return { ...r, provider, model }
}

async function dispatchTts(text: string): Promise<{ audioBlob: Blob; response: unknown; provider: ProviderId; model: string }> {
  const { provider, model } = taskConfigs.value.textToSpeech
  const key = getApiKey(provider)
  if (!key) throw new Error(t.value.needKey)
  if (provider === 'google') {
    const r = await googleTts(key, model, text)
    return { ...r, provider, model }
  }
  if (provider === 'openrouter') {
    const r = isOpenrouterSpeechEndpointModel(model)
      ? await openaiSpeechTts('openrouter', key, model, text)
      : await openrouterTts(key, model, text)
    return { ...r, provider, model }
  }
  const r = await openaiSpeechTts(provider, key, model, text)
  return { ...r, provider, model }
}

watch(
  uiLanguage,
  (value) => {
    localStorage.setItem('lingua-ui-language', value)
    document.documentElement.lang = value
    document.title = value === 'en' ? 'langTTY — Translator' : 'langTTY — แอปแปลภาษา'
  },
  { immediate: true },
)

watch(
  darkMode,
  (value) => {
    localStorage.setItem('lingua-theme', value ? 'dark' : 'light')
    document.documentElement.dataset.theme = value ? 'dark' : 'light'
  },
  { immediate: true },
)

watch(sourceLanguage, () => {
  errorMessage.value = ''
})

function toggleUiLanguage() {
  uiLanguage.value = uiLanguage.value === 'en' ? 'th' : 'en'
}

function switchLanguages() {
  if (isTranslating.value || isGeneratingAudio.value) return
  browserTts.stop()
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
  browserTts.stop()
  translationNeedsSpeech.value = true
  playbackNeedsUserAction.value = false
  revokeAudioUrl()
}

function saveProviderKey(providerId: ProviderId) {
  const key = apiKeyDrafts.value[providerId]?.trim() || ''
  if (!key) {
    errorMessage.value = t.value.invalidKey
    return
  }
  apiKeys.value = { ...apiKeys.value, [providerId]: key }
  apiKeyDrafts.value = { ...apiKeyDrafts.value, [providerId]: key }
  sessionStorage.setItem('lingua-api-keys', JSON.stringify(apiKeys.value))
  errorMessage.value = ''
  keySavedFor.value = providerId
  if (keySavedTimer) clearTimeout(keySavedTimer)
  keySavedTimer = setTimeout(() => {
    keySavedFor.value = null
  }, 2500)
}

function removeProviderKey(providerId: ProviderId) {
  const nextKeys = { ...apiKeys.value }
  delete nextKeys[providerId]
  apiKeys.value = nextKeys
  apiKeyDrafts.value = { ...apiKeyDrafts.value, [providerId]: '' }
  sessionStorage.setItem('lingua-api-keys', JSON.stringify(apiKeys.value))
  if (keySavedFor.value === providerId) keySavedFor.value = null
}

function saveTaskConfiguration() {
  const configs: Record<TaskRole, TaskConfig> = {
    translation: {
      provider: taskDrafts.value.translation.provider,
      model: taskDrafts.value.translation.model.trim(),
    },
    transcription: {
      provider: taskDrafts.value.transcription.provider,
      model: taskDrafts.value.transcription.model.trim(),
    },
    textToSpeech: {
      provider: taskDrafts.value.textToSpeech.provider,
      model: taskDrafts.value.textToSpeech.model.trim(),
    },
  }
  for (const role of taskRoles) {
    if (!configs[role].model) {
      modelSettingsError.value = t.value.invalidModels
      return
    }
  }
  taskConfigs.value = configs
  taskDrafts.value = cloneTasks(configs)
  sessionStorage.setItem('lingua-task-configs', JSON.stringify(configs))
  modelSettingsError.value = ''
  modelsSaved.value = true
  if (modelsSavedTimer) clearTimeout(modelsSavedTimer)
  modelsSavedTimer = setTimeout(() => {
    modelsSaved.value = false
  }, 2500)
}

function restoreDefaultTasks() {
  taskDrafts.value = cloneTasks(defaultTasks)
  modelSettingsError.value = ''
  modelsSaved.value = false
}

function onProviderChange(role: TaskRole) {
  const provider = taskDrafts.value[role].provider
  const prov = providerById(provider)
  taskDrafts.value[role].model = prov.defaults[role] || ''
}

function stopSilenceDetection() {
  if (silenceDetectionTimer) {
    clearInterval(silenceDetectionTimer)
    silenceDetectionTimer = undefined
  }
  if (recordingAudioContext) {
    const audioContext = recordingAudioContext
    recordingAudioContext = null
    if (audioContext.state !== 'closed') {
      void audioContext.close().catch(() => undefined)
    }
  }
}

function cleanupMediaResources() {
  stopSilenceDetection()
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
  mediaRecorder = null
  isRecording.value = false
  isStoppingRecorder = false
}

function requestStopRecorder(discard: boolean) {
  discardRecording = discard
  stopSilenceDetection()
  const recorder = mediaRecorder
  if (!recorder || recorder.state === 'inactive' || isStoppingRecorder) {
    cleanupMediaResources()
    return
  }
  isStoppingRecorder = true
  isRecording.value = false
  try {
    recorder.stop()
  } catch {
    cleanupMediaResources()
  }
}

function monitorRecordingSilence(stream: MediaStream, recorder: MediaRecorder) {
  const audioContext = recordingAudioContext
  if (!audioContext) throw new Error(t.value.silenceDetectionUnsupported)

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  const sourceNode = audioContext.createMediaStreamSource(stream)
  sourceNode.connect(analyser)
  const samples = new Float32Array(analyser.fftSize)
  let speechDetected = false
  let silenceStartedAt: number | undefined

  silenceDetectionTimer = setInterval(() => {
    if (recorder.state !== 'recording' || isStoppingRecorder) {
      stopSilenceDetection()
      return
    }

    analyser.getFloatTimeDomainData(samples)
    const meanSquare = samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length
    const now = Date.now()
    if (Math.sqrt(meanSquare) >= 0.015) {
      speechDetected = true
      silenceStartedAt = undefined
      return
    }
    if (!speechDetected) return

    silenceStartedAt ??= now
    if (now - silenceStartedAt >= 1800) {
      requestStopRecorder(false)
    }
  }, 100)
}

async function translateText() {
  if (isTranslating.value || isGeneratingAudio.value) return
  browserTts.stop()
  const text = sourceText.value.trim()
  if (!hasAnyKey.value) {
    errorMessage.value = t.value.needKey
    showSettings.value = true
    return
  }
  if (!getTaskKey('translation')) {
    errorMessage.value = t.value.noProviderForTask
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
    const { text: translated, response, provider, model } = await dispatchTranslation(
      text,
      sourceLanguageOption.value.name,
      targetLanguageOption.value.name,
    )
    trackModelUsage(provider, model, response)
    if (!translated) throw new Error('The translation service returned an empty response.')
    translatedText.value = translated
    translationNeedsSpeech.value = true
    shouldGenerateSpeech = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t.value.translationError
  } finally {
    isTranslating.value = false
  }

  if (shouldGenerateSpeech) {
    if (isBrowserTtsSelected.value) {
      playBrowserSpeech(true)
    } else {
      await generateSpeech(true)
    }
  }
}

async function transcribeAudio(blob: Blob) {
  if (!hasAnyKey.value) {
    errorMessage.value = t.value.needKey
    showSettings.value = true
    return
  }
  if (!getTaskKey('transcription')) {
    errorMessage.value = t.value.noProviderForTask
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
    const { text: transcript, response, provider, model } = await dispatchTranscription(
      normalizedAudio,
      sourceLanguageOption.value.speechCode,
      sourceLanguageOption.value.code,
    )
    trackModelUsage(provider, model, response)
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
  if (isRecording.value || mediaRecorder?.state === 'recording') {
    requestStopRecorder(false)
    return
  }
  if (!hasAnyKey.value) {
    errorMessage.value = t.value.needKey
    showSettings.value = true
    return
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    errorMessage.value = t.value.recordingUnsupported
    return
  }
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) {
    errorMessage.value = t.value.silenceDetectionUnsupported
    return
  }

  let ctx: AudioContext | null = null
  let stream: MediaStream | null = null

  try {
    ctx = new AudioCtx()
    recordingAudioContext = ctx
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (recordingAudioContext !== ctx) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }
    mediaStream = stream

    const preferredType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      .find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
    const recorder = preferredType
      ? new MediaRecorder(stream, { mimeType: preferredType })
      : new MediaRecorder(stream)
    const chunks: Blob[] = []
    mediaRecorder = recorder
    isStoppingRecorder = false
    discardRecording = false

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onerror = () => {
      cleanupMediaResources()
      errorMessage.value = t.value.microphoneError
    }
    recorder.onstop = () => {
      const shouldTranscribe = !discardRecording
      discardRecording = false
      const mime = recorder.mimeType || chunks[0]?.type || 'audio/webm'
      cleanupMediaResources()
      if (shouldTranscribe && chunks.length > 0) {
        void transcribeAudio(new Blob(chunks, { type: mime }))
      }
    }

    errorMessage.value = ''
    recorder.start()
    isRecording.value = true
    monitorRecordingSilence(stream, recorder)
  } catch (error) {
    requestStopRecorder(true)
    stream?.getTracks().forEach((track) => track.stop())
    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => undefined)
    }
    if (recordingAudioContext === ctx) recordingAudioContext = null
    cleanupMediaResources()
    errorMessage.value = error instanceof Error ? `${t.value.microphoneError} (${error.message})` : t.value.microphoneError
  }
}

function cancelRecording() {
  if (!mediaRecorder && !isRecording.value && !recordingAudioContext) return
  requestStopRecorder(true)
  errorMessage.value = ''
}

function playBrowserSpeech(immediate = false) {
  if (!translatedText.value.trim()) return
  errorMessage.value = ''
  browserTts.play(translatedText.value, {
    lang: targetLanguageOption.value.speechCode,
    immediate,
  })
}

async function generateSpeech(autoPlay = false) {
  if (!translatedText.value || isGeneratingAudio.value) return
  if (isBrowserTtsSelected.value) {
    playBrowserSpeech(autoPlay)
    return
  }
  if (!getTaskKey('textToSpeech')) {
    if (!autoPlay) {
      errorMessage.value = t.value.noProviderForTask
      showSettings.value = true
    }
    return
  }

  isGeneratingAudio.value = true
  errorMessage.value = ''
  isTtsQuotaExceeded.value = false
  playbackNeedsUserAction.value = false
  revokeAudioUrl()

  try {
    const { audioBlob, response, provider, model } = await dispatchTts(translatedText.value)
    trackModelUsage(provider, model, response)
    audioUrl.value = URL.createObjectURL(audioBlob)
    translationNeedsSpeech.value = false
    if (autoPlay) {
      await nextTick()
      const el = audioPlayer.value
      if (el) {
        el.load()
        try {
          await el.play()
        } catch {
          playbackNeedsUserAction.value = true
        }
      }
    }
  } catch (error) {
    translationNeedsSpeech.value = true
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
  requestStopRecorder(true)
  browserTts.stop()
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
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = null
    mediaRecorder.ondataavailable = null
    mediaRecorder.onerror = null
    try {
      mediaRecorder.stop()
    } catch {
      // ignore
    }
  }
  cleanupMediaResources()
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
        <button type="button" class="icon-button language-toggle" :aria-label="t.uiLanguage" :title="t.uiLanguage" @click="toggleUiLanguage">
          <Languages :size="17" /><span>{{ uiLanguageName }}</span>
        </button>
        <button type="button" class="icon-button" :aria-label="darkMode ? t.themeLight : t.themeDark" :title="darkMode ? t.themeLight : t.themeDark" @click="darkMode = !darkMode">
          <Sun v-if="darkMode" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <button type="button" class="icon-button customize-button" :aria-label="t.customize" :title="t.customize" @click="showModelSettings = !showModelSettings">
          <SlidersHorizontal :size="17" /><span class="customize-label">{{ t.customize }}</span>
        </button>
        <button type="button" class="icon-button settings-button" :aria-label="t.apiKeys" :title="t.apiKeys" @click="showSettings = !showSettings">
          <Settings2 :size="18" />
          <span v-if="hasAnyKey" class="key-indicator" />
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
              <h2>{{ t.apiKeys }}</h2>
              <p>{{ t.apiKeysHint }}</p>
            </div>
            <button type="button" class="close-settings" :aria-label="t.clear" @click="showSettings = false"><X :size="17" /></button>
          </div>
          <div v-for="prov in apiKeyProviders" :key="prov.id" class="provider-key-row">
            <span class="provider-key-name">{{ prov.name }}</span>
            <form class="key-form" @submit.prevent="saveProviderKey(prov.id)">
              <input
                v-model="apiKeyDrafts[prov.id]"
                type="password"
                autocomplete="off"
                spellcheck="false"
                class="key-input"
                :placeholder="t.apiPlaceholder"
                :aria-label="`${prov.name} API key`"
              />
              <button type="submit" class="save-key-button">{{ keySavedFor === prov.id ? t.keySaved : t.saveKey }}</button>
              <button v-if="apiKeys[prov.id]" type="button" class="remove-key-button" @click="removeProviderKey(prov.id)">{{ t.removeKey }}</button>
            </form>
            <p v-if="keySavedFor === prov.id" class="key-saved-note"><Check :size="13" /> {{ t.keySaved }}</p>
          </div>
        </div>
      </section>

      <section v-if="showModelSettings" class="settings-card model-settings-card" aria-label="Task configuration">
        <div class="settings-icon"><Settings2 :size="19" /></div>
        <div class="settings-content">
          <div class="settings-heading">
            <div>
              <h2>{{ t.modelSettings }}</h2>
              <p>{{ t.modelHint }}</p>
            </div>
            <button type="button" class="close-settings" :aria-label="t.clear" @click="showModelSettings = false"><X :size="17" /></button>
          </div>
          <form class="task-config-form" @submit.prevent="saveTaskConfiguration">
            <div v-for="role in taskRoles" :key="role" class="task-config-block">
              <span class="task-config-label">{{ taskLabels[role][uiLanguage] }}</span>
              <div class="task-config-fields">
                <label class="task-field">
                  <span>{{ t.providerLabel }}</span>
                  <span class="select-wrap task-select-wrap">
                    <select v-model="taskDrafts[role].provider" @change="onProviderChange(role)">
                      <option v-for="p in providersForTask(role)" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <ChevronDown :size="13" />
                  </span>
                </label>
                <label class="task-field">
                  <span>{{ t.modelLabel }}</span>
                  <input v-model="taskDrafts[role].model" required spellcheck="false" :placeholder="t.modelPlaceholder" />
                </label>
              </div>
            </div>
            <div class="model-form-actions">
              <button type="button" class="remove-key-button" @click="restoreDefaultTasks">{{ t.resetModels }}</button>
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
                <option v-for="language in languages" :key="language.code" :value="language.code">{{ localizedName(language) }}</option>
              </select>
              <ChevronDown :size="15" />
            </span>
          </label>
          <button type="button" class="swap-button" :disabled="isTranslating || isGeneratingAudio" :aria-label="t.switchLanguages" :title="t.switchLanguages" @click="switchLanguages"><ArrowDownUp :size="16" /></button>
          <label class="language-picker">
            <span class="language-caption">{{ t.to }}</span>
            <span class="select-wrap">
              <select v-model="targetLanguage" :aria-label="t.to">
                <option v-for="language in languages" :key="language.code" :value="language.code">{{ localizedName(language) }}</option>
              </select>
              <ChevronDown :size="15" />
            </span>
          </label>
        </div>

        <div class="translation-panels">
          <div class="text-panel source-panel">
            <div class="panel-topline">
              <span class="panel-language">{{ localizedName(sourceLanguageOption) }}</span>
              <div class="panel-tools">
                <button type="button" class="text-tool" :title="t.paste" @click="pasteText"><Clipboard :size="14" /><span>{{ t.paste }}</span></button>
                <button v-if="sourceText" type="button" class="text-tool" :title="t.clear" @click="clearText"><X :size="14" /><span>{{ t.clear }}</span></button>
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
                <button type="button" class="mic-button" :class="{ 'mic-active': isRecording }" :disabled="isTranscribing" :aria-label="isRecording ? t.stopRecording : t.speechInput" @click="toggleRecording">
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
              <span class="panel-language">{{ localizedName(targetLanguageOption) }}</span>
              <div class="panel-tools">
                <button v-if="translatedText" type="button" class="text-tool" :title="copied ? t.copied : t.copy" @click="copyTranslation">
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
              <template v-if="isBrowserTtsSelected && translatedText">
                <div class="browser-tts-box">
                  <div class="browser-tts-controls">
                    <button
                      type="button"
                      class="mic-button"
                      :disabled="!browserTts.isSupported"
                      @click="playBrowserSpeech(false)"
                    >
                      <Play :size="15" />
                      <span>{{ t.play }}</span>
                    </button>
                    <button
                      v-if="browserTts.state.value === 'speaking'"
                      type="button"
                      class="text-tool"
                      @click="browserTts.pause()"
                    >
                      <Pause :size="14" />
                      <span>{{ t.pause }}</span>
                    </button>
                    <button
                      v-if="browserTts.state.value === 'paused'"
                      type="button"
                      class="text-tool"
                      @click="browserTts.resume()"
                    >
                      <Play :size="14" />
                      <span>{{ t.resume }}</span>
                    </button>
                    <button
                      v-if="browserTts.state.value === 'speaking' || browserTts.state.value === 'paused'"
                      type="button"
                      class="text-tool"
                      @click="browserTts.stop()"
                    >
                      <Square :size="14" />
                      <span>{{ t.stop }}</span>
                    </button>
                    <span class="tts-status-badge">{{ browserTtsStatusLabel }}</span>
                  </div>

                  <div class="browser-tts-options">
                    <label class="tts-inline-field">
                      <span>{{ t.voiceLabel }}</span>
                      <select v-model="browserTts.selectedVoiceURI.value" class="tts-mini-select">
                        <option v-for="v in browserTts.voices.value" :key="v.voiceURI" :value="v.voiceURI">
                          {{ v.name }} ({{ v.lang }})
                        </option>
                      </select>
                    </label>

                    <label class="tts-inline-field">
                      <span>{{ t.speedLabel }}: {{ browserTts.rate.value.toFixed(1) }}x</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        :value="browserTts.rate.value"
                        class="tts-rate-slider"
                        @input="browserTts.setRate(Number(($event.target as HTMLInputElement).value))"
                      />
                    </label>
                  </div>
                </div>
              </template>

              <button
                v-else-if="(translationNeedsSpeech || audioUrl) && translatedText"
                type="button"
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
          <button type="button" class="translate-button" :disabled="isTranslating || isGeneratingAudio" @click="translateText">
            <LoaderCircle v-if="isTranslating" :size="16" class="spin" />
            <Sparkles v-else :size="16" />
            {{ isTranslating ? t.translating : t.translate }}
          </button>
        </div>
      </section>

      <section class="usage-card" aria-label="Token usage">
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
          <div v-for="row in usageRows" :key="`${row.provider}:${row.model}`" class="usage-model">
            <div class="usage-model-heading">
              <span class="usage-model-name">{{ row.label }}</span>
              <span class="usage-model-id">{{ providerById(row.provider).name }} · {{ row.model }}</span>
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

      <p v-if="errorMessage || browserTts.errorMessage.value" class="error-message" role="alert">
        {{ errorMessage || browserTts.errorMessage.value }}
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

<style scoped>
.task-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.task-select-wrap {
  width: 100%;
  min-width: 317.5px;
  height: 36px;
}

.select-wrap select {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 100%;
  min-height: 36px;
  padding-right: 1.75rem;
  box-sizing: border-box;
  cursor: pointer;
}

.select-wrap svg {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.browser-tts-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.browser-tts-controls,
.browser-tts-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.tts-status-badge {
  font-size: 0.78rem;
  opacity: 0.85;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.tts-inline-field {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.tts-mini-select {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: transparent;
  color: inherit;
  font-size: 0.8rem;
  max-width: 240px;
}

.tts-rate-slider {
  width: 96px;
  cursor: pointer;
}
</style>