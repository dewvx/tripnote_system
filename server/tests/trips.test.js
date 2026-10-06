import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// แทน repository ด้วยฐานข้อมูลปลอมใน memory เหมือน auth.test.js
// route → authenticate → requireTripRole → validate → controller → service เป็นของจริงทั้งหมด
const db = vi.hoisted(() => ({
  users: [],
  trips: [],
  members: [],
  itemDays: [],
  spent: new Map(),
  nextId: 1,
}));

vi.mock('../src/modules/users/users.repository.js', () => ({
  findUserById: vi.fn(async (id) => db.users.find((u) => u.id === id) ?? null),
}));

vi.mock('../src/modules/trips/trips.repository.js', () => {
  const liveTrip = (id) => db.trips.find((t) => t.id === id && !t.deletedAt);
  const tripFields = ({ deletedAt: _deletedAt, createdByUserId: _by, ...trip }) => trip;
  const memberFields = ({ tripId: _tripId, ...member }) => member;

  return {
    findMembership: vi.fn(async (tripId, userId) => {
      const trip = liveTrip(tripId);
      const member = db.members.find((m) => m.tripId === tripId && m.userId === userId);
      return trip && member ? { trip: tripFields(trip), member: memberFields(member) } : null;
    }),
    listTripsForUser: vi.fn(async (userId, { status } = {}) =>
      db.members
        .filter((m) => m.userId === userId)
        .map((m) => ({ m, trip: liveTrip(m.tripId) }))
        .filter(({ trip }) => trip && (!status || trip.status === status))
        .map(({ m, trip }) => ({
          ...tripFields(trip),
          myRole: m.role,
          memberCount: db.members.filter((x) => x.tripId === trip.id).length,
        })),
    ),
    createTrip: vi.fn(async ({ members, ...fields }) => {
      const trip = {
        id: db.nextId++,
        description: null,
        originName: null,
        budgetAmount: null,
        timezone: 'Asia/Bangkok',
        currency: 'THB',
        status: 'planning',
        startedAt: null,
        completedAt: null,
        deletedAt: null,
        ...fields,
      };
      db.trips.push(trip);
      for (const m of members) {
        db.members.push({ id: db.nextId++, tripId: trip.id, userId: null, ...m });
      }
      return trip.id;
    }),
    findTripWithMembers: vi.fn(async (tripId) => {
      const trip = liveTrip(tripId);
      if (!trip) return null;
      const members = db.members.filter((m) => m.tripId === tripId).map(memberFields);
      return { ...tripFields(trip), members };
    }),
    sumExpenses: vi.fn(async (tripId) => db.spent.get(tripId) ?? '0.00'),
    sumExpensesByTrip: vi.fn(
      async (tripIds) =>
        new Map(tripIds.filter((id) => db.spent.has(id)).map((id) => [id, db.spent.get(id)])),
    ),
    updateTrip: vi.fn(async (tripId, fields) => Object.assign(liveTrip(tripId), fields)),
    softDeleteTrip: vi.fn(async (tripId) => {
      liveTrip(tripId).deletedAt = new Date();
    }),
    countItineraryItemsOutside: vi.fn(
      async (tripId, start, end) =>
        db.itemDays.filter((d) => d.tripId === tripId && (d.day < start || d.day > end)).length,
    ),
  };
});

const { default: app } = await import('../src/app.js');
const { signAccessToken } = await import('../src/lib/jwt.js');

const validTrip = {
  name: 'ทริปทดสอบ',
  destinationName: 'นครราชสีมา',
  startDate: '2026-10-10',
  endDate: '2026-10-12',
  budgetAmount: '7000.00',
  members: [{ displayName: 'เพื่อน 1' }],
};

function addUser(displayName) {
  const user = { id: db.nextId++, email: `${displayName}@example.com`, displayName };
  db.users.push(user);
  return { ...user, auth: `Bearer ${signAccessToken(user.id)}` };
}

function api(user) {
  const withAuth = (req) => req.set('Authorization', user.auth);
  return {
    get: (path) => withAuth(request(app).get(`/api${path}`)),
    post: (path, body) => withAuth(request(app).post(`/api${path}`)).send(body),
    patch: (path, body) => withAuth(request(app).patch(`/api${path}`)).send(body),
    delete: (path) => withAuth(request(app).delete(`/api${path}`)),
  };
}

