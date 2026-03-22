"use client";

import { Shell, Slot } from "@/components/shell";
import { LABEL_COLORS, LABEL_BG, timeAgo } from "@/lib/colors";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [cardDetail, setCardDetail] = useState<any>(null);
  const [draggedCard, setDraggedCard] = useState<number | null>(null);
  const [dragOverList, setDragOverList] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/data?q=board&id=${params.id}`).then(r => r.json()).then(setData);
  }, [params.id]);

  useEffect(() => {
    if (selectedCard) {
      fetch(`/api/data?q=card&id=${selectedCard}`).then(r => r.json()).then(setCardDetail);
    } else {
      setCardDetail(null);
    }
  }, [selectedCard]);

  if (!data) return (
    <Shell>
      <div className="flex items-center justify-center h-full text-gray-500">Loading board...</div>
    </Shell>
  );

  const { board, lists, cards: allCards, members } = data;
  const cardsByList = (listId: number) => allCards.filter((c: any) => c.list_id === listId);

  const handleDragStart = (cardId: number) => setDraggedCard(cardId);
  const handleDragOver = (e: React.DragEvent, listId: number) => {
    e.preventDefault();
    setDragOverList(listId);
  };
  const handleDrop = (listId: number) => {
    if (draggedCard) {
      // Optimistic update
      const card = allCards.find((c: any) => c.id === draggedCard);
      if (card) card.list_id = listId;
      setData({ ...data });
    }
    setDraggedCard(null);
    setDragOverList(null);
  };

  return (
    <Shell boardBg={board.background}>
      {/* Board Header */}
      <Slot id="board-header">
        <div className="flex items-center gap-3 px-4 py-3 bg-black/30 backdrop-blur-sm">
          <button onClick={() => router.push("/")} className="text-white/70 hover:text-white text-sm">←</button>
          <h1 className="text-lg font-bold text-white">{board.name}</h1>
          <button className={`text-lg ${board.starred ? "text-yellow-400" : "text-white/40 hover:text-yellow-400"} transition`}>
            {board.starred ? "★" : "☆"}
          </button>
          <div className="flex-1" />
          <div className="flex -space-x-1.5">
            {members.slice(0, 5).map((m: any) => (
              <div key={m.id} className="w-7 h-7 rounded-full border-2 border-black/40 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: m.color }}>
                {m.avatar}
              </div>
            ))}
          </div>
          <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium text-white backdrop-blur transition">
            🔍 Filter
          </button>
        </div>
      </Slot>

      {/* Board Content - Kanban */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 h-full items-start">
          {lists.map((list: any) => {
            const listCards = cardsByList(list.id);
            const isDragOver = dragOverList === list.id;
            return (
              <div
                key={list.id}
                className={`w-72 flex-shrink-0 flex flex-col max-h-full rounded-xl transition ${
                  isDragOver ? "ring-2 ring-blue-400/50" : ""
                }`}
                style={{ background: "rgba(16,18,27,0.85)", backdropFilter: "blur(8px)" }}
                onDragOver={(e) => handleDragOver(e, list.id)}
                onDrop={() => handleDrop(list.id)}
              >
                {/* List header */}
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <h3 className="text-sm font-semibold text-gray-200">{list.name}</h3>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{listCards.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-auto px-2 pb-2 space-y-1.5">
                  {listCards.map((card: any) => (
                    <Slot key={card.id} id="board-card-item">
                      <div
                        draggable
                        onDragStart={() => handleDragStart(card.id)}
                        onClick={() => setSelectedCard(card.id)}
                        className={`group bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer transition-all hover:shadow-lg ${
                          draggedCard === card.id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Cover */}
                        {card.cover_color && (
                          <div className="h-8 rounded-t-lg" style={{ background: card.cover_color }} />
                        )}

                        <div className="p-2.5">
                          {/* Labels */}
                          {card.labels?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {card.labels.map((l: any) => (
                                <span
                                  key={l.id}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                  style={{
                                    background: LABEL_BG[l.color] || LABEL_BG.blue,
                                    color: LABEL_COLORS[l.color] || LABEL_COLORS.blue,
                                  }}
                                >
                                  {l.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Title */}
                          <p className="text-sm text-gray-200 leading-snug">{card.title}</p>

                          {/* Badges */}
                          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                            {card.due_date && (
                              <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                                card.completed ? "bg-green-500/20 text-green-400" :
                                new Date(card.due_date) < new Date() ? "bg-red-500/20 text-red-400" :
                                "bg-gray-800 text-gray-400"
                              }`}>
                                🕐 {new Date(card.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            {card.comment_count > 0 && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">💬 {card.comment_count}</span>
                            )}
                            {card.checklist_total > 0 && (
                              <span className={`text-[10px] flex items-center gap-0.5 ${
                                card.checklist_done === card.checklist_total ? "text-green-400" : "text-gray-500"
                              }`}>
                                ☑ {card.checklist_done}/{card.checklist_total}
                              </span>
                            )}
                            {card.description && (
                              <span className="text-[10px] text-gray-600">📝</span>
                            )}

                            <div className="flex-1" />

                            {/* Assignees */}
                            {card.members?.length > 0 && (
                              <div className="flex -space-x-1">
                                {card.members.slice(0, 3).map((m: any) => (
                                  <div
                                    key={m.id}
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-gray-900"
                                    style={{ background: m.color }}
                                    title={m.name}
                                  >
                                    {m.avatar}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Slot>
                  ))}
                </div>

                {/* Add card button */}
                <button className="mx-2 mb-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition text-left">
                  + Add a card
                </button>
              </div>
            );
          })}

          {/* Add list */}
          <button className="w-72 flex-shrink-0 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white/70 font-medium transition backdrop-blur text-left">
            + Add another list
          </button>
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && cardDetail && (
        <CardDetailModal
          data={cardDetail}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </Shell>
  );
}

function CardDetailModal({ data, onClose }: { data: any; onClose: () => void }) {
  const { card, listName, checklists, checklistItems, comments } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-full overflow-auto bg-gray-900 rounded-xl border border-gray-800 shadow-2xl">
        {/* Cover */}
        {card.cover_color && (
          <div className="h-24 rounded-t-xl" style={{ background: card.cover_color }} />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition"
        >
          ✕
        </button>

        <div className="flex gap-4 p-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <Slot id="card-detail-header">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-100">{card.title}</h2>
                <p className="text-xs text-gray-500 mt-1">in list <span className="text-gray-400 font-medium">{listName}</span></p>

                {/* Labels */}
                {card.labels?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {card.labels.map((l: any) => (
                      <span
                        key={l.id}
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{
                          background: LABEL_BG[l.color] || LABEL_BG.blue,
                          color: LABEL_COLORS[l.color] || LABEL_COLORS.blue,
                        }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Slot>

            <Slot id="card-detail-body">
              {/* Members */}
              {card.members?.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Members</h4>
                  <div className="flex gap-1.5">
                    {card.members.map((m: any) => (
                      <div key={m.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m.color }} title={m.name}>
                        {m.avatar}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due date */}
              {card.due_date && (
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Due Date</h4>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
                    card.completed ? "bg-green-500/20 text-green-400" :
                    new Date(card.due_date) < new Date() ? "bg-red-500/20 text-red-400" :
                    "bg-gray-800 text-gray-300"
                  }`}>
                    🕐 {new Date(card.due_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {card.completed && " ✓"}
                  </span>
                </div>
              )}

              {/* Description */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                {card.description ? (
                  <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 rounded-lg p-3">{card.description}</p>
                ) : (
                  <p className="text-sm text-gray-600 italic">No description yet...</p>
                )}
              </div>

              {/* Checklists */}
              {checklists.map((cl: any) => {
                const items = checklistItems.filter((i: any) => i.checklistId === cl.id);
                const done = items.filter((i: any) => i.completed).length;
                const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
                return (
                  <div key={cl.id} className="mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">☑ {cl.title}</h4>
                      <span className="text-[10px] text-gray-500">{done}/{items.length}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full mb-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="space-y-1">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-800/50">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            item.completed ? "bg-blue-500 border-blue-500 text-white" : "border-gray-600"
                          }`}>
                            {item.completed && "✓"}
                          </div>
                          <span className={`text-sm ${item.completed ? "text-gray-500 line-through" : "text-gray-300"}`}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Comments */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity</h4>
                <div className="flex gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">ZA</div>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-3">
                  {comments.map((c: any) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: c.author_color }}>
                        {c.author_avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-gray-300">{c.author_name}</span>
                          <span className="text-[10px] text-gray-600">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5 bg-gray-800/50 rounded-lg px-3 py-2">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Slot>
          </div>

          {/* Sidebar */}
          <Slot id="card-detail-sidebar">
            <div className="w-40 flex-shrink-0 space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Add to card</p>
              {["👥 Members", "🏷️ Labels", "☑ Checklist", "📅 Dates", "📎 Attachment", "🖼️ Cover"].map(item => (
                <button key={item} className="w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 text-left transition">
                  {item}
                </button>
              ))}
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Actions</p>
              {["↔ Move", "📋 Copy", "📁 Archive"].map(item => (
                <button key={item} className="w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 text-left transition">
                  {item}
                </button>
              ))}
            </div>
          </Slot>
        </div>
      </div>
    </div>
  );
}
