import Spinner from '../../../components/ui/Spinner.jsx';

// แสดงตอนเปิดแอปแล้วกำลังเช็กเซสชันเดิม
// ครั้งแรกหลังไม่ได้ใช้นาน server อาจตื่นช้า (cold start) จึงต้องมีสถานะให้เห็นชัด
export default function SessionCheck() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label="กำลังเปิดแอป" />
    </div>
  );
}
