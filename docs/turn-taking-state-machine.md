# Wave 1 Turn-Taking State Machine and Audio Policy Contract

This document defines the Wave 1 turn-taking contract for `bargekit` style natural voice interactions.

It is intentionally product-facing and integration-facing, not a DSP implementation spec. The goal is to make turn-taking predictable across UI, transport, VAD, wake-word hooks, speech output, and agent orchestration.

## 1. Wave 1 Scope

Wave 1 covers:

- a single active conversational turn per session
- push-to-talk, always-listen VAD, and wake-hook entry modes
- half-duplex output with controlled barge-in
- explicit muted and privacy-safe idle behavior
- interruptible assistant speech with output ducking hooks
- integration contracts for `VoicePath` (audio I/O pipeline) and `AgentPulse` (agent lifecycle + response streaming)

Wave 1 does **not** require:

- full duplex spoken overlap between user and assistant
- diarization
- wake-word model design
- adaptive ML threshold tuning
- beamforming or acoustic echo cancellation internals
- long-term audio retention

## 2. Product Goals

The state machine should feel:

- **fast**: low friction to start speaking
- **forgiving**: short hesitations should not prematurely end a turn
- **interruptible**: the user can stop the assistant naturally
- **private by default**: muted means not listening; idle means minimal buffered audio
- **observable**: every transition is externally visible to orchestrators and UI

## 3. Interaction Modes

Wave 1 supports these input modes:

| Mode | Meaning | Entry paths |
| --- | --- | --- |
| `push_to_talk` | Mic is armed only while the user holds or toggles capture. | button press, hardware key |
| `vad_open_mic` | Mic stays available and VAD decides when a user turn starts/ends. | hands-free mode |
| `wake_hook` | Mic stays in low-retention pre-roll mode until an external wake hook arms capture. | wake word, external trigger |
| `muted` | Capture and wake detection are disabled. | explicit mute, privacy mode |

Mode changes are operator actions, not inferred state transitions.

## 4. Turn States

The runtime must expose exactly one primary turn state at a time:

| State | Meaning |
| --- | --- |
| `muted` | Audio capture disabled. No turn detection, no wake buffering. |
| `idle` | Ready but not currently in a user or assistant turn. |
| `arming` | Session is preparing to capture a possible user turn. |
| `listening` | User turn has started; capture is active and speech may still be tentative. |
| `user_speaking` | User speech is confidently active. |
| `user_hold` | Short silence hold window after detected speech, waiting to see if the user continues. |
| `thinking` | User turn ended; audio input for the turn is sealed and agent work is in progress. |
| `assistant_preparing` | Assistant output is imminent but audio has not started yet. |
| `assistant_speaking` | Assistant audio is actively rendering. |
| `assistant_ducked` | Assistant is still speaking, but output is attenuated because possible user interruption was detected. |
| `interrupted` | Assistant output was stopped by user intent and the system is handing back to input capture. |
| `error` | Audio/session contract failed and requires recovery or reset. |

## 5. Canonical Events

### User / device events

- `mode.set`
- `mute.on`
- `mute.off`
- `ptt.down`
- `ptt.up`
- `wake.detected`
- `cancel`
- `timeout`

### VoicePath events

- `input.audio_frame`
- `input.vad_started`
- `input.vad_ended`
- `input.level_changed`
- `input.echo_risk`
- `output.started`
- `output.ended`
- `output.duck_applied`
- `output.duck_released`
- `output.interrupted`
- `pipeline.error`

### AgentPulse events

- `turn.accepted`
- `turn.rejected`
- `agent.thinking_started`
- `agent.first_token`
- `agent.response_cancelled`
- `agent.completed`
- `agent.failed`

## 6. State Transition Contract

### `muted`

- Enter on `mute.on` or mode `muted`.
- Exit to `idle` only on `mute.off` with a non-muted mode selected.
- While muted, `VoicePath` must not emit live speech events upstream except health metrics.

### `idle`

- Enter after boot, after assistant output completes, or after recovery.
- Transition to `arming` on `ptt.down`, `wake.detected`, or VAD pre-speech activity in `vad_open_mic` mode.
- Ignore low-confidence noise.

### `arming`

Used to absorb tiny setup delays without claiming a full user turn.

- Transition to `listening` when capture is confirmed.
- Return to `idle` if arming timeout expires without speech.
- Go to `muted` immediately on `mute.on`.

### `listening`

- Transition to `user_speaking` on `input.vad_started` or sufficient speech confidence.
- Return to `idle` if the user never crosses speech confidence within the arming/listen window.
- Transition to `thinking` only if a valid but extremely short push-to-talk turn ends with enough captured audio to submit.

### `user_speaking`

- Remain while VAD speech is active.
- Transition to `user_hold` on `input.vad_ended`.
- If assistant output is currently active, user speech is treated as an interruption attempt.

### `user_hold`

This is the grace window that makes conversation feel natural.

