export type AgentStatus = "idle" | "reasoning" | "executing" | "errored"

export interface Agent {
  id: string
  name: string
  emoji: string
  status: AgentStatus
  model: string
  workspace: string
  tools: string[]
  uptime: string
  tokenUsage: number
  tokenLimit: number
  sessionCount: number
  currentTask?: string
}

export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskColumn = "backlog" | "in-progress" | "pending-approval" | "done"

export interface Task {
  id: string
  title: string
  description: string
  assignedAgent?: string
  priority: TaskPriority
  column: TaskColumn
  createdAt: Date
  updatedAt: Date
  progress: number
  logs: string[]
  output?: string
}

export interface CommMessage {
  id: string
  sourceAgent: string
  targetAgent: string
  summary: string
  timestamp: Date
  type: "delegation" | "response" | "spawn"
}

export interface HITLItem {
  id: string
  agentId: string
  agentName: string
  action: string
  reason: string
  context: string
  priority: TaskPriority
  timestamp: Date
  status: "pending" | "approved" | "rejected"
}

export interface ActivityEvent {
  id: string
  agentId: string
  agentName: string
  agentEmoji: string
  action: string
  detail: string
  timestamp: Date
}

export interface SessionMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export interface MetricsData {
  date: string
  tokens: number
  tasks: number
  avgTime: number
}
