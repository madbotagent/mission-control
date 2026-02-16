interface Env { DB: D1Database }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function uuid() {
  return crypto.randomUUID()
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders() })
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  
  let result
  if (status) {
    result = await env.DB.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY position ASC, created_at DESC').bind(status).all()
  } else {
    result = await env.DB.prepare('SELECT * FROM tasks ORDER BY position ASC, created_at DESC').all()
  }
  
  return new Response(JSON.stringify(result.results), { headers: corsHeaders() })
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await request.json() as Record<string, unknown>
  const id = uuid()
  const now = new Date().toISOString()
  
  // Get max position for the status column
  const maxPos = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE status = ?')
    .bind(body.status || 'backlog').first<{ max_pos: number }>()
  
  const task = {
    id,
    title: body.title,
    description: body.description || null,
    status: body.status || 'backlog',
    priority: body.priority || 'medium',
    assigned_agent: body.assigned_agent || null,
    created_at: now,
    updated_at: now,
    completed_at: null,
    position: (maxPos?.max_pos ?? -1) + 1,
    tags: JSON.stringify(body.tags || []),
    output: body.output || null,
  }
  
  await env.DB.prepare(
    'INSERT INTO tasks (id, title, description, status, priority, assigned_agent, created_at, updated_at, completed_at, position, tags, output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(task.id, task.title, task.description, task.status, task.priority, task.assigned_agent, task.created_at, task.updated_at, task.completed_at, task.position, task.tags, task.output).run()
  
  // Log activity
  await env.DB.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(uuid(), id, body.assigned_agent || 'system', 'created', `Created task: ${task.title}`, now).run()
  
  return new Response(JSON.stringify(task), { status: 201, headers: corsHeaders() })
}
