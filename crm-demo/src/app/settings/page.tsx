"use client";

import { Shell } from "@/components/shell";
import { ClawKitAdmin } from "clawkit";

export default function SettingsPage() {
  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-slate-500 mt-1">App configuration & ClawKit analytics</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold">General</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">Company Name</label>
                <input
                  type="text"
                  defaultValue="Acme Corp"
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Default Currency</label>
                <select className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Fiscal Year Start</label>
                <select className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option>January</option>
                  <option>April</option>
                  <option>July</option>
                </select>
              </div>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">
              Save Changes
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h3 className="text-sm font-semibold mb-4">ClawKit Customization Analytics</h3>
            <ClawKitAdmin />
          </div>
        </div>
      </div>
    </Shell>
  );
}
