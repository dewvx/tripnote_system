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
  budgetAmount: null,
}));

const categories = vi.hoisted(() => [
  { id: 1, code: 'accommodation', nameTh: 'ที่พัก', icon: 'bed', color: '#5b6ee1' },
  { id: 2, code: 'food', nameTh: 'อาหาร', icon: 'utensils', color: '#e2732d' },
]);

vi.mock('../src/modules/trips/trips.repository.js', () => ({
  findMembership: vi.fn(async (tripId, userId) => {
    const m = db.memberships.find((x) => x.tripId === tripId && x.userId === userId);
    return m
      ? {
          trip: {
            id: tripId,
            status: 'active',
            timezone: 'Asia/Bangkok',
            currency: 'THB',
            budgetAmount: db.budgetAmount,
          },
          member: { id: m.id, role: m.role },
        }
      : null;
  }),
}));

vi.mock('../src/modules/expense-categories/expense-categories.repository.js', () => ({
  listActiveCategories: vi.fn(async () => categories),
  findCategoriesByIds: vi.fn(async (ids) => categories.filter((c) => ids.includes(c.id))),
  findActiveCategory: vi.fn(async (id) => categories.find((c) => c.id === id) ?? null),
}));

vi.mock('../src/modules/expenses/expenses.repository.js', async () => {
  const { Prisma } = await import('@prisma/client');
  const sum = (rows) => rows.reduce((acc, e) => acc.plus(e.amount), new Prisma.Decimal(0));
  const view = (row) => ({
    id: row.id,
    clientId: row.clientId,
    amount: row.amount,
    description: row.description ?? null,
    spentAt: row.spentAt,
    category: categories.find((c) => c.id === row.categoryId),
    paidBy: db.members.find((m) => m.id === row.paidByMemberId),
  });
  const live = (tripId, { categoryId, paidByMemberId } = {}) =>
    db.expenses
      .filter((e) => e.tripId === tripId && !e.deletedAt)
      .filter((e) => !categoryId || e.categoryId === categoryId)
      .filter((e) => !paidByMemberId || e.paidByMemberId === paidByMemberId)
      .sort((a, b) => b.spentAt - a.spentAt || b.id - a.id);
  return {
    findMemberInTrip: vi.fn(async (tripId, memberId) => {
      const m = db.members.find((x) => x.id === memberId && x.tripId === tripId);
      return m ? { id: m.id } : null;
    }),
    findByClientId: vi.fn(async (tripId, clientId) => {
      if (db.simulateRace) return null;
      const row = live(tripId).find((e) => e.clientId === clientId);
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
    listExpenses: vi.fn(async (tripId, { cursor, limit, ...filters }) => {
      const rows = live(tripId, filters);
      const start = cursor ? rows.findIndex((e) => e.id === cursor) + 1 : 0;
      return rows.slice(start, start + limit).map(view);
    }),
    listAmountsForDays: vi.fn(async (tripId, filters) =>
      live(tripId, filters).map(({ spentAt, amount }) => ({ spentAt, amount })),
    ),
    findExpense: vi.fn(async (tripId, id) => {
      const row = live(tripId).find((e) => e.id === id);
      return row ? view(row) : null;
    }),
    updateExpense: vi.fn(async (tripId, id, data) => {
      const row = live(tripId).find((e) => e.id === id);
      if (!row) return null;
      Object.assign(row, data, data.amount && { amount: Number(data.amount).toFixed(2) });
      return view(row);
    }),
    sumTrip: vi.fn(async (tripId) => {
      const rows = live(tripId);
      return { total: sum(rows), count: rows.length };
    }),
    sumByCategory: vi.fn(async (tripId) => {
      const ids = [...new Set(live(tripId).map((e) => e.categoryId))];
      return ids.map((categoryId) => {
        const rows = live(tripId, { categoryId });
        return { categoryId, total: sum(rows), count: rows.length };
      });
    }),
    sumPaidByMember: vi.fn(async (tripId) =>
      db.members
        .filter((m) => m.tripId === tripId)
        .sort((a, b) => a.id - b.id)
        .map((m) => ({
          memberId: m.id,
          displayName: m.displayName,
          paid: sum(live(tripId, { paidByMemberId: m.id })),
        })),
    ),
    softDeleteExpense: vi.fn(async (tripId, id) => {
      const row = live(tripId).find((e) => e.id === id);
      if (row) row.deletedAt = new Date();
      return Boolean(row);
    }),
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
  db.budgetAmount = null;
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

// เพิ่มรายจ่ายตรงลงฐานปลอม ไม่ผ่าน API ให้ test อ่านง่าย
function seed(rows) {
  for (const row of rows) {
    db.expenses.push({
      id: db.nextId++,
      tripId: TRIP,
      categoryId: 2,
      paidByMemberId: 100,
      clientId: null,
      ...row,
      spentAt: new Date(row.spentAt),
    });
  }
}

function get(userId, query = '', tripId = TRIP) {
  return request(app)
    .get(`/api/trips/${tripId}/expenses${query}`)
    .set('Authorization', auth(userId));
}

describe('GET /api/trips/:tripId/expenses', () => {
  it('เรียงใหม่ไปเก่าและจำกัดจำนวนด้วย limit', async () => {
    seed([
      { amount: '1.00', spentAt: '2026-10-10T01:00:00Z' },
      { amount: '2.00', spentAt: '2026-10-10T03:00:00Z' },
    ]);

    const res = await get(users.viewer, '?limit=1');

    expect(res.status).toBe(200);
    expect(res.body.data.map((e) => e.amount)).toEqual(['2.00']);
  });

  it('แบ่งหน้าด้วย cursor ไม่ซ้ำไม่ข้าม หน้าสุดท้าย nextCursor เป็น null', async () => {
    seed(
      ['1', '2', '3', '4', '5'].map((n) => ({
        amount: `${n}.00`,
        spentAt: `2026-10-10T0${n}:00:00Z`,
      })),
    );

    const first = await get(users.owner, '?limit=2');
    const second = await get(users.owner, `?limit=2&cursor=${first.body.meta.nextCursor}`);
    const last = await get(users.owner, `?limit=2&cursor=${second.body.meta.nextCursor}`);

    expect(first.body.data.map((e) => e.amount)).toEqual(['5.00', '4.00']);
    expect(second.body.data.map((e) => e.amount)).toEqual(['3.00', '2.00']);
    expect(last.body.data.map((e) => e.amount)).toEqual(['1.00']);
    expect(last.body.meta.nextCursor).toBeNull();
  });

  it('กรองตามหมวดและคนจ่าย ยอดรายวันคิดจากชุดที่กรองแล้ว', async () => {
    seed([
      { amount: '100.00', categoryId: 1, spentAt: '2026-10-10T05:00:00Z' },
      { amount: '40.00', paidByMemberId: 102, spentAt: '2026-10-10T06:00:00Z' },
      { amount: '60.00', spentAt: '2026-10-10T07:00:00Z' },
    ]);

    const food = await get(users.owner, '?categoryId=2');
    expect(food.body.data.map((e) => e.amount)).toEqual(['60.00', '40.00']);
    expect(food.body.meta.days).toEqual([{ date: '2026-10-10', total: '100.00', count: 2 }]);

    const friend = await get(users.owner, '?paidByMemberId=102&categoryId=2');
    expect(friend.body.data.map((e) => e.amount)).toEqual(['40.00']);
  });

  it('ยอดรายวันแบ่งวันตาม timezone ของทริป รวมทุกหน้า และไม่มีเศษทศนิยมเพี้ยน', async () => {
    seed([
      // 23:30 เวลาไทยของวันที่ 10 = 16:30 UTC
      { amount: '0.10', spentAt: '2026-10-10T16:30:00Z' },
      { amount: '0.20', spentAt: '2026-10-10T16:40:00Z' },
      // 00:10 เวลาไทยของวันที่ 11 = 17:10 UTC ของวันที่ 10
      { amount: '50.00', spentAt: '2026-10-10T17:10:00Z' },
    ]);

    const res = await get(users.owner, '?limit=1');

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.days).toEqual([
      { date: '2026-10-11', total: '50.00', count: 1 },
      { date: '2026-10-10', total: '0.30', count: 2 },
    ]);
  });

  it('ไม่แสดงรายการที่ถูกลบ ไม่มีรายจ่าย days เป็น []', async () => {
    seed([{ amount: '9.00', spentAt: '2026-10-10T05:00:00Z', deletedAt: new Date() }]);

    const res = await get(users.owner);

    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toEqual({ nextCursor: null, days: [] });
  });

  it('ตัวกรองที่ไม่ใช่ตัวเลข ตอบ 422 คนนอกทริปได้ 404', async () => {
    expect((await get(users.owner, '?categoryId=abc')).status).toBe(422);
    expect((await get(users.outsider)).status).toBe(404);
  });
});

function patch(userId, expenseId, body, tripId = TRIP) {
  return request(app)
    .patch(`/api/trips/${tripId}/expenses/${expenseId}`)
    .set('Authorization', auth(userId))
    .send(body);
}

function del(userId, expenseId, tripId = TRIP) {
  return request(app)
    .delete(`/api/trips/${tripId}/expenses/${expenseId}`)
    .set('Authorization', auth(userId));
}

describe('PATCH /api/trips/:tripId/expenses/:expenseId', () => {
  beforeEach(() => {
    seed([{ amount: '50.00', description: 'น้ำ', spentAt: '2026-10-10T05:00:00Z' }]);
  });

  it('แก้บางช่องได้ ช่องที่ไม่ส่งคงเดิม ส่ง description ว่าง = ลบ', async () => {
    const res = await patch(users.owner, 1, {
      amount: '75.5',
      categoryId: 1,
      paidByMemberId: 102,
      description: '',
      spentAt: '2026-10-10T20:00:00+07:00',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: 1,
      amount: '75.50',
      description: null,
      category: { code: 'accommodation' },
      paidBy: { id: 102 },
      spentAt: '2026-10-10T13:00:00.000Z',
    });

    const amountOnly = await patch(users.owner, 1, { amount: '80' });
    expect(amountOnly.body.data).toMatchObject({ amount: '80.00', paidBy: { id: 102 } });
  });

  it('ตรวจค่าเหมือนตอนเพิ่ม: เงินศูนย์ หมวดไม่มีจริง คนจ่ายทริปอื่น ตอบ 422', async () => {
    expect((await patch(users.owner, 1, { amount: '0' })).status).toBe(422);

    const category = await patch(users.owner, 1, { categoryId: 99 });
    expect(category.body.error.details[0].field).toBe('categoryId');

    const payer = await patch(users.owner, 1, { paidByMemberId: 200 });
    expect(payer.body.error.details[0].field).toBe('paidByMemberId');

    expect(db.expenses[0].amount).toBe('50.00');
  });

  it('รายการของทริปอื่นหรือที่ถูกลบแล้ว ตอบ 404 EXPENSE_NOT_FOUND', async () => {
    db.memberships.push({ id: 201, tripId: OTHER_TRIP, userId: users.owner, role: 'owner' });

    const otherTrip = await patch(users.owner, 1, { amount: '1' }, OTHER_TRIP);
    expect(otherTrip.status).toBe(404);
    expect(otherTrip.body.error.code).toBe('EXPENSE_NOT_FOUND');

    await del(users.owner, 1);
    expect((await patch(users.owner, 1, { amount: '1' })).status).toBe(404);
  });

  it('viewer แก้ไม่ได้ (403)', async () => {
    expect((await patch(users.viewer, 1, { amount: '1' })).status).toBe(403);
  });
});

describe('DELETE /api/trips/:tripId/expenses/:expenseId', () => {
  beforeEach(() => {
    seed([{ amount: '50.00', spentAt: '2026-10-10T05:00:00Z', clientId: valid().clientId }]);
  });

  it('soft delete ตอบ 204 แถวยังอยู่ ลบซ้ำได้ 404', async () => {
    const res = await del(users.owner, 1);

    expect(res.status).toBe(204);
    expect(db.expenses[0].deletedAt).toBeInstanceOf(Date);
    expect((await get(users.owner)).body.data).toEqual([]);
    expect((await del(users.owner, 1)).status).toBe(404);
  });

  it('ส่ง clientId ของรายการที่ลบไปแล้วซ้ำ ไม่สร้างกลับมาใหม่', async () => {
    await del(users.owner, 1);

    const retry = await post(users.owner, valid());

    expect(retry.status).toBe(404);
    expect(db.expenses.filter((e) => !e.deletedAt)).toHaveLength(0);
  });

  it('viewer ลบไม่ได้ (403) คนนอกทริปได้ 404', async () => {
    expect((await del(users.viewer, 1)).status).toBe(403);
    expect((await del(users.outsider, 1)).status).toBe(404);
    expect(db.expenses[0].deletedAt).toBeUndefined();
  });
});

describe('GET /api/trips/:tripId/expenses/summary', () => {
  const summary = async (userId = users.viewer) =>
    request(app).get(`/api/trips/${TRIP}/expenses/summary`).set('Authorization', auth(userId));

  it('ยังไม่มีรายจ่ายและไม่ได้ตั้งงบ ได้ศูนย์และ null ไม่ error', async () => {
    const res = await summary();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      currency: 'THB',
      budgetAmount: null,
      totalSpent: '0.00',
      remaining: null,
      budgetUsedPercent: null,
      expenseCount: 0,
      memberCount: 2,
      perPerson: '0.00',
      byCategory: [],
      byDay: [],
      byMember: [
        { memberId: 100, displayName: 'Owner', paid: '0.00', share: '0.00', balance: '0.00' },
        { memberId: 102, displayName: 'เพื่อน 1', paid: '0.00', share: '0.00', balance: '0.00' },
      ],
      settlements: [],
    });
  });

  it('รวมยอด งบคงเหลือ เปอร์เซ็นต์ ตามหมวดเรียงมากไปน้อย และรายวันเรียงตามลำดับเดินทาง', async () => {
    db.budgetAmount = '1000.00';
    seed([
      { amount: '0.10', categoryId: 2, spentAt: '2026-10-10T05:00:00Z' },
      { amount: '0.20', categoryId: 2, spentAt: '2026-10-10T06:00:00Z' },
      { amount: '600.00', categoryId: 1, spentAt: '2026-10-11T05:00:00Z' },
      { amount: '1.00', deletedAt: new Date(), spentAt: '2026-10-11T05:00:00Z' },
    ]);

    const { data } = (await summary()).body;

    expect(data).toMatchObject({
      totalSpent: '600.30',
      remaining: '399.70',
      budgetUsedPercent: 60,
      expenseCount: 3,
      perPerson: '300.15',
    });
    expect(data.byCategory).toEqual([
      {
        categoryId: 1,
        code: 'accommodation',
        name: 'ที่พัก',
        icon: 'bed',
        total: '600.00',
        count: 1,
        percent: 100,
      },
      {
        categoryId: 2,
        code: 'food',
        name: 'อาหาร',
        icon: 'utensils',
        total: '0.30',
        count: 2,
        percent: 0,
      },
    ]);
    expect(data.byDay).toEqual([
      { date: '2026-10-10', total: '0.30', count: 2 },
      { date: '2026-10-11', total: '600.00', count: 1 },
    ]);
  });

  it('เกินงบ remaining ติดลบ เปอร์เซ็นต์เกิน 100 เฉลี่ยต่อคนปัดเป็นสตางค์', async () => {
    db.budgetAmount = '100.00';
    db.members.push({ id: 103, tripId: TRIP, displayName: 'เพื่อน 2' });
    seed([{ amount: '100.01', spentAt: '2026-10-10T05:00:00Z' }]);

    const { data } = (await summary()).body;

    expect(data).toMatchObject({
      remaining: '-0.01',
      budgetUsedPercent: 100,
      memberCount: 3,
      // 100.01 / 3 = 33.336... ปัดเป็น 33.34
      perPerson: '33.34',
    });
  });

  it('งบเป็น 0 เปอร์เซ็นต์เป็น null ไม่หารด้วยศูนย์', async () => {
    db.budgetAmount = '0.00';
    seed([{ amount: '5.00', spentAt: '2026-10-10T05:00:00Z' }]);

    const { data } = (await summary()).body;

    expect(data).toMatchObject({ remaining: '-5.00', budgetUsedPercent: null });
  });

  it('ใครจ่ายเท่าไหร่และยอดเคลียร์ ไม่นับรายการที่ลบ เศษสตางค์ลงคนแรก', async () => {
    db.members.push({ id: 103, tripId: TRIP, displayName: 'เพื่อน 2' });
    seed([
      { amount: '100.00', paidByMemberId: 102, spentAt: '2026-10-10T05:00:00Z' },
      { amount: '0.01', paidByMemberId: 100, spentAt: '2026-10-10T06:00:00Z' },
      {
        amount: '999.00',
        paidByMemberId: 103,
        spentAt: '2026-10-10T07:00:00Z',
        deletedAt: new Date(),
      },
    ]);

    const { data } = (await summary()).body;

    // 100.01 / 3 = 33.33 เศษ 2 สตางค์ → Owner (id น้อยสุด) รับ 33.35
    expect(data.byMember).toEqual([
      { memberId: 100, displayName: 'Owner', paid: '0.01', share: '33.35', balance: '-33.34' },
      { memberId: 102, displayName: 'เพื่อน 1', paid: '100.00', share: '33.33', balance: '66.67' },
      { memberId: 103, displayName: 'เพื่อน 2', paid: '0.00', share: '33.33', balance: '-33.33' },
    ]);
    expect(data.settlements).toEqual([
      { fromMemberId: 100, toMemberId: 102, amount: '33.34' },
      { fromMemberId: 103, toMemberId: 102, amount: '33.33' },
    ]);
  });

  it('คนนอกทริปได้ 404', async () => {
    expect((await summary(users.outsider)).status).toBe(404);
  });
});
