"use client"

import { useState } from "react"
import { Task, TaskColumn, TaskPriority } from "@/lib/types"
import { cn, formatRelativeTime } from "@/lib/utils"
import { Clock, GripVertical, Plus, X, ChevronDown, ChevronUp } from "lucide-react"

const columns: { id: TaskColumn; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "text-zinc-400" },
  { id: "in-progress", label: "In Progress", color: "text-blue-400" },
  { id: "pending-approval", label: "Pending Approval", color: "text-yellow-400" },
  { id: "done", label: "Done", color: "text-green-400" },
]

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  low: { label: "Low", class: "bg-zinc-700 text-zinc-300" },
  medium: { label: "Med", class: "bg-blue-900/50 text-blue-300" },
  high: { label: "High", class: "bg-orange-900/50 text-orange-300" },
  urgent: { label: "Urgent", class: "bg-red-900/50 text-red-300" },
}

function TaskCard({ task, onExpand }: { task: Task; onExpand: (task: Task) => void }) {
  const priority = priorityConfig[task.priority]
  return (
    <div
      onClick={() => onExpand(task)}
      className="bg-card border border-border rounded-md p-3 cursor-pointer hover:border-primary/30 transition-all group animate-slide-in"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priority.class)}>
          {priority.label}
        </span>
        {task.assignedAgent && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {task.assignedAgent}
          </span>
        )}
      </div>
      {task.progress > 0 && task.progress < 100 && (
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }} />
        </div>
      )}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        {formatRelativeTime(task.updatedAt)}
      </div>
    </div>
  )
}

function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const priority = priorityConfig[task.priority]
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">{task.title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <span className={cn("text-xs px-2 py-0.5 rounded", priority.class)}>{priority.label}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{task.column}</span>
            {task.assignedAgent && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{task.assignedAgent}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          {task.progress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span><span>{task.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          )}
          {task.logs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Activity Log</h4>
              <div className="space-y-1 bg-muted/30 rounded p-2">
                {task.logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground">→ {log}</div>
                ))}
              </div>
            </div>
          )}
          {task.output && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Output</h4>
              <pre className="text-xs font-mono bg-muted/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">{task.output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [expandedTask, setExpandedTask] = useState<Task | null>(null)

  return (
    <>
      <div className="grid grid-cols-4 gap-4 h-full">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.column === col.id)
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn("text-sm font-semibold", col.color)}>{col.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full w-5 h-5 flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>
                {col.id === "backlog" && (
                  <button className="text-muted-foreground hover:text-foreground">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onExpand={setExpandedTask} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {expandedTask && <TaskDetail task={expandedTask} onClose={() => setExpandedTask(null)} />}
    </>
  )
}
