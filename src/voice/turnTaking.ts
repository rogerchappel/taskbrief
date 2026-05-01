export type TurnInputMode = "push_to_talk" | "vad_open_mic" | "wake_hook" | "muted";

export type TurnState =
  | "muted"
  | "idle"
  | "arming"
  | "listening"
  | "user_speaking"
  | "user_hold"
  | "thinking"
  | "assistant_preparing"
  | "assistant_speaking"
  | "assistant_ducked"
  | "interrupted"
  | "error";

export type TurnEvent =
  | "mode.set"
  | "mute.on"
  | "mute.off"
  | "ptt.down"
  | "ptt.up"
  | "wake.detected"
  | "cancel"
  | "timeout"
  | "input.audio_frame"
  | "input.vad_started"
  | "input.vad_ended"
  | "input.level_changed"
  | "input.echo_risk"
  | "output.started"
  | "output.ended"
  | "output.duck_applied"
  | "output.duck_released"
  | "output.interrupted"
  | "pipeline.error"
  | "turn.accepted"
  | "turn.rejected"
  | "agent.thinking_started"
  | "agent.first_token"
  | "agent.response_cancelled"
  | "agent.completed"
  | "agent.failed";

export type EchoLikelihood = "low" | "medium" | "high";

export interface TurnTimingPolicy {
  preRollMs: number;
  armingTimeoutMs: number;
  minSpeechMs: number;
  endOfTurnHoldMs: number;
  maxTurnMs: number;
  interruptDuckLeadMs: number;
  interruptCommitMs: number;
  resumeFloorMs: number;
  wakeLatchMs: number;
  agentStartTimeoutMs: number;
}

export interface TurnThresholdPolicy {
  speechConfidenceStart: number;
  speechConfidenceContinue: number;
  interruptDuckConfidence: number;
  interruptCommitConfidence: number;
  wakeConfidence: number;
}

export interface BargeInPolicy {
  enabled: boolean;
  explicitPttAlwaysInterrupts: boolean;
  wakeHookCanInterrupt: boolean;
  allowVadInterruptWhenEchoHigh: boolean;
  duckDb: number;
}

export interface TurnTakingPolicyContract {
  version: "wave1";
  defaultMode: TurnInputMode;
  timings: TurnTimingPolicy;
  thresholds: TurnThresholdPolicy;
  bargeIn: BargeInPolicy;
}

export interface TurnTransition {
  from: TurnState;
  event: TurnEvent;
  to: TurnState;
  notes: string;
}

export interface VoicePathSignal {
  atMs: number;
  sessionId: string;
  stateHint?: TurnState;
  confidence?: number;
  levelDbfs?: number;
  echoLikelihood?: EchoLikelihood;
  source?: "mic" | "playback" | "system";
}

export interface SealedUserTurn {
  turnId: string;
  sessionId: string;
  mode: Exclude<TurnInputMode, "muted">;
  startedAtMs: number;
  sealedAtMs: number;
  speechMs: number;
  interruptionOfTurnId?: string;
  transcript?: string;
  audioRef?: string;
}

export const wave1TurnTakingPolicy: TurnTakingPolicyContract = {
  version: "wave1",
  defaultMode: "vad_open_mic",
  timings: {
    preRollMs: 300,
    armingTimeoutMs: 1200,
    minSpeechMs: 180,
    endOfTurnHoldMs: 650,
    maxTurnMs: 30_000,
    interruptDuckLeadMs: 120,
    interruptCommitMs: 240,
    resumeFloorMs: 200,
    wakeLatchMs: 8_000,
    agentStartTimeoutMs: 4_000,
  },
  thresholds: {
    speechConfidenceStart: 0.62,
    speechConfidenceContinue: 0.45,
    interruptDuckConfidence: 0.55,
    interruptCommitConfidence: 0.78,
    wakeConfidence: 0.72,
  },
  bargeIn: {
    enabled: true,
    explicitPttAlwaysInterrupts: true,
    wakeHookCanInterrupt: true,
    allowVadInterruptWhenEchoHigh: false,
    duckDb: -12,
  },
};

export const wave1TurnTransitions: TurnTransition[] = [
  { from: "muted", event: "mute.off", to: "idle", notes: "Leave privacy mode when a listening mode is restored." },
  { from: "idle", event: "ptt.down", to: "arming", notes: "Explicit push-to-talk begins capture arming." },
  { from: "idle", event: "wake.detected", to: "arming", notes: "Wake-hook opens a bounded listening window." },
  { from: "arming", event: "input.vad_started", to: "listening", notes: "Confirmed live capture starts the turn." },
  { from: "arming", event: "timeout", to: "idle", notes: "Arming expires when the user never starts speaking." },
  { from: "listening", event: "input.vad_started", to: "user_speaking", notes: "Speech confidence crosses the start threshold." },
  { from: "user_speaking", event: "input.vad_ended", to: "user_hold", notes: "Hold briefly before sealing the turn." },
  { from: "user_hold", event: "input.vad_started", to: "user_speaking", notes: "Resume the same turn if speech comes back quickly." },
  { from: "user_hold", event: "timeout", to: "thinking", notes: "Silence window elapsed, seal the user turn." },
  { from: "thinking", event: "agent.first_token", to: "assistant_preparing", notes: "Agent output is now imminent." },
  { from: "assistant_preparing", event: "output.started", to: "assistant_speaking", notes: "Playback starts." },
  { from: "assistant_speaking", event: "input.vad_started", to: "assistant_ducked", notes: "Plausible interruption ducks output first." },
  { from: "assistant_ducked", event: "output.interrupted", to: "interrupted", notes: "Assistant playback stops on committed barge-in." },
  { from: "interrupted", event: "input.vad_started", to: "user_speaking", notes: "The interruption becomes the next user turn." },
  { from: "assistant_speaking", event: "output.ended", to: "idle", notes: "Assistant completed normally." },
  { from: "assistant_ducked", event: "output.ended", to: "idle", notes: "Assistant completed while ducked." },
  { from: "idle", event: "mute.on", to: "muted", notes: "Privacy mode overrides readiness." },
  { from: "assistant_speaking", event: "mute.on", to: "muted", notes: "Muting stops output and capture immediately." },
  { from: "thinking", event: "agent.failed", to: "idle", notes: "Return to idle after an agent failure without playback." },
  { from: "idle", event: "pipeline.error", to: "error", notes: "Pipeline failures require recovery." },
];

export function validateWave1Policy(policy: TurnTakingPolicyContract): string[] {
  const issues: string[] = [];

  if (policy.timings.minSpeechMs >= policy.timings.endOfTurnHoldMs) {
    issues.push("minSpeechMs must be less than endOfTurnHoldMs");
  }

  if (policy.timings.interruptDuckLeadMs > policy.timings.interruptCommitMs) {
    issues.push("interruptDuckLeadMs must be less than or equal to interruptCommitMs");
  }

  if (policy.timings.armingTimeoutMs >= policy.timings.wakeLatchMs) {
    issues.push("armingTimeoutMs must be less than wakeLatchMs");
  }

  if (policy.thresholds.speechConfidenceContinue > policy.thresholds.speechConfidenceStart) {
    issues.push("speechConfidenceContinue must be less than or equal to speechConfidenceStart");
  }

  if (policy.thresholds.interruptDuckConfidence > policy.thresholds.interruptCommitConfidence) {
    issues.push("interruptDuckConfidence must be less than or equal to interruptCommitConfidence");
  }

  return issues;
}
