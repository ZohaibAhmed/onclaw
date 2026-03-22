"use client";

import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const COLORS = ["#8b5cf6", "#6366f1", "#22c55e", "#f59e0b", "#06b6d4", "#ec4899", "#ef4444", "#14b8a6"];

export function EventAreaChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
        <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#colorEvents)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RetentionLineChart({ data }: { data: { week: string; retention: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} formatter={(v: number) => `${v}%`} />
        <Line type="monotone" dataKey="retention" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BreakdownPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
