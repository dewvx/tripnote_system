import { useState } from 'react';

import Sheet from '../../../components/ui/Sheet.jsx';
import DeleteExpenseConfirm from './DeleteExpenseConfirm.jsx';
import EditExpenseForm from './EditExpenseForm.jsx';

// แตะรายจ่ายเพื่อแก้ ลบได้จากในนี้หลังยืนยัน expense = null คือปิด
export default function EditExpenseSheet({ trip, expense, onClose }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function close() {
    setConfirmingDelete(false);
    onClose();
  }

  return (
    <Sheet
      open={Boolean(expense)}
      onClose={close}
      title={confirmingDelete ? 'ลบรายจ่ายนี้?' : 'แก้รายจ่าย'}
    >
      {expense &&
        (confirmingDelete ? (
          <DeleteExpenseConfirm
            trip={trip}
            expense={expense}
            onCancel={() => setConfirmingDelete(false)}
            onDeleted={close}
          />
        ) : (
          <EditExpenseForm
            key={expense.id}
            trip={trip}
            expense={expense}
            onSaved={close}
            onDelete={() => setConfirmingDelete(true)}
          />
        ))}
    </Sheet>
  );
}
