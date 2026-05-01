import { describe, expect, it } from "vitest";
import {
  VOICEPATH_LATENCY_BUDGETS,
  type AudioChunkEvent,
  type VoiceFallbackReason,
  type VoiceProvider,
  type VoiceRouteRequest,
} from "../../src/voicepath/index.js";

describe("voicepath routing contract", () => {
  it("keeps realtime first-audio budget under the product hard deadline", () => {
    expect(VOICEPATH_LATENCY_BUDGETS.realtime.firstAudioTargetMs).toBeLessThan(
      VOICEPATH_LATENCY_BUDGETS.realtime.firstAudioHardDeadlineMs,
    );
  });

  it("models first-audio fallback as an explicit normalized reason", () => {
    const reason: VoiceFallbackReason = "first_audio_deadline_exceeded";
    expect(reason).toBe("first_audio_deadline_exceeded");
  });

  it("requires audio chunks to identify sentence, provider, and voice continuity", () => {
    const chunk: AudioChunkEvent = {
      eventId: "evt_1",
      utteranceId: "utt_1",
      sequence: 5,
      timestamp: "2026-05-01T07:30:00.000Z",
      traceId: "trace_1",
      type: "audio_chunk",
      segmentId: "seg_1",
      sentenceIndex: 0,
      providerId: "fast-tts",
      voiceId: "voice_a",
      format: { encoding: "mp3", sampleRateHz: 24_000, channels: 1 },
      chunkIndex: 0,
      byteLength: 3,
      audio: new Uint8Array([1, 2, 3]),
      isFinalChunkForSentence: false,
    };

    expect(chunk.providerId).toBe("fast-tts");
    expect(chunk.voiceId).toBe("voice_a");
    expect(chunk.sentenceIndex).toBe(0);
  });

  it("defines the provider interface and routing request shape", () => {
    const request: VoiceRouteRequest = {
      utteranceId: "utt_1",
      text: "Hello there.",
      locale: "en-AU",
      continuityKey: "conversation:demo:assistant",
      requestedAt: "2026-05-01T07:30:00.000Z",
      latencyClass: "interactive",
    };

    const provider = null as unknown as VoiceProvider;
    expect(request.latencyClass).toBe("interactive");
    expect(provider).toBeNull();
  });
});
