"use client"

import { Agent, AgentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Bot, Cpu, AlertTriangle, Coffee } from "lucide-react"

const statusConfig: Record<AgentStatus, { color: string; label: string; dotClass: string }> = {
  idle: { color: "text-muted-foreground", label: "Idle", dotClass: "bg-zinc-500" },
  reasoning: { color: "text-warning", label: "Reasoning", dotClass: "bg-yellow-500 animate-pulse-dot" },
  executing: { color: "text-success", label: "Executing", dotClass: "bg-green-500 animate-pulse-dot" },
  errored: { color: "text-destructive", label: "Errored", dotClass: "bg-red-500" },
}

function AgentCard({ agent }: { agent: Agent }) {
  const status = statusConfig[agent.status]
  const tokenPct = Math.round((agent.tokenUsage / agent.tokenLimit) * 100)

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors animate-slide-in",
      agent.status === "errored" && "border-destructive/30"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent.emoji}</span>
          <div>
            <div className="font-medium text-sm">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.model}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full", status.dotClass)} />
          <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
        </div>
      </div>

      {agent.currentTask && (
        <div className="text-xs text-muted-foreground mb-3 truncate bg-muted/50 rounded px-2 py-1">
          {agent.currentTask}
        </div>
      )}

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Tokens</span>
            <span>{(agent.tokenUsage / 1000).toFixed(0)}k / {(agent.tokenLimit / 1000).toFixed(0)}k</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", tokenPct > 80 ? "bg-warning" : "bg-primary")}
              style={{ width: `${tokenPct}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Sessions: {agent.sessionCount}</span>
          <span>Up: {agent.uptime}</span>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
        <Icon className={cn("w-8 h-8", color)} />
      </div>
    </div>
  )
}

export default function AgentStatusCards({ agents }: { agents: Agent[] }) {
  const active = agents.filter(a => a.status === "executing" || a.status === "reasoning").length
  const idle = agents.filter(a => a.status === "idle").length
  const errored = agents.filter(a => a.status === "errored").length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="Total Agents" value={agents.length} icon={Bot} color="text-primary" />
        <SummaryCard label="Active" value={active} icon={Cpu} color="text-success" />
        <SummaryCard label="Idle" value={idle} icon={Coffee} color="text-muted-foreground" />
        <SummaryCard label="Errored" value={errored} icon={AlertTriangle} color="text-destructive" />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
