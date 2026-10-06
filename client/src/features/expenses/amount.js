// ตรวจจำนวนเงินที่พิมพ์ก่อนส่ง กฎเดียวกับ expenses.schema.js ฝั่ง server
// คืน { amount } เป็น string พร้อมส่ง หรือ { error } เป็นข้อความไว้แสดงใต้ช่อง
export function parseAmountInput(raw) {
  const value = String(raw ?? '')
    .replace(/[,\s]/g, '')
    .replace(/\.$/, '');

  if (value === '') return { error: 'กรุณาใส่จำนวนเงิน' };
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
    return { error: 'จำนวนเงินต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง' };
  }
  if (!/[1-9]/.test(value)) return { error: 'จำนวนเงินต้องมากกว่า 0' };
  return { amount: value };
}