async function createTrip(user, body = validTrip) {
  const res = await api(user).post('/trips', body);
  expect(res.status).toBe(201);
  return res.body.data;
}

let owner;
let outsider;

beforeEach(() => {
  db.users.length = 0;
  db.trips.length = 0;
  db.members.length = 0;
  db.itemDays.length = 0;
  db.spent.clear();
  db.nextId = 1;
  owner = addUser('Owner');
  outsider = addUser('Outsider');
});

describe('POST /api/trips', () => {
  it('สร้างทริป ผู้สร้างเป็น owner และ guest เป็น editor', async () => {
    const trip = await createTrip(owner);

    expect(trip).toMatchObject({
      name: 'ทริปทดสอบ',
      status: 'planning',
      startDate: '2026-10-10',
      endDate: '2026-10-12',
      dayCount: 3,
      budgetAmount: '7000.00',
      totalSpent: '0.00',
      remaining: '7000.00',
      myRole: 'owner',
    });
    expect(trip.members).toEqual([
      expect.objectContaining({ displayName: 'Owner', role: 'owner', isMe: true, isGuest: false }),
      expect.objectContaining({
        displayName: 'เพื่อน 1',
        role: 'editor',
        isMe: false,
        isGuest: true,
      }),
    ]);
  });

  it('วันจบก่อนวันเริ่ม ตอบ 422 ที่ field endDate', async () => {
    const res = await api(owner).post('/trips', { ...validTrip, endDate: '2026-10-09' });

    expect(res.status).toBe(422);
    expect(res.body.error.details.map((d) => d.field)).toContain('endDate');
  });

  it('ขาดช่องบังคับและงบไม่ใช่ตัวเลข ตอบ 422', async () => {
    const res = await api(owner).post('/trips', { budgetAmount: '12.345' });

    expect(res.status).toBe(422);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'destinationName', 'startDate', 'endDate', 'budgetAmount']),
    );
  });

  it('ไม่ login ตอบ 401', async () => {
    const res = await request(app).post('/api/trips').send(validTrip);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/trips', () => {
  it('เห็นเฉพาะทริปที่ตัวเองเป็นสมาชิก และกรองด้วย status ได้', async () => {
    await createTrip(owner);
    await createTrip(outsider, { ...validTrip, name: 'ของคนอื่น' });

    const all = await api(owner).get('/trips');
    expect(all.status).toBe(200);
    expect(all.body.data.map((t) => t.name)).toEqual(['ทริปทดสอบ']);
    expect(all.body.data[0]).toMatchObject({ myRole: 'owner', memberCount: 2, dayCount: 3 });

    const active = await api(owner).get('/trips?status=active');
    expect(active.body.data).toEqual([]);
  });

  it('มียอดใช้จ่ายรวมของแต่ละทริป ทริปที่ยังไม่มีรายจ่ายเป็น "0.00"', async () => {
    const spent = await createTrip(owner, { ...validTrip, name: 'มีรายจ่าย' });
    await createTrip(owner, { ...validTrip, name: 'ยังไม่จ่าย' });
    db.spent.set(spent.id, '1250.50');

    const res = await api(owner).get('/trips');

    const byName = Object.fromEntries(res.body.data.map((t) => [t.name, t.totalSpent]));
    expect(byName).toEqual({ มีรายจ่าย: '1250.50', ยังไม่จ่าย: '0.00' });
  });
});

describe('สิทธิ์เข้าถึงทริป', () => {
  it('คนที่ไม่ใช่สมาชิก ได้ 404 TRIP_NOT_FOUND ไม่ใช่ 403', async () => {
    const trip = await createTrip(owner);

    for (const res of [
      await api(outsider).get(`/trips/${trip.id}`),
      await api(outsider).patch(`/trips/${trip.id}`, { name: 'แฮก' }),
      await api(outsider).delete(`/trips/${trip.id}`),
    ]) {
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TRIP_NOT_FOUND');
    }
  });

  it('tripId ที่ไม่ใช่ตัวเลขหรือเกินช่วง INT ตอบ 404 ไม่ใช่ 500', async () => {
    for (const id of ['abc', '1.5', '99999999999', '0']) {
      const res = await api(owner).get(`/trips/${id}`);
      expect(res.status).toBe(404);
    }
  });

  it('สมาชิกที่ไม่ใช่ owner แก้หรือลบทริปไม่ได้ ตอบ 403', async () => {
    const trip = await createTrip(owner);
    const editor = addUser('Editor');
    db.members.push({
      id: db.nextId++,
      tripId: trip.id,
      userId: editor.id,
      displayName: 'Editor',
      role: 'editor',
    });

    expect((await api(editor).get(`/trips/${trip.id}`)).status).toBe(200);
    expect((await api(editor).patch(`/trips/${trip.id}`, { name: 'x' })).status).toBe(403);
    expect((await api(editor).delete(`/trips/${trip.id}`)).status).toBe(403);
  });
});

