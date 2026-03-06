import type { SlotConfig } from "../types";

export interface PromptSuggestion {
  text: string;
  category: "style" | "content" | "layout" | "interactive";
  icon: string;
}

/**
 * Context-aware prompt suggestions based on slot type and keywords.
 */
export function getSuggestions(
  slotId: string | null,
  slotConfig: SlotConfig | undefined,
  input: string,
  hasExisting: boolean
): PromptSuggestion[] {
  // If user is typing, filter by input
  if (input.length > 0) {
    const all = [
      ...getSlotSuggestions(slotId, slotConfig),
      ...getGenericSuggestions(hasExisting),
    ];
    const lower = input.toLowerCase();
    return all.filter(
      (s) =>
        s.text.toLowerCase().includes(lower) ||
        s.category.includes(lower)
    ).slice(0, 5);
  }

  // Default: show slot-specific + generic
  return [
    ...getSlotSuggestions(slotId, slotConfig).slice(0, 4),
    ...getGenericSuggestions(hasExisting).slice(0, 2),
  ];
}

function getSlotSuggestions(
  slotId: string | null,
  config: SlotConfig | undefined
): PromptSuggestion[] {
  const name = (config?.name ?? slotId ?? "").toLowerCase();

  if (name.includes("hero") || name.includes("banner")) {
    return [
      { text: "Gradient hero with animated background", category: "style", icon: "🎨" },
      { text: "Minimal hero with large typography", category: "style", icon: "✨" },
      { text: "Hero with product screenshot mockup", category: "content", icon: "📱" },
      { text: "Split hero: text left, image right", category: "layout", icon: "📐" },
      { text: "Hero with animated counter stats", category: "interactive", icon: "📊" },
      { text: "Video background hero section", category: "style", icon: "🎬" },
    ];
  }

  if (name.includes("nav") || name.includes("header")) {
    return [
      { text: "Add a search bar to the navigation", category: "interactive", icon: "🔍" },
      { text: "Sticky navbar with blur backdrop", category: "style", icon: "✨" },
      { text: "Add user avatar and dropdown menu", category: "interactive", icon: "👤" },
      { text: "Breadcrumb navigation bar", category: "layout", icon: "📐" },
      { text: "Mobile hamburger menu", category: "layout", icon: "📱" },
    ];
  }

  if (name.includes("feature") || name.includes("grid")) {
    return [
      { text: "Bento grid layout with icons", category: "layout", icon: "📐" },
      { text: "Feature comparison table", category: "content", icon: "📊" },
      { text: "Animated feature cards on hover", category: "interactive", icon: "✨" },
      { text: "Icon grid with descriptions", category: "content", icon: "🎯" },
      { text: "Testimonials carousel", category: "content", icon: "💬" },
    ];
  }

  if (name.includes("cta") || name.includes("action") || name.includes("pricing")) {
    return [
      { text: "Pricing table with 3 tiers", category: "content", icon: "💰" },
      { text: "Newsletter signup with email input", category: "interactive", icon: "📧" },
      { text: "Download CTA with platform buttons", category: "interactive", icon: "⬇️" },
      { text: "Free trial countdown timer", category: "interactive", icon: "⏰" },
      { text: "Social proof CTA with logos", category: "content", icon: "🏢" },
    ];
  }

  if (name.includes("sidebar") || name.includes("widget")) {
    return [
      { text: "Live clock with timezone display", category: "interactive", icon: "🕐" },
      { text: "Activity feed with timestamps", category: "content", icon: "📋" },
      { text: "Quick stats dashboard", category: "content", icon: "📊" },
      { text: "Todo list widget", category: "interactive", icon: "✅" },
      { text: "Weather widget", category: "content", icon: "🌤️" },
      { text: "Mini calendar widget", category: "interactive", icon: "📅" },
    ];
  }

  if (name.includes("footer")) {
    return [
      { text: "Multi-column footer with links", category: "layout", icon: "📐" },
      { text: "Footer with social media icons", category: "content", icon: "🔗" },
      { text: "Minimal footer with copyright", category: "style", icon: "✨" },
    ];
  }

  return [];
}

function getGenericSuggestions(hasExisting: boolean): PromptSuggestion[] {
  if (hasExisting) {
    return [
      { text: "Make it more colorful", category: "style", icon: "🎨" },
      { text: "Add a dark mode toggle", category: "interactive", icon: "🌙" },
      { text: "Make it more compact", category: "layout", icon: "📐" },
      { text: "Add loading animations", category: "interactive", icon: "✨" },
      { text: "Make the text larger", category: "style", icon: "🔤" },
    ];
  }
  return [
    { text: "Something minimal and clean", category: "style", icon: "✨" },
    { text: "Dark glassmorphism design", category: "style", icon: "🖤" },
    { text: "Colorful gradient style", category: "style", icon: "🌈" },
  ];
}
