"use client"

import { useState } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import AgentStatusCards from "@/components/agents/AgentStatusCards"
import KanbanBoard from "@/components/kanban/KanbanBoard"
import CommFeed from "@/components/dashboard/CommFeed"
import HITLPanel from "@/components/hitl/HITLPanel"
import OutputLogs from "@/components/logs/OutputLogs"
import ActivityTimeline from "@/components/dashboard/ActivityTimeline"
import MetricsChart from "@/components/dashboard/MetricsChart"
import SessionInspector from "@/components/dashboard/SessionInspector"
import AgentConfigPanel from "@/components/dashboard/AgentConfigPanel"
import CommandPalette from "@/components/dashboard/CommandPalette"
import { mockAgents, mockCommMessages, mockMetrics } from "@/lib/mock-data"
import { Search } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"

export default function Home() {
  const [activeView, setActiveView] = useState("overview")

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <CommandPalette onViewChange={setActiveView} />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              {activeView === "overview" && "🚀 Mission Control"}
              {activeView === "kanban" && "📋 Task Board"}
              {activeView === "agents" && "🤖 Agents"}
              {activeView === "hitl" && "🛡️ Approval Queue"}
              {activeView === "comms" && "💬 Agent Communications"}
              {activeView === "logs" && "📄 Output Logs"}
              {activeView === "activity" && "⚡ Activity Timeline"}
              {activeView === "metrics" && "📊 Metrics"}
              {activeView === "settings" && "⚙️ Settings"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "k", metaKey: true })
                window.dispatchEvent(e)
              }}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
            >
              <Search className="w-3 h-3" />
              Search
              <kbd className="text-[10px] border border-border rounded px-1 ml-2">⌘K</kbd>
            </button>
            <ThemeToggle />
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            <span className="text-xs text-muted-foreground">Gateway Connected</span>
          </div>
        </header>

        <div className="p-6">
          {activeView === "overview" && (
            <div className="space-y-6">
              <AgentStatusCards agents={mockAgents} />
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <KanbanBoard />
                </div>
                <div className="space-y-4">
                  <HITLPanel />
                  <CommFeed messages={mockCommMessages.slice(0, 5)} />
                </div>
              </div>
            </div>
          )}

          {activeView === "kanban" && (
            <div className="h-[calc(100vh-8rem)]">
              <KanbanBoard />
            </div>
          )}

          {activeView === "agents" && (
            <div className="space-y-6">
              <AgentStatusCards agents={mockAgents} />
              <SessionInspector agents={mockAgents} />
            </div>
          )}

          {activeView === "hitl" && <HITLPanel />}

          {activeView === "comms" && <CommFeed messages={mockCommMessages} />}

          {activeView === "logs" && <OutputLogs />}

          {activeView === "activity" && <ActivityTimeline />}

          {activeView === "metrics" && <MetricsChart data={mockMetrics} />}

          {activeView === "settings" && <AgentConfigPanel agents={mockAgents} />}
        </div>
      </main>
    </div>
  )
}
