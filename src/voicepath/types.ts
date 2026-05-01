/**
 * Wave 1 Voicepath routing contract types.
 *
 * These types intentionally model product invariants only. Provider SDK adapters,
 * playback, persistence, and concrete routing algorithms belong in later waves.
 */

export const VOICEPATH_LATENCY_BUDGETS = {
  realtime: {
    firstAudioTargetMs: 400,
    firstAudioHardDeadlineMs: 900,
    segmentTargetMs: 2_000,
    totalUtteranceTargetMs: 6_000,
  },
  interactive: {
    firstAudioTargetMs: 800,
    firstAudioHardDeadlineMs: 1_500,
    segmentTargetMs: 4_000,
    totalUtteranceTargetMs: 12_000,
  },
  batch: {
    firstAudioTargetMs: 2_000,
    firstAudioHardDeadlineMs: 5_000,
    segmentTargetMs: null,
    totalUtteranceTargetMs: null,
  },
} as const satisfies Record<VoiceLatencyClass, VoiceLatencyBudget>;

export type VoiceLatencyClass = "realtime" | "interactive" | "batch";

export type VoiceStreamingSupport = "chunked" | "firstByteOnly" | "none";

export type AudioEncoding = "pcm_s16le" | "mp3" | "opus" | "wav";

export type VoiceProviderId = string;
export type VoiceId = string;
export type UtteranceId = string;
export type SegmentId = string;
export type ContinuityKey = string;
export type TraceId = string;

export interface VoiceAudioFormat {
  encoding: AudioEncoding;
  sampleRateHz: number;
  channels: 1 | 2;
}

export interface VoiceLatencyBudget {
  firstAudioTargetMs: number;
  firstAudioHardDeadlineMs: number;
  segmentTargetMs: number | null;
  totalUtteranceTargetMs: number | null;
}

export interface VoiceHint {
  voiceId?: VoiceId;
  providerId?: VoiceProviderId;
  personaId?: string;
  style?: string;
  accent?: string;
  gender?: string;
  age?: string;
}

export interface VoiceRouteRequest {
  utteranceId: UtteranceId;
  text: string;
  locale: string;
  continuityKey: ContinuityKey;
  requestedAt: string;
  latencyClass: VoiceLatencyClass;
  personaId?: string;
  voiceHint?: VoiceHint;
  format?: VoiceAudioFormat;
  maxFirstAudioMs?: number;
  maxTotalMs?: number;
  fallbackPolicy?: VoiceFallbackPolicy;
  traceContext?: VoiceTraceContext;
}

export interface VoiceTraceContext {
  traceId: TraceId;
  parentSpanId?: string;
  requestId?: string;
}

export interface VoiceFallbackPolicy {
  allowedProviderIds: VoiceProviderId[];
  allowEquivalentVoice: boolean;
  allowLocaleDegradation: boolean;
  allowStyleDegradation: boolean;
  failClosedOnContinuityRisk: boolean;
}

export interface VoiceProviderCapabilities {
  providerId: VoiceProviderId;
  supportedLocales: string[];
  localeFallbacks: Record<string, string[]>;
  voices: VoiceCatalogEntry[];
  streaming: VoiceStreamingSupport;
  formats: VoiceAudioFormat[];
  maxTextLength: number;
  recommendedSegmentLength: number;
  latencyBudgets: Partial<Record<VoiceLatencyClass, VoiceLatencyBudget>>;
  supportsSsml: boolean;
  supportsPronunciationDictionary: boolean;
  supportsVoiceCloning: boolean;
  supportsStyleControls: boolean;
}

export interface VoiceCatalogEntry {
  voiceId: VoiceId;
  locale: string;
  displayName: string;
  equivalentVoiceIds: VoiceId[];
  tags: string[];
}

export interface VoiceSynthesisEstimateRequest {
  routeRequest: VoiceRouteRequest;
  candidateVoiceId: VoiceId;
  candidateFormat: VoiceAudioFormat;
}

export type VoiceProviderRisk =
  | "cold_start_risk"
  | "quota_low"
  | "locale_degraded"
  | "voice_degraded"
  | "format_transcode_required"
  | "streaming_unavailable";

export interface VoiceProviderEstimate {
  providerId: VoiceProviderId;
  voiceId: VoiceId;
  available: boolean;
  expectedFirstAudioMs: number;
  expectedTotalMs: number;
  qualityScore: number;
  continuityScore: number;
  risks: VoiceProviderRisk[];
}

export interface VoiceRouteSelection {
  providerId: VoiceProviderId;
  voiceId: VoiceId;
  locale: string;
  format: VoiceAudioFormat;
  latencyClass: VoiceLatencyClass;
  continuityKey: ContinuityKey;
  fallbackPolicy: VoiceFallbackPolicy;
}

export interface VoiceSynthesisRequest {
  utteranceId: UtteranceId;
  segment: VoiceSegment;
  route: VoiceRouteSelection;
  traceContext?: VoiceTraceContext;
}

export interface VoiceSegment {
  segmentId: SegmentId;
  utteranceId: UtteranceId;
  index: number;
  text: string;
  sentenceBoundaries: VoiceSentenceBoundary[];
}

export interface VoiceSentenceBoundary {
  sentenceIndex: number;
  startOffset: number;
  endOffset: number;
  safeFallbackBoundaryBefore: boolean;
  safeFallbackBoundaryAfter: boolean;
}

