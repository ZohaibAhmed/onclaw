import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { faker } from "@faker-js/faker";
import * as schema from "./schema";

faker.seed(123);

const client = postgres("postgresql://zohaibahmed@localhost/slack_clone");
const db = drizzle(client, { schema });

const CHANNELS_DATA = [
  { name: "general", description: "Company-wide announcements and work-based matters", topic: "Welcome to the team! 🎉" },
  { name: "random", description: "Non-work banter and water cooler conversation", topic: "Anything goes (within reason)" },
  { name: "engineering", description: "Engineering team discussions", topic: "Ship it 🚀" },
  { name: "design", description: "Design team discussions and feedback", topic: "Pixels matter" },
  { name: "product", description: "Product roadmap and feature discussions", topic: "What's next?" },
  { name: "marketing", description: "Marketing campaigns and analytics", topic: "Growth 📈" },
  { name: "sales", description: "Sales pipeline and customer updates", topic: "Close those deals!" },
  { name: "support", description: "Customer support tickets and escalations", topic: "Help people, solve problems" },
  { name: "devops", description: "Infrastructure, CI/CD, and deployments", topic: "99.99% uptime or bust" },
  { name: "watercooler", description: "Fun stuff, memes, and off-topic chat", topic: "🍿 Chill zone" },
  { name: "hiring", description: "Recruiting updates and candidate discussions", topic: "We're growing!" },
  { name: "incidents", description: "Production incidents and postmortems", topic: "⚠️ Status page: All systems operational" },
];

const USERS_DATA = [
  { name: "Zohaib Ahmed", displayName: "zohaib", email: "zohaib@company.com", avatar: "ZA", title: "CEO & Founder", status: "online" as const },
  { name: "Sarah Chen", displayName: "sarah.chen", email: "sarah@company.com", avatar: "SC", title: "VP Engineering", status: "online" as const },
  { name: "Marcus Johnson", displayName: "marcus", email: "marcus@company.com", avatar: "MJ", title: "Senior Engineer", status: "online" as const },
  { name: "Emily Rodriguez", displayName: "emily.r", email: "emily@company.com", avatar: "ER", title: "Product Designer", status: "away" as const },
  { name: "David Kim", displayName: "dkim", email: "david@company.com", avatar: "DK", title: "Backend Engineer", status: "online" as const },
  { name: "Rachel Thompson", displayName: "rachel", email: "rachel@company.com", avatar: "RT", title: "Product Manager", status: "dnd" as const },
  { name: "James Wilson", displayName: "jwilson", email: "james@company.com", avatar: "JW", title: "DevOps Engineer", status: "online" as const },
  { name: "Priya Patel", displayName: "priya", email: "priya@company.com", avatar: "PP", title: "Frontend Engineer", status: "online" as const },
  { name: "Alex Morgan", displayName: "alex.m", email: "alex@company.com", avatar: "AM", title: "Marketing Lead", status: "away" as const },
  { name: "Lisa Wang", displayName: "lisa", email: "lisa@company.com", avatar: "LW", title: "Data Scientist", status: "online" as const },
  { name: "Tom Baker", displayName: "tom.b", email: "tom@company.com", avatar: "TB", title: "Sales Director", status: "offline" as const },
  { name: "ClawBot", displayName: "clawbot", email: "bot@company.com", avatar: "🤖", title: "AI Assistant", status: "online" as const, isBot: true },
];

