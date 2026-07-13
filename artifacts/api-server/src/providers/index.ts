import type { VideoProvider } from "./types.js";
import { mockProvider } from "./mockProvider.js";
import { replicateProvider } from "./replicateProvider.js";
import { klingProvider } from "./klingProvider.js";
import { runwayProvider } from "./runwayProvider.js";
import { lumaProvider } from "./lumaProvider.js";
import { pikaProvider } from "./pikaProvider.js";

const allProviders: VideoProvider[] = [
  mockProvider,
  replicateProvider,
  klingProvider,
  runwayProvider,
  lumaProvider,
  pikaProvider,
];

/**
 * Keys required per provider.
 * Kling needs two separate env vars (access key + secret for JWT signing).
 */
const PROVIDER_KEYS: Record<string, string | string[]> = {
  replicate: "REPLICATE_API_TOKEN",
  kling:     ["KLING_ACCESS_KEY", "KLING_SECRET_KEY"],
  runway:    "RUNWAY_API_KEY",
  luma:      "LUMA_API_KEY",
  pika:      "PIKA_API_KEY",
};

/** Check if a provider has all required API keys set. */
export function checkProviderKey(id: string): boolean {
  const keys = PROVIDER_KEYS[id];
  if (!keys) return false;
  if (Array.isArray(keys)) return keys.every((k) => !!process.env[k]);
  return !!process.env[keys];
}

/** Get provider by ID. Falls back to mockProvider when the real provider's key is missing. */
export function getProvider(id: string): VideoProvider {
  const provider = allProviders.find((p) => p.id === id);
  if (!provider) return mockProvider;
  if (!provider.isMock && !checkProviderKey(id)) return mockProvider;
  return provider;
}

/** Get all providers annotated with availability status. */
export function getAllProviders(): (VideoProvider & { hasKey: boolean })[] {
  return allProviders.map((p) => ({
    ...p,
    hasKey: p.isMock || checkProviderKey(p.id),
  }));
}

export { mockProvider };
export type {
  VideoProvider,
  VideoGenerationInput,
  GenerationResult,
  GenerationStatusResult,
} from "./types.js";
