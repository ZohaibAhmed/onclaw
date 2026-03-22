import { pgTable, serial, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const labelColorEnum = pgEnum("label_color", [
  "green", "yellow", "orange", "red", "purple", "blue", "sky", "pink", "black"
]);

export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  background: text("background").notNull().default("#0079bf"),
  starred: boolean("starred").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => lists.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").notNull().default(false),
  coverColor: text("cover_color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").references(() => boards.id).notNull(),
  name: text("name").notNull(),
  color: labelColorEnum("color").notNull(),
});

export const cardLabels = pgTable("card_labels", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  labelId: integer("label_id").references(() => labels.id).notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar").notNull(),
  color: text("color").notNull().default("#0079bf"),
});

export const cardMembers = pgTable("card_members", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  memberId: integer("member_id").references(() => members.id).notNull(),
});

export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  title: text("title").notNull().default("Checklist"),
});

export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").references(() => checklists.id).notNull(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  position: integer("position").notNull().default(0),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").references(() => cards.id).notNull(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
