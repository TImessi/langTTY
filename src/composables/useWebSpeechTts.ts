// src/composables/useWebSpeechTts.ts
import { onBeforeUnmount, ref } from 'vue'

export type TtsPlaybackState = 'idle' | 'speaking' | 'paused' | 'ended' | 'unsupported'

export interface BrowserPlayOptions {
  lang?: string
  immediate?: boolean
}

const MAX_CHUNK_LENGTH = 180
const THAI_VOICE_PRIORITY_KEYWORDS = ['premwadee', 'niwat', 'google']

export function splitTextIntoChunks(text: string, maxLen = MAX_CHUNK_LENGTH): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  if (normalized.length <= maxLen) return [normalized]

  const chunks: string[] = []
  let remaining = normalized

  while (remaining.length > maxLen) {
    const windowSlice = remaining.slice(0, maxLen + 1)
    const sentenceBreak = Math.max(
      windowSlice.lastIndexOf('\n'),
      windowSlice.lastIndexOf('.'),
      windowSlice.lastIndexOf('!'),
      windowSlice.lastIndexOf('?'),
    )
    const spaceBreak = windowSlice.lastIndexOf(' ')

    let cutIndex = -1
    if (sentenceBreak >= Math.floor(maxLen * 0.4)) {
      cutIndex = sentenceBreak + 1
    } else if (spaceBreak > 0) {
      cutIndex = spaceBreak
    } else {
      cutIndex = maxLen
    }

    const piece = remaining.slice(0, cutIndex).trim()
    if (piece) chunks.push(piece)
    remaining = remaining.slice(cutIndex).trimStart()
  }

  if (remaining.trim()) chunks.push(remaining.trim())
  return chunks
}

export function pickVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  targetLang = 'th-TH',
): SpeechSynthesisVoice | null {
  if (!voices.length) return null

  const normalizedLang = targetLang.toLowerCase()
  const baseLang = normalizedLang.split('-')[0] || 'th'

  const exactMatches = voices.filter((v) => v.lang.toLowerCase() === normalizedLang)
  const prefixMatches = voices.filter((v) => v.lang.toLowerCase().startsWith(baseLang))
  const candidates = exactMatches.length ? exactMatches : prefixMatches

  if (baseLang === 'th' && candidates.length) {
    for (const keyword of THAI_VOICE_PRIORITY_KEYWORDS) {
      const matched = candidates.find((v) => v.name.toLowerCase().includes(keyword))
      if (matched) return matched
    }
  }

  if (candidates.length) {
    const googleVoice = candidates.find((v) => /google/i.test(v.name))
    return googleVoice ?? candidates[0] ?? null
  }

  return voices[0] ?? null
}

