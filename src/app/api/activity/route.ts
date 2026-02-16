import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const db = getDb();
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
  const taskId = request.nextUrl.searchParams.get('task_id');

  const rows = taskId
    ? db.prepare('SELECT * FROM activity_log WHERE task_id = ? ORDER BY created_at DESC LIMIT ?').all(taskId, limit)
    : db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?').all(limit);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, body.task_id || null, body.agent || 'system', body.action, body.details || null, now);

  return NextResponse.json({ id, created_at: now }, { status: 201 });
}
