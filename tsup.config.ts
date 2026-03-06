import { defineConfig } from "tsup";

export default defineConfig([
  // Client-side bundle (React components)
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom"],
    banner: { js: '"use client";' },
  },
  // Server-side bundle (Node.js — server engine, Next.js handler)
  {
    entry: ["src/server.ts", "src/next.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: ["react", "react-dom", "fs", "fs/promises", "path"],
    platform: "node",
  },
  // CLI bundle (npx clawkit init)
  {
    entry: ["src/cli/init.ts"],
    format: ["esm"],
    splitting: false,
    sourcemap: true,
    platform: "node",
    external: ["@anthropic-ai/claude-agent-sdk"],
    banner: { js: "#!/usr/bin/env node" },
    outDir: "dist/cli",
  },
]);
