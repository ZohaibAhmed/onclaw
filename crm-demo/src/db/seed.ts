import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { faker } from "@faker-js/faker";
import * as schema from "./schema";

faker.seed(42);

const client = postgres("postgresql://zohaibahmed@localhost/crm_demo");
const db = drizzle(client, { schema });

const TEAMS = ["West Coast", "East Coast"];
const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Real Estate", "Media", "Energy", "Logistics"];
const DEAL_NAMES = ["Platform License", "Enterprise Suite", "Annual Contract", "Pilot Program", "API Integration", "Custom Solution", "Data Migration", "Security Upgrade", "Cloud Deployment", "Consulting Package"];

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(schema.activities);
  await db.delete(schema.deals);
  await db.delete(schema.contacts);
  await db.delete(schema.companies);
  await db.delete(schema.users);

  // Users (sales reps)
  const reps = [
    { name: "Sarah Chen", email: "sarah@acme.com", role: "manager" as const, team: "West Coast", avatar: "SC" },
    { name: "Marcus Johnson", email: "marcus@acme.com", role: "rep" as const, team: "West Coast", avatar: "MJ" },
    { name: "Emily Rodriguez", email: "emily@acme.com", role: "rep" as const, team: "West Coast", avatar: "ER" },
    { name: "David Kim", email: "david@acme.com", role: "rep" as const, team: "West Coast", avatar: "DK" },
    { name: "Rachel Thompson", email: "rachel@acme.com", role: "manager" as const, team: "East Coast", avatar: "RT" },
    { name: "James Wilson", email: "james@acme.com", role: "rep" as const, team: "East Coast", avatar: "JW" },
    { name: "Priya Patel", email: "priya@acme.com", role: "rep" as const, team: "East Coast", avatar: "PP" },
    { name: "Alex Morgan", email: "alex@acme.com", role: "admin" as const, team: "East Coast", avatar: "AM" },
  ];
  const userRows = await db.insert(schema.users).values(reps).returning();
  console.log(`✅ ${userRows.length} users`);

  // Companies
  const companyValues = [];
  const sizes: ("startup" | "smb" | "mid-market" | "enterprise")[] = ["startup", "smb", "mid-market", "enterprise"];
  for (let i = 0; i < 150; i++) {
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const revMap = { startup: [100000, 5000000], smb: [5000000, 50000000], "mid-market": [50000000, 500000000], enterprise: [500000000, 10000000000] };
    const [lo, hi] = revMap[size];
    companyValues.push({
      name: faker.company.name(),
      domain: faker.internet.domainName(),
      industry: INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)],
      size,
      revenue: String(faker.number.int({ min: lo, max: hi })),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      country: "US",
    });
  }
  const companyRows = await db.insert(schema.companies).values(companyValues).returning();
  console.log(`✅ ${companyRows.length} companies`);

  // Contacts
  const statuses: ("lead" | "customer" | "churned")[] = ["lead", "customer", "churned"];
  const sources: ("website" | "referral" | "linkedin" | "cold-outreach" | "event" | "partner")[] = ["website", "referral", "linkedin", "cold-outreach", "event", "partner"];
  const contactValues = [];
  for (let i = 0; i < 500; i++) {
    const company = companyRows[Math.floor(Math.random() * companyRows.length)];
    const owner = userRows[Math.floor(Math.random() * userRows.length)];
    const createdAt = faker.date.between({ from: "2025-01-01", to: "2026-03-01" });
    contactValues.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number({ style: "national" }),
      company: company.name,
      companyId: company.id,
      title: faker.person.jobTitle(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      ownerId: owner.id,
      createdAt,
      updatedAt: createdAt,
    });
  }
  const contactRows = await db.insert(schema.contacts).values(contactValues).returning();
  console.log(`✅ ${contactRows.length} contacts`);

  // Deals
  const stages: ("prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost")[] = ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"];
  const stageProb: Record<string, number> = { prospecting: 10, qualification: 25, proposal: 50, negotiation: 75, "closed-won": 100, "closed-lost": 0 };
  const dealValues = [];
  for (let i = 0; i < 220; i++) {
    const contact = contactRows[Math.floor(Math.random() * contactRows.length)];
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const createdAt = faker.date.between({ from: "2025-03-01", to: "2026-03-01" });
    const closeOffset = faker.number.int({ min: 14, max: 120 });
    const expectedClose = new Date(createdAt.getTime() + closeOffset * 86400000);
    // Skew values: some big enterprise deals, many smaller ones
    const isEnterprise = Math.random() < 0.15;
    const value = isEnterprise
      ? faker.number.int({ min: 100000, max: 500000 })
      : faker.number.int({ min: 5000, max: 80000 });
    dealValues.push({
      name: `${contact.company} — ${DEAL_NAMES[Math.floor(Math.random() * DEAL_NAMES.length)]}`,
      value: String(value),
      stage,
      probability: stageProb[stage],
      contactId: contact.id,
      companyId: contact.companyId,
      ownerId: contact.ownerId,
      expectedCloseDate: expectedClose.toISOString().split("T")[0],
      createdAt,
      updatedAt: createdAt,
    });
  }
  const dealRows = await db.insert(schema.deals).values(dealValues).returning();
  console.log(`✅ ${dealRows.length} deals`);

  // Activities
  const actTypes: ("call" | "email" | "meeting" | "note" | "task")[] = ["call", "email", "meeting", "note", "task"];
  const subjects: Record<string, string[]> = {
    call: ["Discovery call", "Follow-up call", "Demo walkthrough", "Pricing discussion", "Check-in call", "Cold call", "Quarterly review"],
    email: ["Intro email", "Proposal sent", "Follow-up", "Contract draft", "Thank you note", "Meeting recap", "Case study shared"],
    meeting: ["Product demo", "Technical deep-dive", "Executive alignment", "Onboarding kickoff", "QBR meeting", "Contract review"],
    note: ["Updated deal stage", "Competitor mentioned", "Budget confirmed", "Decision timeline", "Stakeholder map updated", "Risk flagged"],
    task: ["Send proposal", "Update CRM", "Prepare demo", "Schedule follow-up", "Get legal review", "Send contract"],
  };
  const activityValues = [];
  for (let i = 0; i < 1200; i++) {
    const type = actTypes[Math.floor(Math.random() * actTypes.length)];
    const contact = contactRows[Math.floor(Math.random() * contactRows.length)];
    const deal = Math.random() < 0.6 ? dealRows[Math.floor(Math.random() * dealRows.length)] : null;
    const subjectList = subjects[type];
    const createdAt = faker.date.between({ from: "2025-06-01", to: "2026-03-05" });
    activityValues.push({
      type,
      subject: subjectList[Math.floor(Math.random() * subjectList.length)],
      body: faker.lorem.sentence(),
      contactId: contact.id,
      dealId: deal?.id ?? null,
      ownerId: contact.ownerId,
      completedAt: Math.random() < 0.7 ? createdAt : null,
      createdAt,
    });
  }
  // Insert in batches (postgres has a param limit)
  for (let i = 0; i < activityValues.length; i += 100) {
    await db.insert(schema.activities).values(activityValues.slice(i, i + 100));
  }
  console.log(`✅ ${activityValues.length} activities`);

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