- Return to `user_speaking` if speech resumes before the hold timer expires.
- Transition to `thinking` when hold timer expires and minimum utterance requirements were met.
- Transition to `idle` if the captured audio is below minimum turn requirements.

### `thinking`

- Emit a sealed user turn to `AgentPulse` exactly once.
- Transition to `assistant_preparing` on `agent.first_token` or on explicit output reservation.
- Return to `idle` on `turn.rejected`, `agent.failed`, or `cancel` when no assistant audio will play.

### `assistant_preparing`

- Transition to `assistant_speaking` on `output.started`.
- Return to `idle` if the response is cancelled before audio starts.
- May briefly show typing/thinking UI while audio buffers.

### `assistant_speaking`

- Transition to `assistant_ducked` when interruption suspicion crosses the duck threshold.
- Transition to `interrupted` when interruption confidence crosses the stop threshold.
- Transition to `idle` on `output.ended`.

### `assistant_ducked`

- Output remains audible but attenuated.
- Return to `assistant_speaking` when interruption suspicion clears.
- Transition to `interrupted` if user intent becomes clear.
- Transition to `idle` on `output.ended`.

### `interrupted`

- `VoicePath` stops assistant playback.
- The system re-arms input without waiting for assistant completion.
- Transition to `listening` or `user_speaking` once live capture resumes.
- Transition to `idle` if interruption does not resolve into a real user turn.

### `error`

- Enter on `pipeline.error` or invariant failure.
- Only exit via explicit recovery to `idle` or `muted`.

## 7. Thresholds and Timing Windows

Wave 1 defaults should be deterministic and configurable per device profile.

| Key | Default | Purpose |
| --- | ---: | --- |
| `preRollMs` | 300 | Buffered audio kept before wake/PTT activation. |
| `armingTimeoutMs` | 1200 | Max time to wait for user speech after arming. |
| `minSpeechMs` | 180 | Minimum voiced speech to count as a real turn. |
| `endOfTurnHoldMs` | 650 | Silence grace period before sealing a user turn. |
| `maxTurnMs` | 30000 | Hard cap on one user capture turn. |
| `interruptDuckLeadMs` | 120 | Time assistant output may stay ducked before stop decision escalates. |
| `interruptCommitMs` | 240 | Continuous interruption evidence needed to stop assistant playback. |
| `resumeFloorMs` | 200 | Silence needed to release ducking or restart idle detection. |
| `wakeLatchMs` | 8000 | Time wake-hook remains armed before expiring without speech. |
| `agentStartTimeoutMs` | 4000 | Max wait from sealed user turn to agent response start signal. |

### Threshold rules

- `minSpeechMs` must be less than `endOfTurnHoldMs`.
- `interruptDuckLeadMs` must be less than or equal to `interruptCommitMs`.
- `armingTimeoutMs` must be less than `wakeLatchMs`.
- Device or environment tuning may adjust values, but ordering semantics must remain stable.

## 8. Barge-In Policy

Wave 1 barge-in is **enabled but gated**.

### Allowed interruption paths

1. **Explicit**: `ptt.down` during assistant speech always interrupts immediately.
2. **Confident live speech**: VAD + level + non-echo evidence crosses the stop threshold.
3. **Wake-hook during assistant speech**: allowed only if the wake subsystem marks the event as user-originated rather than playback-originated.

### Two-stage interruption model

1. **Duck stage**: assistant output volume drops when interruption looks plausible.
2. **Commit stage**: playback stops only when user intent remains stable for `interruptCommitMs` or an explicit interrupt action occurs.

This avoids clipped answers from coughs, room noise, or self-echo.

### Barge-in disallow conditions

Barge-in must not auto-commit from VAD alone when:

- `VoicePath` reports `input.echo_risk=high`
- current mode is `muted`
- session is in `error`
- wake-hook confidence is below platform threshold

## 9. Duplex and Echo Hooks

Wave 1 behavior is operationally **half-duplex** even if the audio stack can physically capture and play simultaneously.

That means:

- user turns and assistant turns are logically exclusive
- simultaneous capture during assistant playback is permitted only for interruption detection
- assistant speech must not be forwarded to `AgentPulse` as user input

`VoicePath` must expose these hooks:

- `echoLikelihood: low | medium | high`
- `playbackReferenceActive: boolean`
- `inputSpeechConfidence: 0..1`
- `interruptConfidence: 0..1`
- `duckOutput(level)`
- `restoreOutput()`
- `stopOutput(reason)`

Wave 1 does not require implementing acoustic echo cancellation itself, but the state machine assumes `VoicePath` can distinguish probable playback bleed from live user speech well enough to gate interruption.

## 10. Push-to-Talk Contract

In `push_to_talk` mode:

- `ptt.down` moves `idle -> arming -> listening`
- `ptt.up` ends the active user turn immediately or enters a very short hold (`<=150ms`) to catch release-edge phonemes
- assistant speech is interrupted immediately on `ptt.down`
- no wake-hook logic is required while PTT is held

PTT is the highest-confidence override path and should bypass most VAD uncertainty.

