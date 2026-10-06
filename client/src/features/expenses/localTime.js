// "YYYY-MM-DDTHH:mm" ตามเวลาของเครื่อง สำหรับ <input type="datetime-local">
// ค่าที่ได้จาก input ส่งเข้า new Date() จะถูกตีความเป็นเวลาของเครื่องเหมือนกัน แปลงไปกลับได้ตรง
export function toLocalInputValue(date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
