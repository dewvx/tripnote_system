import { Prisma } from '@prisma/client';

import { formatMoney } from '../../utils/money.js';

// ยอดเคลียร์แบบหารเท่าทุกคนทุกรายการ (DATABASE.md §6, FEATURES.md F3.4)
// คิดเป็นสตางค์ทั้งหมดด้วย Prisma.Decimal ไม่ผ่าน JS number (AGENTS.md §6)

const ZERO = new Prisma.Decimal(0);

// members = [{ memberId, displayName, paid }] เรียงตาม id (คนแรกคือคนที่รับเศษ)
// ส่วนที่ต้องจ่ายของทุกคนเท่ากันแบบปัดลงเป็นสตางค์ เศษสตางค์ที่เหลือลงที่สมาชิกคนแรก
// ผลรวมของ share จึงเท่ากับยอดรวมพอดี และผลรวมของ balance เป็นศูนย์พอดี
export function splitEqually(members, total) {
  if (members.length === 0) return [];
  const totalSatang = new Prisma.Decimal(total).times(100);
  const baseSatang = totalSatang.divToInt(members.length);
  const remainderSatang = totalSatang.minus(baseSatang.times(members.length));

  return members.map((member, index) => {
    const shareSatang = index === 0 ? baseSatang.plus(remainderSatang) : baseSatang;
    const share = shareSatang.div(100);
    const paid = new Prisma.Decimal(member.paid);
    return {
      memberId: member.memberId,
      displayName: member.displayName,
      paid: formatMoney(paid),
      share: formatMoney(share),
      // บวก = ควรได้คืน, ลบ = ต้องจ่ายเพิ่ม
      balance: formatMoney(paid.minus(share)),
    };
  });
}

// จับคู่คนที่ติดมากที่สุดกับคนที่ควรได้คืนมากที่สุดจนหมด โอนไม่เกิน (จำนวนคน − 1) ครั้ง
// ยอดเท่ากันเรียงตามลำดับสมาชิก ผลลัพธ์จึงเหมือนเดิมทุกครั้งที่เปิดดู
export function settle(byMember) {
  const withBalance = byMember.map((member, order) => ({
    memberId: member.memberId,
    order,
    amount: new Prisma.Decimal(member.balance),
  }));
  const byLargest = (a, b) => b.amount.comparedTo(a.amount) || a.order - b.order;
  const creditors = withBalance.filter((m) => m.amount.greaterThan(ZERO)).sort(byLargest);
  const debtors = withBalance
    .filter((m) => m.amount.lessThan(ZERO))
    .map((m) => ({ ...m, amount: m.amount.negated() }))
    .sort(byLargest);

  const settlements = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = Prisma.Decimal.min(creditors[c].amount, debtors[d].amount);
    settlements.push({
      fromMemberId: debtors[d].memberId,
      toMemberId: creditors[c].memberId,
      amount: formatMoney(amount),
    });
    creditors[c].amount = creditors[c].amount.minus(amount);
    debtors[d].amount = debtors[d].amount.minus(amount);
    if (creditors[c].amount.isZero()) c += 1;
    if (debtors[d].amount.isZero()) d += 1;
  }
  return settlements;
}
