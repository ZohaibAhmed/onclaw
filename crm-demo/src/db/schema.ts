import { pgTable, serial, text, integer, numeric, timestamp, date, pgEnum } from "drizzle-orm/pg-core";

export const contactStatusEnum = pgEnum("contact_status", ["lead", "customer", "churned"]);
export const contactSourceEnum = pgEnum("contact_source", ["website", "referral", "linkedin", "cold-outreach", "event", "partner"]);
export const dealStageEnum = pgEnum("deal_stage", ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"]);
export const activityTypeEnum = pgEnum("activity_type", ["call", "email", "meeting", "note", "task"]);
export const companySizeEnum = pgEnum("company_size", ["startup", "smb", "mid-market", "enterprise"]);
export const userRoleEnum = pgEnum("user_role", ["rep", "manager", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("rep"),
  team: text("team").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry").notNull(),
  size: companySizeEnum("size").notNull(),
  revenue: numeric("revenue"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("US"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  companyId: integer("company_id").references(() => companies.id),
  title: text("title"),
  status: contactStatusEnum("status").notNull().default("lead"),
  source: contactSourceEnum("source").notNull().default("website"),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: numeric("value").notNull(),
  stage: dealStageEnum("stage").notNull().default("prospecting"),
  probability: integer("probability").default(10),
  contactId: integer("contact_id").references(() => contacts.id),
  companyId: integer("company_id").references(() => companies.id),
  ownerId: integer("owner_id").references(() => users.id),
  expectedCloseDate: date("expected_close_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: activityTypeEnum("type").notNull(),
  subject: text("subject").notNull(),
  body: text("body"),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  ownerId: integer("owner_id").references(() => users.id),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
