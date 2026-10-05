// error ที่ "คาดไว้แล้ว" ทั้งหมดให้ throw ด้วย class นี้จากชั้น service
// errorHandler จะแปลงเป็น response รูปแบบเดียวกันทั้งระบบ
export class AppError extends Error {
  constructor(code, status, message, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
