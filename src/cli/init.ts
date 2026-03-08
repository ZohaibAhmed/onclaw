/**
 * `npx onclaw init` — AI-powered project setup using Claude Agent SDK.
 *
 * Scans your project, understands your schema/ORM/auth, and generates
 * a complete OnClaw integration with a typed context API.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline";
import * as path from "path";
import * as fs from "fs";

// ─── Constants ──────────────────────────────────────────

const ONCLAW_DIR = ".onclaw";
const MANIFEST_FILE = "project.json";

// ─── System Prompt ──────────────────────────────────────

const INIT_SYSTEM_PROMPT = `You are OnClaw Init — an AI-powered setup agent for OnClaw, a React library that lets users customize app sections via a ⌘K command bar powered by AI code generation.

Your job is to scan this project and generate a WORKING OnClaw integration. After you're done, the user should be able to press ⌘K and generate components that appear on the page immediately. You are running in the project's root directory.

## What You Need To Do

### Phase 1: Scan & Understand
1. Read package.json to identify the framework (Next.js, Remix, etc.), dependencies, and project structure
2. Find the database schema — look for:
   - Drizzle: drizzle/ or src/db/schema.ts or schema/*.ts
   - Prisma: prisma/schema.prisma
   - Raw SQL: migrations/ or any .sql files
   - Mongoose: models/ directory
   - In-memory / mock data: lib/data.ts, data/, mock/, seed files
3. Find the auth system — look for:
   - NextAuth/Auth.js: auth.ts, [...nextauth] route, auth.config.ts
   - Clerk: middleware.ts with clerkMiddleware, @clerk/nextjs
   - Supabase: supabase client setup, @supabase/ssr
   - Custom JWT: look for jwt/token utilities
4. Find existing pages and their main components — scan app/ or pages/ directory
5. Identify the ORM and how data is currently queried
6. **Read all major page/layout components** — you need to understand the JSX structure to place slots

### Phase 2: Decide Configuration
Based on what you found, make sensible default decisions:
- **Tables/data to expose**: ALL data sources found (except passwords/secrets)
- **Write access**: Limited — only safe mutations. Default to read-only for most.
- **Auth**: Use whatever auth system exists. If none, skip auth checks.
- **Slots**: Identify 3-8 logical UI sections in the main page components

Print a brief summary of what you decided, then immediately proceed to generate files. Do NOT ask the user questions — just make good defaults and generate everything.

### Phase 3: Generate Integration Files
Generate ALL of these files (do not skip any):

#### 1. \`.onclaw/project.json\` — Project manifest
Runtime context for the LLM. Include:
- Framework, ORM, database type, styling approach
- Schema (tables/data structures, columns, types, relations)
- Available queries and actions (names + descriptions)
- Auth system type
- UI patterns (theme, component library)
- Slot definitions

#### 2. \`src/onclaw/context.ts\` (or \`lib/onclaw/context.ts\`) — Data context API
The KEY file. Exports typed query/action functions that generated components can call.
- Import the actual data source (ORM client, in-memory store, API client, etc.)
- Create an \`OnClawContext\` type with \`queries\` and optionally \`actions\`
- Each query is a function with optional filters returning typed data
- Export a \`createContext()\` function
- Add JSDoc comments on each query/action (the LLM reads these at generation time)

#### 3. \`app/api/onclaw/[...onclaw]/route.ts\` — API route handler
\`\`\`ts
import { createOnClawHandler } from "onclaw/next";
import { createContext } from "@/onclaw/context";

export const { GET, POST } = createOnClawHandler({
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
  context: createContext(),
});
\`\`\`
- Wire up auth if the project has it
- Use the correct import path for the context file

#### 4. Update root layout — Add OnClawProvider
- Read the existing root layout.tsx
- Add \`import { OnClawProvider } from "onclaw";\` at the top
- Wrap children with \`<OnClawProvider userId="user" slots={...}>\`
- The slots object keys MUST match the slot ids you'll inject in Phase 4
- Each slot needs \`name\` and \`description\` (both strings)
- DO NOT break the existing layout — wrap minimally

### Phase 4: Inject \`<Slot>\` Wrappers Into Existing Components (CRITICAL)
This is the most important phase. Without this, generated components have nowhere to render.

1. **Read each major page component** (the ones with substantial JSX)
2. **Identify logical sections** — sidebar, header, main content, lists, cards, forms, etc.
3. **Wrap each section** with \`<Slot id="slotName">\` ... \`</Slot>\`
4. **Add the import**: \`import { Slot } from "onclaw";\`

#### How to wrap slots:
- The \`<Slot>\` component wraps existing JSX as its \`children\` (the default/fallback content)
- When a user generates a component for that slot, it replaces the children
- The slot id must match what's in the OnClawProvider's \`slots\` prop

Example — BEFORE:
\`\`\`tsx
<div className="sidebar">
  <nav>...</nav>
</div>
<div className="main-content">
  <header>...</header>
  <div className="messages">...</div>
</div>
\`\`\`

Example — AFTER:
\`\`\`tsx
import { Slot } from "onclaw";
// ...
<Slot id="sidebar"><div className="sidebar">
  <nav>...</nav>
</div></Slot>
<div className="main-content">
  <Slot id="header"><header>...</header></Slot>
  <Slot id="messageList"><div className="messages">...</div></Slot>
</div>
\`\`\`

#### Slot placement rules:
- Wrap the **outermost element** of each logical section
- Don't nest slots inside each other (a slot replacing content would break inner slots)
- Keep slot ids short, camelCase: \`sidebar\`, \`header\`, \`messageList\`, \`userProfile\`
- 3-8 slots per page is ideal — too many is overwhelming, too few is useless
- The \`<Slot>\` must be inside a client component (has "use client" directive)
- If the component file doesn't have "use client", add it at the top
- Good candidates for slots: sidebars, headers, content lists, stat panels, footers, card grids, detail views
- Bad candidates: tiny UI elements (single buttons, icons), structural wrappers (body, html)

## Rules
- ALWAYS use the project's existing patterns (their ORM, their auth, their styling)
- Never install new dependencies — work with what's there
- The context API is the security boundary — only expose what makes sense
- Generated code must be TypeScript
- Use relative imports matching the project's style (@ aliases, etc.)
- If you can't find something (no DB, no auth), skip that part gracefully
- Create the .onclaw directory if it doesn't exist
- Write clean, production-quality code
- The OnClawProvider props are: \`userId\` (string), \`slots\` (Record<string, {name: string, description: string}>), \`endpoint\` (optional string), \`streamEndpoint\` (optional string), \`theme\` (optional "light"|"dark"|"auto"), \`themeOverrides\` (optional), \`store\` (optional), \`hideTrigger\` (optional boolean). Do NOT pass props that don't exist.
- The Slot component props are: \`id\` (string, required), \`children\` (ReactNode, the default content), \`props\` (optional Record), \`editable\` (optional boolean), \`className\` (optional), \`style\` (optional). Do NOT pass props that don't exist.
- The createOnClawHandler config accepts: \`provider\`, \`apiKey\`, \`model\`, \`streaming\`, \`context\`, \`auth\`, \`authorize\`, \`mutations\`, \`rateLimit\`. Do NOT pass options that don't exist.

## Important
- Do NOT ask questions — make sensible defaults and generate everything
- Be thorough in scanning — read actual source files, not just package.json
- Phase 4 (slot injection) is CRITICAL — without it, the whole integration is useless
- Test your work: after injecting slots, verify the JSX is still valid (matching tags, correct nesting)
`;

// ─── CLI Entry Point ────────────────────────────────────

async function main() {
  const cwd = process.cwd();

  // Check if we're in a Node.js project
  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.error("❌ No package.json found. Run this from your project root.");
    process.exit(1);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "❌ ANTHROPIC_API_KEY not set. Set it in your environment or .env file."
    );
    console.error("   Get one at https://console.anthropic.com/");
    process.exit(1);
  }

  // Check if OnClaw is already initialized
  const manifestPath = path.join(cwd, ONCLAW_DIR, MANIFEST_FILE);
  if (fs.existsSync(manifestPath)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await new Promise<string>((resolve) => {
      rl.question(
        "⚠️  OnClaw is already initialized. Re-run setup? (y/N) ",
        resolve
      );
    });
    rl.close();
    if (answer.toLowerCase() !== "y") {
      console.log("Cancelled.");
      process.exit(0);
    }
  }

  console.log("");
  console.log("  🔮 OnClaw Init — AI-powered setup");
  console.log("  ─────────────────────────────────────");
  console.log("");
  console.log("  Claude will scan your project, understand your");
  console.log("  schema and auth, then generate a complete integration.");
  console.log("");

  // Ensure .onclaw directory exists
  const onclawDir = path.join(cwd, ONCLAW_DIR);
  if (!fs.existsSync(onclawDir)) {
    fs.mkdirSync(onclawDir, { recursive: true });
  }

  // Run the Claude Agent SDK
  try {
    let lastToolName = "";

    for await (const message of query({
      prompt: [
        "Scan this project and set up OnClaw. Follow the system prompt instructions exactly — all 4 phases.",
        "Start by reading package.json, then scan the project structure, schema, auth, and page components.",
        "Make sensible defaults — do NOT ask questions. Generate all integration files AND inject <Slot> wrappers into existing components.",
        "Phase 4 (slot injection) is the most important step — without it, generated components have nowhere to render.",
      ].join("\n"),
      options: {
        systemPrompt: INIT_SYSTEM_PROMPT,
        cwd,
        allowedTools: [
          "Read",
          "Write",
          "Edit",
          "Glob",
          "Grep",
          "Bash",
        ],
        permissionMode: "acceptEdits" as const,
        model: "claude-sonnet-4-20250514",
        maxTurns: 50,
      },
    })) {
      // Handle different message types
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block && block.text) {
            // Print Claude's reasoning/output
            console.log(block.text);
          } else if ("name" in block && block.name) {
            // Show tool usage with nice formatting
            const toolName = block.name;
            if (toolName === "Read") {
              const filePath =
                (block as any).input?.file_path ||
                (block as any).input?.path ||
                "";
              console.log(`  📖 Reading ${filePath}`);
            } else if (toolName === "Write") {
              const filePath =
                (block as any).input?.file_path ||
                (block as any).input?.path ||
                "";
              console.log(`  ✍️  Writing ${filePath}`);
            } else if (toolName === "Edit") {
              const filePath =
                (block as any).input?.file_path ||
                (block as any).input?.path ||
                "";
              console.log(`  ✏️  Editing ${filePath}`);
            } else if (toolName === "Glob") {
              console.log(`  🔍 Searching files...`);
            } else if (toolName === "Grep") {
              console.log(`  🔎 Searching contents...`);
            } else if (toolName === "AskUserQuestion") {
              // The SDK handles the interactive prompt automatically
            } else if (toolName === "Bash") {
              console.log(`  ⚡ Running command...`);
            }
            lastToolName = toolName;
          }
        }
      } else if (message.type === "result") {
        if (message.subtype === "success") {
          console.log("");
          console.log("  ─────────────────────────────────────");
          console.log("  ✅ OnClaw is ready!");
          console.log("");
          console.log("  Next steps:");
          console.log("    1. Add ANTHROPIC_API_KEY to your .env.local");
          console.log("    2. Run your dev server and press ⌘K");
          console.log("    3. Type a prompt — your component will appear in a slot!");
          console.log("");
        } else if (message.subtype === "error") {
          console.error("");
          console.error("  ❌ Setup failed:", (message as any).error || "Unknown error");
          process.exit(1);
        }
      }
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error("");
      console.error("  ❌ Claude Agent SDK not found.");
      console.error("  Run: npm install -g @anthropic-ai/claude-agent-sdk");
      console.error("");
    } else {
      console.error("");
      console.error("  ❌ Error:", error.message);
      console.error("");
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
