"use client";

import { ClawKitProvider, Slot, useClawKit } from "clawkit";
import type { TemplateItem, ClawKitEvents } from "clawkit";

const templates: TemplateItem[] = [
  {
    id: "hero-gradient",
    name: "Gradient Hero",
    category: "hero",
    description: "Bold gradient heading with animated background",
    tags: ["gradient", "animated", "bold"],
    code: `const Component = (props) => {
  return React.createElement("section", {
    style: {
      padding: "4rem 2rem", textAlign: "center",
      background: "linear-gradient(135deg, hsl(262 80% 20%) 0%, hsl(200 80% 15%) 100%)",
      borderRadius: "var(--ck-radius)", position: "relative", overflow: "hidden",
    }
  },
    React.createElement("h1", {
      style: { fontSize: "3.5rem", fontWeight: 800, margin: "0 0 1rem",
        background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        fontFamily: "var(--ck-font)", letterSpacing: "-0.03em",
      }
    }, "Something Amazing"),
    React.createElement("p", {
      style: { color: "var(--ck-text-muted)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto 2rem", lineHeight: 1.6, fontFamily: "var(--ck-font)" }
    }, "A beautifully crafted experience that adapts to your vision."),
    React.createElement("button", {
      style: { padding: "12px 32px", borderRadius: "8px", background: "white", color: "black",
        border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--ck-font)" }
    }, "Get Started →")
  );
};`,
  },
  {
    id: "hero-minimal",
    name: "Minimal Hero",
    category: "hero",
    description: "Clean, typography-focused hero with subtle accent",
    tags: ["minimal", "clean", "typography"],
    code: `const Component = (props) => {
  return React.createElement("section", {
    style: { padding: "5rem 2rem", textAlign: "center" }
  },
    React.createElement("div", {
      style: { display: "inline-block", padding: "4px 12px", borderRadius: "999px",
        background: "var(--ck-bg-secondary)", border: "1px solid var(--ck-border)",
        fontSize: "12px", color: "var(--ck-text-muted)", marginBottom: "1.5rem",
        fontFamily: "var(--ck-font)" }
    }, "✦ Now Available"),
    React.createElement("h1", {
      style: { fontSize: "3rem", fontWeight: 700, margin: "0 0 1rem",
        color: "var(--ck-text)", fontFamily: "var(--ck-font)", letterSpacing: "-0.02em", lineHeight: 1.1 }
    }, "Design Without Limits"),
    React.createElement("p", {
      style: { color: "var(--ck-text-muted)", fontSize: "1rem", maxWidth: "440px",
        margin: "0 auto", lineHeight: 1.6, fontFamily: "var(--ck-font)" }
    }, "Simple, powerful tools for people who build things.")
  );
};`,
  },
  {
    id: "sidebar-weather",
    name: "Weather Widget",
    category: "sidebar",
    description: "Simulated weather card with temperature and conditions",
    tags: ["widget", "weather", "info"],
    code: `const Component = (props) => {
  const [temp] = React.useState(72);
  return React.createElement("div", {
    style: { padding: "1.5rem", borderRadius: "var(--ck-radius)",
      background: "linear-gradient(135deg, hsl(210 80% 15%), hsl(210 60% 25%))",
      fontFamily: "var(--ck-font)", color: "var(--ck-text)" }
  },
    React.createElement("div", { style: { fontSize: "11px", textTransform: "uppercase", color: "var(--ck-text-muted)", letterSpacing: "0.05em", marginBottom: "12px" } }, "Weather"),
    React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" } },
      React.createElement("span", { style: { fontSize: "2.5rem", fontWeight: 700 } }, temp + "°"),
      React.createElement("span", { style: { fontSize: "14px", color: "var(--ck-text-muted)" } }, "F")
    ),
    React.createElement("div", { style: { fontSize: "13px", color: "var(--ck-text-muted)" } }, "☀️ Sunny · San Francisco"),
    React.createElement("div", { style: { display: "flex", gap: "16px", marginTop: "12px", fontSize: "12px", color: "var(--ck-text-muted)" } },
      React.createElement("span", null, "💧 45%"),
      React.createElement("span", null, "💨 8 mph")
    )
  );
};`,
  },
  {
    id: "cta-newsletter",
    name: "Newsletter CTA",
    category: "cta",
    description: "Email signup with input field",
    tags: ["newsletter", "email", "signup"],
    code: `const Component = (props) => {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  return React.createElement("div", {
    style: { padding: "2rem", borderRadius: "var(--ck-radius)", border: "1px solid var(--ck-border)",
      background: "var(--ck-bg-secondary)", fontFamily: "var(--ck-font)", textAlign: "center" }
  },
    React.createElement("h3", { style: { color: "var(--ck-text)", fontSize: "1.25rem", fontWeight: 600, margin: "0 0 8px" } },
      submitted ? "You're in! 🎉" : "Stay in the loop"),
    React.createElement("p", { style: { color: "var(--ck-text-muted)", fontSize: "14px", margin: "0 0 1.5rem" } },
      submitted ? "We'll keep you updated." : "Get notified about new features and updates."),
    !submitted && React.createElement("div", { style: { display: "flex", gap: "8px", maxWidth: "360px", margin: "0 auto" } },
      React.createElement("input", {
        type: "email", placeholder: "you@example.com", value: email,
        onChange: (e) => setEmail(e.target.value),
        style: { flex: 1, padding: "10px 14px", borderRadius: "6px", border: "1px solid var(--ck-border)",
          background: "var(--ck-bg)", color: "var(--ck-text)", fontSize: "14px", outline: "none",
          fontFamily: "var(--ck-font)" }
      }),
      React.createElement("button", {
        onClick: () => setSubmitted(true),
        style: { padding: "10px 20px", borderRadius: "6px", background: "var(--ck-accent)",
          color: "var(--ck-accent-text)", border: "none", fontSize: "14px", fontWeight: 500,
          cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--ck-font)" }
      }, "Subscribe")
    )
  );
};`,
  },
];

