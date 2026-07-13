import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Luma Dream Machine provider adapter.
 * Set LUMA_API_KEY in Replit Secrets to enable.
 *
 * Docs: https://lumalabs.ai/dream-machine/api/docs
 */
const API_BASE = "https://api.lumalabs.ai/dream-machine/v1alpha";

type LumaState = "queued" | "dreaming" | "completed" | "failed";

type LumaGeneration = {
  id: string;
  state: LumaState;
  failure_reason?: string;
  assets?: {
    video?: string;
    image?: string;
  };
};

type LumaCreateResponse = {
  id: string;
  state: LumaState;
  failure_reason?: string;
};

function lumaHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Luma accepts specific aspect ratio strings. */
function mapAspectRatio(ar: string): string {
  const map: Record<string, string> = {
    "16:9":  "16:9",
    "9:16":  "9:16",
    "1:1":   "1:1",
    "4:3":   "4:3",
    "3:4":   "3:4",
    "21:9":  "21:9",
    "9:21":  "9:21",
    "4:5":   "4:5",
  };
  return map[ar] ?? "16:9";
}

export const lumaProvider: VideoProvider = {
  id: "luma",
  name: "Luma Dream Machine",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5],
  supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"],
  description:
    "Photorealistic video generation by Luma AI's Dream Machine — stunning motion and lighting.",

  async generateVideo(input: VideoGenerationInput): Promise<GenerationResult> {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) throw new Error("LUMA_API_KEY not set");

    const prompt = input.enhancedPrompt ?? input.prompt;
    const aspect_ratio = mapAspectRatio(input.aspectRatio);

    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio,
      loop: false,
    };

    // Add keyframe for image-to-video
    if (input.referenceImageUrl) {
      body.keyframes = {
        frame0: {
          type: "image",
          url: input.referenceImageUrl,
        },
      };
    }

    const response = await fetch(`${API_BASE}/generations`, {
      method: "POST",
      headers: lumaHeaders(apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Luma API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as LumaCreateResponse;
    return {
      providerJobId: data.id,
      status: "queued",
      progressMessage: "Luma Dream Machine queued",
    };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) throw new Error("LUMA_API_KEY not set");

    const response = await fetch(`${API_BASE}/generations/${jobId}`, {
      headers: lumaHeaders(apiKey),
    });

    if (!response.ok) {
      return {
        status: "failed",
        errorMessage: `Luma status fetch failed (${response.status})`,
      };
    }

    const data = (await response.json()) as LumaGeneration;

    switch (data.state) {
      case "completed":
        return {
          status: "completed",
          videoUrl: data.assets?.video,
          thumbnailUrl: data.assets?.image,
        };

      case "failed":
        return {
          status: "failed",
          errorMessage: data.failure_reason ?? "Luma Dream Machine generation failed",
        };

      case "dreaming":
        return {
          status: "processing",
          progressMessage: "Luma Dream Machine is dreaming up your video",
        };

      default: // queued
        return { status: "queued", progressMessage: "Waiting in Luma queue" };
    }
  },
};
