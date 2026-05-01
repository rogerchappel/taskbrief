# Voicepath Routing Contract and Utterance Lifecycle

Status: Wave 1 architecture/product contract  
Task: `voicepath-define-routing-contract`  
Audience: product, client runtime, provider adapters, QA, and agent implementers

## 1. Product promise

Voicepath turns text segments into streamed speech without making the conversation feel broken. The product-critical invariant is:

> Start audio fast, fall back gracefully when needed, and never randomly switch voice mid-sentence.

The routing layer is responsible for choosing a provider/voice for each utterance, keeping continuity stable across segment boundaries, and emitting enough lifecycle events for clients to explain latency, fallback, cancellation, and completion.

## 2. Vocabulary

- **Utterance**: one user-visible spoken unit requested by the app. Usually one assistant response, notification, or narration paragraph.
- **Segment**: a routable part of an utterance. Segments are the smallest unit that may be synthesized independently.
- **Sentence**: a linguistic sub-unit inside a segment. A sentence must not switch voice or provider once audio has started.
- **Route**: the selected provider, model, voice, format, and fallback policy for an utterance or segment.
- **Continuity key**: stable identity used to preserve voice across related speech, for example `conversationId + personaId + locale`.
- **Primary provider**: the preferred provider for a route.
- **Fallback provider**: a compatible provider used only after an explicit fallback reason.
- **First audio**: the first playable byte/chunk emitted for an utterance.

## 3. Non-goals for Wave 1

Wave 1 defines the contract. It does not implement provider SDK adapters, audio playback, queue persistence, billing, observability backends, or UI.

## 4. Routing inputs

A routing request must carry enough information to choose a stable voice and to make fallback safe.

Required fields:

- `utteranceId`: globally unique id for the speech request.
- `text`: normalized text to speak.
- `locale`: BCP-47 language tag, for example `en-AU`.
- `continuityKey`: stable key for voice continuity across utterances.
- `requestedAt`: client/request timestamp.
- `latencyClass`: `realtime`, `interactive`, or `batch`.

Recommended fields:

- `personaId`: assistant/persona/character identity.
- `voiceHint`: requested voice id, style, gender, age, accent, or provider-specific alias.
- `format`: preferred audio encoding, sample rate, and channel count.
- `maxFirstAudioMs`: caller-specific first-audio deadline.
- `maxTotalMs`: caller-specific total synthesis deadline.
- `fallbackPolicy`: allowed fallback providers, voice equivalence rules, and whether partial audio can be replaced.
- `traceContext`: correlation ids for logs and event consumers.

## 5. Provider interface

Provider adapters must be deterministic wrappers around provider APIs. They should not make product routing decisions internally.

```ts
interface VoiceProvider {
  readonly providerId: string;
  readonly capabilities: VoiceProviderCapabilities;

  estimate(request: VoiceSynthesisEstimateRequest): Promise<VoiceProviderEstimate>;
  synthesize(request: VoiceSynthesisRequest): AsyncIterable<VoiceSynthesisEvent>;
  cancel(handle: VoiceSynthesisHandle, reason: CancellationReason): Promise<void>;
}
```

### 5.1 Capability contract

A provider must declare:

- supported locales and locale fallback rules
- supported voices and provider voice ids
- streaming support (`chunked`, `firstByteOnly`, or `none`)
- supported audio formats
- max text length and recommended segment length
- observed p50/p95 first-audio and total-latency estimates by latency class
- timeout behavior
- retryability by error class
- whether voice cloning, style controls, SSML, or pronunciation dictionaries are supported

### 5.2 Estimate contract

`estimate()` returns a cheap routing signal, not a reservation. It must include:

- `available`: whether the provider can handle the request now
- `expectedFirstAudioMs` and `expectedTotalMs`
- `qualityScore` from 0 to 1 for voice/locale fit
- `continuityScore` from 0 to 1 against the continuity key and requested voice
- `risk`: warnings such as `cold_start_risk`, `quota_low`, or `locale_degraded`

### 5.3 Synthesis contract

`synthesize()` must emit lifecycle events in order:

1. `route_selected`
2. `segment_started`
3. zero or more `audio_chunk` events
4. `segment_completed` or `segment_failed`
5. `utterance_completed`, `utterance_failed`, or `utterance_cancelled`

Adapters must preserve provider error details internally but expose normalized fallback/error reasons to the router.

## 6. Latency budgets

Default budgets are product budgets, not hard provider guarantees.

| Latency class | First audio target | First audio hard deadline | Segment target | Total utterance target |
| --- | ---: | ---: | ---: | ---: |
| `realtime` | <= 400 ms | 900 ms | <= 2,000 ms | <= 6,000 ms |
| `interactive` | <= 800 ms | 1,500 ms | <= 4,000 ms | <= 12,000 ms |
| `batch` | <= 2,000 ms | 5,000 ms | best effort | best effort |

Routing should optimize in this order:

1. first playable audio before deadline
2. continuity with prior utterances
3. naturalness/quality
4. cost

If the first-audio hard deadline is exceeded and fallback is allowed, the router should trigger fallback before waiting for a provider-level terminal failure.

## 7. Continuity invariants

These are mandatory product invariants.

