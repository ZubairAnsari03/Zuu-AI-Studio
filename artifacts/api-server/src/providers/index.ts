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

/** Get provider by ID. Returns mock if not found or if no API key is set. */
export function getProvider(id: string): VideoProvider {
  const provider = allProviders.find((p) => p.id === id);
  if (!provider) return mockProvider;

  // Fall back to mock if the real provider has no key
  if (!provider.isMock) {
    const hasKey = checkProviderKey(id);
    if (!hasKey) return mockProvider;
  }

  return provider;
}

/** Check if a provider has its API key set */
export function checkProviderKey(id: string): boolean {
  const keyMap: Record<string, string> = {
    replicate: "REPLICATE_API_TOKEN",
    kling: "KLING_API_KEY",
    runway: "RUNWAY_API_KEY",
    luma: "LUMA_API_KEY",
    pika: "PIKA_API_KEY",
  };
  const envKey = keyMap[id];
  if (!envKey) return false;
  return !!process.env[envKey];
}

/** Get all providers with their availability status */
export function getAllProviders(): (VideoProvider & { hasKey: boolean })[] {
  return allProviders.map((p) => ({
    ...p,
    hasKey: p.isMock || checkProviderKey(p.id),
  }));
}

export { mockProvider };
export type { VideoProvider, VideoGenerationInput, GenerationResult, GenerationStatusResult } from "./types.js";
