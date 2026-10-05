import { Link } from 'react-router';

// คนที่ไม่ใช่สมาชิกได้ 404 เหมือนทริปไม่มีอยู่จริง (FEATURES.md F1.3)
export default function TripNotFound() {
  return (
    <section className="pt-16 text-center">
      <h1 className="text-2xl font-bold">ไม่พบทริป</h1>
      <p className="mt-2 text-slate">ทริปนี้อาจถูกลบไปแล้ว หรือคุณไม่ได้อยู่ในทริปนี้</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-teal px-5 font-medium text-paper"
      >
        กลับหน้าแรก
      </Link>
    </section>
  );
}
