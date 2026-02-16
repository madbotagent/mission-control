"use client"

import { MetricsData } from "@/lib/types"
import { BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts"
import { useTheme } from "@/components/ThemeProvider"

const chartColors = {
  light: { grid: "#e2e8f0", tick: "#64748b", tooltipBg: "#ffffff", tooltipBorder: "#e2e8f0", label: "#09090b", item: "#64748b" },
  dark: { grid: "#27272a", tick: "#a1a1aa", tooltipBg: "#18181b", tooltipBorder: "#27272a", label: "#fafafa", item: "#a1a1aa" },
}

export default function MetricsChart({ data }: { data: MetricsData[] }) {
  const { theme } = useTheme()
  const c = chartColors[theme]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Tokens (7d)</div>
          <div className="text-2xl font-bold">{(data.reduce((s, d) => s + d.tokens, 0) / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Tasks Completed (7d)</div>
          <div className="text-2xl font-bold">{data.reduce((s, d) => s + d.tasks, 0)}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Avg Completion Time</div>
          <div className="text-2xl font-bold">{Math.round(data.reduce((s, d) => s + d.avgTime, 0) / data.length)}m</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Token Usage
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: "6px", fontSize: 12 }}
                labelStyle={{ color: c.label }}
                itemStyle={{ color: c.item }}
              />
              <Bar dataKey="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Tasks & Avg Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: "6px", fontSize: 12 }}
                labelStyle={{ color: c.label }}
                itemStyle={{ color: c.item }}
              />
              <Line type="monotone" dataKey="tasks" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
              <Line type="monotone" dataKey="avgTime" stroke="#eab308" strokeWidth={2} dot={{ fill: "#eab308", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
