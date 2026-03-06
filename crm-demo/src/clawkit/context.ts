// @ts-nocheck
import { db } from "@/db";
import { users, companies, contacts, deals, activities } from "@/db/schema";
import { eq, and, gte, lte, like, desc, count, sum, avg, sql } from "drizzle-orm";

// Type definitions for the API
export type User = {
  id: number;
  name: string;
  email: string;
  role: "rep" | "manager" | "admin";
  team: string;
  avatar: string | null;
  createdAt: Date;
};

export type Company = {
  id: number;
  name: string;
  domain: string | null;
  industry: string;
  size: "startup" | "smb" | "mid-market" | "enterprise";
  revenue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: Date;
};

export type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  companyId: number | null;
  title: string | null;
  status: "lead" | "customer" | "churned";
  source: "website" | "referral" | "linkedin" | "cold-outreach" | "event" | "partner";
  ownerId: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  ownerName?: string;
  companyName?: string;
};

export type Deal = {
  id: number;
  name: string;
  value: string;
  stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  probability: number | null;
  contactId: number | null;
  companyId: number | null;
  ownerId: number | null;
  expectedCloseDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  ownerName?: string;
  ownerAvatar?: string;
  contactName?: string;
  companyName?: string;
};

export type Activity = {
  id: number;
  type: "call" | "email" | "meeting" | "note" | "task";
  subject: string;
  body: string | null;
  contactId: number | null;
  dealId: number | null;
  ownerId: number | null;
  completedAt: Date | null;
  createdAt: Date;
  // Joined fields
  ownerName?: string;
  contactName?: string;
  dealName?: string;
};

export interface ClawKitContext {
  queries: {
    /**
     * Get all sales reps and team members
     * @param filters Optional filters for role, team
     */
    getUsers: (filters?: {
      role?: "rep" | "manager" | "admin";
      team?: string;
      limit?: number;
    }) => Promise<User[]>;

    /**
     * Get companies with optional filtering
     * @param filters Search, industry, size, limit filters
     */
    getCompanies: (filters?: {
      search?: string;
      industry?: string;
      size?: "startup" | "smb" | "mid-market" | "enterprise";
      limit?: number;
    }) => Promise<Company[]>;

    /**
     * Get contacts with comprehensive filtering and search
     * @param filters Status, source, owner, search, pagination filters
     */
    getContacts: (filters?: {
      status?: "lead" | "customer" | "churned";
      source?: "website" | "referral" | "linkedin" | "cold-outreach" | "event" | "partner";
      ownerId?: number;
      search?: string;
      page?: number;
      limit?: number;
    }) => Promise<{ contacts: Contact[], total: number, page: number, pages: number }>;

    /**
     * Get deals with stage, value, and owner filtering
     * @param filters Stage, value range, owner, date filters
     */
    getDeals: (filters?: {
      stage?: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
      minValue?: number;
      maxValue?: number;
      ownerId?: number;
      limit?: number;
    }) => Promise<Deal[]>;

    /**
     * Get recent activities with type and owner filtering
     * @param filters Activity type, owner, related contact/deal filters
     */
    getActivities: (filters?: {
      type?: "call" | "email" | "meeting" | "note" | "task";
      ownerId?: number;
      contactId?: number;
      dealId?: number;
      limit?: number;
    }) => Promise<Activity[]>;

    /**
     * Get key dashboard metrics: pipeline value, deal counts, win rate
     */
    getDashboardMetrics: () => Promise<{
      totalPipeline: number;
      avgDealSize: number;
      totalDeals: number;
      wonRevenue: number;
      winRate: number;
    }>;

    /**
     * Get deal counts and values grouped by pipeline stage
     */
    getPipelineByStage: () => Promise<Array<{
      stage: string;
      count: number;
      total: string;
    }>>;

    /**
     * Get top performing sales reps ranked by revenue
     * @param limit Number of top performers to return
     */
    getLeaderboard: (limit?: number) => Promise<Array<{
      name: string;
      avatar: string;
      wonCount: number;
      wonValue: string;
    }>>;

    /**
     * Get won/lost deal trends by month for charting
     */
    getMonthlyTrends: () => Promise<Array<{
      month: string;
      stage: string;
      deal_count: number;
      total_value: string;
    }>>;

    /**
     * Get deal revenue attribution by lead source
     */
    getAnalyticsBySource: () => Promise<Array<{
      source: string;
      cnt: number;
      total: string;
    }>>;

    /**
     * Get win rates and performance metrics by sales rep
     */
    getAnalyticsByRep: () => Promise<Array<{
      name: string;
      stage: string;
      cnt: number;
      total: string;
    }>>;
  };