export function useWebSpeechTts() {
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  const voices = ref<SpeechSynthesisVoice[]>([])
  const selectedVoiceURI = ref<string>('')
  const rate = ref<number>(1.0)
  const state = ref<TtsPlaybackState>(isSupported ? 'idle' : 'unsupported')
  const currentChunkIndex = ref<number>(0)
  const totalChunks = ref<number>(0)
  const errorMessage = ref<string>('')

  let queue: string[] = []
  let activeSessionId = 0
  let activeLang = 'th-TH'

  function syncVoices() {
    if (!isSupported) return
    const loaded = window.speechSynthesis.getVoices()
    if (!loaded.length) return
    voices.value = loaded

    if (!selectedVoiceURI.value) {
      const preferred = pickVoiceForLanguage(loaded, activeLang)
      if (preferred) selectedVoiceURI.value = preferred.voiceURI
    }
  }

  function resolveVoice(langCode: string): SpeechSynthesisVoice | null {
    if (!voices.value.length) syncVoices()

    // ถ้าผู้ใช้เลือกเสียงด้วยตนเองและภาษาตรงกับภาษาที่จะอ่าน ให้ใช้เสียงที่เลือกก่อน
    if (selectedVoiceURI.value) {
      const manualVoice = voices.value.find((v) => v.voiceURI === selectedVoiceURI.value)
      const targetBase = langCode.toLowerCase().split('-')[0]
      if (manualVoice && (!targetBase || manualVoice.lang.toLowerCase().startsWith(targetBase))) {
        return manualVoice
      }
    }

    return pickVoiceForLanguage(voices.value, langCode)
  }

  function clearQueueOnly() {
    queue = []
    currentChunkIndex.value = 0
    totalChunks.value = 0
  }

  function stop() {
    activeSessionId += 1
    clearQueueOnly()
    if (!isSupported) return
    window.speechSynthesis.cancel()
    state.value = 'idle'
    errorMessage.value = ''
  }

  function playNextChunk(sessionId: number, langCode: string, immediate = false) {
    if (!isSupported || sessionId !== activeSessionId) return

    if (!queue.length) {
      currentChunkIndex.value = 0
      totalChunks.value = 0
      state.value = 'ended'
      return
    }

    const nextText = queue.shift()!
    currentChunkIndex.value = totalChunks.value - queue.length

    const utterance = new SpeechSynthesisUtterance(nextText)
    const voice = resolveVoice(langCode)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = langCode
    }
    utterance.rate = Math.min(2.0, Math.max(0.5, rate.value))

    utterance.onstart = () => {
      if (sessionId !== activeSessionId) return
      state.value = 'speaking'
    }

    utterance.onpause = () => {
      if (sessionId !== activeSessionId) return
      state.value = 'paused'
    }

    utterance.onresume = () => {
      if (sessionId !== activeSessionId) return
      state.value = 'speaking'
    }

    utterance.onend = () => {
      if (sessionId !== activeSessionId) return
      playNextChunk(sessionId, langCode, false)
    }

    utterance.onerror = (event) => {
      if (sessionId !== activeSessionId) return
      if (event.error === 'interrupted' || event.error === 'canceled') return
      clearQueueOnly()
      state.value = 'idle'
      if (!immediate) {
        errorMessage.value = event.error || 'Speech synthesis error'
      }
    }

    window.speechSynthesis.speak(utterance)
  }

  function play(text: string, options?: BrowserPlayOptions) {
    if (!isSupported) {
      state.value = 'unsupported'
      return
    }
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_LENGTH)
    if (!chunks.length) return

    activeLang = options?.lang || 'th-TH'
    const immediate = Boolean(options?.immediate)

    // อัปเดตเสียงที่เลือกให้ตรงกับภาษาเป้าหมายอัตโนมัติหากเสียงเดิมไม่ใช่ภาษานั้น
    const matchedVoice = pickVoiceForLanguage(voices.value, activeLang)
    if (matchedVoice) {
      const currentManual = voices.value.find((v) => v.voiceURI === selectedVoiceURI.value)
      const targetBase = activeLang.toLowerCase().split('-')[0]
      if (!currentManual || (targetBase && !currentManual.lang.toLowerCase().startsWith(targetBase))) {
        selectedVoiceURI.value = matchedVoice.voiceURI
      }
    }

    activeSessionId += 1
    const sessionId = activeSessionId
    errorMessage.value = ''

    window.speechSynthesis.cancel()
    queue = [...chunks]
    totalChunks.value = chunks.length
    currentChunkIndex.value = 0
    state.value = 'speaking'

    const delay = immediate ? 0 : 20
    setTimeout(() => playNextChunk(sessionId, activeLang, immediate), delay)
  }

  function pause() {
    if (!isSupported || state.value !== 'speaking') return
    window.speechSynthesis.pause()
    state.value = 'paused'
  }

  function resume() {
    if (!isSupported || state.value !== 'paused') return
    window.speechSynthesis.resume()
    state.value = 'speaking'
  }

  function setRate(nextRate: number) {
    rate.value = Math.min(2.0, Math.max(0.5, nextRate))
  }

  if (isSupported) {
    syncVoices()
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices)
  }

  onBeforeUnmount(() => {
    activeSessionId += 1
    clearQueueOnly()
    if (isSupported) {
      window.speechSynthesis.removeEventListener('voiceschanged', syncVoices)
      window.speechSynthesis.cancel()
    }
  })

  return {
    isSupported,
    voices,
    selectedVoiceURI,
    rate,
    state,
    currentChunkIndex,
    totalChunks,
    errorMessage,
    splitTextIntoChunks,
    pickVoiceForLanguage,
    play,
    pause,
    resume,
    stop,
    setRate,
  }
}