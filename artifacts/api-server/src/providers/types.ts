export interface VideoGenerationInput {
  prompt: string;
  enhancedPrompt?: string | null;
  negativePrompt?: string | null;
  style: string;
  aspectRatio: string;
  duration: number;
  quality: string;
  cameraMovement?: string | null;
  lighting?: string | null;
  motionStrength: string;
  seed?: number | null;
  referenceImageUrl?: string | null;
}

export type GenerationStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface GenerationResult {
  providerJobId: string;
  status: GenerationStatus;
  progressMessage?: string;
}

export interface GenerationStatusResult {
  status: GenerationStatus;
  progressMessage?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
}

export interface VideoProvider {
  id: string;
  name: string;
  isMock: boolean;
  supportsImageToVideo: boolean;
  supportedDurations: number[];
  supportedAspectRatios: string[];
  description: string;
  generateVideo(input: VideoGenerationInput): Promise<GenerationResult>;
  getStatus(jobId: string): Promise<GenerationStatusResult>;
  cancelGeneration?(jobId: string): Promise<void>;
}
