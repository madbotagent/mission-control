import { NextResponse } from 'next/server';
import { listAgents, listSessions } from '@/lib/openclaw';

export async function GET() {
  try {
    const [agents, sessions] = await Promise.all([
      listAgents(),
      listSessions(),
    ]);

    // Count active sessions per agent
    const sessionCounts = new Map<string, number>();
    const activeTasks = new Map<string, string>();
    for (const s of sessions) {
      const agentId = s.agentId || 'unknown';
      sessionCounts.set(agentId, (sessionCounts.get(agentId) || 0) + 1);
      if (s.label) activeTasks.set(agentId, s.label as string);
    }

    const enriched = agents.map(a => ({
      ...a,
      id: a.id,
      name: a.name || a.id,
      emoji: a.id === 'coder' ? '🤖' : '🧠',
      status: (sessionCounts.get(a.id) || 0) > 0 ? 'executing' : 'idle',
      model: (a as Record<string, unknown>).model || 'anthropic/claude-opus-4-6',
      sessionCount: sessionCounts.get(a.id) || 0,
      currentTask: activeTasks.get(a.id) || undefined,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