// Realistic message content per channel
const MESSAGES: Record<string, string[]> = {
  general: [
    "Hey everyone! Quick reminder that the all-hands meeting is tomorrow at 2pm PST 📅",
    "Welcome to the team @newbie! Glad to have you aboard 🎉",
    "The new office snack selection has been updated. Check the kitchen!",
    "Reminder: Please update your OKRs by end of week",
    "Great Q4 results everyone! Revenue up 34% 🚀",
    "Company holiday party is December 20th. Save the date!",
    "New PTO policy has been posted in #hr-updates",
    "Shoutout to the engineering team for shipping the v2.0 release!",
    "Please review the updated security guidelines in Notion",
    "Office will be closed Monday for the holiday",
    "Congrats to @sarah.chen on her promotion to VP Eng! 🎊",
    "We just closed our Series B! $45M led by Sequoia 💰",
    "Team offsite is scheduled for March 15-17 in Tahoe",
    "New benefits enrollment period starts next Monday",
    "Happy Friday everyone! What are your weekend plans?",
  ],
  random: [
    "Has anyone tried that new ramen place on 3rd street?",
    "Just saw the craziest thing on my commute 😂",
    "Who's watching the game tonight?",
    "My cat just did the funniest thing lol",
    "Anyone want to grab lunch?",
    "Hot take: tabs > spaces",
    "I can't believe it's already March",
    "The coffee machine on the 3rd floor is broken again 😭",
    "Anyone here into rock climbing?",
    "TIL you can hold Shift+Enter for a new line in Slack",
    "Can we talk about how good that new show on Netflix is?",
    "Who else is doing Dry January?",
    "Just finished a 5K personal best! 🏃‍♂️",
    "Pizza or tacos for team lunch?",
    "The sunset from the office today was incredible 🌅",
  ],
  engineering: [
    "PR #423 is ready for review - adds WebSocket support",
    "Anyone else seeing flaky tests in CI?",
    "I'm thinking we should migrate to Bun for our tooling",
    "The new caching layer reduced p99 latency by 40% 📉",
    "RFC for the new auth system is in the engineering docs",
    "Heads up: I'm going to rebase main after the deploy",
    "Has anyone used tRPC with Next.js App Router?",
    "We need to discuss the database migration strategy",
    "The memory leak in the worker service has been fixed 🎉",
    "Code review guidelines have been updated. Please read!",
    "Deployed v2.3.1 to staging. Please test before we push to prod.",
    "Question: should we use Drizzle or Prisma for the new service?",
    "I wrote a script to automate the release notes generation",
    "The TypeScript 5.4 upgrade broke some of our generic types",
    "Sprint retrospective notes are in Confluence",
    "Anyone know why the build is taking 12 minutes?",
    "New monitoring dashboards are live in Grafana",
    "We should probably add rate limiting to the public API",
  ],
  design: [
    "New mockups for the dashboard redesign are in Figma",
    "Can we standardize our icon set? It's getting inconsistent",
    "Color palette update: moving from indigo to violet for CTAs",
    "The mobile responsive breakpoints need work",
    "User testing results are in - people love the new nav!",
    "Should we use 4px or 8px as our base spacing unit?",
    "New component library docs are live on Storybook",
    "Accessibility audit found 3 contrast issues. Fixing now.",
    "Dark mode is almost done - just need to handle images",
    "The new onboarding flow increased activation by 22%",
  ],
  product: [
    "Q2 roadmap draft is ready for review",
    "Customer interview insights have been posted in Notion",
    "Feature request: bulk actions on the table view",
    "We're deprioritizing the mobile app for now",
    "NPS scores are up to 72! Great work everyone 📊",
    "Competitor just launched a similar feature. Thoughts?",
    "Sprint planning is tomorrow at 10am",
    "The beta rollout has 500 users so far",
    "We need to decide on the pricing tier structure",
    "User churn analysis shows onboarding is the biggest drop-off",
  ],
  devops: [
    "Kubernetes cluster upgrade to 1.29 scheduled for tonight",
    "Alert: API response times spiking in us-east-1",
    "New Terraform modules for the staging environment are ready",
    "CI pipeline is now 3x faster with the new runners",
    "Reminder: rotate your AWS access keys this month",
    "Grafana dashboards have been reorganized by service",
    "Database backup verification passed ✅",
    "We're migrating from Docker Compose to Helm charts",
  ],
  support: [
    "Ticket #1234: Customer can't access their dashboard",
    "Common issue this week: SSO login redirect loop",
    "Updated the troubleshooting guide for API errors",
    "We need an escalation path for enterprise customers",
    "Customer satisfaction score is 94% this month 🎯",
    "New knowledge base articles have been published",
  ],
  sales: [
    "Closed the Acme Corp deal! $120K ARR 🎉",
    "Demo with Tesla scheduled for Thursday",
    "Pipeline review: we're at 78% of Q1 target",
    "New pricing calculator is live on the website",
    "The enterprise plan upsell is working really well",
    "Lost the Spotify deal to a competitor 😔",
  ],
  marketing: [
    "Blog post on AI trends is getting great traction",
    "Email campaign open rates are up 15%",
    "Product Hunt launch is next Tuesday!",
    "New case study with Stripe is published",
    "Social media engagement doubled this month",
  ],
  watercooler: [
    "Anyone want to start a book club?",
    "Today's Wordle was brutal 🟨⬛🟩⬛⬛",
    "My sourdough starter is finally alive! 🍞",
    "Recommend me a good podcast",
    "The office plants are looking rough. Who's on watering duty?",
    "Just discovered the best shortcut to avoid traffic",
    "Movie recommendation thread - go!",
    "Is it just me or is the AC on full blast?",
  ],
  hiring: [
    "We have 3 senior engineer candidates in the pipeline",
    "Updated the interview rubric for design roles",
    "Referral bonus increased to $5K!",
    "New job postings are live on our careers page",
    "Interview feedback for the PM candidate is due today",
  ],
  incidents: [
    "🔴 INCIDENT: API returning 500s for /v2/users endpoint",
    "Root cause identified: database connection pool exhaustion",
    "Mitigation: increased pool size from 20 to 50 connections",
    "✅ RESOLVED: All systems operational. Postmortem to follow.",
    "Postmortem for the March 3rd incident has been published",
    "🟡 MONITORING: Elevated error rates on payment service",
  ],
};

