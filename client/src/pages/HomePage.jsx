import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useHealth } from '../features/system/hooks.js';

// หน้าชั่วคราวของ F1.1: ยืนยันว่า client คุยกับ API และฐานข้อมูลได้
// จะถูกแทนด้วย Dashboard ใน F1.4
export default function HomePage() {
  const { data, error, isPending, refetch, isFetching } = useHealth();

  return (
    <section className="pt-6">
      <h1 className="text-3xl leading-tight font-bold">
        วางแผน จด แล้วย้อนดู ทริปเดียวจบในที่เดียว
      </h1>
      <p className="mt-3 text-slate">
        ตอนนี้ยังเป็นโครงเปล่า หน้านี้มีไว้เช็กว่าระบบต่อกันครบก่อนเริ่มทำ feature จริง
      </p>

      <div className="mt-8 rounded-2xl bg-paper p-5 shadow-sm ring-1 ring-line">
        <h2 className="font-semibold">สถานะระบบ</h2>

        <div className="mt-4">
          {isPending && <Spinner label="กำลังเรียก API" />}

          {error && <ErrorState message={error.message} onRetry={() => refetch()} />}

          {data && (
            <dl className="divide-y divide-line">
              <StatusRow label="API" ok />
              <StatusRow label="ฐานข้อมูล" ok={data.database === 'up'} />
              <div className="flex items-center justify-between py-3">
                <dt className="text-slate">เวลาเซิร์ฟเวอร์</dt>
                <dd className="tabular text-sm">{new Date(data.time).toLocaleString('th-TH')}</dd>
              </div>
            </dl>
          )}
        </div>

        {data && (
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-4 min-h-11 w-full rounded-lg bg-teal px-4 font-medium text-paper active:bg-teal-deep disabled:opacity-60"
          >
            {isFetching ? 'กำลังเช็ก' : 'เช็กอีกครั้ง'}
          </button>
        )}
      </div>
    </section>
  );
}

function StatusRow({ label, ok }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-slate">{label}</dt>
      <dd className={`font-semibold ${ok ? 'text-ok' : 'text-danger'}`}>
        {ok ? 'พร้อมใช้งาน' : 'เชื่อมต่อไม่ได้'}
      </dd>
    </div>
  );
}