const events: ClawKitEvents = {
  onGenerateStart: ({ prompt, slotId, userId }) => {
    console.log("[ClawKit Analytics] Generation started:", { prompt, slotId, userId, timestamp: Date.now() });
  },
  onGenerateComplete: ({ prompt, slotId, durationMs }) => {
    console.log("[ClawKit Analytics] Generation complete:", { prompt, slotId, durationMs });
  },
  onError: ({ error, slotId }) => {
    console.error("[ClawKit Analytics] Error:", { error, slotId });
  },
  onSlotChange: ({ slotId, action }) => {
    console.log("[ClawKit Analytics] Slot changed:", { slotId, action });
  },
};

function DynamicSlots() {
  const { dynamicSlotIds, slots } = useClawKit();
  if (dynamicSlotIds.length === 0) return null;
  return (
    <div className="mt-8 space-y-6">
      {dynamicSlotIds.map((id) => (
        <Slot key={id} id={id} className="w-full">
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-neutral-500">
              {slots[id]?.name ?? id} — Hit ⌘K to generate
            </p>
          </div>
        </Slot>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <ClawKitProvider
      userId="demo-user-1"
      endpoint="/api/clawkit/generate"
      streamEndpoint="/api/clawkit/stream"
      serverUrl="/api/server-mutate"
      theme="dark"
      multiSlot={true}
      templates={templates}
      events={events}
      rateLimit={{ maxGenerations: 20, windowMs: 60_000 }}
      slots={{
        nav: {
          name: "Navigation Bar",
          description: "The top navigation bar with logo, links, and buttons",
        },
        hero: {
          name: "Hero Section",
          description: "The main hero/banner area at the top of the page",
        },
        features: {
          name: "Features Grid",
          description: "A grid showcasing product features or benefits",
        },
        cta: {
          name: "Call to Action",
          description: "A call-to-action section encouraging user engagement",
        },
        sidebar: {
          name: "Sidebar Widget",
          description: "A sidebar widget or info panel",
        },
      }}
    >
      <div className="min-h-screen">
        {/* Nav */}
        <Slot id="nav" editable={false}>
          <nav className="border-b border-white/5 px-6 py-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white" />
                <span className="text-sm font-semibold tracking-tight">
                  Acme SaaS
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-neutral-400">
                <span>Features</span>
                <span>Pricing</span>
                <span>Docs</span>
                <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-neutral-200">
                  Get Started
                </button>
              </div>
            </div>
          </nav>
        </Slot>

        <main className="mx-auto max-w-6xl px-6 py-12">
          {/* Hero */}
          <Slot id="hero" className="mb-16">
            <section className="py-16 text-center">
              <div className="mx-auto max-w-2xl">
                <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-400">
                  Powered by ClawKit
                </div>
                <h1 className="mb-4 text-5xl font-bold tracking-tight">
                  Build your perfect
                  <br />
                  <span className="bg-gradient-to-r from-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                    dashboard
                  </span>
                </h1>
                <p className="mb-8 text-lg text-neutral-400">
                  Press{" "}
                  <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-xs">
                    ⌘K
                  </kbd>{" "}
                  to customize any section of this app with AI.
                  <br />
                  Every user gets their own personalized experience.
                </p>
                <div className="flex justify-center gap-3">
                  <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200">
                    Try it now
                  </button>
                  <button className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-neutral-300 transition hover:bg-white/5">
                    View docs
                  </button>
                </div>
              </div>
            </section>
          </Slot>

          {/* Features */}
          <Slot id="features" className="mb-16">
            <section>
              <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
                Everything you need
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: "⚡", title: "AI Generation", desc: "Describe what you want, get a component instantly" },
                  { icon: "👤", title: "Per-User State", desc: "Each user's customizations are saved independently" },
                  { icon: "🔄", title: "Version History", desc: "Roll back any component to a previous version" },
                  { icon: "🎨", title: "Slot System", desc: "Define customizable areas with context for better AI output" },
                  { icon: "🔌", title: "Pluggable Store", desc: "localStorage, your API, or any custom backend" },
                  { icon: "🛡️", title: "Error Boundaries", desc: "Generated components can't crash your app" },
                ].map((f) => (
                  <div key={f.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-6 transition hover:bg-white/[0.04]">
                    <div className="mb-3 text-2xl">{f.icon}</div>
                    <h3 className="mb-1 text-sm font-semibold">{f.title}</h3>
                    <p className="text-sm text-neutral-500">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </Slot>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              {/* CTA */}
              <Slot id="cta">
                <section className="rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-10">
                  <h2 className="mb-2 text-xl font-semibold">Ready to customize?</h2>
                  <p className="mb-6 text-neutral-400">
                    Hit{" "}
                    <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-xs">⌘K</kbd>{" "}
                    and describe what you want. The AI will generate a React component and place it right here.
                  </p>
                  <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200">
                    Open Command Bar
                  </button>
                </section>
              </Slot>
            </div>

            {/* Sidebar */}
            <Slot id="sidebar">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-4 text-sm font-semibold text-neutral-300">Quick Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: "Active Users", value: "2,847" },
                    { label: "Components", value: "12,093" },
                    { label: "Uptime", value: "99.98%" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">{s.label}</span>
                      <span className="text-sm font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Slot>
          </div>

          {/* Dynamic user-created components */}
          <DynamicSlots />
        </main>
      </div>
    </ClawKitProvider>
  );
}
