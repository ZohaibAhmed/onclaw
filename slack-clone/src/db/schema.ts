import { pgTable, serial, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const channelTypeEnum = pgEnum("channel_type", ["public", "private", "dm"]);
export const userStatusEnum = pgEnum("user_status", ["online", "away", "dnd", "offline"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"), // initials
  status: userStatusEnum("status").notNull().default("online"),
  statusText: text("status_text"),
  title: text("title"),
  timezone: text("timezone").default("America/Los_Angeles"),
  isBot: boolean("is_bot").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: channelTypeEnum("type").notNull().default("public"),
  topic: text("topic"),
  isArchived: boolean("is_archived").default(false),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelMembers = pgTable("channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  threadId: integer("thread_id"), // self-ref: parent message id for thread replies
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
