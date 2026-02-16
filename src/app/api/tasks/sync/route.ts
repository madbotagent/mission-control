import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { listSessions, getSessionHistory } from '@/lib/openclaw';
import crypto from 'crypto';

export async function POST() {
  const db = getDb();
  const now = new Date().toISOString();

  // Get all in-progress tasks with session keys
  const tasks = db.prepare(
    "SELECT * FROM tasks WHERE status = 'in-progress' AND session_key IS NOT NULL"
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

    // Check if the session is explicitly done
    const isEnded = session && (
      session.state === 'ended' || session.state === 'completed' || 
      session.status === 'ended' || session.status === 'completed' ||
      session.state === 'archived'
    );

    // If session not in active list, it might be done OR still starting up
    // Only mark done if: session explicitly ended, OR session missing AND task was dispatched >2 min ago
    const dispatchedAt = new Date(task.updated_at as string).getTime();
    const elapsed = Date.now() - dispatchedAt;
    const minRunTime = 2 * 60 * 1000; // 2 minutes minimum before we consider "missing = done"

    const shouldComplete = isEnded || (!session && elapsed > minRunTime);

    if (shouldComplete) {
      try {
        const history = await getSessionHistory(sessionKey, 5);
        
        // Double check: if we got history, look for signs the agent is still working
        // If history is empty or very short and session is missing, it might still be starting
        if (!session && history.length < 2 && elapsed < 5 * 60 * 1000) {
          continue; // Probably still starting up, skip
        }

        const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');
        const output = lastAssistant?.content?.slice(0, 5000) || 'Task completed (no output captured)';

        db.prepare(
          'UPDATE tasks SET status = ?, completed_at = ?, updated_at = ?, output = ? WHERE id = ?'
        ).run('done', now, now, output, task.id);

        db.prepare(
          'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(crypto.randomUUID(), task.id, task.assigned_agent || 'system', 'completed', 'Task completed by agent', now);

        updated.push(task.id as string);
      } catch {
        // Session might still be starting up or history unavailable - skip
      }
    }
    // If session exists and is active (running/idle), task stays in-progress
  }

  return NextResponse.json({ synced: tasks.length, updated });
}
