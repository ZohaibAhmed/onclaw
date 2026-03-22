import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { sql, desc, eq, asc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "boards";

  if (q === "boards") {
    const rows = await db.select().from(schema.boards).orderBy(desc(schema.boards.starred), asc(schema.boards.name));
    // Get card counts per board
    const counts = await db.execute(sql`
      SELECT b.id as board_id, count(c.id)::int as card_count
      FROM boards b
      LEFT JOIN lists l ON l.board_id = b.id
      LEFT JOIN cards c ON c.list_id = l.id
      GROUP BY b.id
    `);
    const countMap: Record<number, number> = {};
    for (const r of (counts as any).rows || counts) {
      countMap[r.board_id] = r.card_count;
    }
    return NextResponse.json({
      boards: rows.map(b => ({ ...b, cardCount: countMap[b.id] || 0 })),
    });
  }

  if (q === "board") {
    const boardId = Number(searchParams.get("id"));
    if (!boardId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const [board] = await db.select().from(schema.boards).where(eq(schema.boards.id, boardId));
    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const listsData = await db.select().from(schema.lists)
      .where(eq(schema.lists.boardId, boardId))
      .orderBy(asc(schema.lists.position));

    const cardsData = await db.execute(sql`
      SELECT c.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', l.id, 'name', l.name, 'color', l.color)) FILTER (WHERE l.id IS NOT NULL), '[]') as labels,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'avatar', m.avatar, 'color', m.color)) FILTER (WHERE m.id IS NOT NULL), '[]') as members,
        (SELECT count(*)::int FROM comments cm WHERE cm.card_id = c.id) as comment_count,
        (SELECT count(*)::int FROM checklist_items ci JOIN checklists ch ON ci.checklist_id = ch.id WHERE ch.card_id = c.id) as checklist_total,
        (SELECT count(*)::int FROM checklist_items ci JOIN checklists ch ON ci.checklist_id = ch.id WHERE ch.card_id = c.id AND ci.completed = true) as checklist_done
      FROM cards c
      LEFT JOIN card_labels cl ON cl.card_id = c.id
      LEFT JOIN labels l ON l.id = cl.label_id
      LEFT JOIN card_members cme ON cme.card_id = c.id
      LEFT JOIN members m ON m.id = cme.member_id
      WHERE c.list_id IN (SELECT id FROM lists WHERE board_id = ${boardId})
      GROUP BY c.id
      ORDER BY c.position ASC
    `);

    const members = await db.select().from(schema.members);
    const boardLabels = await db.select().from(schema.labels).where(eq(schema.labels.boardId, boardId));

    return NextResponse.json({
      board,
      lists: listsData,
      cards: (cardsData as any).rows || cardsData,
      members,
      labels: boardLabels,
    });
  }

  if (q === "card") {
    const cardId = Number(searchParams.get("id"));
    if (!cardId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const cardData = await db.execute(sql`
      SELECT c.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', l.id, 'name', l.name, 'color', l.color)) FILTER (WHERE l.id IS NOT NULL), '[]') as labels,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'avatar', m.avatar, 'color', m.color)) FILTER (WHERE m.id IS NOT NULL), '[]') as members
      FROM cards c
      LEFT JOIN card_labels cl ON cl.card_id = c.id
      LEFT JOIN labels l ON l.id = cl.label_id
      LEFT JOIN card_members cme ON cme.card_id = c.id
      LEFT JOIN members m ON m.id = cme.member_id
      WHERE c.id = ${cardId}
      GROUP BY c.id
    `);

    const card = ((cardData as any).rows || cardData)[0];
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const checklists = await db.select().from(schema.checklists).where(eq(schema.checklists.cardId, cardId));
    const checklistItems = checklists.length > 0
      ? await db.select().from(schema.checklistItems)
          .where(sql`${schema.checklistItems.checklistId} IN (${sql.join(checklists.map(c => sql`${c.id}`), sql`, `)})`)
          .orderBy(asc(schema.checklistItems.position))
      : [];

    const comments = await db.execute(sql`
      SELECT co.*, m.name as author_name, m.avatar as author_avatar, m.color as author_color
      FROM comments co
      JOIN members m ON m.id = co.member_id
      WHERE co.card_id = ${cardId}
      ORDER BY co.created_at DESC
    `);

    // Get list name
    const [list] = await db.select().from(schema.lists).where(eq(schema.lists.id, card.list_id));

    return NextResponse.json({
      card,
      listName: list?.name || "Unknown",
      checklists,
      checklistItems,
      comments: (comments as any).rows || comments,
    });
  }

  return NextResponse.json({ error: "Unknown query" }, { status: 400 });
}
