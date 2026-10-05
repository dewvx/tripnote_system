import { AppError } from '../lib/AppError.js';
import { TokenExpiredError, verifyAccessToken } from '../lib/jwt.js';

// อ่าน `Authorization: Bearer <token>` แล้วแนบ req.user = { id }
// TOKEN_EXPIRED แยกจาก UNAUTHENTICATED เพื่อให้ client รู้ว่าควรลอง refresh
export function authenticate(req, _res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('UNAUTHENTICATED', 401, 'กรุณาเข้าสู่ระบบ'));
  }

  try {
    const { userId } = verifyAccessToken(token);
    req.user = { id: userId };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(new AppError('TOKEN_EXPIRED', 401, 'เซสชันหมดอายุ'));
    }
    next(new AppError('UNAUTHENTICATED', 401, 'กรุณาเข้าสู่ระบบ'));
  }
}
