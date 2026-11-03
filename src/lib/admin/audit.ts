export interface AuditEntry {
  id: number;
  at: string;
  email: string;
  action: string;
  entity: string;
  entity_id: string;
  detail: string | null;
}

/** Records one admin change. Call it in the same request as the change itself. */
export async function logChange(
  db: D1Database,
  email: string,
  action: string,
  entity: string,
  entityId: string,
  detail?: Record<string, unknown>,
) {
  await db
    .prepare('INSERT INTO audit_log (email, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(email, action, entity, entityId, detail ? JSON.stringify(detail) : null)
    .run();
}

export async function recentChanges(db: D1Database, limit = 20): Promise<AuditEntry[]> {
  const { results } = await db.prepare('SELECT * FROM audit_log ORDER BY at DESC, id DESC LIMIT ?').bind(limit).all<AuditEntry>();
  return results;
}
