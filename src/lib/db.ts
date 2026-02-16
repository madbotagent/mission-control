import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'mission-control.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Initialize schema
  _db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      priority TEXT DEFAULT 'medium',
      assigned_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      position INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      output TEXT,
      run_id TEXT,
      session_key TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      agent TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hitl_requests (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      agent TEXT,
      request_type TEXT NOT NULL,
      context TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      response TEXT,
      priority TEXT DEFAULT 'medium',
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_activity_task ON activity_log(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_hitl_status ON hitl_requests(status);
  `);

  // Migrate existing DBs: add columns if missing
  try { _db.exec(`ALTER TABLE tasks ADD COLUMN run_id TEXT`); } catch { /* exists */ }
  try { _db.exec(`ALTER TABLE tasks ADD COLUMN session_key TEXT`); } catch { /* exists */ }
  try { _db.exec(`ALTER TABLE tasks ADD COLUMN agent_done INTEGER DEFAULT 0`); } catch { /* exists */ }

  return _db;
}
