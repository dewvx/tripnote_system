import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// แทน repository ด้วยฐานข้อมูลปลอมใน memory เหมือน expenses.test.js
const db = vi.hoisted(() => ({
  memberships: [],
  entries: [],
  expenses: [],
  nextId: 1,
}));

const TRIP = 10;
const OTHER_TRIP = 20;

vi.mock('../src/modules/trips/trips.repository.js', () => ({
  findMembership: vi.fn(async (tripId, userId) => {
    const m = db.memberships.find((x) => x.tripId === tripId && x.userId === userId);
    return m
      ? {
          trip: {
            id: tripId,
            timezone: 'Asia/Bangkok',
            startDate: '2026-10-10',
            endDate: '2026-10-12',
          },
          member: { id: m.id, role: m.role },
        }
      : null;
  }),
}));

vi.mock('../src/modules/journal/journal.repository.js', () => {
  const view = ({ id, clientId, body, locationLabel, occurredAt, createdAt }) => ({
    id,
    clientId,
    body,
    locationLabel,
    occurredAt,
    createdAt,
  });
  const live = (tripId) =>
    db.entries
      .filter((e) => e.tripId === tripId && !e.deletedAt)
      .sort((a, b) => a.occurredAt - b.occurredAt || a.id - b.id);
  return {
    findByClientId: vi.fn(async (tripId, clientId) => {
      const row = live(tripId).find((e) => e.clientId === clientId);
      return row ? view(row) : null;
    }),
    createEntry: vi.fn(async (data) => {
      const duplicate =
        data.clientId &&
        db.entries.some((e) => e.tripId === data.tripId && e.clientId === data.clientId);
      if (duplicate) return null;
      const row = { id: db.nextId++, body: null, locationLabel: null, ...data };
      db.entries.push(row);
      return view(row);
    }),
    findEntry: vi.fn(async (tripId, id) => {
      const row = live(tripId).find((e) => e.id === id);
      return row ? view(row) : null;
    }),
    updateEntry: vi.fn(async (tripId, id, data) => {
      const row = live(tripId).find((e) => e.id === id);
      if (!row) return null;
      Object.assign(row, data);
      return view(row);
    }),
    softDeleteEntry: vi.fn(async (tripId, id) => {
      const row = live(tripId).find((e) => e.id === id);
      if (row) row.deletedAt = new Date();
      return Boolean(row);
    }),
    listEntries: vi.fn(async (tripId) => live(tripId).map(view)),
  };
});

vi.mock('../src/modules/expenses/expenses.repository.js', () => ({
  listForTimeline: vi.fn(async (tripId) =>
    db.expenses
      .filter((e) => e.tripId === tripId && !e.deletedAt)
      .sort((a, b) => a.spentAt - b.spentAt || a.id - b.id)
      .map(({ id, amount, spentAt, journalEntryId }) => ({
        id,
        amount,
        spentAt,
        journalEntryId: journalEntryId ?? null,
      })),
  ),
}));

const { default: app } = await import('../src/app.js');
const { signAccessToken } = await import('../src/lib/jwt.js');

const users = { owner: 1, viewer: 2, outsider: 3 };
const auth = (userId) => `Bearer ${signAccessToken(userId)}`;
const CLIENT_ID = '0b0d9c3a-2a51-4d3e-8a55-9d2f6f3b1c11';

const post = (userId, body, tripId = TRIP) =>
  request(app)
    .post(`/api/trips/${tripId}/journal-entries`)
    .set('Authorization', auth(userId))
    .send(body);
const patch = (userId, id, body) =>
  request(app)
    .patch(`/api/trips/${TRIP}/journal-entries/${id}`)
    .set('Authorization', auth(userId))
    .send(body);
const del = (userId, id) =>
  request(app)
    .delete(`/api/trips/${TRIP}/journal-entries/${id}`)
    .set('Authorization', auth(userId));
const timeline = (userId = users.viewer) =>
  request(app).get(`/api/trips/${TRIP}/timeline`).set('Authorization', auth(userId));

