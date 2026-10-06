import { AppError } from '../../lib/AppError.js';
import { dayCount, parseDateOnly } from '../../utils/datetime.js';
import { subtractMoney } from '../../utils/money.js';
import * as usersRepository from '../users/users.repository.js';
import * as tripsRepository from './trips.repository.js';

// ลำดับสถานะที่อนุญาต (API.md §5) completed → active มีไว้เผื่อกดจบทริปผิด
const TRANSITIONS = {
  planning: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: ['active'],
  cancelled: [],
};

function withDayCount(trip) {
  return {
    ...trip,
    dayCount: dayCount(parseDateOnly(trip.startDate), parseDateOnly(trip.endDate)),
  };
}

function toMemberResponse(member, currentUserId) {
  return {
    id: member.id,
    displayName: member.displayName,
    role: member.role,
    isMe: member.userId === currentUserId,
    isGuest: member.userId === null,
  };
}

export async function listTrips(userId, filters) {
  const trips = await tripsRepository.listTripsForUser(userId, filters);
  const spentByTrip = await tripsRepository.sumExpensesByTrip(trips.map((trip) => trip.id));
  return trips.map((trip) => ({
    ...withDayCount(trip),
    totalSpent: spentByTrip.get(trip.id) ?? '0.00',
  }));
}

export async function getTrip(tripId, currentUserId) {
  const trip = await tripsRepository.findTripWithMembers(tripId);
  if (!trip) throw new AppError('TRIP_NOT_FOUND', 404, 'ไม่พบทริปนี้');

  const totalSpent = await tripsRepository.sumExpenses(tripId);
  const members = trip.members.map((m) => toMemberResponse(m, currentUserId));

  return {
    ...withDayCount(trip),
    myRole: members.find((m) => m.isMe)?.role ?? null,
    totalSpent,
    // ไม่ได้ตั้งงบ = null, ใช้เกินงบ = ติดลบ (เหมือน summary ใน API.md §9)
    remaining: trip.budgetAmount === null ? null : subtractMoney(trip.budgetAmount, totalSpent),
    members,
  };
}

// ผู้สร้างเป็น owner และใช้ชื่อที่แสดงของบัญชีเป็นชื่อในทริป
// guest ที่ส่งมาเป็น editor เพราะคนจดอาจจดแทนเพื่อนได้ทุกอย่าง (role มีผลเมื่อเชิญเข้าระบบใน phase ถัดไป)
export async function createTrip(userId, { members: guests, ...fields }) {
  const user = await usersRepository.findUserById(userId);
  if (!user) throw new AppError('UNAUTHENTICATED', 401, 'กรุณาเข้าสู่ระบบอีกครั้ง');

  const tripId = await tripsRepository.createTrip({
    ...fields,
    createdByUserId: userId,
    members: [
      { userId, displayName: user.displayName, role: 'owner' },
      ...guests.map((guest) => ({ displayName: guest.displayName, role: 'editor' })),
    ],
  });

  return getTrip(tripId, userId);
}

export async function updateTrip(trip, changes, currentUserId) {
  const startDate = changes.startDate ?? trip.startDate;
  const endDate = changes.endDate ?? trip.endDate;

  // ส่งมาแค่วันใดวันหนึ่ง schema เช็กเทียบกันเองไม่ได้ ต้องเทียบกับค่าที่มีอยู่
  if (endDate < startDate) {
    throw new AppError('VALIDATION_ERROR', 422, 'ข้อมูลไม่ถูกต้อง', [
      { field: 'endDate', message: 'วันจบต้องไม่ก่อนวันเริ่ม' },
    ]);
  }

  if (startDate !== trip.startDate || endDate !== trip.endDate) {
    const affectedItems = await tripsRepository.countItineraryItemsOutside(
      trip.id,
      startDate,
      endDate,
    );
    if (affectedItems > 0) {
      throw new AppError(
        'DATE_OUT_OF_RANGE',
        409,
        `มีรายการในแผน ${affectedItems} รายการอยู่นอกช่วงวันใหม่ ย้ายหรือลบรายการเหล่านั้นก่อน`,
        { affectedItems },
      );
    }
  }

  await tripsRepository.updateTrip(trip.id, changes);
  return getTrip(trip.id, currentUserId);
}

export async function changeStatus(trip, status, currentUserId) {
  if (status !== trip.status) {
    if (!TRANSITIONS[trip.status].includes(status)) {
      throw new AppError('INVALID_STATUS_TRANSITION', 409, 'เปลี่ยนสถานะทริปแบบนี้ไม่ได้', {
        from: trip.status,
        to: status,
      });
    }

    const changes = { status };
    if (status === 'active') {
      changes.startedAt = trip.startedAt ?? new Date();
      changes.completedAt = null;
    }
    if (status === 'completed') changes.completedAt = new Date();

    await tripsRepository.updateTrip(trip.id, changes);
  }

  return getTrip(trip.id, currentUserId);
}

export async function deleteTrip(trip) {
  await tripsRepository.softDeleteTrip(trip.id);
}