export type VoiceSegmentState = "pending" | "queued" | "streaming" | "completed" | "failed" | "cancelled";

export type VoiceUtteranceState =
  | "created"
  | "routed"
  | "segmenting"
  | "streaming"
  | "completed"
  | "failed"
  | "cancelled";

export type VoiceFallbackReason =
  | "first_audio_deadline_exceeded"
  | "provider_timeout"
  | "provider_unavailable"
  | "provider_rate_limited"
  | "quota_exhausted"
  | "unsupported_locale"
  | "unsupported_voice"
  | "voice_not_equivalent"
  | "synthesis_error"
  | "audio_format_error"
  | "policy_blocked"
  | "cancelled_by_caller";

export type VoiceFallbackOutcome =
  | "retry_same_provider_same_voice"
  | "retry_same_provider_equivalent_voice"
  | "switch_provider_same_voice"
  | "switch_provider_equivalent_voice"
  | "degrade_locale_or_style"
  | "fail_closed";

export type CancellationReason = "caller_cancelled" | "superseded" | "timeout" | "shutdown";

export interface VoiceSynthesisHandle {
  utteranceId: UtteranceId;
  segmentId: SegmentId;
  providerId: VoiceProviderId;
}

export interface VoiceProvider {
  readonly providerId: VoiceProviderId;
  readonly capabilities: VoiceProviderCapabilities;

  estimate(request: VoiceSynthesisEstimateRequest): Promise<VoiceProviderEstimate>;
  synthesize(request: VoiceSynthesisRequest): AsyncIterable<VoiceSynthesisEvent>;
  cancel(handle: VoiceSynthesisHandle, reason: CancellationReason): Promise<void>;
}

export type VoiceSynthesisEvent =
  | UtteranceCreatedEvent
  | RouteSelectedEvent
  | SegmentCreatedEvent
  | SegmentStartedEvent
  | FirstAudioEmittedEvent
  | AudioChunkEvent
  | SegmentCompletedEvent
  | SegmentFailedEvent
  | FallbackEvaluatedEvent
  | FallbackSelectedEvent
  | VoiceChangedEvent
  | UtteranceCompletedEvent
  | UtteranceFailedEvent
  | UtteranceCancelledEvent;

export interface VoiceEventBase {
  eventId: string;
  utteranceId: UtteranceId;
  sequence: number;
  timestamp: string;
  traceId: TraceId;
}

export interface UtteranceCreatedEvent extends VoiceEventBase {
  type: "utterance_created";
  latencyClass: VoiceLatencyClass;
  continuityKey: ContinuityKey;
}

export interface RouteSelectedEvent extends VoiceEventBase {
  type: "route_selected";
  route: VoiceRouteSelection;
}

export interface SegmentCreatedEvent extends VoiceEventBase {
  type: "segment_created";
  segment: VoiceSegment;
}

export interface SegmentStartedEvent extends VoiceEventBase {
  type: "segment_started";
  segmentId: SegmentId;
  providerId: VoiceProviderId;
  voiceId: VoiceId;
}

export interface FirstAudioEmittedEvent extends VoiceEventBase {
  type: "first_audio_emitted";
  segmentId: SegmentId;
  elapsedMs: number;
}

export interface AudioChunkEvent extends VoiceEventBase {
  type: "audio_chunk";
  segmentId: SegmentId;
  sentenceIndex: number;
  providerId: VoiceProviderId;
  voiceId: VoiceId;
  format: VoiceAudioFormat;
  chunkIndex: number;
  byteLength: number;
  audio: Uint8Array | { mediaRef: string };
  isFinalChunkForSentence: boolean;
}

export interface SegmentCompletedEvent extends VoiceEventBase {
  type: "segment_completed";
  segmentId: SegmentId;
  elapsedMs: number;
}

export interface SegmentFailedEvent extends VoiceEventBase {
  type: "segment_failed";
  segmentId: SegmentId;
  reason: VoiceFallbackReason;
  retryable: boolean;
}

export interface FallbackEvaluatedEvent extends VoiceEventBase {
  type: "fallback_evaluated";
  segmentId: SegmentId;
  reason: VoiceFallbackReason;
  safeBoundary: boolean;
}

export interface FallbackSelectedEvent extends VoiceEventBase {
  type: "fallback_selected";
  segmentId: SegmentId;
  reason: VoiceFallbackReason;
  outcome: VoiceFallbackOutcome;
  route: VoiceRouteSelection;
}

export interface VoiceChangedEvent extends VoiceEventBase {
  type: "voice_changed";
  segmentId: SegmentId;
  previousProviderId: VoiceProviderId;
  previousVoiceId: VoiceId;
  nextProviderId: VoiceProviderId;
  nextVoiceId: VoiceId;
  equivalent: boolean;
  reason: VoiceFallbackReason;
}

export interface UtteranceCompletedEvent extends VoiceEventBase {
  type: "utterance_completed";
  elapsedMs: number;
}

export interface UtteranceFailedEvent extends VoiceEventBase {
  type: "utterance_failed";
  reason: VoiceFallbackReason;
  terminal: true;
}

export interface UtteranceCancelledEvent extends VoiceEventBase {
  type: "utterance_cancelled";
  reason: CancellationReason;
}
