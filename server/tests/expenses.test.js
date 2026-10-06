import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// แทน repository ด้วยฐานข้อมูลปลอมใน memory เหมือน trips.test.js
const db = vi.hoisted(() => ({
  memberships: [],
  members: [],
  expenses: [],
  nextId: 1,
  // จำลองคำขอซ้ำที่มาถึงพร้อมกัน: findByClientId รอบแรกยังไม่เจอ แต่ INSERT ชน unique
  simulateRace: false,
}));

const categories = vi.hoisted(() => [
  { id: 1, code: 'accommodation', nameTh: 'ที่พัก', icon: 'bed', color: '#5b6ee1' },
  { id: 2, code: 'food', nameTh: 'อาหาร', icon: 'utensils', color: '#e2732d' },
]);

vi.mock('../src/modules/trips/trips.repository.js', () => ({
  findMembership: vi.fn(async (tripId, userId) => {
    const m = db.memberships.find((x) => x.tripId === tripId && x.userId === userId);
    return m
      ? { trip: { id: tripId, status: 'active' }, member: { id: m.id, role: m.role } }
      : null;
  }),
}));

vi.mock('../src/modules/expense-categories/expense-categories.repository.js', () => ({
  listActiveCategories: vi.fn(async () => categories),
  findActiveCategory: vi.fn(async (id) => categories.find((c) => c.id === id) ?? null),
}));

vi.mock('../src/modules/expenses/expenses.repository.js', () => {
  const view = (row) => ({
    id: row.id,
    clientId: row.clientId,
    amount: row.amount,
    description: row.description ?? null,
    spentAt: row.spentAt,
    category: categories.find((c) => c.id === row.categoryId),
    paidBy: db.members.find((m) => m.id === row.paidByMemberId),
  });
  return {
    findMemberInTrip: vi.fn(async (tripId, memberId) => {
      const m = db.members.find((x) => x.id === memberId && x.tripId === tripId);
      return m ? { id: m.id } : null;
    }),
    findByClientId: vi.fn(async (tripId, clientId) => {
      if (db.simulateRace) return null;
      const row = db.expenses.find((e) => e.tripId === tripId && e.clientId === clientId);
      return row ? view(row) : null;
    }),
    createExpense: vi.fn(async (data) => {
      const duplicate =
        data.clientId &&
        db.expenses.some((e) => e.tripId === data.tripId && e.clientId === data.clientId);
      if (duplicate) {
        db.simulateRace = false;
        return null;
      }
      const row = { id: db.nextId++, ...data, amount: Number(data.amount).toFixed(2) };
      db.expenses.push(row);
      return view(row);
    }),
    listRecentExpenses: vi.fn(async (tripId, limit) =>
      db.expenses
        .filter((e) => e.tripId === tripId)
        .sort((a, b) => b.spentAt - a.spentAt || b.id - a.id)
        .slice(0, limit)
        .map(view),
    ),
  };
});

const { default: app } = await import('../src/app.js');
const { signAccessToken } = await import('../src/lib/jwt.js');

const TRIP = 10;
const OTHER_TRIP = 20;
const users = { owner: 1, viewer: 2, outsider: 3 };
const auth = (userId) => `Bearer ${signAccessToken(userId)}`;

function post(userId, body, tripId = TRIP) {
  return request(app)
    .post(`/api/trips/${tripId}/expenses`)
    .set('Authorization', auth(userId))
    .send(body);
}

const valid = () => ({
  clientId: '6f1c2a9e-8f0b-4f0e-9a51-0c1d2e3f4a5b',
  amount: '50.00',
  categoryId: 2,
  paidByMemberId: 100,
});

beforeEach(() => {
  db.memberships = [
    { id: 100, tripId: TRIP, userId: users.owner, role: 'owner' },
    { id: 101, tripId: TRIP, userId: users.viewer, role: 'viewer' },
  ];
  db.members = [
    { id: 100, tripId: TRIP, displayName: 'Owner' },
    { id: 102, tripId: TRIP, displayName: 'เพื่อน 1' },
    { id: 200, tripId: OTHER_TRIP, displayName: 'คนทริปอื่น' },
  ];
  db.expenses = [];
  db.nextId = 1;
  db.simulateRace = false;
});

describe('GET /api/expense-categories', () => {
  it('คืนหมวดที่ใช้งานได้ ต้อง login', async () => {
    const res = await request(app).get('/api/expense-categories').set('Authorization', auth(1));
    expect(res.status).toBe(200);
    expect(res.body.data.map((c) => c.code)).toEqual(['accommodation', 'food']);

    expect((await request(app).get('/api/expense-categories')).status).toBe(401);
  });
});

