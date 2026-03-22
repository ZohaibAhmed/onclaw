export type Label = { text: string; color: string };
export type Card = { id: string; title: string; description?: string; labels: Label[]; assignees: string[]; dueDate?: string; comments: number; attachments: number; cover?: string };
export type List = { id: string; title: string; cards: Card[] };
export type Board = { id: string; title: string; color: string; lists: List[] };
export type Member = { id: string; name: string; avatar: string };

export const MEMBERS: Member[] = [
  { id: "m1", name: "Zohaib A.", avatar: "ZA" },
  { id: "m2", name: "Sarah C.", avatar: "SC" },
  { id: "m3", name: "Marcus R.", avatar: "MR" },
  { id: "m4", name: "Emily Z.", avatar: "EZ" },
  { id: "m5", name: "James W.", avatar: "JW" },
];

export const BOARDS: Board[] = [
  {
    id: "b1", title: "Product Roadmap", color: "from-blue-600 to-purple-700",
    lists: [
      { id: "l1", title: "Backlog", cards: [
        { id: "c1", title: "Implement OAuth2 SSO for enterprise customers", labels: [{ text: "Feature", color: "bg-green-500" }, { text: "Enterprise", color: "bg-purple-500" }], assignees: ["m1", "m4"], comments: 8, attachments: 2, description: "Add support for SAML and OIDC providers" },
        { id: "c2", title: "Dark mode improvements", labels: [{ text: "Design", color: "bg-pink-500" }], assignees: ["m3"], comments: 3, attachments: 0 },
        { id: "c3", title: "API rate limiting dashboard", labels: [{ text: "Feature", color: "bg-green-500" }, { text: "DevOps", color: "bg-orange-500" }], assignees: ["m5"], comments: 1, attachments: 0 },
        { id: "c4", title: "Migrate to PostgreSQL 17", labels: [{ text: "Infrastructure", color: "bg-orange-500" }], assignees: ["m5"], dueDate: "Mar 20", comments: 5, attachments: 1 },
      ]},
      { id: "l2", title: "In Progress", cards: [
        { id: "c5", title: "Real-time collaboration with CRDTs", labels: [{ text: "Feature", color: "bg-green-500" }, { text: "Priority", color: "bg-red-500" }], assignees: ["m1", "m4"], dueDate: "Mar 15", comments: 14, attachments: 3, description: "Using Yjs for conflict-free replicated data types" },
        { id: "c6", title: "Redesign notification center", labels: [{ text: "Design", color: "bg-pink-500" }], assignees: ["m3", "m2"], comments: 7, attachments: 5 },
        { id: "c7", title: "WebSocket connection pooling", labels: [{ text: "Performance", color: "bg-yellow-500" }], assignees: ["m1"], comments: 4, attachments: 0 },
      ]},
      { id: "l3", title: "Review", cards: [
        { id: "c8", title: "Search indexing with Elasticsearch", labels: [{ text: "Feature", color: "bg-green-500" }], assignees: ["m4"], dueDate: "Mar 12", comments: 11, attachments: 2 },
        { id: "c9", title: "Accessibility audit fixes (WCAG 2.1)", labels: [{ text: "Bug", color: "bg-red-500" }, { text: "Design", color: "bg-pink-500" }], assignees: ["m3", "m2"], comments: 6, attachments: 1 },
      ]},
      { id: "l4", title: "Done ✅", cards: [
        { id: "c10", title: "Multi-language support (i18n)", labels: [{ text: "Feature", color: "bg-green-500" }], assignees: ["m2", "m4"], comments: 9, attachments: 0 },
        { id: "c11", title: "CI/CD pipeline with GitHub Actions", labels: [{ text: "DevOps", color: "bg-orange-500" }], assignees: ["m5"], comments: 3, attachments: 1 },
        { id: "c12", title: "Customer onboarding wizard", labels: [{ text: "Feature", color: "bg-green-500" }, { text: "UX", color: "bg-blue-500" }], assignees: ["m2", "m3"], comments: 12, attachments: 4 },
      ]},
    ]
  },
];

export function getMember(id: string) { return MEMBERS.find(m => m.id === id); }
