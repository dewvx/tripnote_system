import { AppError } from '../lib/AppError.js';

// ใช้: router.post('/', validate({ body: createTripSchema }), controller.create)
// ผลที่ผ่านการตรวจแล้วอยู่ใน req.valid.body / req.valid.query / req.valid.params
// (ไม่เขียนทับ req.query เพราะใน Express 5 เป็น getter อย่างเดียว)
export function validate(schemas) {
  return (req, _res, next) => {
    const valid = {};
    const details = [];

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ field: issue.path.join('.') || part, message: issue.message });
        }
      }
    }

    if (details.length > 0) {
      return next(new AppError('VALIDATION_ERROR', 422, 'ข้อมูลไม่ถูกต้อง', details));
    }

    req.valid = valid;
    next();
  };
}
