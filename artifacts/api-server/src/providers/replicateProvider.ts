import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Replicate provider — uses minimax/video-01 for text-to-video and
 * minimax/video-01-image-to-video for image-to-video.
 *
 * Set REPLICATE_API_TOKEN in Replit Secrets to enable.
 * Model docs: https://replicate.com/minimax/video-01
 */
const API_BASE = "https://api.replicate.com/v1";
const T2V_MODEL = "minimax/video-01";
const I2V_MODEL = "minimax/video-01-image-to-video";

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
  logs?: string | null;
};

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Prefer: "wait=5", // short-poll on create; saves a status round-trip when fast
  };
}

export const replicateProvider: VideoProvider = {
  id: "replicate",
  name: "Replicate (Minimax)",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5, 6],
  supportedAspectRatios: ["16:9", "9:16", "1:1"],
  description:
    "Run the Minimax video-01 model on Replicate — high-quality cinematic text-to-video.",

  async generateVideo(input: VideoGenerationInput): Promise<GenerationResult> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error("REPLICATE_API_TOKEN not set");

    const useI2V = !!(input.referenceImageUrl);
    const model = useI2V ? I2V_MODEL : T2V_MODEL;
    const prompt = input.enhancedPrompt ?? input.prompt;

    const body = useI2V
      ? {
          input: {
            prompt,
            first_frame_image: input.referenceImageUrl,
            prompt_optimizer: true,
          },
        }
      : {
          input: {
            prompt,
            prompt_optimizer: true,
          },
        };

    const response = await fetch(
      `${API_BASE}/models/${model}/predictions`,
      {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Replicate API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as ReplicatePrediction;

    // If Prefer:wait resolved immediately
    if (data.status === "succeeded") {
      return {
        providerJobId: data.id,
        status: "completed",
        progressMessage: "Completed",
      };
    }

    return {
      providerJobId: data.id,
      status: "queued",
      progressMessage: "Replicate prediction created",
    };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error("REPLICATE_API_TOKEN not set");

    const response = await fetch(`${API_BASE}/predictions/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return { status: "failed", errorMessage: `Status fetch failed (${response.status})` };
    }

    const data = (await response.json()) as ReplicatePrediction;

    switch (data.status) {
      case "succeeded": {
        const raw = data.output;
        const videoUrl =
          typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
        return { status: "completed", videoUrl };
      }
      case "failed":
        return {
          status: "failed",
          errorMessage: data.error ?? "Replicate generation failed",
        };
      case "canceled":
        return { status: "cancelled" };
      case "processing":
        return {
          status: "processing",
          progressMessage:
            (data.logs?.split("\n").filter(Boolean).at(-1)) ??
            "Replicate is generating your video",
        };
      default: // starting
        return { status: "queued", progressMessage: "Waiting to start on Replicate" };
    }
  },

  async cancelGeneration(jobId: string): Promise<void> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) return;
    await fetch(`${API_BASE}/predictions/${jobId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  },
};
