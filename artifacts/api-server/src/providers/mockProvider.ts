import type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";

// In-memory store for mock jobs
const mockJobs = new Map<
  string,
  {
    startedAt: number;
    status: "queued" | "processing" | "completed" | "failed";
  }
>();

const MOCK_VIDEO_URL =
  "https://www.w3schools.com/html/mov_bbb.mp4";
const MOCK_THUMBNAIL_URL =
  "https://peach.blender.org/wp-content/uploads/bbb-splash.png";

// Simulate a generation that completes after ~15 seconds
const MOCK_DURATION_MS = 15_000;

export const mockProvider: VideoProvider = {
  id: "mock",
  name: "Demo Mode (Mock)",
  isMock: true,
  supportsImageToVideo: true,
  supportedDurations: [5, 10, 15, 24, 30, 60],
  supportedAspectRatios: ["9:16", "16:9", "1:1", "4:5"],
  description:
    "Demo mode — no real AI video is generated. Connect a real provider API key to generate actual videos.",

  async generateVideo(_input: VideoGenerationInput): Promise<GenerationResult> {
    const jobId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    mockJobs.set(jobId, { startedAt: Date.now(), status: "queued" });
    return {
      providerJobId: jobId,
      status: "queued",
      progressMessage: "Demo job queued",
    };
  },

  async getStatus(jobId: string): Promise<GenerationStatusResult> {
    const job = mockJobs.get(jobId);
    if (!job) {
      return { status: "failed", errorMessage: "Mock job not found" };
    }

    const elapsed = Date.now() - job.startedAt;

    if (elapsed < 3_000) {
      return {
        status: "queued",
        progressMessage: "Preparing prompt",
      };
    } else if (elapsed < 6_000) {
      return {
        status: "processing",
        progressMessage: "AI is creating scenes",
      };
    } else if (elapsed < 10_000) {
      return {
        status: "processing",
        progressMessage: "Rendering motion",
      };
    } else if (elapsed < MOCK_DURATION_MS) {
      return {
        status: "processing",
        progressMessage: "Finalizing video",
      };
    } else {
      mockJobs.delete(jobId);
      return {
        status: "completed",
        progressMessage: "Demo complete",
        videoUrl: MOCK_VIDEO_URL,
        thumbnailUrl: MOCK_THUMBNAIL_URL,
      };
    }
  },

  async cancelGeneration(jobId: string): Promise<void> {
    mockJobs.delete(jobId);
  },
};
