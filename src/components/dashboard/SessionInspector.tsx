"use client"

import { Agent } from "@/lib/types"
import { SessionMessage } from "@/lib/types"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Terminal, User, Bot } from "lucide-react"
import { useState } from "react"

const mockSessions: Record<string, SessionMessage[]> = {
  coder: [
    { role: "user", content: "Build a Mission Control dashboard for managing the OpenClaw agent swarm.", timestamp: new Date(Date.now() - 86400000) },
    { role: "assistant", content: "I'll build the Mission Control dashboard. Let me start by initializing the Next.js project.\n\n```bash\nnpx create-next-app@latest mission-control --typescript --tailwind\n```", timestamp: new Date(Date.now() - 86300000) },
    { role: "assistant", content: "Project initialized. Installing dependencies: recharts, lucide-react, @dnd-kit...", timestamp: new Date(Date.now() - 86000000) },
    { role: "assistant", content: "Building dashboard components. Starting with AgentStatusCards...", timestamp: new Date(Date.now() - 85000000) },
  ],
  researcher: [
    { role: "user", content: "Analyze the top 10 AI agent platform competitors and their pricing.", timestamp: new Date(Date.now() - 43200000) },
    { role: "assistant", content: "I'll research competitor pricing. Let me start by identifying the top platforms...", timestamp: new Date(Date.now() - 43100000) },
  ],
}

export default function SessionInspector({ agents }: { agents: Agent[] }) {
  const [selectedAgent, setSelectedAgent] = useState<string>("coder")
  const messages = mockSessions[selectedAgent] || []

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          Session Inspector
        </h3>
        <select
          value={selectedAgent}
          onChange={e => setSelectedAgent(e.target.value)}
          className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
        >
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
          ))}
        </select>
      </div>
      <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">No active session</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-2 animate-slide-in", msg.role === "user" ? "justify-end" : "")}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-lg p-3 text-xs",
                msg.role === "user" ? "bg-primary/15 text-foreground" : "bg-muted/50 text-foreground"
              )}>
                <pre className="whitespace-pre-wrap font-mono">{msg.content}</pre>
                <div className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(msg.timestamp)}</div>
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
