import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { listSessions } from '@/lib/openclaw';
import crypto from 'crypto';

export async function POST() {
  const db = getDb();
  const now = new Date().toISOString();

  const tasks = db.prepare(
    "SELECT * FROM tasks WHERE status = 'in-progress' AND session_key IS NOT NULL AND agent_done = 0"
  ).all() as Array<Record<string, unknown>>;

  if (tasks.length === 0) {
    return NextResponse.json({ synced: 0, updated: [] });
  }

  let sessions;
  try {
    sessions = await listSessions();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to list sessions: ${message}` }, { status: 500 });
  }

  const sessionMap = new Map(sessions.map(s => [s.sessionKey, s]));
  const updated: string[] = [];

  for (const task of tasks) {
    const sessionKey = task.session_key as string;
    const session = sessionMap.get(sessionKey);

    const isEnded = session && (
      session.state === 'ended' || session.state === 'completed' ||
      session.status === 'ended' || session.status === 'completed' ||
      session.state === 'archived'
    );

    const dispatchedAt = new Date(task.updated_at as string).getTime();
    const elapsed = Date.now() - dispatchedAt;
    const shouldFlag = isEnded || (!session && elapsed > 5 * 60 * 1000);

    if (shouldFlag) {
      // Just flag as agent_done, don't move to done
      db.prepare('UPDATE tasks SET agent_done = 1, updated_at = ? WHERE id = ?').run(now, task.id);

      db.prepare(
        'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(crypto.randomUUID(), task.id, task.assigned_agent || 'system', 'agent_done', 'Agent session completed. Awaiting user review.', now);

      updated.push(task.id as string);
    }
  }

  return NextResponse.json({ synced: tasks.length, updated });
}
