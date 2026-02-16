"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TaskColumn, TaskPriority } from "@/lib/types"
import { api, DBTask } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Clock, GripVertical, Plus, X, Trash2, Save, Loader2, Play, Send, Bot, User, CheckCircle2 } from "lucide-react"

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

function formatTime(iso?: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch { return "" }
}

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.split(urlRegex).map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">{part}</a>
    ) : part
  )
}

interface ChatMessage {
  role: string
  content: string
  timestamp?: string
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
        {task.agent_done === 1 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Agent Done
          </span>
        )}
      </div>
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
            <Play className="w-3 h-3" /> Start Session
          </button>
        </div>
      )}
      {task.status === 'in-progress' && task.session_key && !task.agent_done && (
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
      <div className="bg-card border border-border rounded-lg w-full max-w-lg animate-slide-in" onClick={e => e.stopPropagation()}>
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
            <label className="text-xs font-medium text-muted-foreground">Description & Context</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} className="w-full mt-1 px-3 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y" placeholder="Paste URLs, Loom links, detailed instructions..." />
            <p className="text-[10px] text-muted-foreground mt-1">Tip: Paste URLs, Loom links, or detailed instructions. The agent will use this as context.</p>
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

function ChatPanel({ task, onClose, onUpdate, onDelete, onMove }: {
  task: DBTask
  onClose: () => void
  onUpdate: (t: DBTask) => void
  onDelete: (id: string) => void
  onMove: (id: string, status: string) => void
}) {
  const priority = priorityConfig[task.priority]
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [taskPriority, setTaskPriority] = useState(task.priority)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [startingSession, setStartingSession] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const parsedTags: string[] = (() => { try { return JSON.parse(task.tags || '[]') } catch { return [] } })()

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  // Load chat history when panel opens
  useEffect(() => {
    if (!task.session_key) return
    setLoadingHistory(true)
    api.tasks.chatHistory(task.id)
      .then(data => {
        const filtered = (data.messages || []).filter(m => m.role === 'user' || m.role === 'assistant')
        setMessages(filtered)
      })
      .catch(e => console.error('Failed to load chat:', e))
      .finally(() => setLoadingHistory(false))
  }, [task.id, task.session_key])

  const handleSend = async () => {
    const msg = input.trim()
    if (!msg || sending) return

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setSending(true)

    try {
      const data = await api.tasks.chatSend(task.id, msg)
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e) {
      const errMsg: ChatMessage = { role: 'assistant', content: `⚠️ Error: ${e instanceof Error ? e.message : 'Failed to send message'}`, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStartSession = async () => {
    setStartingSession(true)
    try {
      const result = await api.tasks.dispatch(task.id)
      onUpdate(result.task)
    } catch (e) {
      alert(`Failed to start session: ${e instanceof Error ? e.message : e}`)
    } finally {
      setStartingSession(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.tasks.update(task.id, { title, description, priority: taskPriority })
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

  const hasSession = !!task.session_key

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-card border-l border-border w-full max-w-2xl h-full flex flex-col animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={title} onChange={e => setTitle(e.target.value)} className="font-semibold bg-muted border border-border rounded px-2 py-1 w-full text-sm" />
            ) : (
              <h3 className="font-semibold truncate">{task.title}</h3>
            )}
          </div>
          <div className="flex items-center gap-2 ml-3">
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">Edit</button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task metadata */}
        <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as TaskPriority)} className="text-xs px-2 py-1 bg-muted border border-border rounded">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            ) : (
              <span className={cn("text-xs px-2 py-0.5 rounded", priority.class)}>{priority.label}</span>
            )}
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{task.status}</span>
            {task.assigned_agent && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">🤖 {task.assigned_agent}</span>}
            {task.agent_done === 1 && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Agent Done
              </span>
            )}
            {parsedTags.map((tag, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
            ))}
          </div>
          {editing ? (
            <div className="space-y-2">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md resize-y" placeholder="Description..." />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </button>
                <button onClick={() => { setEditing(false); setTitle(task.title); setDescription(task.description || ""); setTaskPriority(task.priority) }} className="px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
              </div>
            </div>
          ) : task.description ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{linkifyText(task.description)}</p>
          ) : null}
        </div>

        {/* Chat area or start session */}
        {hasSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Session started. Send a message to chat with the agent.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-lg px-3.5 py-2.5",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border"
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:overflow-x-auto [&_code]:text-xs [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.timestamp && (
                        <p className={cn("text-[10px] mt-1", msg.role === 'user' ? "text-primary-foreground/60" : "text-muted-foreground")}>{formatTime(msg.timestamp)}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sending && (
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted border border-border rounded-lg px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Codebot is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                  rows={1}
                  className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary max-h-32"
                  style={{ minHeight: '40px' }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No session yet */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h4 className="text-sm font-medium mb-2">No active session</h4>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs">Start a session to begin chatting with the agent about this task.</p>
            {task.status === 'backlog' && (
              <button
                onClick={handleStartSession}
                disabled={startingSession}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {startingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Session
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">Created {formatRelative(task.created_at)}</span>
            {task.status === 'in-progress' && (
              <button
                onClick={() => { onMove(task.id, 'done'); onClose() }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 text-green-600 hover:bg-green-500/10 rounded font-medium"
              >
                <CheckCircle2 className="w-3 h-3" /> Move to Done
              </button>
            )}
          </div>
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

  const syncTasks = useCallback(async () => {
    try {
      const result = await api.tasks.sync()
      if (result.updated.length > 0) {
        const data = await api.tasks.list()
        setTasks(data)
      }
    } catch (e) {
      console.error('Sync failed:', e)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(syncTasks, 15000)
    return () => clearInterval(interval)
  }, [syncTasks])

  const handleDispatch = async (id: string) => {
    try {
      const result = await api.tasks.dispatch(id)
      setTasks(prev => prev.map(t => t.id === id ? result.task : t))
      // Open the task panel after dispatch
      setExpandedTask(result.task)
    } catch (e) {
      console.error('Dispatch failed:', e)
      alert(`Failed to start session: ${e instanceof Error ? e.message : e}`)
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
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as DBTask['status'], updated_at: new Date().toISOString() } : t))
    try {
      await api.tasks.move(id, newStatus)
    } catch {
      fetchTasks()
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
      {expandedTask && <ChatPanel task={expandedTask} onClose={() => setExpandedTask(null)} onUpdate={handleUpdate} onDelete={handleDelete} onMove={handleMove} />}
      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
    </>
  )
}
