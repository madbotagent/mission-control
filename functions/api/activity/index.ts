interface Env { DB: D1Database }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders() })
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const taskId = url.searchParams.get('task_id')
  
  let result
  if (taskId) {
    result = await env.DB.prepare('SELECT * FROM activity_log WHERE task_id = ? ORDER BY created_at DESC LIMIT ?').bind(taskId, limit).all()
  } else {
    result = await env.DB.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?').bind(limit).all()
  }
  
  return new Response(JSON.stringify(result.results), { headers: corsHeaders() })
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await request.json() as Record<string, unknown>
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  await env.DB.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, body.task_id || null, body.agent || 'system', body.action, body.details || null, now).run()
  
  return new Response(JSON.stringify({ id, created_at: now }), { status: 201, headers: corsHeaders() })
}
