"use client";

import { OnClawProvider, Slot, useOnClaw } from "onclaw";

const SLACK_SLOTS = {
  "sidebar-channels": { name: "Channel Sidebar", description: "Channel list with unread indicators" },
  "channel-header": { name: "Channel Header", description: "Channel name, topic, and actions" },
  "message-list": { name: "Message List", description: "Message feed with avatars and reactions" },
  "message-input": { name: "Message Input", description: "Rich text input with formatting" },
  "thread-panel": { name: "Thread Panel", description: "Thread replies side panel" },
  "user-presence": { name: "User Presence", description: "Online status for team members" },
  "channel-stats": { name: "Channel Stats", description: "Message frequency and activity" },
  "search-results": { name: "Search Results", description: "Message search with context" },
  "active-threads": { name: "Active Threads", description: "Recent threads with reply counts" },
};

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <OnClawProvider
      userId="slack-demo-user"
      endpoint="/api/onclaw/generate"
      streamEndpoint="/api/onclaw/stream"
      multiSlot={true}
      smartPrompts={true}
      slots={SLACK_SLOTS}
      rateLimit={{ maxGenerations: 30, windowMs: 60_000 }}
    >
      {children}
    </OnClawProvider>
  );
}

export { Slot, useOnClaw };
