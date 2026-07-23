export type MessageType =
  | 'HEARLY_TOGGLE'
  | 'MEETING_DETECTED'
  | 'MEETING_ENDED'
  | 'GET_STATUS'
  | 'STATUS_RESPONSE'
  | 'OPEN_POPUP'
  | 'ACTIVATE_HEARLY'
  | 'POPUP_TOGGLE_AUDIO_ON'
  | 'POPUP_TOGGLE_AUDIO_OFF'
  | 'HEARLY_START_AUDIO'
  | 'HEARLY_STOP_AUDIO'
  | 'HEARLY_AUDIO_STARTED'
  | 'HEARLY_AUDIO_STOPPED'
  | 'HEARLY_AUDIO_ERROR'
  | 'HEARLY_VOICE_MATCH'
  | 'HEARLY_VOICE_ACTIVITY'
  | 'HEARLY_MIC_PROCESSING_STARTED'
  | 'HEARLY_MIC_PROCESSING_STOPPED'
  | 'HEARLY_MIC_PROCESSING_ERROR'
  | 'MIC_PERMISSION_GRANTED'
  | 'MIC_PERMISSION_DENIED'
  | 'REQUEST_MIC_PERMISSION'
  | 'HEARLY_TRANSCRIBE_CHUNK'
  | 'HEARLY_VERIFY_VOICE_WINDOW'
  | 'HEARLY_MODEL_UNAVAILABLE'
  | 'HEARLY_NEW_TRANSCRIPT_ENTRY'
  | 'HEARLY_TRANSCRIPT_STATE_CHANGED'
  | 'HEARLY_WEB_CHECK_EXTENSION'
  | 'HEARLY_WEB_GET_PROFILE'
  | 'HEARLY_WEB_GET_MEETINGS'
  | 'HEARLY_WEB_CONFIRM_VOICE'
  | 'HEARLY_WEB_CONFIRM_PAYMENT'
  | 'HEARLY_WEB_GET_SUBSCRIPTION'
  | 'HEARLY_ASSISTANT_SUGGESTION'

export interface HearlyMessage {
  type?: MessageType
  source?: string
  payload?: Record<string, unknown>
  streamId?: string
  tabId?: number
  platform?: string
  error?: string
  score?: number
  matched?: boolean
  isSpeech?: boolean
  confidence?: number
  rms?: number
  noiseFloor?: number
  samples?: number[]
  sampleRate?: number
  threshold?: number
  vadConfidence?: number
  unavailable?: boolean
  language?: 'en' | 'hi' | 'mr'
  speaker?: 'you' | 'others'
  timestamp?: number
  audioBase64?: string
  installed?: boolean
  version?: string
  profile?: unknown
  meetings?: unknown
  transcripts?: unknown
  success?: boolean
  subscription?: {
    isPro: boolean
    planName: string
    paymentId?: string
    paidAt?: number
  }
}

export type Platform = 'meet' | 'zoom' | 'teams' | 'unknown'

export interface MeetingStatus {
  isInMeeting: boolean
  platform: Platform
  isActive: boolean
}
