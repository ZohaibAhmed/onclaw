import type { SlotConfig } from "../types";

/**
 * Auto-enhance vague prompts with contextual detail.
 * Makes short prompts more specific so the LLM produces better output.
 */
export function refinePrompt(
  prompt: string,
  slotId: string,
  slotConfig?: SlotConfig,
  hasExisting?: boolean
): string {
  const trimmed = prompt.trim();

  // Don't refine prompts that are already detailed (>80 chars)
  if (trimmed.length > 80) return trimmed;

  const parts: string[] = [trimmed];

  // Add slot context if the prompt doesn't mention the slot
  if (slotConfig) {
    const slotWords = slotConfig.name.toLowerCase().split(/\s+/);
    const promptLower = trimmed.toLowerCase();
    const mentionsSlot = slotWords.some((w) => w.length > 3 && promptLower.includes(w));

    if (!mentionsSlot) {
      parts.push(`for the ${slotConfig.name} section`);
    }
  }

  // Enhance vague style prompts
  const vaguePatterns: [RegExp, string][] = [
    [/^make it (better|nice|good|cool)$/i, "Improve the visual design with modern styling, better spacing, and polished typography"],
    [/^(dark|light) ?(mode|theme)?$/i, `Apply a ${trimmed.includes("dark") ? "dark" : "light"} color scheme with appropriate contrast and styling`],
    [/^(bigger|larger|smaller|compact)$/i, `Adjust the sizing to be ${trimmed.toLowerCase()} with proportional spacing`],
    [/^(colorful|bright|vibrant)$/i, "Add a vibrant, colorful design with gradients and accent colors"],
    [/^(minimal|clean|simple)$/i, "Create a minimal, clean design with plenty of whitespace and restrained typography"],
    [/^(modern|futuristic|sleek)$/i, "Design with a modern aesthetic — glassmorphism, subtle gradients, and sharp typography"],
  ];

  for (const [pattern, replacement] of vaguePatterns) {
    if (pattern.test(trimmed)) {
      return hasExisting
        ? `${replacement}. Modify the existing component.`
        : replacement;
    }
  }

  // Add quality hint for short prompts
  if (trimmed.length < 30 && !trimmed.includes("style")) {
    parts.push("with polished styling and good visual hierarchy");
  }

  // If modifying existing, hint at iteration
  if (hasExisting && !trimmed.toLowerCase().includes("new") && !trimmed.toLowerCase().includes("replace")) {
    parts.push("— modify the existing component, don't start from scratch");
  }

  return parts.join(" ");
}
