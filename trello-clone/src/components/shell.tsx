"use client";

import { OnClawProvider, Slot, useOnClaw } from "onclaw";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TRELLO_SLOTS } from "@/clawkit/slots";

export function Shell({ children, boardBg }: { children: React.ReactNode; boardBg?: string }) {
  return (
    <OnClawProvider
      userId="trello-demo-user"
      endpoint="/api/onclaw/generate"
      streamEndpoint="/api/onclaw/stream"
      multiSlot={true}
      smartPrompts={true}
      slots={TRELLO_SLOTS}
      rateLimit={{ maxGenerations: 30, windowMs: 60_000 }}
    >
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col" style={boardBg ? { background: boardBg } : {}}>
          {children}
        </main>
      </div>
    </OnClawProvider>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const [boards, setBoards] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/data?q=boards").then(r => r.json()).then(d => setBoards(d.boards || []));
  }, []);

  return (
    <aside className="w-60 flex-shrink-0 border-r border-gray-800 bg-gray-950/95 backdrop-blur flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">T</div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Trello Clone</h1>
            <p className="text-[10px] text-gray-500">ClawKit Demo</p>
          </div>
        </Link>
      </div>

      <Slot id="sidebar-nav">
        <nav className="flex-1 p-3 space-y-1 overflow-auto">
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              pathname === "/" ? "bg-blue-500/15 text-blue-400 font-medium" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <span className="text-base">🏠</span>
            Boards
          </Link>

          <div className="pt-3 pb-1.5">
            <p className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Your Boards</p>
          </div>

          {boards.map(b => {
            const isActive = pathname === `/board/${b.id}`;
            return (
              <Link
                key={b.id}
                href={`/board/${b.id}`}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition ${
                  isActive ? "bg-gray-800 text-gray-100 font-medium" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                <div className="w-5 h-4 rounded-sm flex-shrink-0" style={{ background: b.background }} />
                <span className="truncate flex-1">{b.name}</span>
                {b.starred && <span className="text-yellow-500 text-xs">★</span>}
              </Link>
            );
          })}
        </nav>
      </Slot>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-400">ZA</div>
          <div>
            <div className="text-xs font-medium">Zohaib Ahmed</div>
            <div className="text-[10px] text-gray-500">Admin</div>
          </div>
        </div>
        <div className="mt-2 px-2">
          <kbd className="text-[10px] text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">⌘K</kbd>
          <span className="text-[10px] text-gray-600 ml-1.5">to customize</span>
        </div>
      </div>
    </aside>
  );
}

export { Slot, useOnClaw };