function seedEntry(row) {
  const entry = {
    id: db.nextId++,
    tripId: TRIP,
    clientId: null,
    body: null,
    locationLabel: null,
    ...row,
    occurredAt: new Date(row.occurredAt),
  };
  db.entries.push(entry);
  return entry;
}

function seedExpense(row) {
  db.expenses.push({ id: db.nextId++, tripId: TRIP, ...row, spentAt: new Date(row.spentAt) });
}

beforeEach(() => {
  db.memberships = [
    { id: 100, tripId: TRIP, userId: users.owner, role: 'owner' },
    { id: 101, tripId: TRIP, userId: users.viewer, role: 'viewer' },
  ];
  db.entries = [];
  db.expenses = [];
  db.nextId = 1;
});

describe('POST /api/trips/:tripId/journal-entries', () => {
  it('จดข้อความได้ ตอบ 201 ไม่ส่งเวลา = ตอนนี้ ตัดช่องว่างหัวท้าย', async () => {
    const before = Date.now();
    const res = await post(users.owner, { clientId: CLIENT_ID, body: '  มาถึงโคราชแล้ว  ' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ body: 'มาถึงโคราชแล้ว', locationLabel: null });
    expect(Date.parse(res.body.data.occurredAt)).toBeGreaterThanOrEqual(before - 1000);
    expect(db.entries[0]).toMatchObject({ tripId: TRIP, createdByUserId: users.owner });
  });

  it('มีแค่ชื่อสถานที่ก็จดได้ เวลาที่ส่งมาเก็บเป็น UTC', async () => {
    const res = await post(users.owner, {
      locationLabel: 'เขาใหญ่',
      occurredAt: '2026-10-10T11:42:00+07:00',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      body: null,
      locationLabel: 'เขาใหญ่',
      occurredAt: '2026-10-10T04:42:00.000Z',
    });
  });

  it.each([
    [{}, 'ไม่ส่งอะไรเลย'],
    [{ body: '   ', locationLabel: '' }, 'มีแต่ช่องว่าง'],
  ])('%j (%s) ตอบ 422', async (body) => {
    const res = await post(users.owner, body);

    expect(res.status).toBe(422);
    expect(res.body.error.details[0].field).toBe('body');
    expect(db.entries).toHaveLength(0);
  });

  it('ชื่อสถานที่ยาวเกิน 150 ตัวอักษร ตอบ 422', async () => {
    const res = await post(users.owner, { locationLabel: 'ก'.repeat(151) });

    expect(res.status).toBe(422);
    expect(res.body.error.details[0].field).toBe('locationLabel');
  });

  it('clientId เดิมส่งซ้ำได้บันทึกเดิมด้วย 200 ส่งซ้ำหลังลบแล้วได้ 404 ไม่สร้างใหม่', async () => {
    const first = await post(users.owner, { clientId: CLIENT_ID, body: 'a' });
    const retry = await post(users.owner, { clientId: CLIENT_ID, body: 'a' });

    expect(retry.status).toBe(200);
    expect(retry.body.data.id).toBe(first.body.data.id);
    expect(db.entries).toHaveLength(1);

    await del(users.owner, first.body.data.id);
    expect((await post(users.owner, { clientId: CLIENT_ID, body: 'a' })).status).toBe(404);
    expect(db.entries).toHaveLength(1);
  });

  it('viewer จดไม่ได้ (403) คนนอกทริปได้ 404', async () => {
    expect((await post(users.viewer, { body: 'a' })).status).toBe(403);
    expect((await post(users.outsider, { body: 'a' })).status).toBe(404);
  });
});

