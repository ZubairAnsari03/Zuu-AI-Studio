import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Kling AI provider adapter.
 * Set KLING_API_KEY environment variable to enable.
 *
 * TODO: Fill in the correct API base URL and endpoint paths from Kling docs.
 * Docs: https://docs.qingque.cn/d/home/eZQDvj3S8xHCgTlqWaFiX8FmS
 */
const API_BASE = "https://api.klingai.com/v1"; // TODO: verify base URL

export const klingProvider: VideoProvider = {
  id: "kling",
  name: "Kling AI",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5, 10],
  supportedAspectRatios: ["16:9", "9:16", "1:1"],
  description: "High-quality cinematic video generation by Kling AI.",

  async generateVideo(
    input: VideoGenerationInput,
  ): Promise<GenerationResult> {
    const apiKey = process.env.KLING_API_KEY;
    if (!apiKey) throw new Error("KLING_API_KEY not set");

    // TODO: Replace with actual Kling AI request body schema
    const response = await fetch(`${API_BASE}/videos/text2video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input.enhancedPrompt ?? input.prompt,
        negative_prompt: input.negativePrompt,
        aspect_ratio: input.aspectRatio,
        duration: String(input.duration),
        cfg_scale: 0.5,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Kling API error: ${err}`);
    }

    const data = (await response.json()) as { data?: { task_id: string } };
    const taskId = data.data?.task_id;
    if (!taskId) throw new Error("No task_id returned from Kling");

    return { providerJobId: taskId, status: "queued" };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const apiKey = process.env.KLING_API_KEY;
    if (!apiKey) throw new Error("KLING_API_KEY not set");

    // TODO: Replace with actual Kling status endpoint and response shape
    const response = await fetch(
      `${API_BASE}/videos/text2video/${jobId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!response.ok) {
      return { status: "failed", errorMessage: "Failed to fetch Kling status" };
    }

    const data = (await response.json()) as {
      data?: { task_status: string; task_result?: { videos?: { url: string }[] } };
    };

    const taskStatus = data.data?.task_status;
    if (taskStatus === "succeed") {
      const videoUrl = data.data?.task_result?.videos?.[0]?.url;
      return { status: "completed", videoUrl };
    } else if (taskStatus === "failed") {
      return { status: "failed", errorMessage: "Kling generation failed" };
    }
    return { status: "processing", progressMessage: "Kling is generating" };
  },
};
