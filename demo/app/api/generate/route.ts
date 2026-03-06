import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: Request) {
  const { messages, max_tokens = 4096 } = await req.json();

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens,
      system: messages.find((m: { role: string }) => m.role === "system")?.content || "",
      messages: messages.filter((m: { role: string }) => m.role !== "system"),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const content = data.content?.[0]?.text || "";

  // Return in OpenAI-compatible format (what the engine expects)
  return NextResponse.json({
    choices: [{ message: { content } }],
  });
}
