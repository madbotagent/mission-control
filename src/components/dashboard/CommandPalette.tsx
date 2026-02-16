"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Zap, KanbanSquare, Users, BarChart3, ShieldCheck, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  label: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
}

export default function CommandPalette({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = [
    { id: "overview", label: "Go to Overview", category: "Navigation", icon: Zap, action: () => onViewChange("overview") },
    { id: "kanban", label: "Go to Task Board", category: "Navigation", icon: KanbanSquare, action: () => onViewChange("kanban") },
    { id: "agents", label: "Go to Agents", category: "Navigation", icon: Users, action: () => onViewChange("agents") },
    { id: "metrics", label: "Go to Metrics", category: "Navigation", icon: BarChart3, action: () => onViewChange("metrics") },
    { id: "hitl", label: "Go to Approvals", category: "Navigation", icon: ShieldCheck, action: () => onViewChange("hitl") },
    { id: "settings", label: "Go to Settings", category: "Navigation", icon: Settings, action: () => onViewChange("settings") },
    { id: "new-task", label: "Create New Task", category: "Actions", icon: Zap, action: () => onViewChange("kanban") },
  ]

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(o => !o)
        setQuery("")
        setSelected(0)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSelect = (cmd: CommandItem) => {
    cmd.action()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={e => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
              if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
              if (e.key === "Enter" && filtered[selected]) handleSelect(filtered[selected])
            }}
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => handleSelect(cmd)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                i === selected ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <cmd.icon className="w-4 h-4" />
              <span>{cmd.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{cmd.category}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No results</div>
          )}
        </div>
      </div>
    </div>
  )
}
