export function generateId(): string {
  return `ck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
}

export function formatShortcut(shortcut: string): string {
  const mod = isMac() ? "⌘" : "Ctrl";
  return shortcut.replace("mod", mod).replace("+", " ");
}
