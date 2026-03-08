import { NextResponse } from "next/server";
import {
  generateServerMutation,
  MutationManager,
} from "onclaw/server";
import type { ServerEngineConfig } from "onclaw/server";
import { join } from "path";


const APP_ROOT = process.cwd();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const config: ServerEngineConfig = {
  appRoot: APP_ROOT,
  llmEndpoint: "http://localhost:3777/api/generate",
  onMutationApplied: async (mutation) => {
    console.log(
      `[OnClaw] Mutation ${mutation.id} applied: ${mutation.files.length} files`
    );
  },
};

const manager = new MutationManager(config);
let initialized = false;

export async function POST(req: Request) {
  if (!initialized) {
    await manager.init();
    initialized = true;
  }

  const { prompt, userId, slotId, slotContext } = await req.json();

  if (!prompt || !userId) {
    return NextResponse.json(
      { error: "prompt and userId required" },
      { status: 400 }
    );
  }

  try {
    // Generate the mutation
    const mutation = await generateServerMutation(prompt, config, {
      slotId,
      slotConfig: slotContext,
    });
    mutation.userId = userId;

    // Apply it (write files to disk)
    const result = await manager.apply(mutation);

    return NextResponse.json({
      id: result.id,
      files: result.files.map((f) => ({ path: f.path, action: f.action })),
      needsRebuild: result.needsRebuild,
      status: result.status,
      error: result.error,
      clientCode: result.clientCode,
    });
  } catch (err) {
    console.error("[OnClaw] Server mutation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/** Rollback endpoint */
export async function DELETE(req: Request) {
  if (!initialized) {
    await manager.init();
    initialized = true;
  }

  const { searchParams } = new URL(req.url);
  const mutationId = searchParams.get("id");
  if (!mutationId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const success = await manager.rollback(mutationId);
  return NextResponse.json({ success });
}
