"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, KanbanSquare, Users, ShieldCheck,
  FileText, Activity, Settings, BarChart3,
  MessageSquare, ChevronLeft, Rocket
} from "lucide-react"

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "kanban", label: "Task Board", icon: KanbanSquare },
  { id: "agents", label: "Agents", icon: Users },
  { id: "hitl", label: "Approvals", icon: ShieldCheck, badge: 3 },
  { id: "comms", label: "Agent Comms", icon: MessageSquare },
  { id: "logs", label: "Output Logs", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "h-screen bg-card border-r border-border flex flex-col transition-all duration-200",
      collapsed ? "w-16" : "w-56"
    )}>
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Rocket className="w-6 h-6 text-primary flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">Mission Control</span>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative",
              activeView === item.id
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {item.badge && (
              <span className={cn(
                "bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center",
                collapsed ? "absolute -top-1 -right-1 w-4 h-4" : "ml-auto w-5 h-5"
              )}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform mx-auto", collapsed && "rotate-180")} />
      </button>
    </aside>
  )
}
