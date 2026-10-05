import * as usersService from './users.service.js';

export async function getMe(req, res) {
  const user = await usersService.getMe(req.user.id);
  res.json({ data: user });
}
