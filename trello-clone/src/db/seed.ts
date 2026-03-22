import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const client = postgres("postgresql://zohaibahmed@localhost/trello_clone");
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding trello_clone...");

  // Clear
  await db.delete(schema.comments);
  await db.delete(schema.checklistItems);
  await db.delete(schema.checklists);
  await db.delete(schema.cardMembers);
  await db.delete(schema.cardLabels);
  await db.delete(schema.cards);
  await db.delete(schema.labels);
  await db.delete(schema.lists);
  await db.delete(schema.boards);
  await db.delete(schema.members);

  // Members
  const memberRows = await db.insert(schema.members).values([
    { name: "Zohaib Ahmed", email: "zohaib@example.com", avatar: "ZA", color: "#0079bf" },
    { name: "Sarah Chen", email: "sarah@example.com", avatar: "SC", color: "#eb5a46" },
    { name: "Marcus Johnson", email: "marcus@example.com", avatar: "MJ", color: "#61bd4f" },
    { name: "Emily Rodriguez", email: "emily@example.com", avatar: "ER", color: "#f2d600" },
    { name: "David Kim", email: "david@example.com", avatar: "DK", color: "#c377e0" },
  ]).returning();

  // Boards
  const boardRows = await db.insert(schema.boards).values([
    { name: "Product Roadmap", background: "#0079bf", starred: true },
    { name: "Sprint Board", background: "#d29034", starred: true },
    { name: "Marketing Campaign", background: "#519839", starred: false },
    { name: "Bug Tracker", background: "#b04632", starred: false },
    { name: "Team Onboarding", background: "#89609e", starred: false },
  ]).returning();

  const [roadmap, sprint, marketing, bugs, onboarding] = boardRows;

  // Labels per board
  const labelDefs = [
    { boardId: roadmap.id, name: "Feature", color: "green" as const },
    { boardId: roadmap.id, name: "Bug", color: "red" as const },
    { boardId: roadmap.id, name: "Enhancement", color: "blue" as const },
    { boardId: roadmap.id, name: "Urgent", color: "orange" as const },
    { boardId: roadmap.id, name: "Design", color: "purple" as const },
    { boardId: roadmap.id, name: "Research", color: "yellow" as const },
    { boardId: sprint.id, name: "Frontend", color: "sky" as const },
    { boardId: sprint.id, name: "Backend", color: "green" as const },
    { boardId: sprint.id, name: "Blocked", color: "red" as const },
    { boardId: sprint.id, name: "P0", color: "orange" as const },
    { boardId: marketing.id, name: "Social", color: "blue" as const },
    { boardId: marketing.id, name: "Content", color: "green" as const },
    { boardId: marketing.id, name: "Paid", color: "orange" as const },
    { boardId: bugs.id, name: "Critical", color: "red" as const },
    { boardId: bugs.id, name: "Minor", color: "yellow" as const },
    { boardId: bugs.id, name: "UI", color: "purple" as const },
    { boardId: onboarding.id, name: "Week 1", color: "green" as const },
    { boardId: onboarding.id, name: "Week 2", color: "blue" as const },
  ];
  const labelRows = await db.insert(schema.labels).values(labelDefs).returning();

  // Helper
  const labelsFor = (boardId: number) => labelRows.filter(l => l.boardId === boardId);

  // Lists for Product Roadmap
  const roadmapLists = await db.insert(schema.lists).values([
    { boardId: roadmap.id, name: "Backlog", position: 0 },
    { boardId: roadmap.id, name: "Up Next", position: 1 },
    { boardId: roadmap.id, name: "In Progress", position: 2 },
    { boardId: roadmap.id, name: "In Review", position: 3 },
    { boardId: roadmap.id, name: "Done ✅", position: 4 },
  ]).returning();

  // Lists for Sprint Board
  const sprintLists = await db.insert(schema.lists).values([
    { boardId: sprint.id, name: "To Do", position: 0 },
    { boardId: sprint.id, name: "In Progress", position: 1 },
    { boardId: sprint.id, name: "Code Review", position: 2 },
    { boardId: sprint.id, name: "QA", position: 3 },
    { boardId: sprint.id, name: "Done", position: 4 },
  ]).returning();

  // Lists for Marketing
  const marketingLists = await db.insert(schema.lists).values([
    { boardId: marketing.id, name: "Ideas", position: 0 },
    { boardId: marketing.id, name: "Planning", position: 1 },
    { boardId: marketing.id, name: "In Progress", position: 2 },
    { boardId: marketing.id, name: "Published", position: 3 },
  ]).returning();

  // Lists for Bugs
  const bugLists = await db.insert(schema.lists).values([
    { boardId: bugs.id, name: "Reported", position: 0 },
    { boardId: bugs.id, name: "Triaged", position: 1 },
    { boardId: bugs.id, name: "Fixing", position: 2 },
    { boardId: bugs.id, name: "Resolved", position: 3 },
  ]).returning();

  // Lists for Onboarding
  const onboardingLists = await db.insert(schema.lists).values([
    { boardId: onboarding.id, name: "Before Day 1", position: 0 },
    { boardId: onboarding.id, name: "Day 1", position: 1 },
    { boardId: onboarding.id, name: "Week 1", position: 2 },
    { boardId: onboarding.id, name: "Week 2+", position: 3 },
  ]).returning();

  // Cards for Product Roadmap
  const roadmapCards: { listId: number; title: string; description: string | null; position: number; dueDate?: Date; coverColor?: string }[] = [
    // Backlog
    { listId: roadmapLists[0].id, title: "AI-powered search across all boards", description: "Use vector embeddings to enable semantic search across cards, comments, and attachments.", position: 0, coverColor: "#0079bf" },
    { listId: roadmapLists[0].id, title: "Mobile app redesign", description: "Redesign the mobile experience with bottom navigation and gesture support.", position: 1 },
    { listId: roadmapLists[0].id, title: "Custom field types", description: "Allow users to add custom fields (date, number, dropdown) to cards.", position: 2 },
    { listId: roadmapLists[0].id, title: "Board templates marketplace", description: null, position: 3 },
    { listId: roadmapLists[0].id, title: "Gantt chart view", description: "Timeline view showing card dependencies and due dates.", position: 4 },
    { listId: roadmapLists[0].id, title: "Webhooks & API v2", description: "RESTful API with webhook support for third-party integrations.", position: 5 },
    // Up Next
    { listId: roadmapLists[1].id, title: "Dark mode improvements", description: "Fix contrast issues and add OLED-optimized dark theme.", position: 0, coverColor: "#1a1a2e" },
    { listId: roadmapLists[1].id, title: "Keyboard shortcuts overhaul", description: "Add vim-like navigation, ⌘K command palette.", position: 1 },
    { listId: roadmapLists[1].id, title: "Card dependencies & blockers", description: "Link cards as dependencies with visual indicators.", position: 2 },
    // In Progress
    { listId: roadmapLists[2].id, title: "Real-time collaboration cursors", description: "Show other users' cursors and selections in real-time.", position: 0, coverColor: "#61bd4f" },
    { listId: roadmapLists[2].id, title: "Notification center redesign", description: "Unified notification inbox with filtering and snooze.", position: 1 },
    { listId: roadmapLists[2].id, title: "Performance optimization", description: "Reduce initial load time by 40%. Lazy load board content.", position: 2, dueDate: new Date("2026-03-15") },
    // In Review
    { listId: roadmapLists[3].id, title: "Multi-select cards", description: "Select multiple cards for bulk move, label, or archive.", position: 0 },
    { listId: roadmapLists[3].id, title: "Activity log export", description: "Export board activity as CSV/JSON for compliance.", position: 1, dueDate: new Date("2026-03-10") },
    // Done
    { listId: roadmapLists[4].id, title: "SSO integration (SAML/OIDC)", description: "Enterprise SSO with Okta, Azure AD, Google Workspace.", position: 0 },
    { listId: roadmapLists[4].id, title: "Board permissions revamp", description: "Granular permissions: viewer, commenter, editor, admin.", position: 1 },
    { listId: roadmapLists[4].id, title: "Markdown support in descriptions", description: "Full markdown with live preview in card descriptions.", position: 2 },
  ];

  // Cards for Sprint Board
  const sprintCards = [
    { listId: sprintLists[0].id, title: "Implement drag-and-drop for card reordering", description: "Use @dnd-kit for smooth card DnD between lists.", position: 0 },
    { listId: sprintLists[0].id, title: "Add card cover image upload", description: null, position: 1 },
    { listId: sprintLists[0].id, title: "Fix timezone bug in due dates", description: "Due dates show wrong day for UTC+/- users.", position: 2 },
    { listId: sprintLists[0].id, title: "Write E2E tests for board CRUD", description: null, position: 3 },
    { listId: sprintLists[1].id, title: "Build notification preferences UI", description: "Per-board and per-card notification settings.", position: 0, coverColor: "#f2d600" },
    { listId: sprintLists[1].id, title: "Migrate to Next.js 15 app router", description: "Convert pages/ to app/ directory structure.", position: 1 },
    { listId: sprintLists[1].id, title: "Implement card search with filters", description: "Search by title, label, member, due date.", position: 2, dueDate: new Date("2026-03-12") },
    { listId: sprintLists[2].id, title: "Refactor board state management", description: "Move from useState to Zustand for board state.", position: 0 },
    { listId: sprintLists[2].id, title: "Add loading skeletons", description: "Skeleton screens for boards, lists, and cards.", position: 1 },
    { listId: sprintLists[3].id, title: "Test member invitation flow", description: "QA the invite-by-email and link sharing flows.", position: 0 },
    { listId: sprintLists[4].id, title: "Fix card modal scroll on mobile", description: null, position: 0 },
    { listId: sprintLists[4].id, title: "Update dependencies to latest", description: "Bump React, Next.js, Tailwind to latest.", position: 1 },
  ];

  // Cards for Marketing
  const marketingCards = [
    { listId: marketingLists[0].id, title: "Launch video for v2.0", description: "2-minute product demo video for YouTube and Twitter.", position: 0 },
    { listId: marketingLists[0].id, title: "Comparison blog: Us vs Trello vs Asana", description: null, position: 1 },
    { listId: marketingLists[0].id, title: "Customer spotlight series", description: "Monthly interviews with power users.", position: 2 },
    { listId: marketingLists[1].id, title: "Product Hunt launch prep", description: "Prepare assets, tagline, and hunter outreach.", position: 0, coverColor: "#da552f" },
    { listId: marketingLists[1].id, title: "Email drip campaign for trial users", description: "7-day onboarding email sequence.", position: 1 },
    { listId: marketingLists[2].id, title: "Write SEO blog: 'Best project management tools 2026'", description: null, position: 0 },
    { listId: marketingLists[2].id, title: "Design social media templates", description: "Figma templates for Twitter, LinkedIn, Instagram.", position: 1 },
    { listId: marketingLists[3].id, title: "Case study: How Acme Corp uses boards", description: "Published on blog with video testimonial.", position: 0 },
  ];

  // Cards for Bugs
  const bugCards = [
    { listId: bugLists[0].id, title: "Cards disappear after quick drag", description: "Intermittent: cards vanish when dropped too fast between lists.", position: 0, coverColor: "#eb5a46" },
    { listId: bugLists[0].id, title: "Label color picker broken on Safari", description: "Color picker dropdown doesn't open on Safari 17.", position: 1 },
    { listId: bugLists[0].id, title: "Duplicate notifications on card move", description: null, position: 2 },
    { listId: bugLists[1].id, title: "Memory leak in board websocket", description: "Board connections not cleaned up on unmount.", position: 0 },
    { listId: bugLists[1].id, title: "Search returns archived cards", description: "Archived cards should be excluded from search results.", position: 1 },
    { listId: bugLists[2].id, title: "Fix checklist progress calculation", description: "Shows 100% when 0 items exist.", position: 0 },
    { listId: bugLists[3].id, title: "Fixed: Copy card loses labels", description: null, position: 0 },
    { listId: bugLists[3].id, title: "Fixed: Board background not saving", description: null, position: 1 },
  ];

  // Cards for Onboarding
  const onboardingCards = [
    { listId: onboardingLists[0].id, title: "Set up development environment", description: "Install Node.js, clone repo, run setup script.", position: 0 },
    { listId: onboardingLists[0].id, title: "Read architecture docs", description: "Review ARCHITECTURE.md and system design docs.", position: 1 },
    { listId: onboardingLists[0].id, title: "Get access to all tools", description: "GitHub, Slack, Figma, AWS, Vercel access.", position: 2 },
    { listId: onboardingLists[1].id, title: "Meet the team — intro calls", description: "30-min 1:1 with each team member.", position: 0, coverColor: "#c377e0" },
    { listId: onboardingLists[1].id, title: "Ship your first PR", description: "Pick a 'good first issue' and submit a PR.", position: 1 },
    { listId: onboardingLists[2].id, title: "Complete code review training", description: null, position: 0 },
    { listId: onboardingLists[2].id, title: "Shadow on-call rotation", description: "Observe one on-call shift with a senior engineer.", position: 1 },
    { listId: onboardingLists[3].id, title: "Lead a sprint planning session", description: "Run planning for your first sprint.", position: 0 },
    { listId: onboardingLists[3].id, title: "Write your first design doc", description: null, position: 1 },
  ];

  const allCardData = [...roadmapCards, ...sprintCards, ...marketingCards, ...bugCards, ...onboardingCards];
  const allCards = await db.insert(schema.cards).values(allCardData.map(c => ({
    listId: c.listId,
    title: c.title,
    description: c.description || null,
    position: c.position,
    dueDate: c.dueDate || null,
    coverColor: c.coverColor || null,
  }))).returning();
  console.log(`✅ ${allCards.length} cards`);

  // Assign labels to cards (random subset)
  const cardLabelValues: { cardId: number; labelId: number }[] = [];
  for (const card of allCards) {
    // Find which board this card belongs to
    const list = [...roadmapLists, ...sprintLists, ...marketingLists, ...bugLists, ...onboardingLists].find(l => l.id === card.listId);
    if (!list) continue;
    const boardLabels = labelsFor(list.boardId);
    if (boardLabels.length === 0) continue;
    // 70% chance of having at least one label
    if (Math.random() < 0.7) {
      const count = Math.random() < 0.4 ? 2 : 1;
      const shuffled = [...boardLabels].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        cardLabelValues.push({ cardId: card.id, labelId: shuffled[i].id });
      }
    }
  }
  if (cardLabelValues.length > 0) {
    await db.insert(schema.cardLabels).values(cardLabelValues);
    console.log(`✅ ${cardLabelValues.length} card-label assignments`);
  }

  // Assign members to cards
  const cardMemberValues: { cardId: number; memberId: number }[] = [];
  for (const card of allCards) {
    if (Math.random() < 0.75) {
      const count = Math.random() < 0.3 ? 2 : 1;
      const shuffled = [...memberRows].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        cardMemberValues.push({ cardId: card.id, memberId: shuffled[i].id });
      }
    }
  }
  if (cardMemberValues.length > 0) {
    await db.insert(schema.cardMembers).values(cardMemberValues);
    console.log(`✅ ${cardMemberValues.length} card-member assignments`);
  }

  // Checklists for some cards
  const cardsWithChecklists = allCards.filter(() => Math.random() < 0.3);
  for (const card of cardsWithChecklists) {
    const [checklist] = await db.insert(schema.checklists).values({ cardId: card.id, title: "Tasks" }).returning();
    const itemCount = 2 + Math.floor(Math.random() * 4);
    const items = [];
    const taskTexts = ["Research options", "Write draft", "Get feedback", "Update docs", "Deploy changes", "Add tests", "Review PR", "Update design"];
    for (let i = 0; i < itemCount; i++) {
      items.push({ checklistId: checklist.id, text: taskTexts[i % taskTexts.length], completed: Math.random() < 0.5, position: i });
    }
    await db.insert(schema.checklistItems).values(items);
  }
  console.log(`✅ ${cardsWithChecklists.length} checklists`);

  // Comments
  const commentTexts = [
    "This looks great! Let's move forward with this approach.",
    "Can we get an estimate on this?",
    "I've updated the design mockups for this.",
    "Blocked on API changes — waiting for backend team.",
    "Shipped! 🚀",
    "Let's discuss this in standup tomorrow.",
    "Added some notes to the description.",
    "This is higher priority than we thought.",
    "Nice work on this one!",
    "Moving to next sprint if not done by Friday.",
  ];
  const commentValues: { cardId: number; memberId: number; text: string; createdAt: Date }[] = [];
  for (const card of allCards) {
    if (Math.random() < 0.4) {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        commentValues.push({
          cardId: card.id,
          memberId: memberRows[Math.floor(Math.random() * memberRows.length)].id,
          text: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          createdAt: new Date(Date.now() - Math.random() * 7 * 86400000),
        });
      }
    }
  }
  if (commentValues.length > 0) {
    await db.insert(schema.comments).values(commentValues);
    console.log(`✅ ${commentValues.length} comments`);
  }

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
