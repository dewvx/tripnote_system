import { AppError } from '../../lib/AppError.js';
import * as usersRepository from './users.repository.js';

export async function getMe(userId) {
  const user = await usersRepository.findUserById(userId);
  // token ยังไม่หมดอายุแต่บัญชีไม่มีแล้ว ให้ถือว่าไม่ได้ login
  if (!user) throw new AppError('UNAUTHENTICATED', 401, 'กรุณาเข้าสู่ระบบอีกครั้ง');
  return user;
}
