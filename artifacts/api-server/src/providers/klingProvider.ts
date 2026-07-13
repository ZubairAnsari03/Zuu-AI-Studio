import { sign } from "jsonwebtoken";
import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

/**
 * Kling AI provider adapter.
 *
 * Set KLING_ACCESS_KEY and KLING_SECRET_KEY in Replit Secrets to enable.
 * Kling uses HMAC-SHA256 JWT authentication (not a plain Bearer token).
 *
 * Docs: https://docs.qingque.cn/d/home/eZQDvj3S8xHCgTlqWaFiX8FmS
 */
const API_BASE = "https://api.klingai.com/v1";

type KlingTaskStatus =
  | "submitted"
  | "processing"
  | "succeed"
  | "failed";

type KlingCreateResponse = {
  code: number;
  message: string;
  request_id: string;
  data?: {
    task_id: string;
    task_status: KlingTaskStatus;
  };
};

type KlingStatusResponse = {
  code: number;
  message: string;
  data?: {
    task_id: string;
    task_status: KlingTaskStatus;
    task_status_msg?: string;
    task_result?: {
      videos?: Array<{ id: string; url: string; duration: string }>;
    };
  };
};

/** Generate a short-lived JWT the way Kling's API expects. */
function makeKlingJWT(accessKey: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { iss: accessKey, exp: now + 1800, nbf: now - 5 },
    secretKey,
    // jsonwebtoken adds alg/typ automatically via HS256
    { algorithm: "HS256" },
  );
}

function klingHeaders(accessKey: string, secretKey: string) {
  return {
    Authorization: `Bearer ${makeKlingJWT(accessKey, secretKey)}`,
    "Content-Type": "application/json",
  };
}

/** Map our generic aspect-ratio strings to Kling's accepted values. */
function mapAspectRatio(ar: string): string {
  const map: Record<string, string> = {
    "16:9": "16:9",
    "9:16": "9:16",
    "1:1": "1:1",
    "4:5": "4:5",
    "4:3": "4:3",
    "3:4": "3:4",
  };
  return map[ar] ?? "16:9";
}

/** Clamp duration to Kling's accepted values ("5" or "10"). */
function mapDuration(seconds: number): string {
  return seconds <= 5 ? "5" : "10";
}

export const klingProvider: VideoProvider = {
  id: "kling",
  name: "Kling AI",
  isMock: false,
  supportsImageToVideo: true,
  supportedDurations: [5, 10],
  supportedAspectRatios: ["16:9", "9:16", "1:1", "4:5"],
  description:
    "High-quality cinematic video generation by Kuaishou's Kling AI — photorealistic motion.",

  async generateVideo(input: VideoGenerationInput): Promise<GenerationResult> {
    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;
    if (!accessKey || !secretKey)
      throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY must both be set");

    const headers = klingHeaders(accessKey, secretKey);
    const prompt = input.enhancedPrompt ?? input.prompt;
    const duration = mapDuration(input.duration);
    const aspect_ratio = mapAspectRatio(input.aspectRatio);
    const useI2V = !!(input.referenceImageUrl);

    let response: Response;

    if (useI2V) {
      response = await fetch(`${API_BASE}/videos/image2video`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model_name: "kling-v1",
          image: input.referenceImageUrl,
          prompt,
          negative_prompt: input.negativePrompt ?? undefined,
          cfg_scale: 0.5,
          duration,
        }),
      });
    } else {
      response = await fetch(`${API_BASE}/videos/text2video`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model_name: "kling-v1",
          prompt,
          negative_prompt: input.negativePrompt ?? undefined,
          cfg_scale: 0.5,
          mode: "std",
          duration,
          aspect_ratio,
        }),
      });
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Kling API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as KlingCreateResponse;
    if (data.code !== 0 || !data.data?.task_id) {
      throw new Error(`Kling rejected request: ${data.message}`);
    }

    return {
      providerJobId: data.data.task_id,
      status: "queued",
      progressMessage: "Kling task submitted",
    };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;
    if (!accessKey || !secretKey)
      throw new Error("KLING_ACCESS_KEY and KLING_SECRET_KEY must both be set");

    const response = await fetch(
      `${API_BASE}/videos/text2video/${jobId}`,
      { headers: klingHeaders(accessKey, secretKey) },
    );

    if (!response.ok) {
      return { status: "failed", errorMessage: `Kling status fetch failed (${response.status})` };
    }

    const data = (await response.json()) as KlingStatusResponse;
    const task = data.data;

    if (!task) {
      return { status: "failed", errorMessage: data.message ?? "Empty response from Kling" };
    }

    switch (task.task_status) {
      case "succeed": {
        const videoUrl = task.task_result?.videos?.[0]?.url;
        return { status: "completed", videoUrl };
      }
      case "failed":
        return {
          status: "failed",
          errorMessage: task.task_status_msg ?? "Kling generation failed",
        };
      case "processing":
        return {
          status: "processing",
          progressMessage: task.task_status_msg ?? "Kling is generating your video",
        };
      default: // submitted
        return { status: "queued", progressMessage: "Kling task queued" };
    }
  },
};
