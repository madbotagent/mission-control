"use client"

import { useState, useEffect, useCallback } from "react"
import { api, DBActivity } from "@/lib/api"
import { Activity, Loader2 } from "lucide-react"

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

const actionEmoji: Record<string, string> = {
  created: "✨",
  moved: "➡️",
  assigned: "👤",
  completed: "✅",
  commented: "💬",
  approved: "👍",
  rejected: "👎",
  deleted: "🗑️",
}

export default function ActivityTimeline() {
  const [events, setEvents] = useState<DBActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.activity.list(50)
      setEvents(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 10000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Activity Timeline
        </h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No activity yet</div>
        ) : (
          <div className="relative px-4 py-2">
            <div className="absolute left-[29px] top-0 bottom-0 w-px bg-border" />
            {events.map(event => (
              <div key={event.id} className="relative flex gap-3 pb-4 animate-slide-in">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs z-10 flex-shrink-0">
                  {actionEmoji[event.action] || "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium">{event.agent || "system"}</span>
                    <span className="text-[10px] text-muted-foreground">{event.action}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">{formatRelative(event.created_at)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate font-mono">{event.details}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
