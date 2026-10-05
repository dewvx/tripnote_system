import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// แทน repository ด้วยฐานข้อมูลปลอมใน memory
// test จึงวิ่งผ่าน route → middleware → controller → service ของจริงทั้งหมด โดยไม่ต้องมี MySQL
const db = vi.hoisted(() => ({ users: [], tokens: [], nextId: 1 }));

vi.mock('../src/modules/users/users.repository.js', async () => {
  const { AppError } = await import('../src/lib/AppError.js');
  const toPublic = ({ id, email, displayName }) => ({ id, email, displayName });
  return {
    findUserById: vi.fn(async (id) => {
      const user = db.users.find((u) => u.id === id);
      return user ? toPublic(user) : null;
    }),
    findUserWithPasswordByEmail: vi.fn(async (email) => {
      const user = db.users.find((u) => u.email === email);
      return user ? { ...toPublic(user), passwordHash: user.passwordHash } : null;
    }),
    createUser: vi.fn(async (data) => {
      if (db.users.some((u) => u.email === data.email)) {
        throw new AppError('EMAIL_TAKEN', 409, 'อีเมลนี้ถูกใช้สมัครแล้ว');
      }
      const user = { id: db.nextId++, ...data };
      db.users.push(user);
      return toPublic(user);
    }),
  };
});

vi.mock('../src/modules/auth/auth.repository.js', () => {
  const create = (data) => {
    const token = { id: db.nextId++, revokedAt: null, ...data };
    db.tokens.push(token);
    return token;
  };
  const revokeWhere = (match) => {
    for (const t of db.tokens) if (match(t) && !t.revokedAt) t.revokedAt = new Date();
  };
  return {
    createRefreshToken: vi.fn(async (data) => create(data)),
    findRefreshTokenByHash: vi.fn(async (hash) => db.tokens.find((t) => t.tokenHash === hash)),
    rotateRefreshToken: vi.fn(async (oldId, next) => {
      const old = db.tokens.find((t) => t.id === oldId);
      if (old.revokedAt) return null;
      old.revokedAt = new Date();
      return create(next);
    }),
    revokeRefreshToken: vi.fn(async (hash) => revokeWhere((t) => t.tokenHash === hash)),
    revokeAllRefreshTokens: vi.fn(async (userId) => revokeWhere((t) => t.userId === userId)),
  };
});

const { default: app } = await import('../src/app.js');
const { resetRateLimits } = await import('../src/middlewares/rateLimit.js');

const alice = { email: 'alice@example.com', password: 'correct-horse', displayName: 'Alice' };

function refreshCookie(res) {
  const cookie = res.headers['set-cookie']?.find((c) => c.startsWith('refresh_token='));
  return cookie?.split(';')[0];
}

async function register(body = alice) {
  return request(app).post('/api/auth/register').send(body);
}

beforeEach(() => {
  db.users.length = 0;
  db.tokens.length = 0;
  db.nextId = 1;
  resetRateLimits();
});

describe('POST /api/auth/register', () => {
  it('สมัครสำเร็จ ได้ access token, user และ refresh cookie แบบ httpOnly', async () => {
    const res = await register({ ...alice, email: '  Alice@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toEqual({ id: 1, email: 'alice@example.com', displayName: 'Alice' });

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('เก็บรหัสผ่านเป็น bcrypt hash ไม่ใช่ข้อความเดิม และไม่ส่ง hash ออกไป', async () => {
    const res = await register();

    expect(db.users[0].passwordHash).toMatch(/^\$2b\$12\$/);
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
    expect(db.tokens[0].tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(refreshCookie(res)).not.toContain(db.tokens[0].tokenHash);
  });

  it('อีเมลซ้ำ ตอบ 409 EMAIL_TAKEN', async () => {
    await register();
    const res = await register();

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('รหัสผ่านสั้นเกินและอีเมลผิดรูปแบบ ตอบ 422 พร้อมชื่อ field', async () => {
    const res = await register({ email: 'nope', password: 'short', displayName: '' });

    expect(res.status).toBe(422);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'displayName']));
  });

  it('รหัสผ่านภาษาไทยที่เกิน 72 byte ถูกปฏิเสธ', async () => {
    const res = await register({ ...alice, password: 'ก'.repeat(25) });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register();
    db.tokens.length = 0;
    resetRateLimits();
  });

  it('login สำเร็จ', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ALICE@example.com', password: alice.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(refreshCookie(res)).toBeDefined();
  });

  it('รหัสผิดกับอีเมลที่ไม่มี ตอบเหมือนกันทุกอย่าง ไม่บอกว่าผิดที่ช่องไหน', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'wrong-password' });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassword.body.error.details).toBeUndefined();
  });

  it('ลองผิดเกิน 10 ครั้งใน 15 นาที ตอบ 429 RATE_LIMITED', async () => {
    const attempt = () =>
      request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'x' });

    for (let i = 0; i < 9; i++) await attempt();
    const res = await attempt();
    expect(res.status).toBe(401);

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('POST /api/auth/refresh', () => {
  it('ได้ access token ใหม่ พร้อม user และหมุน refresh token', async () => {
    const first = refreshCookie(await register());

    const res = await request(app).post('/api/auth/refresh').set('Cookie', first);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(alice.email);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshCookie(res)).not.toBe(first);
    expect(db.tokens[0].revokedAt).not.toBeNull();
  });

  it('ไม่มี cookie ตอบ 401', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('ใช้ token ที่หมุนไปแล้วซ้ำ จะเพิกถอนทุกเซสชันของผู้ใช้นั้น', async () => {
    const stolen = refreshCookie(await register());
    const current = refreshCookie(
      await request(app).post('/api/auth/refresh').set('Cookie', stolen),
    );

    const replay = await request(app).post('/api/auth/refresh').set('Cookie', stolen);
    expect(replay.status).toBe(401);

    // ตัวที่ถูกต้องล่าสุดก็ใช้ไม่ได้แล้ว
    const afterReplay = await request(app).post('/api/auth/refresh').set('Cookie', current);
    expect(afterReplay.status).toBe(401);
  });

  it('token หมดอายุ ตอบ 401', async () => {
    const cookie = refreshCookie(await register());
    db.tokens[0].expiresAt = new Date(Date.now() - 1000);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('เพิกถอน refresh token และล้าง cookie', async () => {
    const cookie = refreshCookie(await register());

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(res.headers['set-cookie'][0]).toMatch(/refresh_token=;/);

    const after = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(after.status).toBe(401);
  });

  it('ไม่มี cookie ก็ตอบ 204 (กดออกซ้ำได้)', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(204);
  });
});

describe('GET /api/users/me', () => {
  it('ใช้ access token แล้วได้ข้อมูลผู้ใช้', async () => {
    const { accessToken } = (await register()).body.data;

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: 1, email: alice.email, displayName: 'Alice' });
  });

  it('ไม่มี token ตอบ 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('token ปลอม ตอบ 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer abc.def.ghi');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('token หมดอายุ ตอบ 401 TOKEN_EXPIRED เพื่อให้ client รู้ว่าต้อง refresh', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    const expired = jwt.sign({ sub: '1' }, process.env.JWT_ACCESS_SECRET, { expiresIn: -10 });

    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });
});
