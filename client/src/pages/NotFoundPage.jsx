import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="pt-16 text-center">
      <h1 className="text-2xl font-bold">ไม่พบหน้านี้</h1>
      <p className="mt-2 text-slate">ลิงก์อาจผิด หรือหน้านี้ถูกย้ายไปแล้ว</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-teal px-5 font-medium text-paper"
      >
        กลับหน้าแรก
      </Link>
    </section>
  );
}
