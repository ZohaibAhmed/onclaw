import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { sql, desc, eq, and, isNull, count } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "channels";

  if (q === "channels") {
    const result = await db.execute(sql`
      SELECT c.*,
        (SELECT count(*) FROM channel_members cm WHERE cm.channel_id = c.id)::int as member_count,
        (SELECT count(*) FROM messages m WHERE m.channel_id = c.id)::int as message_count
      FROM channels c ORDER BY c.name
    `);
    return NextResponse.json({ channels: (result as any).rows || result });
  }

  if (q === "messages") {
    const channelId = Number(searchParams.get("channelId") || 1);
    const limit = Number(searchParams.get("limit") || 50);

    // Get channel info
    const [channel] = await db.select().from(schema.channels).where(eq(schema.channels.id, channelId));

    // Get top-level messages (no thread replies)
    const msgs = await db.select({
      id: schema.messages.id,
      content: schema.messages.content,
      threadId: schema.messages.threadId,
      isEdited: schema.messages.isEdited,
      createdAt: schema.messages.createdAt,
      userId: schema.messages.userId,
      userName: schema.users.name,
      userDisplayName: schema.users.displayName,
      userAvatar: schema.users.avatar,
      userStatus: schema.users.status,
      userIsBot: schema.users.isBot,
    }).from(schema.messages)
      .innerJoin(schema.users, eq(schema.messages.userId, schema.users.id))
      .where(and(eq(schema.messages.channelId, channelId), isNull(schema.messages.threadId)))
      .orderBy(schema.messages.createdAt)
      .limit(limit);

    // Get thread reply counts
    const msgIds = msgs.map((m) => m.id);
    let threadCounts: Record<number, number> = {};
    if (msgIds.length > 0) {
      const tc = await db.execute(sql`
        SELECT thread_id, count(*)::int as reply_count
        FROM messages WHERE thread_id IN ${sql`(${sql.join(msgIds.map(id => sql`${id}`), sql`, `)})`}
        GROUP BY thread_id
      `);
      for (const r of ((tc as any).rows || tc) as any[]) {
        threadCounts[r.thread_id] = r.reply_count;
      }
    }

    // Get reactions grouped
    let reactionsMap: Record<number, { emoji: string; count: number; users: string[] }[]> = {};
    if (msgIds.length > 0) {
      const rxns = await db.execute(sql`
        SELECT r.message_id, r.emoji, count(*)::int as cnt, array_agg(u.name) as user_names
        FROM reactions r JOIN users u ON r.user_id = u.id
        WHERE r.message_id IN ${sql`(${sql.join(msgIds.map(id => sql`${id}`), sql`, `)})`}
        GROUP BY r.message_id, r.emoji
      `);
      for (const r of ((rxns as any).rows || rxns) as any[]) {
        if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
        reactionsMap[r.message_id].push({ emoji: r.emoji, count: r.cnt, users: r.user_names });
      }
    }

    const enriched = msgs.map((m) => ({
      ...m,
      replyCount: threadCounts[m.id] || 0,
      reactions: reactionsMap[m.id] || [],
    }));

    // Member count
    const [{ memberCount }] = await db.select({ memberCount: count() })
      .from(schema.channelMembers)
      .where(eq(schema.channelMembers.channelId, channelId));

    return NextResponse.json({ channel, messages: enriched, memberCount });
  }

  if (q === "thread") {
    const threadId = Number(searchParams.get("threadId"));
    // Parent message
    const [parent] = await db.select({
      id: schema.messages.id,
      content: schema.messages.content,
      createdAt: schema.messages.createdAt,
      userId: schema.messages.userId,
      userName: schema.users.name,
      userAvatar: schema.users.avatar,
      userDisplayName: schema.users.displayName,
    }).from(schema.messages)
      .innerJoin(schema.users, eq(schema.messages.userId, schema.users.id))
      .where(eq(schema.messages.id, threadId));

    const replies = await db.select({
      id: schema.messages.id,
      content: schema.messages.content,
      createdAt: schema.messages.createdAt,
      userId: schema.messages.userId,
      userName: schema.users.name,
      userAvatar: schema.users.avatar,
      userDisplayName: schema.users.displayName,
    }).from(schema.messages)
      .innerJoin(schema.users, eq(schema.messages.userId, schema.users.id))
      .where(eq(schema.messages.threadId, threadId))
      .orderBy(schema.messages.createdAt);

    return NextResponse.json({ parent, replies });
  }

  if (q === "users") {
    const rows = await db.select().from(schema.users).orderBy(schema.users.name);
    return NextResponse.json({ users: rows });
  }

  return NextResponse.json({ error: "Unknown query" }, { status: 400 });
}
