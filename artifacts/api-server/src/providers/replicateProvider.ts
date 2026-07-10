import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Replicate provider adapter.
 * Set REPLICATE_API_TOKEN environment variable to enable.
 *
 * TODO: Choose a specific model from https://replicate.com/explore?tag=video
 * and fill in MODEL_ID below (e.g. "stability-ai/stable-video-diffusion").
 */
const MODEL_ID = "TODO:stability-ai/stable-video-diffusion:version-hash";
const API_BASE = "https://api.replicate.com/v1";

export const replicateProvider: VideoProvider = {
  id: "replicate",
  name: "Replicate",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5, 10],
  supportedAspectRatios: ["16:9", "9:16", "1:1"],
  description: "Run open-source video models via Replicate.",

  async generateVideo(
    input: VideoGenerationInput,
  ): Promise<GenerationResult> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error("REPLICATE_API_TOKEN not set");

    // TODO: Adjust input mapping to the chosen model's schema
    const response = await fetch(`${API_BASE}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: MODEL_ID,
        input: {
          prompt: input.enhancedPrompt ?? input.prompt,
          negative_prompt: input.negativePrompt,
          num_frames: input.duration * 8,
          seed: input.seed ?? undefined,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Replicate API error: ${err}`);
    }

    const data = (await response.json()) as { id: string; status: string };
    return {
      providerJobId: data.id,
      status: "queued",
    };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error("REPLICATE_API_TOKEN not set");

    const response = await fetch(`${API_BASE}/predictions/${jobId}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    if (!response.ok) {
      return { status: "failed", errorMessage: "Failed to fetch status" };
    }

    const data = (await response.json()) as {
      status: string;
      output?: string | string[];
      error?: string;
    };

    if (data.status === "succeeded") {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      return { status: "completed", videoUrl: output };
    } else if (data.status === "failed" || data.status === "canceled") {
      return { status: "failed", errorMessage: data.error ?? "Generation failed" };
    }
    return { status: "processing", progressMessage: "Replicate is processing" };
  },
};