describe('POST /api/trips/:tripId/expenses', () => {
  it('บันทึกได้ ตอบ 201 เงินเป็น string และไม่ส่ง spentAt = ตอนนี้', async () => {
    const before = Date.now();
    const res = await post(users.owner, { ...valid(), paidByMemberId: 102, description: ' น้ำ ' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      amount: '50.00',
      description: 'น้ำ',
      category: { code: 'food' },
      paidBy: { id: 102, displayName: 'เพื่อน 1' },
    });
    expect(Date.parse(res.body.data.spentAt)).toBeGreaterThanOrEqual(before - 1000);
    expect(db.expenses[0]).toMatchObject({ tripId: TRIP, createdByUserId: users.owner });
  });

  it.each([
    ['0', 'ศูนย์'],
    ['0.00', 'ศูนย์มีทศนิยม'],
    ['-5', 'ติดลบ'],
    ['12.345', 'ทศนิยมเกิน 2 ตำแหน่ง'],
    ['abc', 'ไม่ใช่ตัวเลข'],
    [50, 'เป็น number ไม่ใช่ string'],
  ])('amount = %j (%s) ตอบ 422', async (amount) => {
    const res = await post(users.owner, { ...valid(), amount });

    expect(res.status).toBe(422);
    expect(res.body.error.details.map((d) => d.field)).toContain('amount');
    expect(db.expenses).toHaveLength(0);
  });

  it('ขาดหมวดและคนจ่าย ตอบ 422 ทั้งสอง field', async () => {
    const res = await post(users.owner, { amount: '10' });

    expect(res.status).toBe(422);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['categoryId', 'paidByMemberId']));
  });

  it('หมวดที่ไม่มีอยู่ ตอบ 422 categoryId', async () => {
    const res = await post(users.owner, { ...valid(), categoryId: 99 });

    expect(res.status).toBe(422);
    expect(res.body.error.details[0].field).toBe('categoryId');
  });

  it('คนจ่ายที่อยู่ทริปอื่น ตอบ 422 paidByMemberId', async () => {
    const res = await post(users.owner, { ...valid(), paidByMemberId: 200 });

    expect(res.status).toBe(422);
    expect(res.body.error.details[0].field).toBe('paidByMemberId');
  });

  it('spentAt ต้องมี timezone และเก็บเป็นเวลาเดียวกันใน UTC', async () => {
    const noOffset = await post(users.owner, { ...valid(), spentAt: '2026-10-10T11:42:00' });
    expect(noOffset.status).toBe(422);

    const res = await post(users.owner, { ...valid(), spentAt: '2026-10-10T11:42:00+07:00' });
    expect(res.status).toBe(201);
    expect(res.body.data.spentAt).toBe('2026-10-10T04:42:00.000Z');
  });

  it('clientId เดิมส่งซ้ำ ได้รายการเดิมด้วย 200 ไม่เกิดรายการซ้ำ', async () => {
    const first = await post(users.owner, valid());
    const retry = await post(users.owner, valid());

    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.data.id).toBe(first.body.data.id);
    expect(db.expenses).toHaveLength(1);
  });

  it('คำขอซ้ำที่มาถึงพร้อมกันจนชน unique ได้รายการเดิมด้วย 200', async () => {
    const first = await post(users.owner, valid());
    db.simulateRace = true;

    const raced = await post(users.owner, valid());

    expect(raced.status).toBe(200);
    expect(raced.body.data.id).toBe(first.body.data.id);
    expect(db.expenses).toHaveLength(1);
  });

  it('clientId ไม่ใช่ UUID ตอบ 422', async () => {
    const res = await post(users.owner, { ...valid(), clientId: 'not-a-uuid' });

    expect(res.status).toBe(422);
  });

  it('viewer บันทึกไม่ได้ (403) คนนอกทริปได้ 404', async () => {
    expect((await post(users.viewer, valid())).status).toBe(403);
    expect((await post(users.outsider, valid())).status).toBe(404);
  });
});

describe('GET /api/trips/:tripId/expenses', () => {
  it('เรียงใหม่ไปเก่าและจำกัดจำนวนด้วย limit', async () => {
    for (const [i, spentAt] of ['2026-10-10T01:00:00Z', '2026-10-10T03:00:00Z'].entries()) {
      await post(users.owner, { ...valid(), clientId: undefined, amount: `${i + 1}`, spentAt });
    }

    const res = await request(app)
      .get(`/api/trips/${TRIP}/expenses?limit=1`)
      .set('Authorization', auth(users.viewer));

    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.amount)).toEqual(['2.00']);
  });
});
