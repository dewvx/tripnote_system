import LoginForm from '../features/auth/components/LoginForm.jsx';

// page = 1 route ประกอบ component ของ feature เข้าด้วยกัน ไม่มี logic ของตัวเอง
export default function LoginPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
      <div className="mt-6">
        <LoginForm />
      </div>
    </section>
  );
}
