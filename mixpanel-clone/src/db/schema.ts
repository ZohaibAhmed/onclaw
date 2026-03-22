import { pgTable, serial, text, integer, numeric, timestamp, date, pgEnum, boolean, jsonb } from "drizzle-orm/pg-core";

export const eventCategoryEnum = pgEnum("event_category", ["pageview", "click", "signup", "purchase", "custom", "api_call", "error"]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  category: eventCategoryEnum("category").notNull().default("custom"),
  distinctId: text("distinct_id").notNull(), // user identifier
  properties: jsonb("properties"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  distinctId: text("distinct_id").notNull(),
  email: text("email"),
  name: text("name"),
  city: text("city"),
  country: text("country"),
  os: text("os"),
  browser: text("browser"),
  plan: text("plan"),
  revenue: numeric("revenue").default("0"),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  eventCount: integer("event_count").default(0),
});

export const funnels = pgTable("funnels", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  steps: jsonb("steps").notNull(), // array of event names
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const segments = pgTable("segments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  userCount: integer("user_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
