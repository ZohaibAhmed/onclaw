"use client";

import { Shell, Slot } from "@/components/shell";
import { STATUS_COLORS, timeAgo } from "@/lib/format";
import { useEffect, useState } from "react";

export default function ContactsPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/data?q=contacts&page=${page}`).then((r) => r.json()).then(setData);
  }, [page]);

  if (!data) return <Shell><div className="flex items-center justify-center h-full text-slate-500">Loading...</div></Shell>;

  const filtered = search
    ? data.contacts.filter((c: any) =>
        `${c.firstName} ${c.lastName} ${c.email} ${c.company}`.toLowerCase().includes(search.toLowerCase())
      )
    : data.contacts;

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
            <p className="text-sm text-slate-500 mt-1">{data.total} total contacts</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">
            + Add Contact
          </button>
        </div>

        <Slot id="contacts-summary">
          <div className="grid grid-cols-3 gap-4">
            {(["lead", "customer", "churned"] as const).map((status) => {
              const count = data.contacts.filter((c: any) => c.status === status).length;
              return (
                <div key={status} className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                  <div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-slate-500 capitalize">{status}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Slot>

        {/* Search */}
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        {/* Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.company}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
                      style={{
                        background: `${STATUS_COLORS[c.status]}15`,
                        color: STATUS_COLORS[c.status],
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 capitalize">{c.source}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.ownerName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{timeAgo(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {data.page} of {data.pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
              className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
