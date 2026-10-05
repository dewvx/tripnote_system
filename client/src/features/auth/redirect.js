// path ที่จะพากลับไปหลัง login อ่านจาก ?next=
// รับเฉพาะ path ภายในแอป กันการใช้ลิงก์ login ของเราพาไปเว็บอื่น (open redirect)
export function safeNextPath(value) {
  // `//host` และ `/\host` เบราว์เซอร์ตีความเป็นโดเมนอื่นได้
  const isInternal =
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\');
  return isInternal ? value : '/';
}

export function loginPathFor(location) {
  const next = `${location.pathname}${location.search}${location.hash}`;
  return next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`;
}
