import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Runway provider adapter.
 * Set RUNWAY_API_KEY environment variable to enable.
 *
 * TODO: Fill in request/response shapes from Runway API docs.
 * Docs: https://docs.runwayml.com/
 */
const API_BASE = "https://api.runwayml.com/v1";

export const runwayProvider: VideoProvider = {
  id: "runway",
  name: "Runway",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5, 10],
  supportedAspectRatios: ["16:9", "9:16"],
  description: "Professional AI video generation by Runway.",

  async generateVideo(
    input: VideoGenerationInput,
  ): Promise<GenerationResult> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) throw new Error("RUNWAY_API_KEY not set");

    // TODO: Map to actual Runway Gen-3 request shape
    const response = await fetch(`${API_BASE}/image_to_video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptText: input.enhancedPrompt ?? input.prompt,
        duration: input.duration,
        ratio: input.aspectRatio,
        seed: input.seed ?? undefined,
        ...(input.referenceImageUrl
          ? { promptImage: input.referenceImageUrl }
          : {}),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Runway API error: ${err}`);
    }

    const data = (await response.json()) as { id: string };
    return { providerJobId: data.id, status: "queued" };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) throw new Error("RUNWAY_API_KEY not set");

    const response = await fetch(`${API_BASE}/tasks/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    });

    if (!response.ok) {
      return { status: "failed", errorMessage: "Failed to fetch Runway status" };
    }

    const data = (await response.json()) as {
      status: string;
      output?: string[];
      failure?: string;
    };

    if (data.status === "SUCCEEDED") {
      return { status: "completed", videoUrl: data.output?.[0] };
    } else if (data.status === "FAILED") {
      return {
        status: "failed",
        errorMessage: data.failure ?? "Runway generation failed",
      };
    }
    return { status: "processing", progressMessage: "Runway is rendering" };
  },
};
