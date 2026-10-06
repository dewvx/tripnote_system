import { formatMoney } from '../../trips/format.js';

// ยอดติดลบจาก API เป็น "-625.00" แสดงเป็นค่าบวกพร้อมคำบอกทิศทางแทนเครื่องหมาย
const abs = (amount) => amount.replace('-', '');

function BalanceLabel({ balance, currency }) {
  if (/^0\.00$/.test(abs(balance))) return <span className="text-slate">ลงตัว</span>;
  if (balance.startsWith('-')) {
    return (
      <span className="font-semibold">ต้องจ่ายเพิ่ม {formatMoney(abs(balance), currency)}</span>
    );
  }
  return <span className="font-semibold text-ok">ได้คืน {formatMoney(balance, currency)}</span>;
}

// ใครจ่ายเท่าไหร่และใครต้องโอนให้ใคร (FEATURES.md F3.4) ตัวเลขทุกตัวมาจาก server
export default function SettlementSection({ summary, members }) {
  const { currency, byMember, settlements } = summary;
  const nameOf = (memberId) => {
    const member = members.find((m) => m.id === memberId);
    const name = member?.displayName ?? byMember.find((m) => m.memberId === memberId)?.displayName;
    return member?.isMe ? `${name} (คุณ)` : name;
  };
  // คนแรกได้ share ไม่เท่าคนอื่นเมื่อหารไม่ลงตัว
  const hasRemainder = byMember.some((m) => m.share !== byMember[0].share);

  return (
    <>
      <section className="rounded-2xl bg-paper p-4 ring-1 ring-line">
        <h2 className="font-semibold">ใครจ่ายไปเท่าไหร่</h2>
        <ul className="mt-1 divide-y divide-line">
          {byMember.map((member) => (
            <li key={member.memberId} className="py-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">{nameOf(member.memberId)}</span>
                <span className="tabular shrink-0 text-right">
                  <BalanceLabel balance={member.balance} currency={currency} />
                </span>
              </div>
              <p className="tabular text-sm text-slate">
                จ่ายไป {formatMoney(member.paid, currency)} · ส่วนที่ต้องจ่าย{' '}
                {formatMoney(member.share, currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-paper p-4 ring-1 ring-line">
        <h2 className="font-semibold">เคลียร์กัน</h2>
        {settlements.length === 0 ? (
          <p className="mt-1 text-slate">ทุกคนจ่ายเท่ากันแล้ว ไม่ต้องโอนให้ใคร</p>
        ) : (
          <ul className="mt-1 space-y-2">
            {settlements.map((s) => (
              <li
                key={`${s.fromMemberId}-${s.toMemberId}`}
                className="rounded-lg bg-mist px-3 py-2.5"
              >
                <strong>{nameOf(s.fromMemberId)}</strong> ต้องจ่ายคืน{' '}
                <strong>{nameOf(s.toMemberId)}</strong>{' '}
                <strong className="tabular">{formatMoney(s.amount, currency)}</strong>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 border-t border-line pt-2 text-sm text-slate">
          ตอนนี้หารเท่ากันทุกคนทุกรายการ ยังเลือกหารเฉพาะบางคนในรายการไม่ได้ (จะทำใน v0.2)
          {hasRemainder &&
            ` · เศษสตางค์จากการหารรวมไว้ที่ ${byMember[0].displayName} เพื่อให้ยอดลงตัวพอดี`}
        </p>
      </section>
    </>
  );
}
