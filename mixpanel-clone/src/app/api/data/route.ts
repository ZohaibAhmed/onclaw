import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { sql, desc, eq, count, sum, avg } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "events";

  if (q === "events") {
    // Event trend by day
    const trend = await db.execute(sql`
      SELECT to_char(timestamp, 'YYYY-MM-DD') as date, count(*)::int as count
      FROM events
      WHERE timestamp > now() - interval '90 days'
      GROUP BY date ORDER BY date
    `);

    // Events by category
    const byCategory = await db.execute(sql`
      SELECT category as name, count(*)::int as count
      FROM events GROUP BY category ORDER BY count DESC
    `);

    // Top events
    const topEvents = await db.execute(sql`
      SELECT name, count(*)::int as count,
        count(DISTINCT distinct_id)::int as users
      FROM events GROUP BY name ORDER BY count DESC LIMIT 15
    `);

    // Metrics
    const [metrics] = await db.select({
      totalEvents: count(),
    }).from(schema.events);
    const [uniqueUsers] = await db.execute(sql`
      SELECT count(DISTINCT distinct_id)::int as unique_users FROM events
    `);
    const [topEvent] = await db.execute(sql`
      SELECT name, count(*)::int as cnt FROM events GROUP BY name ORDER BY cnt DESC LIMIT 1
    `);

    return NextResponse.json({
      trend: (trend as any).rows || trend,
      byCategory: (byCategory as any).rows || byCategory,
      topEvents: (topEvents as any).rows || topEvents,
      metrics: {
        totalEvents: metrics.totalEvents,
        uniqueUsers: (uniqueUsers as any).unique_users,
        avgPerUser: metrics.totalEvents > 0 ? Math.round(metrics.totalEvents / ((uniqueUsers as any).unique_users || 1)) : 0,
        topEvent: (topEvent as any).name,
      },
    });
  }

  if (q === "funnels") {
    const funnelRows = await db.select().from(schema.funnels).orderBy(desc(schema.funnels.createdAt));
    // Compute funnel data for each
    const funnelsWithData = await Promise.all(funnelRows.map(async (funnel) => {
      const steps = JSON.parse(funnel.steps as string) as string[];
      const stepData = [];
      let prevUsers = 0;
      for (let i = 0; i < steps.length; i++) {
        let userCountResult;
        if (i === 0) {
          userCountResult = await db.execute(sql`
            SELECT count(DISTINCT distinct_id)::int as users FROM events WHERE name = ${steps[i]}
          `);
        } else {
          // Users who did step i AND all previous steps
          const prevSteps = steps.slice(0, i + 1);
          userCountResult = await db.execute(sql`
            SELECT count(DISTINCT e1.distinct_id)::int as users
            FROM events e1
            WHERE e1.name = ${steps[i]}
            AND e1.distinct_id IN (
              SELECT distinct_id FROM events WHERE name = ${steps[0]}
            )
          `);
        }
        const users = ((userCountResult as any).rows?.[0] || (userCountResult as any)[0])?.users || 0;
        const rate = i === 0 ? 100 : (prevUsers > 0 ? Math.round((users / prevUsers) * 100) : 0);
        stepData.push({ step: steps[i], users, rate });
        prevUsers = users;
      }
      return { ...funnel, stepData };
    }));
    return NextResponse.json({ funnels: funnelsWithData });
  }

  if (q === "segments") {
    const segmentRows = await db.select().from(schema.segments).orderBy(desc(schema.segments.createdAt));
    // User breakdown
    const byPlan = await db.execute(sql`
      SELECT plan as name, count(*)::int as value FROM user_profiles GROUP BY plan ORDER BY value DESC
    `);
    const byCountry = await db.execute(sql`
      SELECT country as name, count(*)::int as value FROM user_profiles GROUP BY country ORDER BY value DESC LIMIT 10
    `);
    const byOS = await db.execute(sql`
      SELECT os as name, count(*)::int as value FROM user_profiles GROUP BY os ORDER BY value DESC
    `);
    const byBrowser = await db.execute(sql`
      SELECT browser as name, count(*)::int as value FROM user_profiles GROUP BY browser ORDER BY value DESC
    `);
    return NextResponse.json({
      segments: segmentRows,
      byPlan: (byPlan as any).rows || byPlan,
      byCountry: (byCountry as any).rows || byCountry,
      byOS: (byOS as any).rows || byOS,
      byBrowser: (byBrowser as any).rows || byBrowser,
    });
  }

  if (q === "retention") {
    // Cohort retention: for each week cohort, what % are still active in subsequent weeks
    const cohorts = await db.execute(sql`
      WITH cohort AS (
        SELECT distinct_id,
          date_trunc('week', min(timestamp)) as cohort_week
        FROM events GROUP BY distinct_id
      ),
      activity AS (
        SELECT DISTINCT e.distinct_id,
          date_trunc('week', e.timestamp) as activity_week,
          c.cohort_week
        FROM events e
        JOIN cohort c ON e.distinct_id = c.distinct_id
      )
      SELECT
        to_char(cohort_week, 'YYYY-MM-DD') as cohort,
        EXTRACT(days FROM (activity_week - cohort_week))::int / 7 as week_number,
        count(DISTINCT distinct_id)::int as users
      FROM activity
      WHERE EXTRACT(days FROM (activity_week - cohort_week)) >= 0
      GROUP BY cohort_week, week_number
      ORDER BY cohort_week, week_number
      LIMIT 200
    `);
    // Retention curve (average across cohorts)
    const curve = await db.execute(sql`
      WITH cohort AS (
        SELECT distinct_id, date_trunc('week', min(timestamp)) as cohort_week
        FROM events GROUP BY distinct_id
      ),
      activity AS (
        SELECT DISTINCT e.distinct_id,
          date_trunc('week', e.timestamp) as activity_week,
          c.cohort_week
        FROM events e JOIN cohort c ON e.distinct_id = c.distinct_id
      ),
      weekly AS (
        SELECT cohort_week,
          EXTRACT(days FROM (activity_week - cohort_week))::int / 7 as week_number,
          count(DISTINCT distinct_id)::int as users
        FROM activity
        WHERE EXTRACT(days FROM (activity_week - cohort_week)) >= 0
        GROUP BY cohort_week, week_number
      ),
      base AS (
        SELECT cohort_week, users as base_users FROM weekly WHERE week_number = 0
      )
      SELECT
        w.week_number as week,
        round(avg(w.users::float / NULLIF(b.base_users, 0) * 100))::int as retention
      FROM weekly w JOIN base b ON w.cohort_week = b.cohort_week
      WHERE w.week_number <= 12
      GROUP BY w.week_number
      ORDER BY w.week_number
    `);
    return NextResponse.json({
      cohorts: (cohorts as any).rows || cohorts,
      curve: ((curve as any).rows || curve).map((r: any) => ({ week: `W${r.week}`, retention: r.retention })),
    });
  }

  if (q === "live") {
    // Recent events (simulating live)
    const recent = await db.execute(sql`
      SELECT e.id, e.name, e.category, e.distinct_id,
        e.properties, e.timestamp,
        u.name as user_name, u.country, u.city
      FROM events e
      LEFT JOIN user_profiles u ON e.distinct_id = u.distinct_id AND e.project_id = u.project_id
      ORDER BY e.timestamp DESC
      LIMIT 50
    `);
    // Events per minute (last hour, grouped by minute)
    const perMinute = await db.execute(sql`
      SELECT to_char(timestamp, 'HH24:MI') as minute, count(*)::int as count
      FROM events
      WHERE timestamp > now() - interval '60 minutes'
      GROUP BY minute ORDER BY minute
    `);
    return NextResponse.json({
      events: (recent as any).rows || recent,
      perMinute: (perMinute as any).rows || perMinute,
    });
  }

  return NextResponse.json({ error: "Unknown query" }, { status: 400 });
}
