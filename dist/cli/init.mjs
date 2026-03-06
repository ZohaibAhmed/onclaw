#!/usr/bin/env node

// src/cli/init.ts
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline";
import * as path from "path";
import * as fs from "fs";
var CLAWKIT_DIR = ".clawkit";
var MANIFEST_FILE = "project.json";
var INIT_SYSTEM_PROMPT = `You are ClawKit Init \u2014 an AI-powered setup agent for ClawKit, a React library that lets users customize apps via a \u2318K command bar powered by AI code generation.

Your job is to scan this project and generate a complete ClawKit integration. You are running in the project's root directory.

## What You Need To Do

### Phase 1: Scan & Understand
1. Read package.json to identify the framework (Next.js, Remix, etc.), dependencies, and project structure
2. Find the database schema \u2014 look for:
   - Drizzle: drizzle/ or src/db/schema.ts or schema/*.ts
   - Prisma: prisma/schema.prisma
   - Raw SQL: migrations/ or any .sql files
   - Mongoose: models/ directory
3. Find the auth system \u2014 look for:
   - NextAuth/Auth.js: auth.ts, [...nextauth] route, auth.config.ts
   - Clerk: middleware.ts with clerkMiddleware, @clerk/nextjs
   - Supabase: supabase client setup, @supabase/ssr
   - Custom JWT: look for jwt/token utilities
4. Find existing pages and their data patterns \u2014 scan app/ or pages/ directory
5. Identify the ORM and how data is currently queried

### Phase 2: Decide Configuration
Based on what you found, make sensible default decisions:
- **Tables to expose**: ALL tables found in the schema (except any that contain passwords/secrets \u2014 check column names)
- **Write access**: Limited \u2014 only safe status/stage updates. Default to read-only for most tables.
- **Auth**: Use whatever auth system exists. If none, skip auth checks.
- **Off-limits pages**: None by default

Print a summary of what you decided, then immediately proceed to generate files. Do NOT ask the user questions \u2014 just make good defaults and generate everything.

### Phase 3: Generate Integration
Generate ALL of these files (do not skip any):

#### 1. \`.clawkit/project.json\` \u2014 Project manifest
This is used at runtime to give the LLM context about the project. Include:
- Framework, ORM, database type
- Full schema (tables, columns, types, relations)
- Available queries and actions (names + descriptions)
- Auth system type
- UI patterns (theme, component library, styling approach)
- Pages and their data dependencies

#### 2. \`src/clawkit/context.ts\` (or \`lib/clawkit/context.ts\`) \u2014 Data context API
This is the KEY file. It exports typed query functions that generated components can call.
- Import the actual ORM client from the project
- Create a \`ClawKitContext\` type with \`queries\` and optionally \`actions\`
- Each query is a function that takes optional filters and returns typed data
- Each action is a function for allowed mutations
- Export a \`createContext()\` function that returns the context object
- Add JSDoc comments describing each query/action (the LLM reads these at generation time)

Example for a Drizzle project:
\`\`\`ts
import { db } from "@/db";
import { deals, contacts, companies } from "@/db/schema";
import { eq, and, gte, lte, like, desc, sql } from "drizzle-orm";

export interface ClawKitContext {
  queries: {
    getDeals: (filters?: { stage?: string; minValue?: number; ownerId?: string }) => Promise<Deal[]>;
    getContacts: (filters?: { search?: string; status?: string; limit?: number }) => Promise<Contact[]>;
    // ...
  };
  actions?: {
    updateDealStage: (dealId: string, stage: string) => Promise<void>;
    // ...
  };
}

export function createContext(): ClawKitContext {
  return {
    queries: {
      async getDeals(filters = {}) {
        const conditions = [];
        if (filters.stage) conditions.push(eq(deals.stage, filters.stage));
        if (filters.minValue) conditions.push(gte(deals.value, filters.minValue));
        return db.select().from(deals).where(and(...conditions)).orderBy(desc(deals.createdAt));
      },
      // ...
    },
  };
}
\`\`\`

#### 3. \`app/api/clawkit/[...clawkit]/route.ts\` \u2014 API route handler
- Import createClawKitHandler from "clawkit/next"
- Import createContext from the context file
- Wire up auth (using the project's actual auth system)
- Configure the LLM provider (read from env vars)
- Pass the context + project manifest to the handler

#### 4. Update root layout \u2014 Add ClawKitProvider
- Read the existing root layout.tsx
- Add ClawKitProvider wrapping the children
- Configure with sensible defaults (userId from session, slots from pages)
- DO NOT break the existing layout \u2014 wrap minimally

#### 5. \`src/clawkit/slots.ts\` \u2014 Slot definitions
- Scan existing pages and create slot configs for major sections
- Each slot gets a name, description, and available data context
- Export as a slots config object

## Rules
- ALWAYS use the project's existing patterns (their ORM, their auth, their styling)
- Never install new dependencies \u2014 work with what's there
- The context API is the security boundary \u2014 only expose what the user approves
- Generated code must be TypeScript
- Use relative imports that match the project's existing import style (@ aliases, etc.)
- If you can't find something (no DB, no auth), skip that part and note it
- Create the .clawkit directory if it doesn't exist
- Write clean, production-quality code with good comments

## Important
- Ask questions using the AskUserQuestion tool \u2014 don't assume
- Be thorough in scanning \u2014 read actual schema files, not just package.json
- The project manifest (.clawkit/project.json) is critical \u2014 it's what makes runtime generation smart
- If the project uses a src/ directory, put clawkit files in src/clawkit/. Otherwise use lib/clawkit/
`;
async function main() {
  const cwd = process.cwd();
  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.error("\u274C No package.json found. Run this from your project root.");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "\u274C ANTHROPIC_API_KEY not set. Set it in your environment or .env file."
    );
    console.error("   Get one at https://console.anthropic.com/");
    process.exit(1);
  }
  const manifestPath = path.join(cwd, CLAWKIT_DIR, MANIFEST_FILE);
  if (fs.existsSync(manifestPath)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const answer = await new Promise((resolve) => {
      rl.question(
        "\u26A0\uFE0F  ClawKit is already initialized. Re-run setup? (y/N) ",
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
  console.log("  \u{1F52E} ClawKit Init \u2014 AI-powered setup");
  console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  console.log("");
  console.log("  Claude will scan your project, understand your");
  console.log("  schema and auth, then generate a complete integration.");
  console.log("");
  const clawkitDir = path.join(cwd, CLAWKIT_DIR);
  if (!fs.existsSync(clawkitDir)) {
    fs.mkdirSync(clawkitDir, { recursive: true });
  }
  try {
    let lastToolName = "";
    for await (const message of query({
      prompt: [
        "Scan this project and set up ClawKit. Follow the system prompt instructions exactly.",
        "Start by reading package.json, then find the database schema, auth system, and existing pages.",
        "Ask me which tables to expose and what permissions to set, then generate all integration files."
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
          "Bash"
        ],
        permissionMode: "acceptEdits",
        model: "claude-sonnet-4-20250514",
        maxTurns: 50
      }
    })) {
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if ("text" in block && block.text) {
            console.log(block.text);
          } else if ("name" in block && block.name) {
            const toolName = block.name;
            if (toolName === "Read") {
              const filePath = block.input?.file_path || block.input?.path || "";
              console.log(`  \u{1F4D6} Reading ${filePath}`);
            } else if (toolName === "Write") {
              const filePath = block.input?.file_path || block.input?.path || "";
              console.log(`  \u270D\uFE0F  Writing ${filePath}`);
            } else if (toolName === "Edit") {
              const filePath = block.input?.file_path || block.input?.path || "";
              console.log(`  \u270F\uFE0F  Editing ${filePath}`);
            } else if (toolName === "Glob") {
              console.log(`  \u{1F50D} Searching files...`);
            } else if (toolName === "Grep") {
              console.log(`  \u{1F50E} Searching contents...`);
            } else if (toolName === "AskUserQuestion") {
            } else if (toolName === "Bash") {
              console.log(`  \u26A1 Running command...`);
            }
            lastToolName = toolName;
          }
        }
      } else if (message.type === "result") {
        if (message.subtype === "success") {
          console.log("");
          console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
          console.log("  \u2705 ClawKit is ready!");
          console.log("");
          console.log("  Next steps:");
          console.log("    1. Review the generated files in .clawkit/ and src/clawkit/");
          console.log("    2. Add ANTHROPIC_API_KEY to your .env.local");
          console.log("    3. Run your dev server and press \u2318K");
          console.log("");
        } else if (message.subtype === "error") {
          console.error("");
          console.error("  \u274C Setup failed:", message.error || "Unknown error");
          process.exit(1);
        }
      }
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("");
      console.error("  \u274C Claude Agent SDK not found.");
      console.error("  Run: npm install -g @anthropic-ai/claude-agent-sdk");
      console.error("");
    } else {
      console.error("");
      console.error("  \u274C Error:", error.message);
      console.error("");
    }
    process.exit(1);
  }
}
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
//# sourceMappingURL=init.mjs.map