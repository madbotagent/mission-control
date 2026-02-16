import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionHistory } from '@/lib/openclaw';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const sessionKey = task.session_key as string | null;
  if (!sessionKey) {
    return NextResponse.json({ error: 'No session associated with this task' }, { status: 404 });
  }

  try {
    const history = await getSessionHistory(sessionKey, 50);
    return NextResponse.json({ sessionKey, messages: history });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to fetch session: ${message}` }, { status: 500 });
  }
}
