import { AppError } from '../lib/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError('NOT_FOUND', 404, `ไม่พบ ${req.method} ${req.path}`));
}
