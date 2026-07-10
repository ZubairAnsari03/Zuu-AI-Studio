/**
 * Rule-based prompt enhancer.
 * When an AI text API key is connected (e.g. OPENAI_API_KEY), this can be
 * replaced with an LLM call. For now, a sophisticated rule-based system
 * generates detailed cinematic prompts from simple user ideas.
 */

interface EnhanceInput {
  prompt: string;
  style?: string | null;
  aspectRatio?: string | null;
  cameraMovement?: string | null;
  lighting?: string | null;
}

interface EnhanceOutput {
  enhancedPrompt: string;
  negativePrompt: string;
}

const STYLE_DESCRIPTORS: Record<string, string> = {
  "Cinematic Realistic":
    "cinematic realism, photorealistic, professional film quality, 8K resolution, film grain, anamorphic lens flare",
  "3D Animated Movie":
    "premium stylized 3D animated movie aesthetic, high-quality CGI, subsurface scattering, global illumination, studio render quality",
  Anime:
    "anime style, detailed cel-shaded animation, vibrant colors, expressive characters, dynamic action lines",
  Fantasy:
    "epic fantasy, ethereal atmosphere, magical particle effects, painterly details, rich color palette",
  "Clay Animation":
    "stop-motion clay animation, tactile textures, handcrafted feel, warm color palette, charming imperfections",
  Photorealistic:
    "ultra-photorealistic, hyperdetailed, ray-traced lighting, physically based rendering, 8K resolution",
  "Product Advertisement":
    "professional commercial photography style, clean background, product-focused composition, soft studio lighting, commercial grade",
  "Nature Documentary":
    "BBC nature documentary style, macro photography, natural lighting, 4K wildlife cinematography, David Attenborough aesthetic",
  "Horror Cinematic":
    "atmospheric horror cinematography, moody shadows, tension-building composition, desaturated tones with accent lighting",
  "Sci-Fi":
    "science fiction aesthetic, futuristic technology, neon-lit cyberpunk or clean space opera visuals, advanced CGI",
  "Social Media Viral":
    "eye-catching social media format, bold colors, dynamic motion graphics, trendy aesthetic, high-energy editing",
  "Cute Cartoon":
    "cute animated cartoon style, bright saturated colors, rounded shapes, expressive eyes, playful animation",
};

const CAMERA_DESCRIPTORS: Record<string, string> = {
  "Static Camera": "locked-off static camera, stable composition",
  "Slow Zoom In": "smooth slow dolly zoom-in, gradual push-in movement",
  "Slow Zoom Out": "smooth slow zoom-out, gradually revealing environment",
  "Tracking Shot": "smooth tracking shot following the subject",
  "Dolly Shot": "cinematic dolly movement, smooth horizontal travel",
  "Drone Shot": "aerial drone shot, sweeping bird's-eye perspective",
  "Orbit Camera": "orbiting camera movement around the subject, 360-degree arc",
  "Handheld Cinematic":
    "subtle handheld camera movement, cinema vérité style, organic motion",
  "Close-up": "intimate close-up shot, shallow depth of field",
  "Wide Establishing Shot":
    "wide establishing shot, revealing the full environment",
};

const LIGHTING_DESCRIPTORS: Record<string, string> = {
  "Golden Hour":
    "warm golden hour lighting, long shadows, rich amber tones, backlit glow",
  "Soft Cinematic": "soft diffused cinematic lighting, gentle fill light, minimal shadows",
  Dramatic: "high-contrast dramatic lighting, deep shadows, chiaroscuro effect",
  Neon: "vibrant neon lighting, colorful reflections, urban night aesthetic",
  Moonlight: "cool moonlight illumination, soft blue tones, mysterious night atmosphere",
  "Studio Lighting": "clean studio lighting, professional even exposure, soft boxes",
  "Magical Glow": "ethereal magical glow, bioluminescent light, fantastical illumination",
  "Natural Daylight": "natural daylight, soft overcast diffusion, true-to-life colors",
};

const ASPECT_RATIO_DESCRIPTORS: Record<string, string> = {
  "9:16": "vertical portrait format, optimized for mobile viewing",
  "16:9": "widescreen cinematic format, classic film aspect ratio",
  "1:1": "square format, perfectly balanced composition",
  "4:5": "portrait format, social media optimized",
};

const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low quality, distorted face, extra limbs, bad anatomy, flickering, unstable motion, duplicate characters, watermark, logo, text, subtitles, cropped subject, oversaturated colors, pixelated, compressed artifacts, shaky camera, jerky motion, low resolution";

export function enhancePrompt(input: EnhanceInput): EnhanceOutput {
  const { prompt, style, aspectRatio, cameraMovement, lighting } = input;

  const parts: string[] = [];

  // Core subject from user prompt
  parts.push(prompt.trim());

  // Style descriptor
  const styleDesc = style ? STYLE_DESCRIPTORS[style] : null;
  if (styleDesc) parts.push(styleDesc);

  // Camera movement
  const cameraDesc = cameraMovement ? CAMERA_DESCRIPTORS[cameraMovement] : null;
  if (cameraDesc) parts.push(cameraDesc);

  // Lighting
  const lightingDesc = lighting ? LIGHTING_DESCRIPTORS[lighting] : null;
  if (lightingDesc) parts.push(lightingDesc);

  // Aspect ratio framing note
  const aspectDesc = aspectRatio ? ASPECT_RATIO_DESCRIPTORS[aspectRatio] : null;
  if (aspectDesc) parts.push(aspectDesc);

  // Universal quality enhancers
  parts.push(
    "highly detailed, smooth motion, professional color grading, cinematic composition, masterful cinematography",
  );

  const enhancedPrompt = parts.join(", ");

  return {
    enhancedPrompt,
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  };
}
