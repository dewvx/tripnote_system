import RegisterForm from '../features/auth/components/RegisterForm.jsx';

export default function RegisterPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </section>
  );
}
