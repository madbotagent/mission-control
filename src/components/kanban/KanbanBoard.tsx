"use client"

import { useState, useEffect, useCallback } from "react"
import { TaskColumn, TaskPriority } from "@/lib/types"
import { api, DBTask } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Clock, GripVertical, Plus, X, Trash2, Save, Loader2, Play, ScrollText } from "lucide-react"

const columns: { id: TaskColumn; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "text-muted-foreground" },
  { id: "in-progress", label: "In Progress", color: "text-[#083b9e] dark:text-[#2d6de0]" },
  { id: "pending-approval", label: "Pending Approval", color: "text-[#512feb] dark:text-[#7c5af6]" },
  { id: "done", label: "Done", color: "text-[#22a84d] dark:text-[#67FF01]" },
]

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  low: { label: "Low", class: "bg-[#786565]/20 text-[#786565]" },
  medium: { label: "Med", class: "bg-[#083b9e]/15 text-[#083b9e] dark:bg-[#2d6de0]/20 dark:text-[#5b9bff]" },
  high: { label: "High", class: "bg-[#512feb]/15 text-[#512feb] dark:bg-[#7c5af6]/20 dark:text-[#a78bfa]" },
  urgent: { label: "Urgent", class: "bg-[#f86a07]/15 text-[#f86a07]" },
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

function TaskCard({ task, onExpand, onMove, onDispatch }: { task: DBTask; onExpand: (t: DBTask) => void; onMove: (id: string, status: string) => void; onDispatch?: (id: string) => void }) {
  const priority = priorityConfig[task.priority]
  const colIdx = columns.findIndex(c => c.id === task.status)

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
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priority.class)}>{priority.label}</span>
        {task.assigned_agent && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{task.assigned_agent}</span>
        )}
      </div>
      {/* Move buttons */}
      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {colIdx > 0 && (
          <button
            onClick={e => { e.stopPropagation(); onMove(task.id, columns[colIdx - 1].id) }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent"
          >← {columns[colIdx - 1].label}</button>
        )}
        {colIdx < columns.length - 1 && (
          <button
            onClick={e => { e.stopPropagation(); onMove(task.id, columns[colIdx + 1].id) }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent"
          >{columns[colIdx + 1].label} →</button>
        )}
      </div>
      {task.status === 'backlog' && onDispatch && (
        <div className="mt-2">
          <button
            onClick={e => { e.stopPropagation(); onDispatch(task.id) }}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
          >
            <Play className="w-3 h-3" /> Dispatch
          </button>
        </div>
      )}
      {task.status === 'in-progress' && task.session_key && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-primary">
          <Loader2 className="w-3 h-3 animate-spin" /> Agent working...
        </div>
      )}
      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        {formatRelative(task.updated_at)}
      </div>
    </div>
  )
}

function AddTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: DBTask) => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [agent, setAgent] = useState("")
  const [tags, setTags] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const task = await api.tasks.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_agent: agent.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map(t => t.trim()) : undefined,
      })
      onCreated(task)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">New Task</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Task title..." />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full mt-1 px-3 py-2 text-sm bg-muted border border-border rounded-md">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Assign Agent</label>
              <input value={agent} onChange={e => setAgent(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. coder" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tags (comma separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="frontend, bug-fix" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={submit} disabled={!title.trim() || saving} className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Create Task
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskDetail({ task, onClose, onUpdate, onDelete }: { task: DBTask; onClose: () => void; onUpdate: (t: DBTask) => void; onDelete: (id: string) => void }) {
  const priority = priorityConfig[task.priority]
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [taskPriority, setTaskPriority] = useState(task.priority)
  const [agent, setAgent] = useState(task.assigned_agent || "")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'session'>('details')
  const [sessionLog, setSessionLog] = useState<Array<{ role: string; content: string }> | null>(null)
  const [loadingSession, setLoadingSession] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.tasks.update(task.id, {
        title, description, priority: taskPriority, assigned_agent: agent || undefined,
      })
      onUpdate(updated)
      setEditing(false)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return
    setDeleting(true)
    try {
      await api.tasks.delete(task.id)
      onDelete(task.id)
      onClose()
    } catch (e) { console.error(e) }
    finally { setDeleting(false) }
  }

  const loadSession = async () => {
    if (sessionLog || !task.session_key) return
    setLoadingSession(true)
    try {
      const data = await api.tasks.session(task.id)
      setSessionLog(data.messages)
    } catch { setSessionLog([]) }
    finally { setLoadingSession(false) }
  }

  const parsedTags: string[] = (() => { try { return JSON.parse(task.tags || '[]') } catch { return [] } })()

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          {editing ? (
            <input value={title} onChange={e => setTitle(e.target.value)} className="font-semibold bg-muted border border-border rounded px-2 py-1 flex-1 mr-2 text-sm" />
          ) : (
            <h3 className="font-semibold">{task.title}</h3>
          )}
          <div className="flex items-center gap-1">
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground">Edit</button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>
        {task.session_key && (
          <div className="flex border-b border-border">
            <button onClick={() => setActiveTab('details')} className={cn("px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors", activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>Details</button>
            <button onClick={() => { setActiveTab('session'); loadSession() }} className={cn("flex items-center gap-1 px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors", activeTab === 'session' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}><ScrollText className="w-3 h-3" /> Session Log</button>
          </div>
        )}
        {activeTab === 'session' && task.session_key ? (
          <div className="p-4 max-h-96 overflow-y-auto">
            {loadingSession ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : sessionLog && sessionLog.length > 0 ? (
              <div className="space-y-3">
                {sessionLog.map((msg, i) => (
                  <div key={i} className={cn("text-xs rounded p-3", msg.role === 'assistant' ? 'bg-primary/5 border border-primary/10' : 'bg-muted')}>
                    <div className="font-medium text-muted-foreground mb-1 uppercase text-[10px]">{msg.role}</div>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{typeof msg.content === 'string' ? msg.content.slice(0, 3000) : JSON.stringify(msg.content).slice(0, 3000)}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No session messages found</p>
            )}
          </div>
        ) : (
        <div className="p-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {editing ? (
              <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as TaskPriority)} className="text-xs px-2 py-1 bg-muted border border-border rounded">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            ) : (
              <span className={cn("text-xs px-2 py-0.5 rounded", priority.class)}>{priority.label}</span>
            )}
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{task.status}</span>
            {editing ? (
              <input value={agent} onChange={e => setAgent(e.target.value)} placeholder="Agent" className="text-xs px-2 py-1 bg-muted border border-border rounded w-24" />
            ) : task.assigned_agent ? (
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{task.assigned_agent}</span>
            ) : null}
          </div>
          {editing ? (
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md resize-none" />
          ) : (
            <p className="text-sm text-muted-foreground">{task.description || "No description"}</p>
          )}
          {parsedTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {parsedTags.map((tag, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
              ))}
            </div>
          )}
          {task.output && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Output</h4>
              <pre className="text-xs font-mono bg-muted/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">{task.output}</pre>
            </div>
          )}
          {editing && (
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
            </div>
          )}
        </div>
        )}
        <div className="p-4 border-t border-border flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">Created {formatRelative(task.created_at)}</span>
          <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded">
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<DBTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTask, setExpandedTask] = useState<DBTask | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [dispatching, setDispatching] = useState<string | null>(null)

  const syncTasks = useCallback(async () => {
    try {
      const result = await api.tasks.sync()
      if (result.updated.length > 0) {
        // Refresh tasks if any were updated
        const data = await api.tasks.list()
        setTasks(data)
      }
    } catch (e) {
      console.error('Sync failed:', e)
    }
  }, [])

  // Auto-sync every 15 seconds
  useEffect(() => {
    const interval = setInterval(syncTasks, 15000)
    return () => clearInterval(interval)
  }, [syncTasks])

  const handleDispatch = async (id: string) => {
    setDispatching(id)
    try {
      const result = await api.tasks.dispatch(id)
      setTasks(prev => prev.map(t => t.id === id ? result.task : t))
    } catch (e) {
      console.error('Dispatch failed:', e)
      alert(`Dispatch failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setDispatching(null)
    }
  }

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.tasks.list()
      setTasks(data)
    } catch (e) {
      console.error('Failed to fetch tasks:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleMove = async (id: string, newStatus: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as DBTask['status'], updated_at: new Date().toISOString() } : t))
    try {
      await api.tasks.move(id, newStatus)
    } catch {
      fetchTasks() // revert on error
    }
  }

  const handleCreated = (task: DBTask) => {
    setTasks(prev => [...prev, task])
  }

  const handleUpdate = (updated: DBTask) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setExpandedTask(updated)
  }

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4 h-full">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn("text-sm font-semibold", col.color)}>{col.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full w-5 h-5 flex items-center justify-center">{colTasks.length}</span>
                </div>
                {col.id === "backlog" && (
                  <button onClick={() => setShowAddModal(true)} className="text-muted-foreground hover:text-foreground">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onExpand={setExpandedTask} onMove={handleMove} onDispatch={col.id === 'backlog' ? handleDispatch : undefined} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {expandedTask && <TaskDetail task={expandedTask} onClose={() => setExpandedTask(null)} onUpdate={handleUpdate} onDelete={handleDelete} />}
      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
    </>
  )
}
