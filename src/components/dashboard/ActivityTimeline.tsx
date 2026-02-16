"use client"

import { ActivityEvent } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"
import { Activity } from "lucide-react"

export default function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Activity Timeline
        </h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        <div className="relative px-4 py-2">
          <div className="absolute left-[29px] top-0 bottom-0 w-px bg-border" />
          {events.map(event => (
            <div key={event.id} className="relative flex gap-3 pb-4 animate-slide-in">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs z-10 flex-shrink-0">
                {event.agentEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">{event.agentName}</span>
                  <span className="text-[10px] text-muted-foreground">{event.action}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">{formatRelativeTime(event.timestamp)}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate font-mono">{event.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
