// @ts-nocheck
import { db } from "@/db";
import { boards, lists, cards, labels, cardLabels, cardMembers, members, comments, checklists, checklistItems } from "@/db/schema";
import { eq, and, desc, asc, count, sql, like } from "drizzle-orm";

export interface OnClawContext {
  queries: {
    getBoards: () => Promise<any[]>;
    getBoardDetail: (boardId: number) => Promise<any>;
    getCardDetail: (cardId: number) => Promise<any>;
    getBoardStats: () => Promise<any>;
    getMembers: () => Promise<any[]>;
    searchCards: (query: string) => Promise<any[]>;
  };
  actions: {
    moveCard: (cardId: number, listId: number, position: number) => Promise<void>;
    updateCardTitle: (cardId: number, title: string) => Promise<void>;
  };
}

export function createContext(): OnClawContext {
  return {
    queries: {
      async getBoards() {
        return db.select().from(boards).orderBy(desc(boards.starred), asc(boards.name));
      },
      async getBoardDetail(boardId: number) {
        const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
        const listsData = await db.select().from(lists).where(eq(lists.boardId, boardId)).orderBy(asc(lists.position));
        const cardsData = await db.execute(sql`
          SELECT c.*, 
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', l.id, 'name', l.name, 'color', l.color)) FILTER (WHERE l.id IS NOT NULL), '[]') as labels,
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', m.id, 'name', m.name, 'avatar', m.avatar, 'color', m.color)) FILTER (WHERE m.id IS NOT NULL), '[]') as members
          FROM cards c
          LEFT JOIN card_labels cl ON cl.card_id = c.id
          LEFT JOIN labels l ON l.id = cl.label_id
          LEFT JOIN card_members cme ON cme.card_id = c.id
          LEFT JOIN members m ON m.id = cme.member_id
          WHERE c.list_id IN (SELECT id FROM lists WHERE board_id = ${boardId})
          GROUP BY c.id ORDER BY c.position ASC
        `);
        return { board, lists: listsData, cards: (cardsData as any).rows || cardsData };
      },
      async getCardDetail(cardId: number) {
        const result = await db.execute(sql`
          SELECT c.*, l.name as list_name FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = ${cardId}
        `);
        return ((result as any).rows || result)[0];
      },
      async getBoardStats() {
        const result = await db.execute(sql`
          SELECT b.id, b.name, count(c.id)::int as card_count,
            count(c.id) FILTER (WHERE c.completed = true)::int as done_count
          FROM boards b LEFT JOIN lists l ON l.board_id = b.id LEFT JOIN cards c ON c.list_id = l.id
          GROUP BY b.id, b.name
        `);
        return (result as any).rows || result;
      },
      async getMembers() {
        return db.select().from(members);
      },
      async searchCards(query: string) {
        return db.select({
          id: cards.id,
          title: cards.title,
          listId: cards.listId,
        }).from(cards).where(like(cards.title, `%${query}%`)).limit(20);
      },
    },
    actions: {
      async moveCard(cardId: number, listId: number, position: number) {
        await db.update(cards).set({ listId, position, updatedAt: new Date() }).where(eq(cards.id, cardId));
      },
      async updateCardTitle(cardId: number, title: string) {
        await db.update(cards).set({ title, updatedAt: new Date() }).where(eq(cards.id, cardId));
      },
    },
  };
}
