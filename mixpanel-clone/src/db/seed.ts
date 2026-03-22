import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { faker } from "@faker-js/faker";
import * as schema from "./schema";

faker.seed(99);

const client = postgres("postgresql://zohaibahmed@localhost/mixpanel_clone");
const db = drizzle(client, { schema });

const EVENT_NAMES = [
  "Page Viewed", "Button Clicked", "Sign Up", "Login", "Purchase Completed",
  "Item Added to Cart", "Search Performed", "Profile Updated", "Subscription Started",
  "Subscription Cancelled", "Invite Sent", "File Uploaded", "Report Generated",
  "API Call Made", "Error Occurred", "Onboarding Step Completed", "Feature Flag Toggled",
  "Notification Opened", "Dashboard Viewed", "Settings Changed"
];

const PAGES = ["/", "/dashboard", "/pricing", "/docs", "/blog", "/settings", "/profile", "/signup", "/login", "/checkout"];
const BROWSERS = ["Chrome", "Firefox", "Safari", "Edge"];
const OS_LIST = ["macOS", "Windows", "Linux", "iOS", "Android"];
const COUNTRIES = ["US", "UK", "DE", "FR", "CA", "AU", "JP", "BR", "IN", "NL"];
const CITIES = ["San Francisco", "New York", "London", "Berlin", "Toronto", "Sydney", "Tokyo", "São Paulo", "Mumbai", "Amsterdam"];
const PLANS = ["free", "starter", "pro", "enterprise"];
const CATEGORIES: ("pageview" | "click" | "signup" | "purchase" | "custom" | "api_call" | "error")[] = ["pageview", "click", "signup", "purchase", "custom", "api_call", "error"];

function categoryForEvent(name: string): typeof CATEGORIES[number] {
  if (name.includes("View") || name.includes("Dashboard")) return "pageview";
  if (name.includes("Click") || name.includes("Button")) return "click";
  if (name.includes("Sign Up")) return "signup";
  if (name.includes("Purchase") || name.includes("Subscription Started")) return "purchase";
  if (name.includes("API")) return "api_call";
  if (name.includes("Error")) return "error";
  return "custom";
}

async function seed() {
  console.log("🌱 Seeding mixpanel_clone database...");

  // Clear
  await db.delete(schema.segments);
  await db.delete(schema.funnels);
  await db.delete(schema.events);
  await db.delete(schema.userProfiles);
  await db.delete(schema.projects);

  // Project
  const [project] = await db.insert(schema.projects).values({
    name: "Acme SaaS",
    token: "acme-prod-token-123",
  }).returning();
  console.log(`✅ Project: ${project.name}`);

  // User profiles
  const profileValues = [];
  for (let i = 0; i < 800; i++) {
    const countryIdx = Math.floor(Math.random() * COUNTRIES.length);
    const firstSeen = faker.date.between({ from: "2025-06-01", to: "2026-02-15" });
    const lastSeen = faker.date.between({ from: firstSeen, to: "2026-03-08" });
    profileValues.push({
      projectId: project.id,
      distinctId: `user_${faker.string.alphanumeric(12)}`,
      email: faker.internet.email(),
      name: faker.person.fullName(),
      city: CITIES[countryIdx],
      country: COUNTRIES[countryIdx],
      os: OS_LIST[Math.floor(Math.random() * OS_LIST.length)],
      browser: BROWSERS[Math.floor(Math.random() * BROWSERS.length)],
      plan: PLANS[Math.floor(Math.random() * PLANS.length)],
      revenue: String(faker.number.int({ min: 0, max: 5000 })),
      firstSeen,
      lastSeen,
      eventCount: faker.number.int({ min: 5, max: 500 }),
    });
  }
  const profiles = await db.insert(schema.userProfiles).values(profileValues).returning();
  console.log(`✅ ${profiles.length} user profiles`);

  // Events - 15k events spread over ~9 months
  const eventValues = [];
  for (let i = 0; i < 15000; i++) {
    const profile = profiles[Math.floor(Math.random() * profiles.length)];
    const eventName = EVENT_NAMES[Math.floor(Math.random() * EVENT_NAMES.length)];
    const ts = faker.date.between({ from: "2025-06-01", to: "2026-03-08" });
    const props: any = {
      page: PAGES[Math.floor(Math.random() * PAGES.length)],
      browser: profile.browser,
      os: profile.os,
      country: profile.country,
    };
    if (eventName.includes("Purchase")) {
      props.amount = faker.number.int({ min: 9, max: 499 });
      props.currency = "USD";
    }
    if (eventName.includes("Search")) {
      props.query = faker.lorem.words(2);
    }
    eventValues.push({
      projectId: project.id,
      name: eventName,
      category: categoryForEvent(eventName),
      distinctId: profile.distinctId,
      properties: props,
      timestamp: ts,
      createdAt: ts,
    });
  }
  // Batch insert
  for (let i = 0; i < eventValues.length; i += 500) {
    await db.insert(schema.events).values(eventValues.slice(i, i + 500));
  }
  console.log(`✅ ${eventValues.length} events`);

  // Funnels
  const funnelValues = [
    { projectId: project.id, name: "Signup → Purchase", steps: JSON.stringify(["Page Viewed", "Sign Up", "Login", "Item Added to Cart", "Purchase Completed"]) },
    { projectId: project.id, name: "Onboarding Flow", steps: JSON.stringify(["Sign Up", "Onboarding Step Completed", "Profile Updated", "Dashboard Viewed"]) },
    { projectId: project.id, name: "Feature Adoption", steps: JSON.stringify(["Login", "Dashboard Viewed", "Report Generated", "Invite Sent"]) },
  ];
  await db.insert(schema.funnels).values(funnelValues);
  console.log(`✅ ${funnelValues.length} funnels`);

  // Segments
  const segmentValues = [
    { projectId: project.id, name: "Power Users", filters: JSON.stringify({ minEvents: 100, plan: ["pro", "enterprise"] }), userCount: 142 },
    { projectId: project.id, name: "Free Tier", filters: JSON.stringify({ plan: ["free"] }), userCount: 318 },
    { projectId: project.id, name: "Churned (30d inactive)", filters: JSON.stringify({ lastSeenBefore: "30d" }), userCount: 87 },
    { projectId: project.id, name: "US Enterprise", filters: JSON.stringify({ country: "US", plan: ["enterprise"] }), userCount: 56 },
    { projectId: project.id, name: "Mobile Users", filters: JSON.stringify({ os: ["iOS", "Android"] }), userCount: 203 },
  ];
  await db.insert(schema.segments).values(segmentValues);
  console.log(`✅ ${segmentValues.length} segments`);

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
