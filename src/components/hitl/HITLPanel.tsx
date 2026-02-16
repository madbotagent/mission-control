"use client"

import { useState, useEffect, useCallback } from "react"
import { TaskPriority } from "@/lib/types"
import { api, DBHitl } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ShieldCheck, Check, X, Pencil, AlertTriangle, Loader2 } from "lucide-react"

const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
const priorityStyle: Record<string, string> = {
  urgent: "border-l-[#f86a07]",
  high: "border-l-[#512feb]",
  medium: "border-l-[#083b9e]",
  low: "border-l-[#786565]",
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

export default function HITLPanel() {
  const [items, setItems] = useState<DBHitl[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.hitl.list()
      setItems(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchItems()
    const interval = setInterval(fetchItems, 15000)
    return () => clearInterval(interval)
  }, [fetchItems])

  const pending = items.filter(i => i.status === "pending").sort((a, b) => 
    (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
  )

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    // Optimistic
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    try {
      await api.hitl.respond(id, status)
    } catch { fetchItems() }
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
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-muted" />
            All clear — no pending approvals
          </div>
        ) : (
          pending.map(item => (
            <div key={item.id} className={cn("p-4 border-l-2 animate-slide-in", priorityStyle[item.priority] || "border-l-zinc-500")}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-medium">{item.agent || "Unknown Agent"}</div>
                  <div className="text-xs text-muted-foreground">{formatRelative(item.created_at)}</div>
                </div>
                {item.priority === "urgent" && (
                  <span className="flex items-center gap-1 text-[10px] text-[#f86a07] bg-[#f86a07]/10 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>
              <div className="mb-2">
                <div className="text-sm font-medium text-foreground mb-1">{item.request_type}</div>
                {item.context && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mt-1 font-mono">{item.context}</div>
                )}
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
