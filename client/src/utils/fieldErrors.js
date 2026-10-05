// แปลง error.details จาก API เป็น { [field]: message } ไว้แสดงใต้ช่องที่ผิด
export function fieldErrors(error) {
  const result = {};
  for (const { field, message } of error?.details ?? []) {
    result[field] ??= message;
  }
  return result;
}
