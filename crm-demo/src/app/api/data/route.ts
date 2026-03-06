import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { sql, desc, eq, count, sum, avg } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "dashboard";

  if (q === "dashboard") {
    const [metrics] = await db.select({
      totalDeals: count(),
      totalPipeline: sum(schema.deals.value),
      avgDealSize: avg(schema.deals.value),
    }).from(schema.deals);

    const wonDeals = await db.select({ count: count(), total: sum(schema.deals.value) })
      .from(schema.deals).where(eq(schema.deals.stage, "closed-won"));

    const lostDeals = await db.select({ count: count() })
      .from(schema.deals).where(eq(schema.deals.stage, "closed-lost"));

    const pipeline = await db.select({ stage: schema.deals.stage, count: count(), total: sum(schema.deals.value) })
      .from(schema.deals).groupBy(schema.deals.stage);

    const recentActivity = await db.select({
      id: schema.activities.id,
      type: schema.activities.type,
      subject: schema.activities.subject,
      createdAt: schema.activities.createdAt,
      ownerName: schema.users.name,
    }).from(schema.activities)
      .leftJoin(schema.users, eq(schema.activities.ownerId, schema.users.id))
      .orderBy(desc(schema.activities.createdAt))
      .limit(15);

    const leaderboard = await db.select({
      name: schema.users.name,
      avatar: schema.users.avatar,
      wonCount: count(),
      wonValue: sum(schema.deals.value),
    }).from(schema.deals)
      .innerJoin(schema.users, eq(schema.deals.ownerId, schema.users.id))
      .where(eq(schema.deals.stage, "closed-won"))
      .groupBy(schema.users.name, schema.users.avatar)
      .orderBy(desc(sum(schema.deals.value)));

    // Monthly deals
    const monthlyDeals = await db.execute(sql`
      SELECT
        to_char(created_at, 'YYYY-MM') as month,
        stage,
        count(*)::int as deal_count,
        sum(value::numeric)::bigint as total_value
      FROM deals
      WHERE stage IN ('closed-won', 'closed-lost')
      GROUP BY month, stage
      ORDER BY month
    `);

    const totalWon = Number(wonDeals[0]?.count || 0);
    const totalLost = Number(lostDeals[0]?.count || 0);
    const winRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;

    return NextResponse.json({
      metrics: {
        totalPipeline: Number(metrics.totalPipeline || 0),
        avgDealSize: Math.round(Number(metrics.avgDealSize || 0)),
        totalDeals: Number(metrics.totalDeals),
        wonRevenue: Number(wonDeals[0]?.total || 0),
        winRate,
      },
      pipeline,
      recentActivity,
      leaderboard,
      monthlyDeals: (monthlyDeals as any).rows || monthlyDeals,
    });
  }

  if (q === "contacts") {
    const page = Number(searchParams.get("page") || 1);
    const limit = 25;
    const offset = (page - 1) * limit;
    const rows = await db.select({
      id: schema.contacts.id,
      firstName: schema.contacts.firstName,
      lastName: schema.contacts.lastName,
      email: schema.contacts.email,
      phone: schema.contacts.phone,
      company: schema.contacts.company,
      title: schema.contacts.title,
      status: schema.contacts.status,
      source: schema.contacts.source,
      ownerName: schema.users.name,
      createdAt: schema.contacts.createdAt,
    }).from(schema.contacts)
      .leftJoin(schema.users, eq(schema.contacts.ownerId, schema.users.id))
      .orderBy(desc(schema.contacts.createdAt))
      .limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(schema.contacts);
    return NextResponse.json({ contacts: rows, total, page, pages: Math.ceil(total / limit) });
  }

  if (q === "deals") {
    const rows = await db.select({
      id: schema.deals.id,
      name: schema.deals.name,
      value: schema.deals.value,
      stage: schema.deals.stage,
      probability: schema.deals.probability,
      expectedCloseDate: schema.deals.expectedCloseDate,
      ownerName: schema.users.name,
      ownerAvatar: schema.users.avatar,
      contactName: sql<string>`${schema.contacts.firstName} || ' ' || ${schema.contacts.lastName}`,
      companyName: schema.companies.name,
      createdAt: schema.deals.createdAt,
    }).from(schema.deals)
      .leftJoin(schema.users, eq(schema.deals.ownerId, schema.users.id))
      .leftJoin(schema.contacts, eq(schema.deals.contactId, schema.contacts.id))
      .leftJoin(schema.companies, eq(schema.deals.companyId, schema.companies.id))
      .orderBy(desc(schema.deals.createdAt));
    return NextResponse.json({ deals: rows });
  }

  if (q === "analytics") {
    const byMonth = await db.execute(sql`
      SELECT to_char(created_at, 'YYYY-MM') as month, stage,
        count(*)::int as cnt, sum(value::numeric)::bigint as total
      FROM deals GROUP BY month, stage ORDER BY month
    `);
    const byRep = await db.execute(sql`
      SELECT u.name, d.stage, count(*)::int as cnt, sum(d.value::numeric)::bigint as total
      FROM deals d JOIN users u ON d.owner_id = u.id
      GROUP BY u.name, d.stage ORDER BY u.name
    `);
    const bySource = await db.execute(sql`
      SELECT c.source, count(d.id)::int as cnt, sum(d.value::numeric)::bigint as total
      FROM deals d JOIN contacts c ON d.contact_id = c.id
      WHERE d.stage = 'closed-won'
      GROUP BY c.source ORDER BY total DESC
    `);
    const velocity = await db.execute(sql`
      SELECT to_char(created_at, 'YYYY-MM') as month,
        avg(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::int as avg_days
      FROM deals WHERE stage IN ('closed-won', 'closed-lost')
      GROUP BY month ORDER BY month
    `);
    return NextResponse.json({
      byMonth: (byMonth as any).rows || byMonth,
      byRep: (byRep as any).rows || byRep,
      bySource: (bySource as any).rows || bySource,
      velocity: (velocity as any).rows || velocity,
    });
  }

  return NextResponse.json({ error: "Unknown query" }, { status: 400 });
}