## 11. Wake-Hook Contract

Wake-hook is intentionally abstract so platforms can plug in wake word, hardware button, or external attention signal implementations.

Requirements:

- wake-hook must emit `wake.detected` with confidence and source metadata
- wake-hook may unlock `arming` but may not itself create a completed user turn
- wake-triggered sessions expire after `wakeLatchMs` if the user does not actually speak
- wake detections during `muted` must be ignored

## 12. Silence and End-of-Turn Semantics

A user turn ends only when all are true:

- speech has crossed `minSpeechMs`
- VAD indicates speech ended or PTT was released
- `endOfTurnHoldMs` elapsed without resumed speech
- no explicit cancel was received

This prevents fragmentation from natural pauses like “uh… actually”.

## 13. Output Ducking Policy

Output ducking is part of the contract, not just a UX effect.

- Ducking must happen before hard interruption when interruption evidence is ambiguous.
- Ducking level should default to roughly `-12 dB` equivalent.
- Ducking must be reversible without rebuffering the response.
- UI should reflect ducked state separately from fully interrupted state.

## 14. Privacy Posture

Wave 1 privacy rules:

- `muted` means no active capture, no wake buffering, no server-bound audio frames
- `idle` may keep only bounded local pre-roll (`preRollMs`) for wake/PTT responsiveness
- pre-roll must stay in memory only and must not be persisted
- assistant playback references used for echo gating must not be stored as conversation history
- sealed user turns sent to `AgentPulse` must contain only the active turn payload and session metadata required for response generation
- raw live audio should be discarded after turn sealing unless a separate explicit recording feature exists

## 15. VoicePath Integration Contract

`VoicePath` owns device-facing audio behavior.

It must provide:

- capture start/stop control
- VAD start/end events
- speech confidence / level signals
- output playback lifecycle events
- duck / restore / interrupt methods
- echo-likelihood or playback-reference signals
- per-frame timestamps monotonic within the session

### Required event payload shape

```ts
interface VoicePathSignal {
  atMs: number;
  sessionId: string;
  stateHint?: string;
  confidence?: number;
  levelDbfs?: number;
  echoLikelihood?: "low" | "medium" | "high";
  source?: "mic" | "playback" | "system";
}
```

## 16. AgentPulse Integration Contract

`AgentPulse` owns conversational orchestration after a user turn is sealed.

It must support:

- accepting a sealed turn with timing metadata
- signalling thinking start
- signalling first-token / response-available start
- streaming cancellation on interruption
- completion and failure events tied to the turn id

### Required turn submission fields

```ts
interface SealedUserTurn {
  turnId: string;
  sessionId: string;
  mode: "push_to_talk" | "vad_open_mic" | "wake_hook";
  startedAtMs: number;
  sealedAtMs: number;
  speechMs: number;
  interruptionOfTurnId?: string;
  transcript?: string;
  audioRef?: string;
}
```

### Interruption contract

When the user barges in during assistant speech:

1. `VoicePath.stopOutput("barge_in")`
2. runtime emits `output.interrupted`
3. runtime marks next sealed turn with `interruptionOfTurnId`
4. `AgentPulse` cancels the interrupted response stream and begins a new turn

## 17. Observability

Every transition should emit:

- `fromState`
- `toState`
- `event`
- `sessionId`
- `turnId` when present
- `atMs`
- `reason`

Minimum counters:

- completed turns
- abandoned arming attempts
- false interruption ducks
- committed interruptions
- agent start timeouts
- pipeline errors

## 18. Wave 1 Invariants

The runtime must preserve these invariants:

1. Only one sealed user turn may be in-flight to `AgentPulse` at a time.
2. Assistant output may not begin before a user turn is sealed.
3. `muted` blocks all wake and VAD turn starts.
4. `assistant_speaking` and `user_speaking` may not both be the primary state at once.
5. `assistant_ducked` is a subtype of active assistant playback, not a separate completed turn.
6. An interruption creates a new user turn or resolves back to idle; it must not leave the session orphaned.

## 19. Recommended Wave 1 UI Mapping

| State | UI expectation |
| --- | --- |
| `muted` | Mic off / privacy visible |
| `idle` | Ready indicator |
| `arming` | Mic arming pulse |
| `listening` | Active listening pulse |
| `user_speaking` | Strong live input meter |
| `user_hold` | Hold / waiting for more speech |
| `thinking` | Processing / thinking |
| `assistant_preparing` | Response incoming |
| `assistant_speaking` | Speaking animation |
| `assistant_ducked` | Speaking + interrupted hint |
| `interrupted` | Switched back to listening |
| `error` | Recovery needed |

## 20. Out of Scope for Later Waves

Later waves may add:

- full duplex conversation
- adaptive thresholds based on environment
- diarized multi-speaker handling
- continuous wake + wake cancellation learning
- richer echo suppression and endpointing models
- cross-device handoff

Wave 1 should ship only when the above state and event contract is stable across UI, runtime, `VoicePath`, and `AgentPulse`.
