"use client"

import { useState } from "react"
import { HITLItem, TaskPriority } from "@/lib/types"
import { cn, formatRelativeTime } from "@/lib/utils"
import { ShieldCheck, Check, X, Pencil, AlertTriangle } from "lucide-react"

const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
const priorityStyle: Record<TaskPriority, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-500",
  low: "border-l-zinc-500",
}

export default function HITLPanel({ items: initialItems }: { items: HITLItem[] }) {
  const [items, setItems] = useState(initialItems)
  const pending = items.filter(i => i.status === "pending").sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const updateStatus = (id: string, status: "approved" | "rejected") => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Human Approval Queue
        </h3>
        {pending.length > 0 && (
          <span className="bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>
      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-muted" />
            All clear — no pending approvals
          </div>
        ) : (
          pending.map(item => (
            <div key={item.id} className={cn("p-4 border-l-2 animate-slide-in", priorityStyle[item.priority])}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-medium">{item.agentName}</div>
                  <div className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</div>
                </div>
                {item.priority === "urgent" && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>
              <div className="mb-2">
                <div className="text-sm font-medium text-foreground mb-1">{item.action}</div>
                <div className="text-xs text-muted-foreground mb-1">{item.reason}</div>
                <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mt-1 font-mono">{item.context}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(item.id, "approved")}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-success/15 text-success rounded hover:bg-success/25 transition-colors"
                >
                  <Check className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => updateStatus(item.id, "rejected")}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-destructive/15 text-destructive rounded hover:bg-destructive/25 transition-colors"
                >
                  <X className="w-3 h-3" /> Reject
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded hover:bg-accent transition-colors">
                  <Pencil className="w-3 h-3" /> Modify
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
