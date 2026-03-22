// @ts-nocheck
import { db } from "@/db";
import { events, userProfiles, funnels, segments, projects } from "@/db/schema";
import { eq, and, desc, count, sum, sql } from "drizzle-orm";

export function createContext() {
  return {
    queries: {
      async getEventTrend(eventNameOrDays?: string | number, days?: number) {
        // Support both getEventTrend(days) and getEventTrend(eventName, days)
        let eventName: string | undefined;
        let numDays: number;
        if (typeof eventNameOrDays === 'string') {
          eventName = eventNameOrDays;
          numDays = days ?? 90;
        } else {
          numDays = eventNameOrDays ?? 90;
        }
        const result = eventName
          ? await db.execute(sql`
              SELECT to_char(timestamp, 'YYYY-MM-DD') as date, count(*)::int as count
              FROM events WHERE timestamp > now() - make_interval(days => ${numDays}) AND name = ${eventName}
              GROUP BY date ORDER BY date
            `)
          : await db.execute(sql`
              SELECT to_char(timestamp, 'YYYY-MM-DD') as date, count(*)::int as count
              FROM events WHERE timestamp > now() - make_interval(days => ${numDays})
              GROUP BY date ORDER BY date
            `);
        return (result as any).rows || result;
      },
      async getEventsByCategory() {
        const result = await db.execute(sql`
          SELECT category as name, count(*)::int as count FROM events GROUP BY category ORDER BY count DESC
        `);
        return (result as any).rows || result;
      },
      async getTopEvents(limit = 15) {
        const result = await db.execute(sql`
          SELECT name, count(*)::int as count, count(DISTINCT distinct_id)::int as users
          FROM events GROUP BY name ORDER BY count DESC LIMIT ${limit}
        `);
        return (result as any).rows || result;
      },
      async getMetrics() {
        const [m] = await db.select({ totalEvents: count() }).from(events);
        const [u] = await db.execute(sql`SELECT count(DISTINCT distinct_id)::int as unique_users FROM events`);
        return { totalEvents: m.totalEvents, uniqueUsers: (u as any).unique_users };
      },
      async getUserSegments() {
        return db.select().from(segments).orderBy(desc(segments.createdAt));
      },
      async getUserBreakdown(field: string) {
        const result = await db.execute(sql`
          SELECT ${sql.raw(field)} as name, count(*)::int as value FROM user_profiles GROUP BY ${sql.raw(field)} ORDER BY value DESC LIMIT 10
        `);
        return (result as any).rows || result;
      },
      async getFunnels() {
        return db.select().from(funnels).orderBy(desc(funnels.createdAt));
      },
      async getRecentEvents(limit = 50) {
        const result = await db.execute(sql`
          SELECT e.id, e.name, e.category, e.distinct_id, e.properties, e.timestamp,
            u.name as user_name, u.country, u.city
          FROM events e LEFT JOIN user_profiles u ON e.distinct_id = u.distinct_id AND e.project_id = u.project_id
          ORDER BY e.timestamp DESC LIMIT ${limit}
        `);
        return (result as any).rows || result;
      },
    },
    actions: {},
  };
}
