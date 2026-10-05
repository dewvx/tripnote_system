import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import Button from '../components/ui/Button.jsx';
import TextField from '../components/ui/TextField.jsx';
import { useRegister } from '../features/auth/hooks.js';
import { fieldErrors } from '../utils/fieldErrors.js';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();
  const errors = fieldErrors(register.error);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    register.mutate({
      displayName: form.get('displayName'),
      email: form.get('email'),
      password: form.get('password'),
    });
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <TextField
          label="ชื่อที่แสดง"
          name="displayName"
          autoComplete="nickname"
          maxLength={100}
          required
          hint="เพื่อนร่วมทริปจะเห็นชื่อนี้"
          error={errors.displayName}
        />
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
          autoComplete="new-password"
          minLength={8}
          required
          hint="อย่างน้อย 8 ตัวอักษร"
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

        {register.error && !register.error.details && (
          <p role="alert" className="rounded-lg bg-danger/5 p-3 text-danger">
            {register.error.message}
          </p>
        )}

        <Button type="submit" loading={register.isPending} className="w-full">
          {register.isPending ? 'กำลังสมัคร' : 'สมัครและเริ่มใช้งาน'}
        </Button>
      </form>

      <p className="mt-6 text-center text-slate">
        มีบัญชีแล้ว?{' '}
        <Link
          to={{ pathname: '/login', search: searchParams.toString() }}
          className="inline-flex min-h-11 items-center font-medium text-teal"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </section>
  );
}
