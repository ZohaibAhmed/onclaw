// @ts-nocheck
import { db } from "@/db";
import { users, channels, channelMembers, messages, reactions, bookmarks } from "@/db/schema";
import { eq, and, desc, count, sql, isNull, isNotNull } from "drizzle-orm";

export interface OnClawContext {
  queries: {
    getUsers: (filters?: { status?: string; limit?: number }) => Promise<any[]>;
    getChannels: (filters?: { type?: string; limit?: number }) => Promise<any[]>;
    getChannelMessages: (channelId: number, filters?: { limit?: number; before?: number }) => Promise<any[]>;
    getThreadReplies: (threadId: number) => Promise<any[]>;
    searchMessages: (query: string, filters?: { channelId?: number; userId?: number; limit?: number }) => Promise<any[]>;
    getChannelStats: () => Promise<any[]>;
    getUserActivity: (userId: number) => Promise<any>;
    getRecentThreads: (channelId: number, limit?: number) => Promise<any[]>;
  };
  actions: {
    sendMessage: (channelId: number, userId: number, content: string, threadId?: number) => Promise<any>;
    addReaction: (messageId: number, userId: number, emoji: string) => Promise<void>;
    updateChannelTopic: (channelId: number, topic: string) => Promise<void>;
  };
}

export function createContext(): OnClawContext {
  return {
    queries: {
      async getUsers(filters = {}) {
        let query: any = db.select().from(users);
        const conditions = [];
        if (filters.status) conditions.push(eq(users.status, filters.status));
        if (conditions.length) query = query.where(and(...conditions));
        if (filters.limit) query = query.limit(filters.limit);
        return query;
      },

      async getChannels(filters = {}) {
        let query: any = db.select().from(channels);
        const conditions = [];
        if (filters.type) conditions.push(eq(channels.type, filters.type));
        if (conditions.length) query = query.where(and(...conditions));
        query = query.orderBy(channels.name);
        if (filters.limit) query = query.limit(filters.limit);
        return query;
      },

      async getChannelMessages(channelId, filters = {}) {
        const limit = filters.limit || 50;
        return db.select({
          id: messages.id,
          content: messages.content,
          threadId: messages.threadId,
          createdAt: messages.createdAt,
          userId: messages.userId,
          userName: users.name,
          userAvatar: users.avatar,
          userStatus: users.status,
        }).from(messages)
          .innerJoin(users, eq(messages.userId, users.id))
          .where(and(eq(messages.channelId, channelId), isNull(messages.threadId)))
          .orderBy(desc(messages.createdAt))
          .limit(limit);
      },

      async getThreadReplies(threadId) {
        return db.select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          userId: messages.userId,
          userName: users.name,
          userAvatar: users.avatar,
        }).from(messages)
          .innerJoin(users, eq(messages.userId, users.id))
          .where(eq(messages.threadId, threadId))
          .orderBy(messages.createdAt);
      },

      async searchMessages(query, filters = {}) {
        const limit = filters.limit || 20;
        const conditions = [sql`${messages.content} ILIKE ${'%' + query + '%'}`];
        if (filters.channelId) conditions.push(eq(messages.channelId, filters.channelId));
        if (filters.userId) conditions.push(eq(messages.userId, filters.userId));

        return db.select({
          id: messages.id,
          content: messages.content,
          channelId: messages.channelId,
          channelName: channels.name,
          createdAt: messages.createdAt,
          userName: users.name,
        }).from(messages)
          .innerJoin(users, eq(messages.userId, users.id))
          .innerJoin(channels, eq(messages.channelId, channels.id))
          .where(and(...conditions))
          .orderBy(desc(messages.createdAt))
          .limit(limit);
      },

      async getChannelStats() {
        const result = await db.execute(sql`
          SELECT c.id, c.name, c.type, c.topic,
            (SELECT count(*) FROM messages m WHERE m.channel_id = c.id)::int as message_count,
            (SELECT count(*) FROM channel_members cm WHERE cm.channel_id = c.id)::int as member_count,
            (SELECT max(m.created_at) FROM messages m WHERE m.channel_id = c.id) as last_activity
          FROM channels c ORDER BY c.name
        `);
        return (result as any).rows || result;
      },

      async getUserActivity(userId) {
        const [msgCount] = await db.select({ count: count() }).from(messages).where(eq(messages.userId, userId));
        const [reactionCount] = await db.select({ count: count() }).from(reactions).where(eq(reactions.userId, userId));
        return { messageCount: msgCount.count, reactionCount: reactionCount.count };
      },

      async getRecentThreads(channelId, limit = 5) {
        const result = await db.execute(sql`
          SELECT m.id, m.content, m.created_at, u.name as user_name, u.avatar as user_avatar,
            (SELECT count(*) FROM messages r WHERE r.thread_id = m.id)::int as reply_count,
            (SELECT max(r.created_at) FROM messages r WHERE r.thread_id = m.id) as last_reply
          FROM messages m
          JOIN users u ON m.user_id = u.id
          WHERE m.channel_id = ${channelId} AND m.thread_id IS NULL
            AND (SELECT count(*) FROM messages r WHERE r.thread_id = m.id) > 0
          ORDER BY last_reply DESC
          LIMIT ${limit}
        `);
        return (result as any).rows || result;
      },
    },

    actions: {
      async sendMessage(channelId, userId, content, threadId) {
        const [msg] = await db.insert(messages).values({
          channelId, userId, content, threadId: threadId || null,
        }).returning();
        return msg;
      },

      async addReaction(messageId, userId, emoji) {
        await db.insert(reactions).values({ messageId, userId, emoji });
      },

      async updateChannelTopic(channelId, topic) {
        await db.update(channels).set({ topic }).where(eq(channels.id, channelId));
      },
    },
  };
}
