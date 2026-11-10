export interface AuditEntry {
  id: number;
  at: string;
  email: string;
  action: string;
  entity: string;
  entity_id: string;
  detail: string | null;
}

/**
 * Records one admin change. Call it in the same request, after the change.
 * The change is already saved by then, so a failure here is logged rather than
 * shown to the editor as an error.
 */
export async function logChange(
  db: D1Database,
  email: string,
  action: string,
  entity: string,
  entityId: string,
  detail?: Record<string, unknown>,
) {
  try {
    await db
      .prepare('INSERT INTO audit_log (email, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?)')
      .bind(email, action, entity, entityId, detail ? JSON.stringify(detail) : null)
      .run();
  } catch (err) {
    console.error('[audit] could not record', action, entity, entityId, err);
  }
}

export async function recentChanges(db: D1Database, limit = 20): Promise<AuditEntry[]> {
  const { results } = await db.prepare('SELECT * FROM audit_log ORDER BY at DESC, id DESC LIMIT ?').bind(limit).all<AuditEntry>();
  return results;
}
