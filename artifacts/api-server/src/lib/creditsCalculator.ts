/** Calculate credit cost for a video generation */
export function calculateCredits(
  duration: number,
  quality: string,
): number {
  let base = duration; // 1 credit per second

  const qualityMultiplier: Record<string, number> = {
    standard: 1,
    hd: 1.5,
    full_hd: 2,
    "4k": 3,
  };

  const multiplier = qualityMultiplier[quality] ?? 1;
  return Math.ceil(base * multiplier);
}
