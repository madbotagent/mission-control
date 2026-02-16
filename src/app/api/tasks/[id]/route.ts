import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await request.json();
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const completed_at = body.status === 'done' && existing.status !== 'done' ? now : (existing.completed_at as string | null);

  db.prepare(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assigned_agent = ?, updated_at = ?, completed_at = ?, tags = ?, output = ? WHERE id = ?'
  ).run(
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
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

  db.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), id, 'system', 'deleted', `Deleted task: ${existing.title}`, new Date().toISOString());

  return NextResponse.json({ success: true });
}
