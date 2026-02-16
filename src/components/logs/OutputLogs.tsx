"use client"

import { useState, useEffect, useCallback } from "react"
import { api, DBTask } from "@/lib/api"
import { FileText, Copy, Download, Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react"

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

export default function OutputLogs() {
  const [tasks, setTasks] = useState<DBTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.tasks.list()
      setTasks(data.filter(t => t.output))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

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
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No outputs yet</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="animate-slide-in">
              <button
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                {expanded === task.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className="text-sm font-medium flex-1">{task.title}</span>
                <span className="text-[10px] text-muted-foreground">{formatRelative(task.updated_at)}</span>
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
