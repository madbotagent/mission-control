"use client"

import { CommMessage } from "@/lib/types"
import { cn, formatRelativeTime } from "@/lib/utils"
import { ArrowRight, GitBranch, MessageSquare } from "lucide-react"

const typeConfig = {
  delegation: { icon: ArrowRight, color: "text-blue-400", bg: "bg-blue-400/10" },
  response: { icon: MessageSquare, color: "text-green-400", bg: "bg-green-400/10" },
  spawn: { icon: GitBranch, color: "text-purple-400", bg: "bg-purple-400/10" },
}

export default function CommFeed({ messages }: { messages: CommMessage[] }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Agent Communications
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
        {messages.map(msg => {
          const config = typeConfig[msg.type]
          return (
            <div key={msg.id} className="px-4 py-3 hover:bg-muted/30 transition-colors animate-slide-in">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("w-5 h-5 rounded flex items-center justify-center", config.bg)}>
                  <config.icon className={cn("w-3 h-3", config.color)} />
                </div>
                <span className="text-xs font-medium">{msg.sourceAgent}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">{msg.targetAgent}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{formatRelativeTime(msg.timestamp)}</span>
              </div>
              <p className="text-xs text-muted-foreground pl-7">{msg.summary}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
