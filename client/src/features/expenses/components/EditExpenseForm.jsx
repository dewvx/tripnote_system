import { useState } from 'react';

import Button from '../../../components/ui/Button.jsx';
import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import { fieldErrors } from '../../../utils/fieldErrors.js';
import { parseAmountInput } from '../amount.js';
import { useExpenseCategories, useUpdateExpense } from '../hooks.js';
import { toLocalInputValue } from '../localTime.js';
import AmountField from './AmountField.jsx';
import CategoryPicker from './CategoryPicker.jsx';
import PayerPicker from './PayerPicker.jsx';

function initialValues(expense) {
  return {
    // "50.00" → "50" แก้ง่ายกว่าบนแป้นมือถือ
    amount: expense.amount.replace(/\.00$/, ''),
    categoryId: expense.category.id,
    payerId: expense.paidBy.id,
    spentAt: toLocalInputValue(new Date(expense.spentAt)),
    description: expense.description ?? '',
  };
}

// แก้รายจ่ายที่บันทึกแล้ว ช่องเดียวกับตอนเพิ่ม แต่เปิดทุกช่องไว้เลยเพราะมาเพื่อแก้
export default function EditExpenseForm({ trip, expense, onSaved, onDelete }) {
  const categories = useExpenseCategories();
  const updateExpense = useUpdateExpense(trip.id);
  const [initial] = useState(() => initialValues(expense));
  const [values, setValues] = useState(initial);
  const [clientErrors, setClientErrors] = useState({});
  const errors = { ...fieldErrors(updateExpense.error), ...clientErrors };
  const update = (fields) => setValues((current) => ({ ...current, ...fields }));

  function handleSubmit(event) {
    event.preventDefault();
    const { amount, error: amountError } = parseAmountInput(values.amount);
    const nextErrors = {};
    if (amountError) nextErrors.amount = amountError;
    if (!values.spentAt) nextErrors.spentAt = 'กรุณาใส่เวลา';
    setClientErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateExpense.mutate(
      {
        expenseId: expense.id,
        amount,
        categoryId: values.categoryId,
        paidByMemberId: values.payerId,
        // ว่าง = ลบรายละเอียด
        description: values.description,
        // input ละเอียดแค่นาที ส่งเฉพาะตอนแก้จริง วินาทีเดิมจะได้ไม่หายและลำดับไม่เปลี่ยน
        ...(values.spentAt !== initial.spentAt && {
          spentAt: new Date(values.spentAt).toISOString(),
        }),
      },
      { onSuccess: onSaved },
    );
  }

  // error ที่ไม่ได้ผูกกับช่องไหน เช่นเน็ตหลุด หรือรายการถูกลบไปแล้ว
  const generalError = updateExpense.error && !updateExpense.error.details?.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <AmountField
        value={values.amount}
        onChange={(amount) => update({ amount })}
        error={errors.amount}
      />

      {categories.isPending && <Spinner label="กำลังโหลดหมวด" />}
      {categories.error && (
        <ErrorState message={categories.error.message} onRetry={() => categories.refetch()} />
      )}
      {categories.data && (
        <CategoryPicker
          categories={categories.data}
          value={values.categoryId}
          onChange={(categoryId) => update({ categoryId })}
          error={errors.categoryId}
        />
      )}

      <PayerPicker
        members={trip.members}
        value={values.payerId}
        onChange={(payerId) => update({ payerId })}
        error={errors.paidByMemberId}
      />

      <TextField
        label="เวลา"
        type="datetime-local"
        value={values.spentAt}
        onChange={(event) => update({ spentAt: event.target.value })}
        error={errors.spentAt}
      />

      <TextField
        label="รายละเอียด"
        value={values.description}
        onChange={(event) => update({ description: event.target.value })}
        maxLength={255}
        placeholder="เช่น ข้าวมันไก่ร้านหน้าโรงแรม"
        error={errors.description}
      />

      {generalError && (
        <div role="alert" className="rounded-lg bg-danger/5 p-3 text-danger">
          <p className="font-medium">บันทึกไม่สำเร็จ</p>
          <p className="text-sm">{updateExpense.error.message}</p>
        </div>
      )}

      <div className="space-y-2">
        <Button type="submit" loading={updateExpense.isPending} className="w-full">
          {updateExpense.isPending ? 'กำลังบันทึก' : 'บันทึกการแก้ไข'}
        </Button>
        <Button
          variant="danger-ghost"
          onClick={onDelete}
          disabled={updateExpense.isPending}
          className="w-full"
        >
          ลบรายการนี้
        </Button>
      </div>
    </form>
  );
}
