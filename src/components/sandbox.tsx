"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * Renders generated code inside a sandboxed iframe for security isolation.
 * The iframe has no access to the parent page's DOM, cookies, or JS context.
 */
export function SandboxedComponent({
  code,
  props = {},
  theme,
  height = "auto",
  onError,
}: {
  code: string;
  props?: Record<string, unknown>;
  theme?: Record<string, string>;
  height?: string | number;
  onError?: (error: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(200);

  const themeVars = theme
    ? Object.entries(theme)
        .map(([k, v]) => `${k}: ${v};`)
        .join("\n")
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://unpkg.com/react@19/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js" crossorigin></script>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  :root { ${themeVars} }
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: transparent; overflow: hidden; }
</style>
</head>
<body>
<div id="root"></div>
<script>
try {
  ${code}
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(Component, ${JSON.stringify(props)}));

  // Auto-resize
  const ro = new ResizeObserver(() => {
    const h = document.getElementById("root").scrollHeight;
    window.parent.postMessage({ type: "ck-sandbox-resize", height: h }, "*");
  });
  ro.observe(document.getElementById("root"));
} catch (e) {
  window.parent.postMessage({ type: "ck-sandbox-error", error: e.message }, "*");
  document.getElementById("root").innerHTML =
    '<div style="color:#ef4444;font-size:13px;padding:16px;font-family:monospace">Error: ' +
    e.message + '</div>';
}
</script>
</body>
</html>`;

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "ck-sandbox-resize") {
        setIframeHeight(e.data.height);
      } else if (e.data?.type === "ck-sandbox-error") {
        onError?.(e.data.error);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onError]);

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: height === "auto" ? `${iframeHeight}px` : height,
        border: "none",
        borderRadius: "var(--ck-radius)",
        overflow: "hidden",
        transition: "height 0.2s ease",
      }}
      title="OnClaw Sandbox"
    />
  );
}

/**
 * Hook to check if sandboxing should be used.
 * Returns true if the config enables sandboxing.
 */
export function useShouldSandbox(sandbox?: boolean): boolean {
  return sandbox ?? false;
}
