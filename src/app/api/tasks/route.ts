import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const db = getDb();
  const status = request.nextUrl.searchParams.get('status');

  const rows = status
    ? db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY position ASC, created_at DESC').all(status)
    : db.prepare('SELECT * FROM tasks ORDER BY position ASC, created_at DESC').all();

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE status = ?')
    .get(body.status || 'backlog') as { max_pos: number };

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
  };

  db.prepare(
    'INSERT INTO tasks (id, title, description, status, priority, assigned_agent, created_at, updated_at, completed_at, position, tags, output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(task.id, task.title, task.description, task.status, task.priority, task.assigned_agent, task.created_at, task.updated_at, task.completed_at, task.position, task.tags, task.output);

  db.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), id, body.assigned_agent || 'system', 'created', `Created task: ${task.title}`, now);

  return NextResponse.json(task, { status: 201 });
}
