import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { spawnAgent } from '@/lib/openclaw';
import crypto from 'crypto';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const now = new Date().toISOString();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Optional: pick agent from request body
  const body = await request.json().catch(() => ({})) as Record<string, string>;
  const agentId = body.agentId || (task.assigned_agent as string) || 'coder';

  const taskDescription = `You are working on a task for the Mission Control dashboard.

Task: ${task.title}

Details:
${task.description || 'No additional details.'}

The user will chat with you to provide more details and iterate. Ask clarifying questions if needed. When you make changes to code, tell the user what you did.`;

  try {
    const result = await spawnAgent({
      task: taskDescription,
      agentId,
      label: `MC: ${task.title}`,
    });

    // Update task: move to in-progress, store session info
    db.prepare(
      'UPDATE tasks SET status = ?, assigned_agent = ?, run_id = ?, session_key = ?, updated_at = ? WHERE id = ?'
    ).run('in-progress', agentId, result.runId, result.childSessionKey, now, id);

    // Log activity
    db.prepare(
      'INSERT INTO activity_log (id, task_id, agent, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), id, agentId, 'dispatched', `Dispatched to ${agentId} agent (session: ${result.childSessionKey})`, now);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return NextResponse.json({ task: updated, session: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to dispatch: ${message}` }, { status: 500 });
  }
}