  actions: {
    /**
     * Update a deal's pipeline stage
     * @param dealId The deal to update
     * @param stage New pipeline stage
     */
    updateDealStage: (dealId: number, stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost") => Promise<void>;

    /**
     * Update a contact's status
     * @param contactId The contact to update
     * @param status New contact status
     */
    updateContactStatus: (contactId: number, status: "lead" | "customer" | "churned") => Promise<void>;

    /**
     * Update a deal's win probability
     * @param dealId The deal to update
     * @param probability New probability percentage (0-100)
     */
    updateDealProbability: (dealId: number, probability: number) => Promise<void>;
  };
}

export function createContext(): ClawKitContext {
  return {
    queries: {
      async getUsers(filters = {}) {
        let query: any = db.select().from(users);

        const conditions = [];
        if (filters.role) conditions.push(eq(users.role, filters.role));
        if (filters.team) conditions.push(eq(users.team, filters.team));

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        query = query.orderBy(desc(users.createdAt));

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        return query;
      },

      async getCompanies(filters = {}) {
        let query: any = db.select().from(companies);

        const conditions = [];
        if (filters.search) {
          conditions.push(like(companies.name, `%${filters.search}%`));
        }
        if (filters.industry) conditions.push(eq(companies.industry, filters.industry));
        if (filters.size) conditions.push(eq(companies.size, filters.size));

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        query = query.orderBy(desc(companies.createdAt));

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        return query;
      },

      async getContacts(filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 25;
        const offset = (page - 1) * limit;

        let query = db.select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          phone: contacts.phone,
          company: contacts.company,
          companyId: contacts.companyId,
          title: contacts.title,
          status: contacts.status,
          source: contacts.source,
          ownerId: contacts.ownerId,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt,
          ownerName: users.name,
          companyName: companies.name,
        }).from(contacts)
          .leftJoin(users, eq(contacts.ownerId, users.id))
          .leftJoin(companies, eq(contacts.companyId, companies.id));

        const conditions = [];
        if (filters.status) conditions.push(eq(contacts.status, filters.status));
        if (filters.source) conditions.push(eq(contacts.source, filters.source));
        if (filters.ownerId) conditions.push(eq(contacts.ownerId, filters.ownerId));
        if (filters.search) {
          conditions.push(
            sql`${contacts.firstName} || ' ' || ${contacts.lastName} || ' ' || ${contacts.email} || ' ' || COALESCE(${contacts.company}, '') ILIKE ${'%' + filters.search + '%'}`
          );
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        const contactsData = await query
          .orderBy(desc(contacts.createdAt))
          .limit(limit)
          .offset(offset);

        const [{ total }] = await db.select({ total: count() }).from(contacts);

        return {
          contacts: contactsData,
          total,
          page,
          pages: Math.ceil(total / limit)
        };
      },

      async getDeals(filters = {}) {
        let query = db.select({
          id: deals.id,
          name: deals.name,
          value: deals.value,
          stage: deals.stage,
          probability: deals.probability,
          contactId: deals.contactId,
          companyId: deals.companyId,
          ownerId: deals.ownerId,
          expectedCloseDate: deals.expectedCloseDate,
          createdAt: deals.createdAt,
          updatedAt: deals.updatedAt,
          ownerName: users.name,
          ownerAvatar: users.avatar,
          contactName: sql<string>`${contacts.firstName} || ' ' || ${contacts.lastName}`,
          companyName: companies.name,
        }).from(deals)
          .leftJoin(users, eq(deals.ownerId, users.id))
          .leftJoin(contacts, eq(deals.contactId, contacts.id))
          .leftJoin(companies, eq(deals.companyId, companies.id));

        const conditions = [];
        if (filters.stage) conditions.push(eq(deals.stage, filters.stage));
        if (filters.minValue) conditions.push(gte(deals.value, filters.minValue.toString()));
        if (filters.maxValue) conditions.push(lte(deals.value, filters.maxValue.toString()));
        if (filters.ownerId) conditions.push(eq(deals.ownerId, filters.ownerId));

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        query = query.orderBy(desc(deals.createdAt));

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        return query;
      },

      async getActivities(filters = {}) {
        let query = db.select({
          id: activities.id,
          type: activities.type,
          subject: activities.subject,
          body: activities.body,
          contactId: activities.contactId,
          dealId: activities.dealId,
          ownerId: activities.ownerId,
          completedAt: activities.completedAt,
          createdAt: activities.createdAt,
          ownerName: users.name,
          contactName: sql<string>`${contacts.firstName} || ' ' || ${contacts.lastName}`,
          dealName: deals.name,
        }).from(activities)
          .leftJoin(users, eq(activities.ownerId, users.id))
          .leftJoin(contacts, eq(activities.contactId, contacts.id))
          .leftJoin(deals, eq(activities.dealId, deals.id));

        const conditions = [];
        if (filters.type) conditions.push(eq(activities.type, filters.type));
        if (filters.ownerId) conditions.push(eq(activities.ownerId, filters.ownerId));
        if (filters.contactId) conditions.push(eq(activities.contactId, filters.contactId));
        if (filters.dealId) conditions.push(eq(activities.dealId, filters.dealId));

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        query = query.orderBy(desc(activities.createdAt));

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        return query;
      },

      async getDashboardMetrics() {
        const [metrics] = await db.select({
          totalDeals: count(),
          totalPipeline: sum(deals.value),
          avgDealSize: avg(deals.value),
        }).from(deals);

        const wonDeals = await db.select({ count: count(), total: sum(deals.value) })
          .from(deals).where(eq(deals.stage, "closed-won"));

        const lostDeals = await db.select({ count: count() })
          .from(deals).where(eq(deals.stage, "closed-lost"));

        const totalWon = Number(wonDeals[0]?.count || 0);
        const totalLost = Number(lostDeals[0]?.count || 0);
        const winRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;

        return {
          totalPipeline: Number(metrics.totalPipeline || 0),
          avgDealSize: Math.round(Number(metrics.avgDealSize || 0)),
          totalDeals: Number(metrics.totalDeals),
          wonRevenue: Number(wonDeals[0]?.total || 0),
          winRate,
        };
      },

      async getPipelineByStage() {
        return db.select({
          stage: deals.stage,
          count: count(),
          total: sum(deals.value)
        }).from(deals).groupBy(deals.stage);
      },

      async getLeaderboard(limit = 10) {
        return db.select({
          name: users.name,
          avatar: users.avatar,
          wonCount: count(),
          wonValue: sum(deals.value),
        }).from(deals)
          .innerJoin(users, eq(deals.ownerId, users.id))
          .where(eq(deals.stage, "closed-won"))
          .groupBy(users.name, users.avatar)
          .orderBy(desc(sum(deals.value)))
          .limit(limit);
      },

      async getMonthlyTrends() {
        const result = await db.execute(sql`
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
        return (result as any).rows || result;
      },

      async getAnalyticsBySource() {
        const result = await db.execute(sql`
          SELECT c.source, count(d.id)::int as cnt, sum(d.value::numeric)::bigint as total
          FROM deals d JOIN contacts c ON d.contact_id = c.id
          WHERE d.stage = 'closed-won'
          GROUP BY c.source ORDER BY total DESC
        `);
        return (result as any).rows || result;
      },

      async getAnalyticsByRep() {
        const result = await db.execute(sql`
          SELECT u.name, d.stage, count(*)::int as cnt, sum(d.value::numeric)::bigint as total
          FROM deals d JOIN users u ON d.owner_id = u.id
          GROUP BY u.name, d.stage ORDER BY u.name
        `);
        return (result as any).rows || result;
      },
    },

    actions: {
      async updateDealStage(dealId: number, stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost") {
        await db.update(deals)
          .set({
            stage,
            updatedAt: new Date()
          })
          .where(eq(deals.id, dealId));
      },

      async updateContactStatus(contactId: number, status: "lead" | "customer" | "churned") {
        await db.update(contacts)
          .set({
            status,
            updatedAt: new Date()
          })
          .where(eq(contacts.id, contactId));
      },

      async updateDealProbability(dealId: number, probability: number) {
        // Clamp probability between 0 and 100
        const clampedProbability = Math.max(0, Math.min(100, probability));

        await db.update(deals)
          .set({
            probability: clampedProbability,
            updatedAt: new Date()
          })
          .where(eq(deals.id, dealId));
      },
    },
  };
}