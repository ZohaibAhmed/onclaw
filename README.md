# ClawKit ⚡

**Every user gets their own version of your app.**

An open-source React library that turns any SaaS into a per-user platform. Users press `⌘K`, describe what they need, and get a live feature — backed by your real database. No templates, no mock data.

## Setup

```bash
npm install clawkit
npx clawkit init
```

The init command uses AI to scan your project — finds your schema, ORM, auth, and pages — then generates everything you need:

- **`.clawkit/project.json`** — Project manifest (schema, relations, UI patterns) injected into every LLM prompt
- **`src/clawkit/context.ts`** — Typed query/action functions that act as the security boundary
- **API route** — Wired to your auth with rate limiting

## Manual Setup

### 1. API route

```ts
// app/api/clawkit/[...clawkit]/route.ts
import { createClawKitHandler } from "clawkit/next";

export const { GET, POST } = createClawKitHandler({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
```

### 2. Wrap your page

```tsx
"use client";
import { ClawKitProvider, Slot } from "clawkit";

export default function Page() {
  return (
    <ClawKitProvider userId="user-123" slots={{
      hero: { name: "Hero Section", description: "Main hero banner" },
      metrics: { name: "Key Metrics", description: "Dashboard stats" },
    }}>
      <Slot id="hero"><h1>Default hero</h1></Slot>
      <Slot id="metrics"><p>Default metrics</p></Slot>
    </ClawKitProvider>
  );
}
```

Users press `⌘K` and customize any `<Slot>` — or create entirely new components.

## Context API

The killer feature. Generated components query your actual database through typed functions you control:

```ts
// src/clawkit/context.ts
export function createContext() {
  return {
    queries: {
      async getDeals() { return db.select().from(deals); },
      async getContacts() { return db.select().from(contacts); },
    },
    actions: {
      async updateDealStage(dealId, stage) {
        await db.update(deals).set({ stage }).where(eq(deals.id, dealId));
      },
    },
  };
}
```

```ts
// route.ts
export const { GET, POST } = createClawKitHandler({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
  context: createContext(),
  auth: async (req) => {
    const session = await getServerSession(req);
    if (!session?.user) throw new Error("Unauthorized");
    return { userId: session.user.id };
  },
  rateLimit: { maxGenerations: 20, windowMs: 3600000 },
});
```

User asks "show me top deals by value" → LLM generates a component calling `ctx.queries.getDeals()` → real data from your database.

## How It Works

1. **`npx clawkit init`** — AI scans your project, generates integration files
2. **User presses `⌘K`** — Describes what they want
3. **LLM generates a React component** — Enriched with your schema and available queries
4. **Component renders instantly** — Real data via context bridge
5. **Changes persist per-user** — localStorage or your own backend

## Security

- **Context API is the boundary** — generated code can only call functions you expose. No raw SQL, no arbitrary imports.
- **Server-side auth** — `auth` + `authorize` callbacks
- **Rate limiting** — per-user throttling
- **No client-side API keys** — LLM config stays on the server
- **Protected files** — mutation manager prevents overwriting critical files
- **Optional iframe sandboxing** for untrusted code

## API

### `clawkit` (client)

`ClawKitProvider` · `Slot` · `useClawKit` · `createContextBridge` · `ClawKitAdmin` · `SandboxedComponent` · `DiffView` · `StyleEditor` · `LocalStoreAdapter` · `APIStoreAdapter`

### `clawkit/next` (server)

`createClawKitHandler` — catch-all route handler with auth, rate limiting, context API, manifest enrichment

### `clawkit/server`

`MutationManager` · `generateServerMutation` — file mutations with rollback

### CLI

`npx clawkit init` — AI-powered setup via Claude Agent SDK

## Requirements

React 18+ · Next.js 13+ · Anthropic or OpenAI API key · Node 18+

## License

MIT
