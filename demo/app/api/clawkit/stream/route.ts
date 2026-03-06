import { createClawKitHandler } from "clawkit/next";

export const { POST } = createClawKitHandler({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
  streaming: true,
});
