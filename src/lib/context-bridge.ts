/**
 * Context Bridge — Client-side proxy for the server-side context API.
 *
 * Generated components call `ctx.queries.getDeals()` which gets proxied
 * to `/api/clawkit/context` on the server, executing the real query functions.
 */

export interface ContextBridgeConfig {
  /** Context API endpoint (default: /api/clawkit/context) */
  endpoint?: string;
  /** Additional headers (e.g., auth tokens) */
  headers?: Record<string, string>;
  /** Cache TTL in ms (default: 30000 — 30 seconds) */
  cacheTtlMs?: number;
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

/**
 * Creates a client-side context proxy that routes calls to the server.
 * Generated components use this like: `const deals = await ctx.queries.getDeals({ stage: "won" })`
 */
export function createContextBridge(config: ContextBridgeConfig = {}) {
  const endpoint = config.endpoint || "/api/clawkit/context";
  const cacheTtl = config.cacheTtlMs ?? 30000;
  const cache = new Map<string, CacheEntry>();

  async function call(type: "query" | "action", name: string, args: any[]): Promise<any> {
    // Check cache for queries (not actions)
    if (type === "query") {
      const cacheKey = `${name}:${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify({ type, name, args }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Context call failed: ${res.status}`);
    }

    const { data } = await res.json();

    // Cache query results
    if (type === "query" && cacheTtl > 0) {
      const cacheKey = `${name}:${JSON.stringify(args)}`;
      cache.set(cacheKey, { data, expiresAt: Date.now() + cacheTtl });
    }

    return data;
  }

  // Build proxy objects for queries and actions
  const queries = new Proxy({} as Record<string, (...args: any[]) => Promise<any>>, {
    get(_target, prop: string) {
      return (...args: any[]) => call("query", prop, args);
    },
  });

  const actions = new Proxy({} as Record<string, (...args: any[]) => Promise<any>>, {
    get(_target, prop: string) {
      return (...args: any[]) => call("action", prop, args);
    },
  });

  return {
    queries,
    actions,
    /** Clear the query cache */
    clearCache() {
      cache.clear();
    },
  };
}