1. **No mid-sentence random switch**: after the first audio chunk for a sentence is emitted, the provider and voice for that sentence are locked.
2. **Fallback at safe boundaries**: fallback may occur before first audio, between sentences, or between segments. It must not splice a different voice into an already-started sentence.
3. **Stable continuity key**: all utterances sharing a continuity key should prefer the same canonical voice unless there is an explicit fallback reason.
4. **Voice equivalence must be declared**: fallback voice changes require a declared equivalence mapping or an event that tells the client the voice changed.
5. **Partial audio is append-only**: emitted audio chunks are immutable. The router may stop future chunks, but must not ask clients to reinterpret already-played audio.
6. **Cancellation is terminal**: after `utterance_cancelled`, no more audio chunks for that utterance may be emitted.
7. **Route decisions are explainable**: every fallback or degraded route emits a normalized reason and the selected replacement.

## 8. Utterance and segment lifecycle

```text
created
  -> routed
  -> segmenting
  -> segment_queued
  -> segment_started
  -> first_audio_emitted
  -> segment_completed
  -> utterance_completed
```

Failure path:

```text
created -> routed -> segment_started? -> segment_failed -> fallback_evaluated
  -> fallback_selected -> segment_started -> ... -> utterance_completed
  OR
  -> utterance_failed
```

Cancellation path:

```text
created -> routed? -> cancellation_requested -> utterance_cancelled
```

### Segment states

- `pending`: segment exists but is not yet routed or queued.
- `queued`: provider route selected; synthesis has not started.
- `streaming`: provider started and may emit audio chunks.
- `completed`: all audio for the segment emitted.
- `failed`: segment route failed and no safe retry remains for this segment.
- `cancelled`: caller cancelled before completion.

### Sentence boundary rules

The segmenter must provide safe boundaries. A segment may contain multiple short sentences when latency requires it, but every segment must carry sentence boundary metadata so fallback can decide whether a boundary is safe.

## 9. Event stream

All lifecycle changes are represented as append-only events. Events are suitable for server logs, client playback coordination, and QA replay.

Required common fields:

- `eventId`
- `utteranceId`
- `sequence`
- `timestamp`
- `type`
- `traceId`

Event types:

- `utterance_created`
- `route_selected`
- `segment_created`
- `segment_started`
- `first_audio_emitted`
- `audio_chunk`
- `segment_completed`
- `segment_failed`
- `fallback_evaluated`
- `fallback_selected`
- `voice_changed`
- `utterance_completed`
- `utterance_failed`
- `utterance_cancelled`

### Audio chunk event

An `audio_chunk` must include:

- `segmentId`
- `sentenceIndex`
- `providerId`
- `voiceId`
- `format`
- `chunkIndex`
- `byteLength`
- `audio`: bytes or an out-of-band media reference
- `isFinalChunkForSentence`

Clients may begin playback as soon as the first valid `audio_chunk` arrives.

## 10. Fallback reasons

Normalized fallback reasons:

- `first_audio_deadline_exceeded`
- `provider_timeout`
- `provider_unavailable`
- `provider_rate_limited`
- `quota_exhausted`
- `unsupported_locale`
- `unsupported_voice`
- `voice_not_equivalent`
- `synthesis_error`
- `audio_format_error`
- `policy_blocked`
- `cancelled_by_caller`

Fallback decision outcomes:

- `retry_same_provider_same_voice`
- `retry_same_provider_equivalent_voice`
- `switch_provider_same_voice`
- `switch_provider_equivalent_voice`
- `degrade_locale_or_style`
- `fail_closed`

The router should fail closed when fallback would violate continuity invariants.

## 11. Routing algorithm contract

The router should follow this decision order:

1. Validate request shape, text length, locale, and format.
2. Segment text and mark safe sentence boundaries.
3. Load continuity state for the continuity key.
4. Build candidate provider/voice routes from capability declarations.
5. Score candidates by first-audio budget, continuity score, quality score, reliability, and cost.
6. Select a primary route and emit `route_selected`.
7. Start synthesis for the earliest playable segment.
8. If no first audio arrives before the hard deadline, evaluate fallback at the current safe boundary.
9. Lock provider/voice per sentence after first audio.
10. Persist continuity state after successful first audio and completion.

## 12. Package layout

Wave 1 keeps implementation light while making the contract importable by future adapters.

```text
src/voicepath/
  index.ts          public exports for Wave 1 contract types
  types.ts          provider, routing, lifecycle, event, and fallback types

docs/
  voicepath-routing-contract.md
```

Future implementation packages should keep product routing separate from provider adapters:

```text
packages/voicepath-core/       router, segmentation, continuity state, lifecycle events
packages/voicepath-adapters/   provider-specific adapters
packages/voicepath-client/     browser/node playback helpers
packages/voicepath-testkit/    fake providers, latency simulators, invariant tests
```

## 13. Acceptance criteria for future waves

A Wave 2 implementation should include invariant tests proving:

- first audio deadline triggers fallback before terminal provider failure
- emitted audio never changes provider/voice within a sentence
- fallback voice changes are either equivalent or explicitly surfaced through `voice_changed`
- cancellation produces no late audio chunks
- continuity state biases later utterances toward the same canonical voice
