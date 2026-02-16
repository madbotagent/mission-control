"use client"

import { useState } from "react"
import { Task } from "@/lib/types"
import { cn, formatRelativeTime } from "@/lib/utils"
import { FileText, Copy, Download, Check, ChevronDown, ChevronRight } from "lucide-react"

export default function OutputLogs({ tasks }: { tasks: Task[] }) {
  const completedTasks = tasks.filter(t => t.output)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Output Logs
        </h3>
      </div>
      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {completedTasks.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No outputs yet</div>
        ) : (
          completedTasks.map(task => (
            <div key={task.id} className="animate-slide-in">
              <button
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                {expanded === task.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm font-medium flex-1">{task.title}</span>
                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(task.updatedAt)}</span>
              </button>
              {expanded === task.id && task.output && (
                <div className="px-4 pb-3">
                  <div className="relative">
                    <pre className="text-xs font-mono bg-muted/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">{task.output}</pre>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => handleCopy(task.id, task.output!)}
                        className="p-1 rounded bg-muted hover:bg-accent transition-colors"
                      >
                        {copied === task.id ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                      <button className="p-1 rounded bg-muted hover:bg-accent transition-colors">
                        <Download className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
