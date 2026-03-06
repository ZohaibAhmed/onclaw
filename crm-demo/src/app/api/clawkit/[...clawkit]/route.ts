import { createClawKitHandler } from "clawkit/next";
import { createContext } from "@/clawkit/context";

export const { GET, POST } = createClawKitHandler({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: "claude-sonnet-4-20250514",
  streaming: true,
  context: createContext(),

  // Demo auth — no auth system, hardcoded user
  auth: async () => ({
    userId: "1",
    role: "admin",
  }),

  rateLimit: {
    maxGenerations: 30,
    windowMs: 60_000,
  },
});
