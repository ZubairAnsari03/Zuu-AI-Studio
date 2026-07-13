import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Runway ML provider adapter — uses Gen-4 Turbo for text-to-video
 * and Gen-3 Alpha Turbo for image-to-video.
 *
 * Set RUNWAY_API_KEY in Replit Secrets to enable.
 * Docs: https://docs.runwayml.com/
 */
const API_BASE = "https://api.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

type RunwayTask = {
  id: string;
  status: "PENDING" | "THROTTLED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  progress?: number;
  output?: string[];
  failure?: string;
  failureCode?: string;
};

function runwayHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_VERSION,
  };
}

/** Map our aspect-ratio to Runway's "ratio" format (WxH). */
function mapRatio(ar: string): string {
  const map: Record<string, string> = {
    "16:9": "1280:768",
    "9:16": "768:1280",
    "1:1":  "960:960",
    "4:5":  "864:1080",
    "4:3":  "1024:768",
    "3:4":  "768:1024",
  };
  return map[ar] ?? "1280:768";
}

/** Clamp duration to Runway's accepted values (5 or 10). */
function mapDuration(seconds: number): number {
  return seconds <= 5 ? 5 : 10;
}

export const runwayProvider: VideoProvider = {
  id: "runway",
  name: "Runway Gen-4",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5, 10],
  supportedAspectRatios: ["16:9", "9:16", "1:1", "4:5"],
  description:
    "Runway Gen-4 Turbo — Hollywood-grade AI video, industry-standard motion quality.",

  async generateVideo(input: VideoGenerationInput): Promise<GenerationResult> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) throw new Error("RUNWAY_API_KEY not set");

    const prompt = input.enhancedPrompt ?? input.prompt;
    const ratio = mapRatio(input.aspectRatio);
    const duration = mapDuration(input.duration);
    const useI2V = !!(input.referenceImageUrl);

    let body: Record<string, unknown>;
    let endpoint: string;

    if (useI2V) {
      // Gen-3 Alpha Turbo — image + prompt → video
      endpoint = `${API_BASE}/image_to_video`;
      body = {
        model: "gen3a_turbo",
        promptImage: input.referenceImageUrl,
        promptText: prompt,
        duration,
        ratio,
        seed: input.seed ?? undefined,
      };
    } else {
      // Gen-4 Turbo — text → video
      endpoint = `${API_BASE}/text_to_video`;
      body = {
        model: "gen4_turbo",
        text_prompt: prompt,
        duration,
        ratio,
        seed: input.seed ?? undefined,
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: runwayHeaders(apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Runway API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { id: string };
    return {
      providerJobId: data.id,
      status: "queued",
      progressMessage: "Runway task created",
    };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) throw new Error("RUNWAY_API_KEY not set");

    const response = await fetch(`${API_BASE}/tasks/${jobId}`, {
      headers: runwayHeaders(apiKey),
    });

    if (!response.ok) {
      return {
        status: "failed",
        errorMessage: `Runway status fetch failed (${response.status})`,
      };
    }

    const data = (await response.json()) as RunwayTask;

    switch (data.status) {
      case "SUCCEEDED":
        return { status: "completed", videoUrl: data.output?.[0] };

      case "FAILED":
        return {
          status: "failed",
          errorMessage: data.failure ?? data.failureCode ?? "Runway generation failed",
        };

      case "CANCELLED":
        return { status: "cancelled" };

      case "RUNNING":
        return {
          status: "processing",
          progressMessage: data.progress
            ? `Runway rendering — ${Math.round(data.progress * 100)}%`
            : "Runway is rendering your video",
        };

      default: // PENDING | THROTTLED
        return { status: "queued", progressMessage: "Waiting in Runway queue" };
    }
  },

  async cancelGeneration(jobId: string): Promise<void> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) return;
    await fetch(`${API_BASE}/tasks/${jobId}/cancel`, {
      method: "POST",
      headers: runwayHeaders(apiKey),
    });
  },
};