describe('GET /api/trips/:tripId', () => {
  it('งบคงเหลือคิดด้วย Decimal ติดลบได้เมื่อใช้เกินงบ ไม่ตั้งงบเป็น null', async () => {
    const trip = await createTrip(owner, { ...validTrip, budgetAmount: '100.10' });
    const noBudget = await createTrip(owner, { ...validTrip, budgetAmount: '' });

    db.spent.set(trip.id, '70.20');
    expect((await api(owner).get(`/trips/${trip.id}`)).body.data.remaining).toBe('29.90');

    db.spent.set(trip.id, '100.30');
    expect((await api(owner).get(`/trips/${trip.id}`)).body.data.remaining).toBe('-0.20');

    expect((await api(owner).get(`/trips/${noBudget.id}`)).body.data.remaining).toBeNull();
  });
});

describe('PATCH /api/trips/:tripId', () => {
  it('แก้บางช่องได้ ส่งค่าว่างในช่องไม่บังคับ = ลบค่า', async () => {
    const trip = await createTrip(owner, { ...validTrip, originName: 'มหาสารคาม' });

    const res = await api(owner).patch(`/trips/${trip.id}`, {
      name: 'ชื่อใหม่',
      originName: '',
      budgetAmount: '',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'ชื่อใหม่', originName: null, budgetAmount: null });
  });

  it('ส่งแค่วันจบที่ก่อนวันเริ่มเดิม ตอบ 422', async () => {
    const trip = await createTrip(owner);

    const res = await api(owner).patch(`/trips/${trip.id}`, { endDate: '2026-10-01' });

    expect(res.status).toBe(422);
    expect(res.body.error.details[0].field).toBe('endDate');
  });

  it('ย่อช่วงวันจนรายการในแผนหลุดช่วง ตอบ 409 DATE_OUT_OF_RANGE พร้อมจำนวน', async () => {
    const trip = await createTrip(owner);
    db.itemDays.push({ tripId: trip.id, day: '2026-10-12' });

    const res = await api(owner).patch(`/trips/${trip.id}`, { endDate: '2026-10-11' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'DATE_OUT_OF_RANGE',
      details: { affectedItems: 1 },
    });
  });
});

describe('PATCH /api/trips/:tripId/status', () => {
  it('planning → active → completed → active ได้ และบันทึกเวลาเริ่ม/จบ', async () => {
    const trip = await createTrip(owner);
    const path = `/trips/${trip.id}/status`;

    const started = await api(owner).patch(path, { status: 'active' });
    expect(started.body.data.status).toBe('active');
    expect(started.body.data.startedAt).not.toBeNull();

    const completed = await api(owner).patch(path, { status: 'completed' });
    expect(completed.body.data.completedAt).not.toBeNull();

    const reopened = await api(owner).patch(path, { status: 'active' });
    expect(reopened.body.data).toMatchObject({ status: 'active', completedAt: null });
    expect(reopened.body.data.startedAt).toBe(started.body.data.startedAt);
  });

  it('ข้ามขั้น planning → completed ไม่ได้ ตอบ 409', async () => {
    const trip = await createTrip(owner);

    const res = await api(owner).patch(`/trips/${trip.id}/status`, { status: 'completed' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});

describe('DELETE /api/trips/:tripId', () => {
  it('soft delete แล้วทริปหายจากรายการและเข้า URL เดิมได้ 404', async () => {
    const trip = await createTrip(owner);

    const res = await api(owner).delete(`/trips/${trip.id}`);
    expect(res.status).toBe(204);
    expect(db.trips[0].deletedAt).toBeInstanceOf(Date);

    expect((await api(owner).get('/trips')).body.data).toEqual([]);
    expect((await api(owner).get(`/trips/${trip.id}`)).status).toBe(404);
  });
});
