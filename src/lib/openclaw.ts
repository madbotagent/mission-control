const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

interface InvokeResult {
  status: string;
  result?: unknown;
  error?: string;
}

async function invoke(tool: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${GATEWAY_URL}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tool, args, sessionKey: 'main' }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenClaw Gateway error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  
  // tools/invoke returns { ok, result } where result may have { content, details }
  const result = data.result ?? data;
  // If result has a details object (e.g. sessions_spawn), prefer that
  if (result && typeof result === 'object' && 'details' in result) {
    return (result as Record<string, unknown>).details;
  }
  // If result has content array with text, try parsing it
  if (result && typeof result === 'object' && 'content' in result) {
    const content = (result as Record<string, unknown>).content;
    if (Array.isArray(content) && content[0]?.text) {
      try { return JSON.parse(content[0].text); } catch { /* fall through */ }
    }
  }
  return result;
}

export interface SpawnResult {
  status: string;
  childSessionKey: string;
  runId: string;
}

export async function spawnAgent(opts: {
  task: string;
  agentId?: string;
  label?: string;
  model?: string;
}): Promise<SpawnResult> {
  const result = await invoke('sessions_spawn', {
    task: opts.task,
    agentId: opts.agentId || 'coder',
    label: opts.label || 'Mission Control Task',
    model: opts.model || 'anthropic/claude-opus-4-6',
    thinking: 'low',
  });
  return result as SpawnResult;
}

export interface SessionInfo {
  sessionKey: string;
  label?: string;
  agentId?: string;
  status?: string;
  state?: string;
  createdAt?: string;
  lastMessage?: unknown;
  [key: string]: unknown;
}

export async function listSessions(): Promise<SessionInfo[]> {
  const result = await invoke('sessions_list', {
    kinds: ['subagent'],
    messageLimit: 1,
  });
  // Result could be { sessions: [...] } or just an array
  if (Array.isArray(result)) return result;
  const obj = result as Record<string, unknown>;
  if (Array.isArray(obj.sessions)) return obj.sessions as SessionInfo[];
  return [];
}

export interface HistoryMessage {
  role: string;
  content: string;
  timestamp?: string;
}

export async function getSessionHistory(sessionKey: string, limit = 20): Promise<HistoryMessage[]> {
  const result = await invoke('sessions_history', {
    sessionKey,
    limit,
  });
  if (Array.isArray(result)) return result as HistoryMessage[];
  const obj = result as Record<string, unknown>;
  if (Array.isArray(obj.messages)) return obj.messages as HistoryMessage[];
  return [];
}

export interface AgentInfo {
  id: string;
  name: string;
  [key: string]: unknown;
}

export async function sendMessage(sessionKey: string, message: string): Promise<string> {
  const result = await invoke('sessions_send', { sessionKey, message });
  // Result could be a string, or { content: [...] }, or { reply: "..." }
  if (typeof result === 'string') return result;
  const obj = result as Record<string, unknown>;
  if (typeof obj.reply === 'string') return obj.reply;
  if (typeof obj.text === 'string') return obj.text;
  if (Array.isArray(obj.content)) {
    const texts = obj.content.map((c: Record<string, unknown>) => c.text || '').filter(Boolean);
    if (texts.length) return texts.join('\n');
  }
  return JSON.stringify(result);
}

export async function listAgents(): Promise<AgentInfo[]> {
  const result = await invoke('agents_list', {});
  if (Array.isArray(result)) return result as AgentInfo[];
  const obj = result as Record<string, unknown>;
  if (Array.isArray(obj.agents)) return obj.agents as AgentInfo[];
  return [];
}
