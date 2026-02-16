interface Env { DB: D1Database }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders() })
}

export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = params.id as string
  const body = await request.json() as { status: string; response?: string }
  const now = new Date().toISOString()
  
  const existing = await env.DB.prepare('SELECT * FROM hitl_requests WHERE id = ?').bind(id).first()
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders() })
  }
  
  await env.DB.prepare(
    'UPDATE hitl_requests SET status = ?, response = ?, resolved_at = ? WHERE id = ?'
  ).bind(body.status, body.response || null, now, id).run()
  
  // Log activity
  await env.DB.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(crypto.randomUUID(), existing.task_id, 'human', body.status, `HITL request ${body.status}: ${existing.request_type}`, now).run()
  
  const updated = await env.DB.prepare('SELECT * FROM hitl_requests WHERE id = ?').bind(id).first()
  return new Response(JSON.stringify(updated), { headers: corsHeaders() })
}
