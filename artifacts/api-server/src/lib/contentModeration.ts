/** Blocked content patterns — checked against all user-supplied text */
const BLOCKED_PATTERNS = [
  // Child safety
  /\b(child|minor|kid|underage|toddler|infant|baby)\b.{0,50}\b(nude|naked|sexual|explicit|sex)\b/i,
  /\b(sexual|explicit|nude|naked)\b.{0,50}\b(child|minor|kid|underage)\b/i,
  // Non-consensual content
  /\bnon.?consensual\b/i,
  /\brapist?\b/i,
  // Fraud / impersonation
  /\bdeep.?fake.{0,40}\b(fraud|deceptive|deceive|impersonate)\b/i,
  // Graphic violence instructions
  /\b(instructions?|how.to|tutorial)\b.{0,40}\b(bomb|explosive|weapon|kill|murder)\b/i,
];

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

function checkText(text: string): ModerationResult {
  const lower = text.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        allowed: false,
        reason:
          "Your content contains material that violates our content policy. Please revise your prompt and try again.",
      };
    }
  }
  return { allowed: true };
}

export function moderatePrompt(prompt: string): ModerationResult {
  return checkText(prompt);
}

/** Moderate all user-supplied text fields to prevent policy bypasses */
export function moderateAllFields(fields: (string | null | undefined)[]): ModerationResult {
  for (const field of fields) {
    if (!field) continue;
    const result = checkText(field);
    if (!result.allowed) return result;
  }
  return { allowed: true };
}
