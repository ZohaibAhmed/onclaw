/**
 * System prompt templates used during runtime generation.
 * These get enriched with the project manifest from .clawkit/project.json.
 */

export function buildRuntimeSystemPrompt(manifest: ProjectManifest): string {
  return `You are a code generator for a ${manifest.framework} application using ClawKit.
You generate React components that use a provided context API to query real data.

## Project Context
- Framework: ${manifest.framework}
- ORM: ${manifest.orm || "none"}
- Database: ${manifest.database || "none"}
- Styling: ${typeof manifest.styling === "object" ? manifest.styling.framework || "tailwind" : manifest.styling || "tailwind"}
- Auth: ${manifest.auth || manifest.authSystem || "none"}

## Database Schema
${formatSchema(manifest.schema)}

## Available Context API
Generated components receive a \`ctx\` prop with these functions:

### Queries (read-only)
${formatQueries(manifest.queries)}

### Actions (mutations)
${formatActions(manifest.actions)}

## Rules
- Use ONLY \`ctx.queries.*\` and \`ctx.actions.*\` to access data — NO raw database imports
- Use ONLY React and standard browser APIs — no external imports
- Use JSX freely (it will be transpiled automatically)
- Use inline styles with CSS variables: var(--ck-bg), var(--ck-text), var(--ck-accent), var(--ck-border), var(--ck-radius)
- For charts/visualizations, use inline SVG — no chart libraries
- Use mock/sample data as fallback if a query isn't available
- Components must be self-contained — assign to \`const Component = ...\`
- Handle loading and error states gracefully
- Match the app's existing visual style: ${manifest.uiPatterns?.theme || (typeof manifest.styling === "object" ? manifest.styling.theme : "dark")} theme, ${manifest.uiPatterns?.styling || "clean minimal"}

## Available Data Fields
${formatDataFields(manifest.schema)}
`;
}

export interface ProjectManifest {
  framework: string;
  orm?: string;
  database?: string;
  auth?: string;
  authSystem?: string;
  styling?: string | { framework?: string; theme?: string; colorPalette?: Record<string, string> };
  schema: Record<string, TableSchema>;
  queries: QueryDef[] | Record<string, any>;
  actions: ActionDef[] | Record<string, any>;
  uiPatterns?: {
    theme?: string;
    styling?: string;
    componentLibrary?: string;
    components?: Record<string, string>;
    colors?: Record<string, any>;
    formatting?: Record<string, string>;
  };
  pages?: PageDef[];
  slots?: Record<string, { name: string; description: string }>;
  generatedAt?: string;
}

export interface TableSchema {
  table?: string;
  description?: string;
  columns: Record<string, any> | { name: string; type: string; nullable?: boolean; references?: string }[];
  relations?: Record<string, any>;
}

export interface QueryDef {
  name: string;
  description: string;
  params?: string;
  returns: string;
}

export interface ActionDef {
  name: string;
  description: string;
  params: string;
}

export interface PageDef {
  path: string;
  name: string;
  dataQueries: string[];
}

// ─── Formatters ─────────────────────────────────────────

function formatSchema(schema: Record<string, TableSchema>): string {
  if (!schema || Object.keys(schema).length === 0) return "No schema available.";

  return Object.entries(schema)
    .map(([table, def]) => {
      // Handle columns as either array or object
      let colLines: string[];
      if (Array.isArray(def.columns)) {
        colLines = def.columns.map(
          (c: any) => `  - ${c.name}: ${c.type}${c.nullable ? " (nullable)" : ""}${c.references ? ` → ${c.references}` : ""}`
        );
      } else {
        colLines = Object.entries(def.columns).map(
          ([name, info]: [string, any]) => `  - ${name}: ${info.type || info}${info.nullable ? " (nullable)" : ""}${info.references ? ` → ${info.references}` : ""}`
        );
      }
      const desc = def.description ? `\n  ${def.description}` : "";
      const rels = def.relations
        ? "\n  Relations: " +
          Object.entries(def.relations)
            .map(([k, v]) => `${k} → ${typeof v === "string" ? v : (v as any).table || JSON.stringify(v)}`)
            .join(", ")
        : "";
      return `### ${table}${desc}\n${colLines.join("\n")}${rels}`;
    })
    .join("\n\n");
}

function formatQueries(queries: QueryDef[] | Record<string, any>): string {
  if (!queries) return "No queries available.";
  // Handle object format from manifest
  if (!Array.isArray(queries)) {
    return Object.entries(queries)
      .map(([name, def]) => `- \`ctx.queries.${name}(${def.filters ? `{${def.filters.join(", ")}}` : ""})\` — ${def.description} → ${def.returns}`)
      .join("\n");
  }
  if (queries.length === 0) return "No queries available.";
  return queries
    .map((q) => `- \`ctx.queries.${q.name}(${q.params || ""})\` — ${q.description} → ${q.returns}`)
    .join("\n");
}

function formatActions(actions: ActionDef[] | Record<string, any>): string {
  if (!actions) return "No write actions available (read-only mode).";
  if (!Array.isArray(actions)) {
    const entries = Object.entries(actions);
    if (entries.length === 0) return "No write actions available (read-only mode).";
    return entries
      .map(([name, def]) => `- \`ctx.actions.${name}(${def.params || ""})\` — ${def.description}`)
      .join("\n");
  }
  if (actions.length === 0) return "No write actions available (read-only mode).";
  return actions
    .map((a) => `- \`ctx.actions.${a.name}(${a.params})\` — ${a.description}`)
    .join("\n");
}

function formatDataFields(schema: Record<string, TableSchema>): string {
  if (!schema || Object.keys(schema).length === 0) return "No schema available.";
  return Object.entries(schema)
    .map(([table, def]) => {
      const colNames = Array.isArray(def.columns)
        ? def.columns.map((c: any) => c.name)
        : Object.keys(def.columns);
      return `**${table}**: ${colNames.join(", ")}`;
    })
    .join("\n");
}
