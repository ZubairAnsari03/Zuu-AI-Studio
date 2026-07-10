import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Pika provider adapter.
 * Set PIKA_API_KEY environment variable to enable.
 *
 * TODO: Fill in endpoint details from Pika API docs.
 * Docs: https://pika.art/api (check for latest API docs)
 */
const API_BASE = "https://api.pika.art/v1"; // TODO: verify base URL

export const pikaProvider: VideoProvider = {
  id: "pika",
  name: "Pika",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [3, 5, 10],
  supportedAspectRatios: ["16:9", "9:16", "1:1"],
  description: "Creative AI video generation by Pika.",

  async generateVideo(
    input: VideoGenerationInput,
  ): Promise<GenerationResult> {
    const apiKey = process.env.PIKA_API_KEY;
    if (!apiKey) throw new Error("PIKA_API_KEY not set");

    // TODO: Adjust to actual Pika request body schema
    const response = await fetch(`${API_BASE}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText: input.enhancedPrompt ?? input.prompt,
        negativePrompt: input.negativePrompt,
        aspectRatio: input.aspectRatio,
        duration: input.duration,
        seed: input.seed ?? undefined,
        options: {
          motion: input.motionStrength === "high" ? 3 : input.motionStrength === "low" ? 1 : 2,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pika API error: ${err}`);
    }

    const data = (await response.json()) as { job?: { id: string } };
    const jobId = data.job?.id;
    if (!jobId) throw new Error("No job ID returned from Pika");

    return { providerJobId: jobId, status: "queued" };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.PIKA_API_KEY;
    if (!apiKey) throw new Error("PIKA_API_KEY not set");

    // TODO: Adjust to actual Pika status endpoint and response shape
    const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return { status: "failed", errorMessage: "Failed to fetch Pika status" };
    }

    const data = (await response.json()) as {
      status?: string;
      resultUrl?: string;
      error?: string;
    };

    if (data.status === "completed" || data.status === "success") {
      return { status: "completed", videoUrl: data.resultUrl };
    } else if (data.status === "failed" || data.status === "error") {
      return { status: "failed", errorMessage: data.error ?? "Pika generation failed" };
    }
    return { status: "processing", progressMessage: "Pika is generating" };
  },
};
