interface Env { DB: D1Database }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function uuid() { return crypto.randomUUID() }

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders() })
}

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = params.id as string
  const body = await request.json() as Record<string, unknown>
  const now = new Date().toISOString()
  
  const existing = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first()
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })
  }
  
  const completed_at = body.status === 'done' && existing.status !== 'done' ? now : (existing.completed_at as string | null)
  
  await env.DB.prepare(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assigned_agent = ?, updated_at = ?, completed_at = ?, tags = ?, output = ? WHERE id = ?'
  ).bind(
    body.title ?? existing.title,
    body.description ?? existing.description,
    body.status ?? existing.status,
    body.priority ?? existing.priority,
    body.assigned_agent ?? existing.assigned_agent,
    now,
    completed_at,
    body.tags ? JSON.stringify(body.tags) : (existing.tags as string),
    body.output ?? existing.output,
    id
  ).run()
  
  const updated = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first()
  return new Response(JSON.stringify(updated), { headers: corsHeaders() })
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = params.id as string
  
  const existing = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first()
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })
  }
  
  await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run()
  
  await env.DB.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(uuid(), id, 'system', 'deleted', `Deleted task: ${existing.title}`, new Date().toISOString()).run()
  
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders() })
}