describe('PATCH /api/trips/:tripId/journal-entries/:entryId', () => {
  it('แก้บางช่องได้ ลบข้อความได้ถ้ายังมีชื่อสถานที่', async () => {
    const entry = seedEntry({ body: 'เดิม', occurredAt: '2026-10-10T05:00:00Z' });

    const res = await patch(users.owner, entry.id, { locationLabel: 'ตลาด', body: '' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ body: null, locationLabel: 'ตลาด' });
  });

  it('แก้จนว่างทั้งข้อความและสถานที่ไม่ได้ ตอบ 422 ค่าเดิมไม่เปลี่ยน', async () => {
    const entry = seedEntry({ body: 'เดิม', occurredAt: '2026-10-10T05:00:00Z' });

    const res = await patch(users.owner, entry.id, { body: '' });

    expect(res.status).toBe(422);
    expect(db.entries[0].body).toBe('เดิม');
  });

  it('บันทึกของทริปอื่นหรือที่ลบแล้ว ตอบ 404 ENTRY_NOT_FOUND viewer แก้ไม่ได้', async () => {
    const other = seedEntry({ tripId: OTHER_TRIP, body: 'x', occurredAt: '2026-10-10T05:00:00Z' });
    const res = await patch(users.owner, other.id, { body: 'y' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ENTRY_NOT_FOUND');

    const entry = seedEntry({ body: 'x', occurredAt: '2026-10-10T05:00:00Z' });
    expect((await patch(users.viewer, entry.id, { body: 'y' })).status).toBe(403);

    expect((await del(users.owner, entry.id)).status).toBe(204);
    expect((await patch(users.owner, entry.id, { body: 'y' })).status).toBe(404);
    expect((await del(users.owner, entry.id)).status).toBe(404);
  });
});

describe('GET /api/trips/:tripId/timeline', () => {
  it('ยังไม่มีอะไรเลย ได้ days ว่าง', async () => {
    const res = await timeline();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ days: [] });
  });

  it('รวมบันทึกกับรายจ่าย เรียงตามเวลา จัดกลุ่มตามวันของทริป ยอดรายวันรวมทุกรายจ่าย', async () => {
    const morning = seedEntry({ body: 'ออกเดินทาง', occurredAt: '2026-10-10T01:00:00Z' });
    seedExpense({ amount: '0.10', spentAt: '2026-10-10T02:00:00Z' });
    seedExpense({ amount: '0.20', spentAt: '2026-10-10T16:59:00Z' }); // 23:59 เวลาไทย
    const lunch = seedEntry({ body: 'ข้าวเที่ยง', occurredAt: '2026-10-10T05:00:00Z' });
    seedExpense({ amount: '120.00', spentAt: '2026-10-10T05:01:00Z', journalEntryId: lunch.id });
    seedEntry({ locationLabel: 'เขาใหญ่', occurredAt: '2026-10-10T17:00:00Z' }); // 00:00 วันที่ 11

    const { days } = (await timeline()).body.data;

    expect(days.map((d) => [d.date, d.dayNumber, d.totalSpent])).toEqual([
      ['2026-10-10', 1, '120.30'],
      ['2026-10-11', 2, '0.00'],
    ]);
    expect(days[0].items.map((i) => [i.kind, (i.entry ?? i.expense).id])).toEqual([
      ['entry', morning.id],
      ['expense', 2],
      ['entry', lunch.id],
      ['expense', 3],
    ]);
    // รายจ่ายที่ผูกกับบันทึกอยู่ในบันทึก ไม่แสดงซ้ำเป็นแถวแยก
    expect(days[0].items[2].entry.expenses.map((e) => e.amount)).toEqual(['120.00']);
    expect(days[0].items[0].entry.expenses).toEqual([]);
  });

  it('ลบบันทึกแล้ว รายจ่ายที่เคยผูกไว้กลับมาเป็นแถวเดี่ยว', async () => {
    const entry = seedEntry({ body: 'x', occurredAt: '2026-10-10T05:00:00Z' });
    seedExpense({ amount: '50.00', spentAt: '2026-10-10T05:01:00Z', journalEntryId: entry.id });
    await del(users.owner, entry.id);

    const { days } = (await timeline()).body.data;

    expect(days[0].items.map((i) => i.kind)).toEqual(['expense']);
  });

  it('วันนอกช่วงทริป dayNumber เป็น null คนนอกทริปได้ 404', async () => {
    seedEntry({ body: 'เตรียมของ', occurredAt: '2026-10-08T05:00:00Z' });

    const { days } = (await timeline()).body.data;
    expect(days[0]).toMatchObject({ date: '2026-10-08', dayNumber: null });

    expect((await timeline(users.outsider)).status).toBe(404);
  });
});
