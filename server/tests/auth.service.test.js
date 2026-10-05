import { createHash } from 'node:crypto';

import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// unit test ของ service ล้วน ๆ: แทน repository ด้วย vi.fn แล้วเช็กว่า service เรียกด้วยค่าที่ถูกต้อง
// ส่วนพฤติกรรมผ่าน HTTP (cookie, status code) อยู่ใน auth.test.js
vi.mock('../src/modules/users/users.repository.js', () => ({
  findUserById: vi.fn(),
  findUserWithPasswordByEmail: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('../src/modules/auth/auth.repository.js', () => ({
  createRefreshToken: vi.fn(),
  findRefreshTokenByHash: vi.fn(),
  rotateRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllRefreshTokens: vi.fn(),
}));

const usersRepository = await import('../src/modules/users/users.repository.js');
const authRepository = await import('../src/modules/auth/auth.repository.js');
const authService = await import('../src/modules/auth/auth.service.js');
const { verifyAccessToken } = await import('../src/lib/jwt.js');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const alice = { id: 1, email: 'alice@example.com', displayName: 'Alice' };
const DAY = 24 * 60 * 60 * 1000;

function storedToken(overrides = {}) {
  return {
    id: 10,
    userId: alice.id,
    tokenHash: sha256('old-token'),
    expiresAt: new Date(Date.now() + DAY),
    revokedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  authRepository.createRefreshToken.mockImplementation(async (data) => ({ id: 99, ...data }));
  authRepository.rotateRefreshToken.mockImplementation(async (_oldId, next) => ({
    id: 11,
    ...next,
  }));
});

describe('password hashing', () => {
  it('register เก็บ bcrypt hash ที่ verify กับรหัสเดิมได้ และไม่เก็บรหัสดิบ', async () => {
    usersRepository.createUser.mockResolvedValue(alice);

    await authService.register({ ...alice, password: 'correct-horse' });

    const { passwordHash } = usersRepository.createUser.mock.calls[0][0];
    expect(passwordHash).not.toBe('correct-horse');
    expect(passwordHash).toMatch(/^\$2b\$12\$/);
    expect(await bcrypt.compare('correct-horse', passwordHash)).toBe(true);
    expect(await bcrypt.compare('wrong-horse', passwordHash)).toBe(false);
  });

  it('hash ของรหัสเดียวกันสองครั้งไม่ซ้ำกัน (มี salt)', async () => {
    usersRepository.createUser.mockResolvedValue(alice);

    await authService.register({ ...alice, password: 'same-password' });
    await authService.register({ ...alice, password: 'same-password' });

    const [first, second] = usersRepository.createUser.mock.calls.map(([d]) => d.passwordHash);
    expect(first).not.toBe(second);
  });
});

describe('register', () => {
  it('คืน access token ของผู้ใช้ใหม่ และบันทึก refresh token เป็น hash พร้อม userAgent', async () => {
    usersRepository.createUser.mockResolvedValue(alice);

    const result = await authService.register(
      { ...alice, password: 'correct-horse' },
      { userAgent: 'Mobile Safari' },
    );

    expect(result.user).toEqual(alice);
    expect(verifyAccessToken(result.accessToken).userId).toBe(alice.id);

    const record = authRepository.createRefreshToken.mock.calls[0][0];
    expect(record).toMatchObject({ userId: alice.id, userAgent: 'Mobile Safari' });
    expect(record.tokenHash).toBe(sha256(result.refreshToken));
    expect(record.tokenHash).not.toBe(result.refreshToken);
    expect(result.refreshExpiresAt).toEqual(record.expiresAt);
  });

  it('ส่งต่อ error จาก repository เช่นอีเมลซ้ำ โดยไม่สร้าง refresh token', async () => {
    const { AppError } = await import('../src/lib/AppError.js');
    usersRepository.createUser.mockRejectedValue(new AppError('EMAIL_TAKEN', 409, 'ซ้ำ'));

    await expect(
      authService.register({ ...alice, password: 'correct-horse' }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
    expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
  });
});

describe('login', () => {
  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('correct-horse', 4);
    usersRepository.findUserWithPasswordByEmail.mockImplementation(async (email) =>
      email === alice.email ? { ...alice, passwordHash } : null,
    );
  });

  it('รหัสถูก ได้เซสชันใหม่ และ user ที่คืนไม่มี passwordHash', async () => {
    const result = await authService.login({ email: alice.email, password: 'correct-horse' });

    expect(result.user).toEqual(alice);
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(verifyAccessToken(result.accessToken).userId).toBe(alice.id);
    expect(authRepository.createRefreshToken).toHaveBeenCalledOnce();
  });

  it('รหัสผิด throw INVALID_CREDENTIALS และไม่สร้าง refresh token', async () => {
    await expect(
      authService.login({ email: alice.email, password: 'wrong-horse' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
    expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
  });

  it('อีเมลที่ไม่มีได้ error เดียวกับรหัสผิด', async () => {
    const wrongPassword = await authService
      .login({ email: alice.email, password: 'wrong-horse' })
      .catch((e) => e);
    const unknownEmail = await authService
      .login({ email: 'nobody@example.com', password: 'correct-horse' })
      .catch((e) => e);

    expect(unknownEmail.code).toBe(wrongPassword.code);
    expect(unknownEmail.message).toBe(wrongPassword.message);
  });
});

describe('refresh token rotation', () => {
  beforeEach(() => {
    usersRepository.findUserById.mockResolvedValue(alice);
  });

  it('ค้นด้วย hash ของ token, เพิกถอนตัวเก่า และออก token ใหม่ที่ไม่ซ้ำตัวเดิม', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue(storedToken());

    const result = await authService.refresh('old-token', { userAgent: 'Chrome' });

    expect(authRepository.findRefreshTokenByHash).toHaveBeenCalledWith(sha256('old-token'));
    const [oldId, next] = authRepository.rotateRefreshToken.mock.calls[0];
    expect(oldId).toBe(10);
    expect(next).toMatchObject({ userId: alice.id, userAgent: 'Chrome' });
    expect(result.refreshToken).not.toBe('old-token');
    expect(next.tokenHash).toBe(sha256(result.refreshToken));
    expect(result.user).toEqual(alice);
    expect(verifyAccessToken(result.accessToken).userId).toBe(alice.id);
  });

  it('ไม่มี token throw UNAUTHENTICATED โดยไม่แตะฐานข้อมูล', async () => {
    await expect(authService.refresh(undefined)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(authRepository.findRefreshTokenByHash).not.toHaveBeenCalled();
  });

  it('token ที่ไม่รู้จัก throw UNAUTHENTICATED', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(authService.refresh('unknown')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('token ที่ถูกเพิกถอนแล้วกลับมาใช้ซ้ำ เพิกถอนทุกเซสชันของผู้ใช้', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue(
      storedToken({ revokedAt: new Date(Date.now() - 1000) }),
    );

    await expect(authService.refresh('old-token')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(authRepository.revokeAllRefreshTokens).toHaveBeenCalledWith(alice.id);
    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('token หมดอายุ throw UNAUTHENTICATED และไม่หมุน', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue(
      storedToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(authService.refresh('old-token')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled();
    expect(authRepository.revokeAllRefreshTokens).not.toHaveBeenCalled();
  });

  it('ผู้ใช้ถูกลบไปแล้ว throw UNAUTHENTICATED', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue(storedToken());
    usersRepository.findUserById.mockResolvedValue(null);

    await expect(authService.refresh('old-token')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(authRepository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('แพ้ race (มี request อื่นหมุนไปก่อน) throw UNAUTHENTICATED แต่ไม่เพิกถอนทุกเซสชัน', async () => {
    authRepository.findRefreshTokenByHash.mockResolvedValue(storedToken());
    authRepository.rotateRefreshToken.mockResolvedValue(null);

    await expect(authService.refresh('old-token')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(authRepository.revokeAllRefreshTokens).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('เพิกถอน token ด้วย hash ไม่ใช่ค่าดิบ', async () => {
    await authService.logout('some-token');

    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith(sha256('some-token'));
  });

  it('ไม่มี token ก็จบเฉย ๆ ไม่ throw และไม่แตะฐานข้อมูล', async () => {
    await expect(authService.logout(undefined)).resolves.toBeUndefined();
    expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
  });
});
