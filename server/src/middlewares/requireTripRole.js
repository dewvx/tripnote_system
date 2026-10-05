import { AppError } from '../lib/AppError.js';
import * as tripsRepository from '../modules/trips/trips.repository.js';

const RANK = { viewer: 1, editor: 2, owner: 3 };
const MAX_INT = 2_147_483_647;

// ใช้หลัง authenticate กับทุก route ใต้ /api/trips/:tripId
// ไม่ใช่สมาชิก (หรือทริปถูกลบ) → 404 ไม่ใช่ 403 เพื่อไม่บอกว่าทริปนั้นมีอยู่จริง
// role ไม่พอ → 403
// ผ่าน → แนบ req.trip และ req.member ให้ controller ใช้
export function requireTripRole(minRole) {
  return async (req, _res, next) => {
    // id ที่ไม่ใช่ตัวเลข หรือเกินช่วง INT ของ Prisma ถือว่าไม่พบ ไม่ปล่อยให้ Prisma throw เป็น 500
    const tripId = Number(req.params.tripId);
    const isValidId = /^\d{1,10}$/.test(req.params.tripId) && tripId > 0 && tripId <= MAX_INT;
    const membership = isValidId ? await tripsRepository.findMembership(tripId, req.user.id) : null;

    if (!membership) {
      return next(new AppError('TRIP_NOT_FOUND', 404, 'ไม่พบทริปนี้'));
    }
    if (RANK[membership.member.role] < RANK[minRole]) {
      return next(new AppError('FORBIDDEN', 403, 'คุณไม่มีสิทธิ์ทำรายการนี้ในทริปนี้'));
    }

    req.trip = membership.trip;
    req.member = membership.member;
    next();
  };
}
