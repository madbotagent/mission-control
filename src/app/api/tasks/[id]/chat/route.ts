import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionHistory, sendMessage } from '@/lib/openclaw';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const sessionKey = task.session_key as string | null;
  if (!sessionKey) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const history = await getSessionHistory(sessionKey, 100);
    return NextResponse.json({ messages: history });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to fetch chat: ${message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const sessionKey = task.session_key as string | null;
  if (!sessionKey) {
    return NextResponse.json({ error: 'No active session for this task. Start a session first.' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, string>;
  const userMessage = body.message;
  if (!userMessage || typeof userMessage !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    const reply = await sendMessage(sessionKey, userMessage);
    // Update task timestamp
    db.prepare('UPDATE tasks SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to send message: ${message}` }, { status: 500 });
  }
}
