import { useState } from 'react';

import Button from '../../../components/ui/Button.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import { fieldErrors } from '../../../utils/fieldErrors.js';
import { parseAmountInput } from '../amount.js';
import { useCreateExpense, useExpenseCategories } from '../hooks.js';
import { setLastPayerId } from '../preferences.js';
import CategoryPicker from './CategoryPicker.jsx';
import PayerPicker from './PayerPicker.jsx';
import SpentAtField from './SpentAtField.jsx';

// แตะ + → พิมพ์จำนวนเงิน → แตะหมวด → บันทึก (FEATURES.md F3.1)
// draft อยู่ที่ตัวแม่ ปิด sheet แล้วเปิดใหม่ข้อมูลยังอยู่ และใช้ clientId เดิม กดซ้ำก็ไม่เกิดรายการซ้ำ
export default function QuickAddExpenseForm({ trip, draft, onChange, onSaved }) {
  const categories = useExpenseCategories();
  const createExpense = useCreateExpense(trip.id);
  const [clientErrors, setClientErrors] = useState({});
  const errors = { ...fieldErrors(createExpense.error), ...clientErrors };
  const update = (fields) => onChange({ ...draft, ...fields });

  function handleSubmit(event) {
    event.preventDefault();
    const { amount, error: amountError } = parseAmountInput(draft.amount);
    const nextErrors = {};
    if (amountError) nextErrors.amount = amountError;
    if (!draft.categoryId) nextErrors.categoryId = 'กรุณาเลือกหมวด';
    if (!draft.payerId) nextErrors.paidByMemberId = 'กรุณาเลือกคนจ่าย';
    setClientErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createExpense.mutate(
      {
        clientId: draft.clientId,
        amount,
        categoryId: draft.categoryId,
        paidByMemberId: draft.payerId,
        description: draft.description || undefined,
        // datetime-local เป็นเวลาของเครื่อง new Date() ตีความตามนั้นแล้วแปลงเป็น UTC ให้
        spentAt: draft.spentAt ? new Date(draft.spentAt).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          setLastPayerId(trip.id, draft.payerId);
          onSaved();
        },
      },
    );
  }

  // error ที่ไม่ได้ผูกกับช่องไหน เช่นเน็ตหลุด
  const generalError = createExpense.error && !createExpense.error.details?.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="expense-amount" className="font-medium">
          จำนวนเงิน (บาท)
        </label>
        <input
          id="expense-amount"
          data-autofocus
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0"
          value={draft.amount}
          onChange={(event) => update({ amount: event.target.value })}
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
          className={`tabular mt-1.5 block min-h-16 w-full rounded-xl border bg-paper px-4 text-right text-3xl font-semibold ${
            errors.amount ? 'border-danger' : 'border-line'
          } focus:border-teal focus:outline-none`}
        />
        {errors.amount && (
          <p id="expense-amount-error" className="mt-1.5 text-sm text-danger">
            {errors.amount}
          </p>
        )}
      </div>

      {categories.isPending && <Spinner label="กำลังโหลดหมวด" />}
      {categories.error && (
        <ErrorState message={categories.error.message} onRetry={() => categories.refetch()} />
      )}
      {categories.data && (
        <CategoryPicker
          categories={categories.data}
          value={draft.categoryId}
          onChange={(categoryId) => update({ categoryId })}
          error={errors.categoryId}
        />
      )}

      <PayerPicker
        members={trip.members}
        value={draft.payerId}
        onChange={(payerId) => update({ payerId })}
        error={errors.paidByMemberId}
      />

      <SpentAtField
        value={draft.spentAt}
        onChange={(spentAt) => update({ spentAt })}
        error={errors.spentAt}
      />

      {draft.showDetails ? (
        <TextField
          label="รายละเอียด"
          value={draft.description}
          onChange={(event) => update({ description: event.target.value })}
          maxLength={255}
          placeholder="เช่น ข้าวมันไก่ร้านหน้าโรงแรม"
          error={errors.description}
        />
      ) : (
        <button
          type="button"
          onClick={() => update({ showDetails: true })}
          className="min-h-11 font-medium text-teal"
        >
          + เพิ่มรายละเอียด
        </button>
      )}

      {generalError && (
        <div role="alert" className="rounded-lg bg-danger/5 p-3 text-danger">
          <p className="font-medium">บันทึกไม่สำเร็จ</p>
          <p className="text-sm">{createExpense.error.message}</p>
          <p className="mt-1 text-sm">
            ข้อมูลที่กรอกยังอยู่ครบ กดบันทึกอีกครั้งได้ ไม่เกิดรายการซ้ำ
          </p>
        </div>
      )}

      <Button type="submit" loading={createExpense.isPending} className="w-full">
        {createExpense.isPending ? 'กำลังบันทึก' : generalError ? 'ลองบันทึกอีกครั้ง' : 'บันทึก'}
      </Button>
    </form>
  );
}
