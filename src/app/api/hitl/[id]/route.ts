import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await request.json();
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT * FROM hitl_requests WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  db.prepare(
    'UPDATE hitl_requests SET status = ?, response = ?, resolved_at = ? WHERE id = ?'
  ).run(body.status, body.response || null, now, id);

  db.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), existing.task_id, 'human', body.status, `HITL request ${body.status}: ${existing.request_type}`, now);

  const updated = db.prepare('SELECT * FROM hitl_requests WHERE id = ?').get(id);
  return NextResponse.json(updated);
}
