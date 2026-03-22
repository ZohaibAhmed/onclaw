"use client";

import { Shell, Slot, useOnClaw } from "@/components/shell";
import { formatTime, formatDate, isSameDay, STATUS_COLORS } from "@/lib/format";
import { useEffect, useState, useRef, useCallback } from "react";

interface Channel { id: number; name: string; description: string; topic: string; type: string; member_count: number; message_count: number }
interface Message {
  id: number; content: string; createdAt: string; userId: number;
  userName: string; userDisplayName: string; userAvatar: string; userStatus: string; userIsBot: boolean;
  replyCount: number; reactions: { emoji: string; count: number; users: string[] }[];
}
interface ThreadReply {
  id: number; content: string; createdAt: string; userName: string; userAvatar: string; userDisplayName: string;
}

function ChannelSidebar({ channels, activeId, onSelect }: { channels: Channel[]; activeId: number; onSelect: (id: number) => void }) {
  return (
    <aside className="w-60 flex-shrink-0 bg-[#19171d] border-r border-[#35373b] flex flex-col h-screen">
      {/* Workspace header */}
      <div className="p-4 border-b border-[#35373b] flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#4a154b] flex items-center justify-center text-white text-xs font-bold">S</div>
        <div>
          <div className="text-sm font-bold text-white">SlackKit</div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-[#ababad]">Zohaib Ahmed</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="px-2 py-3 space-y-0.5">
        {[
          { icon: "💬", label: "Threads" },
          { icon: "📨", label: "All DMs" },
          { icon: "🔔", label: "Activity" },
          { icon: "📌", label: "Later" },
        ].map((item) => (
          <button key={item.label} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#ababad] hover:bg-[#35373b] rounded-md transition">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Channels */}
      <div className="px-2 pt-2 flex-1 overflow-auto">
        <Slot id="sidebar-channels">
          <div>
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-xs font-semibold text-[#ababad] uppercase tracking-wider">Channels</span>
              <button className="text-[#ababad] hover:text-white text-sm">+</button>
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => onSelect(ch.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition ${
                    ch.id === activeId
                      ? "bg-[#1264a3] text-white"
                      : "text-[#ababad] hover:bg-[#35373b]"
                  }`}
                >
                  <span className="text-xs opacity-60">#</span>
                  <span className="truncate">{ch.name}</span>
                  {ch.message_count > 20 && (
                    <span className="ml-auto text-[10px] bg-[#e8912d] text-white rounded-full px-1.5 py-0.5 font-bold">
                      {Math.floor(Math.random() * 5) + 1}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Slot>

        {/* Direct Messages section */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold text-[#ababad] uppercase tracking-wider">Direct Messages</span>
            <button className="text-[#ababad] hover:text-white text-sm">+</button>
          </div>
          <Slot id="user-presence">
            <div className="space-y-0.5">
              {[
                { name: "Sarah Chen", avatar: "SC", status: "online" },
                { name: "Marcus Johnson", avatar: "MJ", status: "online" },
                { name: "Emily Rodriguez", avatar: "ER", status: "away" },
                { name: "David Kim", avatar: "DK", status: "online" },
                { name: "ClawBot", avatar: "🤖", status: "online" },
              ].map((u) => (
                <button key={u.name} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#ababad] hover:bg-[#35373b] rounded-md transition">
                  <div className="relative">
                    <div className="w-5 h-5 rounded-sm bg-[#35373b] flex items-center justify-center text-[9px] font-medium">
                      {u.avatar}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#19171d]"
                      style={{ background: STATUS_COLORS[u.status] }}
                    />
                  </div>
                  <span className="truncate">{u.name}</span>
                </button>
              ))}
            </div>
          </Slot>
        </div>
      </div>

      {/* ⌘K hint */}
      <div className="p-3 border-t border-[#35373b]">
        <kbd className="text-[10px] text-[#ababad] border border-[#35373b] rounded px-1.5 py-0.5">⌘K</kbd>
        <span className="text-[10px] text-[#6b6b6e] ml-1.5">to customize with AI</span>
      </div>
    </aside>
  );
}

function MessageBubble({ msg, onThreadOpen }: { msg: Message; onThreadOpen: (id: number) => void }) {
  return (
    <div className="group flex gap-2.5 px-5 py-1.5 hover:bg-[#222529] transition">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-lg bg-[#35373b] flex items-center justify-center text-xs font-bold text-white">
          {msg.userAvatar}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-white hover:underline cursor-pointer">{msg.userName}</span>
          {msg.userIsBot && (
            <span className="text-[10px] bg-[#4a154b] text-[#e8a0bf] px-1.5 py-0.5 rounded font-medium">APP</span>
          )}
          <span className="text-xs text-[#6b6b6e]">{formatTime(msg.createdAt)}</span>
        </div>
        <p className="text-[15px] leading-relaxed text-[#d1d2d3] mt-0.5">{msg.content}</p>

        {/* Reactions */}
        {msg.reactions.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.reactions.map((r, i) => (
              <button
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#222529] border border-[#35373b] rounded-full text-xs hover:bg-[#35373b] transition"
                title={r.users.join(", ")}
              >
                <span>{r.emoji}</span>
                <span className="text-[#ababad]">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {msg.replyCount > 0 && (
          <button
            onClick={() => onThreadOpen(msg.id)}
            className="flex items-center gap-1.5 mt-1.5 text-[#1d9bd1] hover:underline text-xs"
          >
            <span className="font-medium">{msg.replyCount} {msg.replyCount === 1 ? "reply" : "replies"}</span>
          </button>
        )}
      </div>

      {/* Hover actions */}
      <div className="opacity-0 group-hover:opacity-100 transition flex items-start gap-0.5 -mt-3 bg-[#222529] border border-[#35373b] rounded-lg p-0.5 shadow-lg">
        {["😊", "👍", "💬", "⋯"].map((icon) => (
          <button
            key={icon}
            onClick={() => icon === "💬" && onThreadOpen(msg.id)}
            className="w-7 h-7 flex items-center justify-center text-sm hover:bg-[#35373b] rounded transition text-[#ababad]"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadPanel({ threadId, onClose }: { threadId: number; onClose: () => void }) {
  const [data, setData] = useState<{ parent: ThreadReply; replies: ThreadReply[] } | null>(null);

  useEffect(() => {
    fetch(`/api/data?q=thread&threadId=${threadId}`).then((r) => r.json()).then(setData);
  }, [threadId]);

  return (
    <div className="w-96 flex-shrink-0 border-l border-[#35373b] bg-[#1a1d21] flex flex-col h-screen">
      <div className="px-4 py-3 border-b border-[#35373b] flex items-center justify-between">
        <Slot id="thread-panel">
          <div>
            <h3 className="text-sm font-bold text-white">Thread</h3>
            <p className="text-xs text-[#ababad]">#{data?.parent?.userName || "..."}</p>
          </div>
        </Slot>
        <button onClick={onClose} className="text-[#ababad] hover:text-white text-lg">×</button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {data && (
          <>
            {/* Parent message */}
            <div className="flex gap-2.5 pb-3 border-b border-[#35373b]">
              <div className="w-9 h-9 rounded-lg bg-[#35373b] flex items-center justify-center text-xs font-bold text-white">
                {data.parent.userAvatar}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white">{data.parent.userName}</span>
                  <span className="text-xs text-[#6b6b6e]">{formatTime(data.parent.createdAt)}</span>
                </div>
                <p className="text-[15px] text-[#d1d2d3] mt-0.5">{data.parent.content}</p>
              </div>
            </div>

            <div className="text-xs text-[#6b6b6e] px-2">{data.replies.length} {data.replies.length === 1 ? "reply" : "replies"}</div>

            {/* Replies */}
            {data.replies.map((r) => (
              <div key={r.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#35373b] flex items-center justify-center text-[10px] font-bold text-white">
                  {r.userAvatar}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-white">{r.userName}</span>
                    <span className="text-xs text-[#6b6b6e]">{formatTime(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#d1d2d3] mt-0.5">{r.content}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Reply input */}
      <div className="p-3 border-t border-[#35373b]">
        <div className="bg-[#222529] border border-[#35373b] rounded-lg px-3 py-2">
          <input
            type="text"
            placeholder="Reply..."
            className="w-full bg-transparent text-sm text-[#d1d2d3] placeholder:text-[#6b6b6e] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function ChannelView({ channelId, channels }: { channelId: number; channels: Channel[] }) {
  const [data, setData] = useState<{ channel: any; messages: Message[]; memberCount: number } | null>(null);
  const [threadId, setThreadId] = useState<number | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/data?q=messages&channelId=${channelId}`).then((r) => r.json()).then(setData);
    setThreadId(null);
  }, [channelId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const channel = data?.channel;
  const msgs = data?.messages || [];

  return (
    <div className="flex flex-1 h-screen">
      <div className="flex-1 flex flex-col">
        {/* Channel header */}
        <Slot id="channel-header">
          <header className="px-5 py-3 border-b border-[#35373b] flex items-center justify-between bg-[#1a1d21]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  # {channel?.name || "loading"}
                </span>
                <span className="text-xs text-[#6b6b6e]">|</span>
                <span className="text-xs text-[#ababad]">{channel?.topic}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#ababad]">👥 {data?.memberCount || 0}</span>
              <button className="text-[#ababad] hover:text-white text-sm px-2 py-1 hover:bg-[#35373b] rounded transition">📌</button>
              <button className="text-[#ababad] hover:text-white text-sm px-2 py-1 hover:bg-[#35373b] rounded transition">🔍</button>
            </div>
          </header>
        </Slot>

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          <Slot id="message-list">
            <div className="py-4">
              {/* Channel intro */}
              <div className="px-5 pb-6 mb-4 border-b border-[#35373b]">
                <div className="text-3xl mb-1">🎯</div>
                <h2 className="text-xl font-bold text-white"># {channel?.name}</h2>
                <p className="text-sm text-[#ababad] mt-1">{channel?.description}</p>
                <p className="text-xs text-[#6b6b6e] mt-2">This is the very beginning of <strong className="text-white">#{channel?.name}</strong></p>
              </div>

              {msgs.map((msg, i) => {
                const showDate = i === 0 || !isSameDay(msgs[i - 1].createdAt, msg.createdAt);
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 px-5 my-4">
                        <div className="flex-1 h-px bg-[#35373b]" />
                        <span className="text-xs font-medium text-[#ababad] bg-[#1a1d21] px-3 py-1 rounded-full border border-[#35373b]">
                          {formatDate(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-[#35373b]" />
                      </div>
                    )}
                    <MessageBubble msg={msg} onThreadOpen={setThreadId} />
                  </div>
                );
              })}
              <div ref={messagesEnd} />
            </div>
          </Slot>
        </div>

        {/* Message input */}
        <Slot id="message-input">
          <div className="px-5 pb-4">
            <div className="bg-[#222529] border border-[#35373b] rounded-lg">
              {/* Formatting toolbar */}
              <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-[#35373b]">
                {["𝐁", "𝐼", "𝚂", "🔗", "</>", "📋", "1.", "•", "❝"].map((btn) => (
                  <button key={btn} className="w-7 h-7 flex items-center justify-center text-xs text-[#ababad] hover:bg-[#35373b] rounded transition">
                    {btn}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder={`Message #${channel?.name || "..."}`}
                className="w-full bg-transparent px-3 py-2.5 text-sm text-[#d1d2d3] placeholder:text-[#6b6b6e] focus:outline-none"
              />
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 flex items-center justify-center text-sm text-[#ababad] hover:bg-[#35373b] rounded transition">➕</button>
                  <button className="w-7 h-7 flex items-center justify-center text-sm text-[#ababad] hover:bg-[#35373b] rounded transition">😊</button>
                  <button className="w-7 h-7 flex items-center justify-center text-sm text-[#ababad] hover:bg-[#35373b] rounded transition">@</button>
                  <button className="w-7 h-7 flex items-center justify-center text-sm text-[#ababad] hover:bg-[#35373b] rounded transition">📎</button>
                </div>
                <button className="w-8 h-8 flex items-center justify-center bg-[#007a5a] hover:bg-[#148567] text-white rounded-lg transition text-sm">
                  ➤
                </button>
              </div>
            </div>
          </div>
        </Slot>
      </div>

      {/* Thread panel */}
      {threadId && <ThreadPanel threadId={threadId} onClose={() => setThreadId(null)} />}
    </div>
  );
}

export default function SlackApp() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<number>(0);

  useEffect(() => {
    fetch("/api/data?q=channels").then((r) => r.json()).then((d) => {
      setChannels(d.channels);
      // Default to #general
      const general = d.channels.find((c: Channel) => c.name === "general");
      if (general) setActiveChannel(general.id);
      else if (d.channels.length > 0) setActiveChannel(d.channels[0].id);
    });
  }, []);

  if (!channels.length) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-screen text-[#6b6b6e]">Loading workspace...</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex h-screen">
        <ChannelSidebar channels={channels} activeId={activeChannel} onSelect={setActiveChannel} />
        {activeChannel > 0 && <ChannelView channelId={activeChannel} channels={channels} />}
      </div>
    </Shell>
  );
}
