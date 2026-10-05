import Button from '../../../components/ui/Button.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import { fieldErrors } from '../../../utils/fieldErrors.js';

// ฟอร์มข้อมูลทริปที่ใช้ทั้งตอนสร้างและแก้ไข
// children คือช่องเพิ่มเติมเฉพาะหน้า (เช่นจำนวนคนตอนสร้าง) แทรกไว้ก่อนปุ่มบันทึก
export default function TripForm({
  trip,
  error,
  isPending,
  submitLabel,
  pendingLabel,
  onSubmit,
  children,
}) {
  const errors = fieldErrors(error);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      name: form.get('name'),
      destinationName: form.get('destinationName'),
      originName: form.get('originName'),
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
      budgetAmount: form.get('budgetAmount').replaceAll(',', ''),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TextField
        label="ชื่อทริป"
        name="name"
        defaultValue={trip?.name}
        maxLength={150}
        required
        error={errors.name}
      />
      <TextField
        label="ปลายทาง"
        name="destinationName"
        defaultValue={trip?.destinationName}
        maxLength={150}
        required
        error={errors.destinationName}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="วันเริ่ม"
          name="startDate"
          type="date"
          defaultValue={trip?.startDate}
          required
          error={errors.startDate}
        />
        <TextField
          label="วันจบ"
          name="endDate"
          type="date"
          defaultValue={trip?.endDate}
          required
          error={errors.endDate}
        />
      </div>
      <TextField
        label="ต้นทาง (ไม่บังคับ)"
        name="originName"
        defaultValue={trip?.originName ?? ''}
        maxLength={150}
        error={errors.originName}
      />
      <TextField
        label="งบทั้งทริป (ไม่บังคับ)"
        name="budgetAmount"
        inputMode="decimal"
        placeholder="เช่น 7000"
        defaultValue={trip?.budgetAmount ?? ''}
        hint="หน่วยเป็นบาท"
        error={errors.budgetAmount}
      />

      {children}

      {error && !error.details?.length && (
        <p role="alert" className="rounded-lg bg-danger/5 p-3 text-danger">
          {error.message}
        </p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
