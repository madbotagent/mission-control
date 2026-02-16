const BASE = '/api'

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

// Types matching DB schema
export interface DBTask {
  id: string
  title: string
  description: string | null
  status: 'backlog' | 'in-progress' | 'pending-approval' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_agent: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  position: number
  tags: string // JSON array
  output: string | null
  run_id: string | null
  session_key: string | null
}

export interface DBActivity {
  id: string
  task_id: string | null
  agent: string | null
  action: string
  details: string | null
  created_at: string
}

export interface DBHitl {
  id: string
  task_id: string | null
  agent: string | null
  request_type: string
  context: string | null
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  response: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  resolved_at: string | null
}

// Tasks
export const api = {
  tasks: {
    list: (status?: string) => request<DBTask[]>(`/tasks${status ? `?status=${status}` : ''}`),
    create: (data: { title: string; description?: string; status?: string; priority?: string; assigned_agent?: string; tags?: string[] }) =>
      request<DBTask>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ title: string; description: string; status: string; priority: string; assigned_agent: string; tags: string[]; output: string }>) =>
      request<DBTask>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
    move: (id: string, status: string, position?: number) =>
      request<DBTask>(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify({ status, position }) }),
    dispatch: (id: string, agentId?: string) =>
      request<{ task: DBTask; session: { childSessionKey: string; runId: string } }>(`/tasks/${id}/dispatch`, { method: 'POST', body: JSON.stringify({ agentId }) }),
    sync: () =>
      request<{ synced: number; updated: string[] }>('/tasks/sync', { method: 'POST' }),
    session: (id: string) =>
      request<{ sessionKey: string; messages: Array<{ role: string; content: string; timestamp?: string }> }>(`/tasks/${id}/session`),
  },
  agents: {
    list: () => request<Array<Record<string, unknown>>>('/agents'),
  },
  activity: {
    list: (limit?: number, taskId?: string) => {
      const params = new URLSearchParams()
      if (limit) params.set('limit', String(limit))
      if (taskId) params.set('task_id', taskId)
      const qs = params.toString()
      return request<DBActivity[]>(`/activity${qs ? `?${qs}` : ''}`)
    },
    create: (data: { task_id?: string; agent?: string; action: string; details?: string }) =>
      request<{ id: string }>('/activity', { method: 'POST', body: JSON.stringify(data) }),
  },
  hitl: {
    list: (status?: string) => request<DBHitl[]>(`/hitl${status ? `?status=${status}` : ''}`),
    create: (data: { task_id?: string; agent?: string; request_type: string; context?: string; priority?: string }) =>
      request<{ id: string }>('/hitl', { method: 'POST', body: JSON.stringify(data) }),
    respond: (id: string, status: string, response?: string) =>
      request<DBHitl>(`/hitl/${id}`, { method: 'PUT', body: JSON.stringify({ status, response }) }),
  },
}
