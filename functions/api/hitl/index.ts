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
  const status = url.searchParams.get('status')
  
  let result
  if (status) {
    result = await env.DB.prepare('SELECT * FROM hitl_requests WHERE status = ? ORDER BY created_at DESC').bind(status).all()
  } else {
    result = await env.DB.prepare('SELECT * FROM hitl_requests ORDER BY created_at DESC').all()
  }
  
  return new Response(JSON.stringify(result.results), { headers: corsHeaders() })
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await request.json() as Record<string, unknown>
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  
  await env.DB.prepare(
    'INSERT INTO hitl_requests (id, task_id, agent, request_type, context, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.task_id || null, body.agent || null, body.request_type, body.context || null, 'pending', body.priority || 'medium', now).run()
  
  return new Response(JSON.stringify({ id, status: 'pending', created_at: now }), { status: 201, headers: corsHeaders() })
}
