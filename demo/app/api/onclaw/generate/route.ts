import { createOnClawHandler } from "onclaw/next";

export const { POST } = createOnClawHandler({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
