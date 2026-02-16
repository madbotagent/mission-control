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

export const onRequestPatch: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = params.id as string
  const body = await request.json() as { status: string; position?: number }
  const now = new Date().toISOString()
  
  const existing = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first()
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })
  }
  
  const oldStatus = existing.status as string
  const newStatus = body.status
  const completed_at = newStatus === 'done' && oldStatus !== 'done' ? now : (existing.completed_at as string | null)
  
  // Get position
  let position = body.position
  if (position === undefined) {
    const maxPos = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE status = ?')
      .bind(newStatus).first<{ max_pos: number }>()
    position = (maxPos?.max_pos ?? -1) + 1
  }
  
  await env.DB.prepare(
    'UPDATE tasks SET status = ?, position = ?, updated_at = ?, completed_at = ? WHERE id = ?'
  ).bind(newStatus, position, now, completed_at, id).run()
  
  // Log the move
  if (oldStatus !== newStatus) {
    await env.DB.prepare(
      'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(uuid(), id, (existing.assigned_agent as string) || 'system', 'moved', `Moved from ${oldStatus} to ${newStatus}`, now).run()
  }
  
  const updated = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first()
  return new Response(JSON.stringify(updated), { headers: corsHeaders() })
}
