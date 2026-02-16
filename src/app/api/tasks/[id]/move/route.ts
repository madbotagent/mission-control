import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await request.json();
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const oldStatus = existing.status as string;
  const newStatus = body.status;
  const completed_at = newStatus === 'done' && oldStatus !== 'done' ? now : (existing.completed_at as string | null);

  let position = body.position;
  if (position === undefined) {
    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE status = ?')
      .get(newStatus) as { max_pos: number };
    position = (maxPos?.max_pos ?? -1) + 1;
  }

  db.prepare(
    'UPDATE tasks SET status = ?, position = ?, updated_at = ?, completed_at = ? WHERE id = ?'
  ).run(newStatus, position, now, completed_at, id);

  if (oldStatus !== newStatus) {
    db.prepare(
      'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), id, (existing.assigned_agent as string) || 'system', 'moved', `Moved from ${oldStatus} to ${newStatus}`, now);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return NextResponse.json(updated);
}
