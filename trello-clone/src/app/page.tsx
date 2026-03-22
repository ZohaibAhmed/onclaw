"use client";

import { Shell, Slot } from "@/components/shell";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BoardsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/data?q=boards").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-gray-500">Loading...</div></Shell>;

  const starred = data.boards.filter((b: any) => b.starred);
  const all = data.boards;

  return (
    <Shell>
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {starred.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-4">
                <span className="text-yellow-500">★</span> Starred Boards
              </h2>
              <Slot id="boards-grid">
                <div className="grid grid-cols-4 gap-3">
                  {starred.map((b: any) => (
                    <BoardCard key={b.id} board={b} />
                  ))}
                </div>
              </Slot>
            </div>
          )}

          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-4">
              <span>📋</span> All Boards
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {all.map((b: any) => (
                <BoardCard key={b.id} board={b} />
              ))}
              <button className="h-24 rounded-lg border-2 border-dashed border-gray-800 hover:border-gray-600 flex items-center justify-center text-sm text-gray-500 hover:text-gray-300 transition">
                + Create Board
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function BoardCard({ board }: { board: any }) {
  return (
    <Link
      href={`/board/${board.id}`}
      className="group relative h-24 rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-white/20"
      style={{ background: board.background }}
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
      <div className="relative p-3 h-full flex flex-col justify-between">
        <h3 className="text-sm font-bold text-white drop-shadow">{board.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">{board.cardCount} cards</span>
          {board.starred && <span className="text-yellow-300 text-xs">★</span>}
        </div>
      </div>
    </Link>
  );
}
