export const SLACK_SLOTS = {
  "sidebar-channels": {
    name: "Channel Sidebar",
    description: "List of channels with unread indicators and member counts",
    availableData: ["getChannels() - returns all channels with type and metadata"],
  },
  "channel-header": {
    name: "Channel Header",
    description: "Channel name, topic, member count, and action buttons (search, settings)",
    availableData: ["getChannelStats() - returns channel info with message and member counts"],
  },
  "message-list": {
    name: "Message List",
    description: "Chronological message feed with user avatars, timestamps, reactions, and thread indicators",
    availableData: ["getChannelMessages(channelId) - returns messages with user info"],
  },
  "message-input": {
    name: "Message Input",
    description: "Rich text input with formatting toolbar, emoji picker, and file upload button",
    availableActions: ["sendMessage(channelId, userId, content) - sends a new message"],
  },
  "thread-panel": {
    name: "Thread Panel",
    description: "Side panel showing thread replies with the parent message at top",
    availableData: ["getThreadReplies(threadId) - returns thread replies in chronological order"],
  },
  "user-presence": {
    name: "User Presence List",
    description: "Online/away/DND status indicators for team members in the sidebar",
    availableData: ["getUsers() - returns users with status and statusText"],
  },
  "channel-stats": {
    name: "Channel Analytics",
    description: "Message frequency, active members, and activity trends for a channel",
    availableData: ["getChannelStats() - returns per-channel message counts and last activity"],
  },
  "search-results": {
    name: "Search Results",
    description: "Message search results with channel context, highlighting, and timestamps",
    availableData: ["searchMessages(query) - full-text search across messages"],
  },
  "active-threads": {
    name: "Active Threads",
    description: "List of recent threads with reply counts and last activity time",
    availableData: ["getRecentThreads(channelId) - returns threads with reply counts"],
  },
};

export function getSlotConfig(slotId: string) {
  return SLACK_SLOTS[slotId as keyof typeof SLACK_SLOTS] || null;
}
export function getAllSlotIds() {
  return Object.keys(SLACK_SLOTS);
}
