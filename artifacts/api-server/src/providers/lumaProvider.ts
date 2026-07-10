import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Luma Dream Machine provider adapter.
 * Set LUMA_API_KEY environment variable to enable.
 *
 * TODO: Fill in endpoint details from Luma API docs.
 * Docs: https://lumalabs.ai/dream-machine/api/docs
 */
const API_BASE = "https://api.lumalabs.ai/dream-machine/v1alpha";

export const lumaProvider: VideoProvider = {
  id: "luma",
  name: "Luma Dream Machine",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5],
  supportedAspectRatios: ["16:9", "9:16", "4:3", "3:4", "21:9", "9:21"],
  description: "Photorealistic video generation by Luma Dream Machine.",

  async generateVideo(
    input: VideoGenerationInput,
  ): Promise<GenerationResult> {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) throw new Error("LUMA_API_KEY not set");

    // TODO: Adjust to actual Luma request body schema
    const body: Record<string, unknown> = {
      prompt: input.enhancedPrompt ?? input.prompt,
      aspect_ratio: input.aspectRatio,
      loop: false,
    };

    if (input.referenceImageUrl) {
      body.keyframes = {
        frame0: { type: "image", url: input.referenceImageUrl },
      };
    }

    const response = await fetch(`${API_BASE}/generations/video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Luma API error: ${err}`);
    }

    const data = (await response.json()) as { id: string; state: string };
    return { providerJobId: data.id, status: "queued" };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) throw new Error("LUMA_API_KEY not set");

    const response = await fetch(
      `${API_BASE}/generations/${jobId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!response.ok) {
      return { status: "failed", errorMessage: "Failed to fetch Luma status" };
    }

    const data = (await response.json()) as {
      state: string;
      assets?: { video?: string };
      failure_reason?: string;
    };

    if (data.state === "completed") {
      return { status: "completed", videoUrl: data.assets?.video };
    } else if (data.state === "failed") {
      return {
        status: "failed",
        errorMessage: data.failure_reason ?? "Luma generation failed",
      };
    }
    return { status: "processing", progressMessage: "Luma is dreaming" };
  },
};
