import type { SharePayload } from "../types";

/**
 * Encode a share payload into a URL-safe string.
 * Uses base64 encoding of compressed JSON.
 */
export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  // Use btoa for browser, Buffer.from for Node
  if (typeof btoa !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json).toString("base64");
}

/**
 * Decode a share payload from a URL-safe string.
 */
export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    let json: string;
    if (typeof atob !== "undefined") {
      json = decodeURIComponent(escape(atob(encoded)));
    } else {
      json = Buffer.from(encoded, "base64").toString("utf-8");
    }
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

/**
 * Generate a share URL containing the component data.
 * If a shareEndpoint is configured, sends to server and returns a short URL.
 * Otherwise returns a data: URL with the encoded payload.
 */
export async function generateShareUrl(
  payload: SharePayload,
  shareEndpoint?: string
): Promise<string> {
  if (shareEndpoint) {
    try {
      const res = await fetch(shareEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { url } = await res.json();
        return url;
      }
    } catch {
      // Fall back to client-side encoding
    }
  }

  // Client-side: encode in hash fragment
  const encoded = encodeSharePayload(payload);
  const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  return `${baseUrl}#onclaw=${encoded}`;
}

/**
 * Check if the current URL contains a shared component.
 */
export function parseShareFromUrl(): SharePayload | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const match = hash.match(/#onclaw=(.+)/);
  if (!match) return null;
  return decodeSharePayload(match[1]);
}
