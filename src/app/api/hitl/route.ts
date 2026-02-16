import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const db = getDb();
  const status = request.nextUrl.searchParams.get('status');

  const rows = status
    ? db.prepare('SELECT * FROM hitl_requests WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM hitl_requests ORDER BY created_at DESC').all();

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO hitl_requests (id, task_id, agent, request_type, context, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.task_id || null, body.agent || null, body.request_type, body.context || null, 'pending', body.priority || 'medium', now);

  return NextResponse.json({ id, status: 'pending', created_at: now }, { status: 201 });
}
