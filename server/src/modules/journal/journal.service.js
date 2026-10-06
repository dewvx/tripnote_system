import { AppError } from '../../lib/AppError.js';
import { EMPTY_MESSAGE } from './journal.schema.js';
import * as journalRepository from './journal.repository.js';

function notFound() {
  return new AppError('ENTRY_NOT_FOUND', 404, 'ไม่พบบันทึกนี้ อาจถูกลบไปแล้ว');
}

// คืน { entry, created } ให้ controller เลือก 201 หรือ 200 (API.md §Idempotency)
export async function createEntry(trip, userId, input) {
  const { clientId, occurredAt, ...fields } = input;

  if (clientId) {
    const existing = await journalRepository.findByClientId(trip.id, clientId);
    if (existing) return { entry: existing, created: false };
  }

  const entry = await journalRepository.createEntry({
    ...fields,
    tripId: trip.id,
    createdByUserId: userId,
    clientId: clientId ?? null,
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
  });
  if (entry) return { entry, created: true };

  // ชน unique ระหว่างทาง คืนตัวที่บันทึกไปก่อน ถ้าหาไม่เจอแปลว่าตัวเดิมถูกลบไปแล้ว ไม่สร้างกลับมาใหม่
  const existing = await journalRepository.findByClientId(trip.id, clientId);
  if (!existing) throw notFound();
  return { entry: existing, created: false };
}

export async function updateEntry(trip, entryId, input) {
  const current = await journalRepository.findEntry(trip.id, entryId);
  if (!current) throw notFound();

  const { occurredAt, ...fields } = input;
  const next = { ...current, ...fields };
  if (!next.body && !next.locationLabel) {
    throw new AppError('VALIDATION_ERROR', 422, 'ข้อมูลไม่ถูกต้อง', [
      { field: 'body', message: EMPTY_MESSAGE },
    ]);
  }

  const data = { ...fields, ...(occurredAt && { occurredAt: new Date(occurredAt) }) };
  if (Object.keys(data).length === 0) return current;

  const entry = await journalRepository.updateEntry(trip.id, entryId, data);
  if (!entry) throw notFound();
  return entry;
}

export async function deleteEntry(trip, entryId) {
  const deleted = await journalRepository.softDeleteEntry(trip.id, entryId);
  if (!deleted) throw notFound();
}
