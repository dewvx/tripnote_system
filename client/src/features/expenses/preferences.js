// จำคนจ่ายล่าสุดต่อทริป เป็นความสะดวกของเครื่องนี้เท่านั้น ไม่ใช่ข้อมูลของทริป
// localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว, ปิด storage) จึงครอบ try/catch และถือว่าไม่มีค่า

const key = (tripId) => `tripnote:lastPayer:${tripId}`;

export function getLastPayerId(tripId) {
  try {
    const value = Number(localStorage.getItem(key(tripId)));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function setLastPayerId(tripId, memberId) {
  try {
    localStorage.setItem(key(tripId), String(memberId));
  } catch {
    // เก็บไม่ได้ก็แค่ครั้งหน้าไม่ได้เลือกไว้ให้
  }
}

// คนจ่ายเริ่มต้น: คนล่าสุดถ้ายังอยู่ในทริป → ตัวเรา → คนแรก
export function defaultPayerId(members, lastPayerId) {
  if (members.some((m) => m.id === lastPayerId)) return lastPayerId;
  return (members.find((m) => m.isMe) ?? members[0])?.id ?? null;
}