const EMOJIS = ["👍", "❤️", "😂", "🎉", "🚀", "👀", "🔥", "💯", "✅", "🙌", "👏", "💪"];

async function seed() {
  console.log("🌱 Seeding Slack clone database...");

  // Clear
  await db.delete(schema.bookmarks);
  await db.delete(schema.reactions);
  await db.delete(schema.messages);
  await db.delete(schema.channelMembers);
  await db.delete(schema.channels);
  await db.delete(schema.users);

  // Users
  const userRows = await db.insert(schema.users).values(USERS_DATA).returning();
  console.log(`✅ ${userRows.length} users`);

  // Channels
  const channelRows = await db.insert(schema.channels).values(
    CHANNELS_DATA.map((c) => ({
      ...c,
      type: "public" as const,
      createdById: userRows[0].id,
    }))
  ).returning();
  console.log(`✅ ${channelRows.length} channels`);

  // Add all users to general and random, random subset to others
  const memberValues: { channelId: number; userId: number }[] = [];
  for (const ch of channelRows) {
    if (ch.name === "general" || ch.name === "random") {
      for (const u of userRows) {
        memberValues.push({ channelId: ch.id, userId: u.id });
      }
    } else {
      // 5-9 random members
      const shuffled = [...userRows].sort(() => Math.random() - 0.5);
      const count = faker.number.int({ min: 5, max: 9 });
      for (let i = 0; i < count; i++) {
        memberValues.push({ channelId: ch.id, userId: shuffled[i].id });
      }
    }
  }
  await db.insert(schema.channelMembers).values(memberValues);
  console.log(`✅ ${memberValues.length} channel memberships`);

  // Messages
  const allMessages: {
    channelId: number;
    userId: number;
    content: string;
    threadId: number | null;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];

  for (const ch of channelRows) {
    const channelMessages = MESSAGES[ch.name] || MESSAGES["general"];
    const members = memberValues.filter((m) => m.channelId === ch.id);
    
    // Generate 15-40 messages per channel
    const msgCount = faker.number.int({ min: 15, max: 40 });
    for (let i = 0; i < msgCount; i++) {
      const member = members[Math.floor(Math.random() * members.length)];
      const content = channelMessages[Math.floor(Math.random() * channelMessages.length)];
      const createdAt = faker.date.between({ from: "2026-02-01", to: "2026-03-09" });
      allMessages.push({
        channelId: ch.id,
        userId: member.userId,
        content,
        threadId: null,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  // Sort by time
  allMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Insert in batches
  const insertedMessages = [];
  for (let i = 0; i < allMessages.length; i += 50) {
    const batch = await db.insert(schema.messages).values(allMessages.slice(i, i + 50)).returning();
    insertedMessages.push(...batch);
  }
  console.log(`✅ ${insertedMessages.length} messages`);

  // Thread replies (add replies to ~20% of messages)
  const threadReplies: typeof allMessages = [];
  for (const msg of insertedMessages) {
    if (Math.random() < 0.2) {
      const replyCount = faker.number.int({ min: 1, max: 5 });
      const members = memberValues.filter((m) => m.channelId === msg.channelId);
      const channelName = channelRows.find((c) => c.id === msg.channelId)?.name || "general";
      const channelMsgs = MESSAGES[channelName] || MESSAGES["general"];
      for (let r = 0; r < replyCount; r++) {
        const member = members[Math.floor(Math.random() * members.length)];
        const replyAt = new Date(msg.createdAt.getTime() + faker.number.int({ min: 60000, max: 86400000 }));
        threadReplies.push({
          channelId: msg.channelId,
          userId: member.userId,
          content: channelMsgs[Math.floor(Math.random() * channelMsgs.length)],
          threadId: msg.id,
          createdAt: replyAt,
          updatedAt: replyAt,
        });
      }
    }
  }
  if (threadReplies.length > 0) {
    for (let i = 0; i < threadReplies.length; i += 50) {
      await db.insert(schema.messages).values(threadReplies.slice(i, i + 50));
    }
  }
  console.log(`✅ ${threadReplies.length} thread replies`);

  // Reactions
  const reactionValues: { messageId: number; userId: number; emoji: string }[] = [];
  for (const msg of insertedMessages) {
    if (Math.random() < 0.3) {
      const count = faker.number.int({ min: 1, max: 4 });
      const usedUsers = new Set<number>();
      for (let r = 0; r < count; r++) {
        const user = userRows[Math.floor(Math.random() * userRows.length)];
        if (!usedUsers.has(user.id)) {
          usedUsers.add(user.id);
          reactionValues.push({
            messageId: msg.id,
            userId: user.id,
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          });
        }
      }
    }
  }
  if (reactionValues.length > 0) {
    for (let i = 0; i < reactionValues.length; i += 100) {
      await db.insert(schema.reactions).values(reactionValues.slice(i, i + 100));
    }
  }
  console.log(`✅ ${reactionValues.length} reactions`);

  console.log("\n🎉 Slack clone seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
