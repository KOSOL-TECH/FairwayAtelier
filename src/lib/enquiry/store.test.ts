import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { UPSERT_ENQUIRY, retentionCutoff } from './store';

describe('UPSERT_ENQUIRY (retries of one submission)', () => {
  const setup = () => {
    const db = new DatabaseSync(':memory:');
    db.exec(readFileSync('migrations/0004_enquiries.sql', 'utf8'));
    const save = (name: string, at: string) =>
      db.prepare(UPSERT_ENQUIRY).run('id-1', at, name, 'a@b.co', '', 'May', '2', 'Standard', 'Hello', at);
    return { db, save };
  };

  it('stores a retry as the same enquiry, with the latest details and the first receipt time', () => {
    const { db, save } = setup();
    save('Anne', '2026-11-10T10:00:00.000Z');
    save('Anne Martin', '2026-11-10T10:01:00.000Z');
    const rows = db.prepare('SELECT name, received_at FROM enquiries').all();
    expect(rows).toEqual([{ name: 'Anne Martin', received_at: '2026-11-10T10:00:00.000Z' }]);
  });

  it('leaves an enquiry the team has already acted on untouched', () => {
    const { db, save } = setup();
    save('Anne', '2026-11-10T10:00:00.000Z');
    db.prepare("UPDATE enquiries SET status = 'replied'").run();
    save('Someone else', '2026-11-10T10:05:00.000Z');
    expect(db.prepare('SELECT name, status FROM enquiries').all()).toEqual([{ name: 'Anne', status: 'replied' }]);
  });
});

describe('retentionCutoff', () => {
  it('is three years before now', () => {
    expect(retentionCutoff(new Date('2026-11-03T12:00:00Z'))).toBe('2023-11-03T12:00:00.000Z');
  });

  it('handles 29 February', () => {
    expect(retentionCutoff(new Date('2028-02-29T00:00:00Z'))).toBe('2025-03-01T00:00:00.000Z');
  });
});
