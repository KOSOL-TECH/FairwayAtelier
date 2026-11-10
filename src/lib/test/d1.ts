/**
 * Test helper: a D1-shaped database backed by Node's built-in SQLite, loaded
 * with the real migration files. Only the parts of the D1 API this project
 * uses are implemented. Never imported by application code.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

type Row = Record<string, unknown>;

class Statement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new Statement(this.db, this.sql, params as SQLInputValue[]);
  }

  async first<T = Row>(column?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.params) as Row | undefined;
    if (!row) return null;
    return (column ? row[column] : { ...row }) as T;
  }

  async all<T = Row>() {
    const results = this.db.prepare(this.sql).all(...this.params).map((r) => ({ ...r })) as T[];
    return { results, success: true as const, meta: { changes: 0 } };
  }

  async run() {
    const { changes, lastInsertRowid } = this.db.prepare(this.sql).run(...this.params);
    return { results: [], success: true as const, meta: { changes: Number(changes), last_row_id: Number(lastInsertRowid) } };
  }
}

export interface TestDb {
  /** Pass this wherever a `D1Database` is expected */
  d1: D1Database;
  /** The underlying database, for arranging and inspecting rows directly */
  sqlite: DatabaseSync;
}

/**
 * @param migrations file names in `migrations/`, applied in the order given
 */
export function testDb(...migrations: string[]): TestDb {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const file of migrations) sqlite.exec(readFileSync(`migrations/${file}`, 'utf8'));

  const d1 = {
    prepare: (sql: string) => new Statement(sqlite, sql),
    // Like D1, a batch is one transaction: all of it applies or none of it.
    batch: async (statements: Statement[]) => {
      sqlite.exec('BEGIN');
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec('COMMIT');
        return out;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    },
  };
  return { d1: d1 as unknown as D1Database, sqlite };
}

/** The accounts schema with the tables it reads from: admin_users (copied at migration) and enquiries. */
export const accountsDb = () => testDb('0002_admin_users.sql', '0004_enquiries.sql', '0008_accounts.sql');
