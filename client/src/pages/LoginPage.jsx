import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import Button from '../components/ui/Button.jsx';
import TextField from '../components/ui/TextField.jsx';
import { useLogin } from '../features/auth/hooks.js';
import { fieldErrors } from '../utils/fieldErrors.js';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const errors = fieldErrors(login.error);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    login.mutate({ email: form.get('email'), password: form.get('password') });
  }

  // สำเร็จแล้ว GuestOnly จะพาไปหน้าที่ตั้งใจไว้เอง
  return (
    <section>
      <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <TextField
          label="อีเมล"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          error={errors.email}
        />
        <TextField
          label="รหัสผ่าน"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <label className="flex min-h-11 items-center gap-2 text-slate">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
            className="size-5 accent-teal"
          />
          แสดงรหัสผ่าน
        </label>

        {login.error && !login.error.details && (
          <p role="alert" className="rounded-lg bg-danger/5 p-3 text-danger">
            {login.error.message}
          </p>
        )}

        <Button type="submit" loading={login.isPending} className="w-full">
          {login.isPending ? 'กำลังเข้าสู่ระบบ' : 'เข้าสู่ระบบ'}
        </Button>
      </form>

      <p className="mt-6 text-center text-slate">
        ยังไม่มีบัญชี?{' '}
        <Link
          to={{ pathname: '/register', search: searchParams.toString() }}
          className="inline-flex min-h-11 items-center font-medium text-teal"
        >
          สมัครสมาชิก
        </Link>
      </p>
    </section>
  );
}
