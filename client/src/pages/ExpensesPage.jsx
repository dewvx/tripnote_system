import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';

import BackLink from '../components/ui/BackLink.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EditExpenseSheet from '../features/expenses/components/EditExpenseSheet.jsx';
import ExpenseDayGroups from '../features/expenses/components/ExpenseDayGroups.jsx';
import ExpenseFilters from '../features/expenses/components/ExpenseFilters.jsx';
import QuickAddExpense from '../features/expenses/components/QuickAddExpense.jsx';
import { useExpenseCategories, useExpenseHistory } from '../features/expenses/hooks.js';
import TripNotFound from '../features/trips/components/TripNotFound.jsx';
import { useTrip } from '../features/trips/hooks.js';

// ตัวกรองอยู่ใน URL (?category=&payer=) กดเข้าไปแก้แล้วกลับมา หรือรีเฟรช ตัวกรองยังอยู่
function readFilters(searchParams) {
  const toId = (value) => (/^\d+$/.test(value ?? '') ? Number(value) : null);
  return {
    categoryId: toId(searchParams.get('category')),
    paidByMemberId: toId(searchParams.get('payer')),
  };
}

function toSearchParams({ categoryId, paidByMemberId }) {
  return {
    ...(categoryId && { category: String(categoryId) }),
    ...(paidByMemberId && { payer: String(paidByMemberId) }),
  };
}

// ประวัติรายจ่าย (FEATURES.md F3.2): จัดกลุ่มตามวัน ยอดรวมรายวัน กรองตามหมวดและคนจ่าย แตะเพื่อแก้
export default function ExpensesPage() {
  const { tripId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const trip = useTrip(tripId);
  const categories = useExpenseCategories();
  const history = useExpenseHistory(tripId, {
    categoryId: filters.categoryId ?? undefined,
    paidByMemberId: filters.paidByMemberId ?? undefined,
  });
  const [editing, setEditing] = useState(null);

  if (trip.isPending) return <Spinner label="กำลังโหลดทริป" />;
  if (trip.error?.code === 'TRIP_NOT_FOUND') return <TripNotFound />;
  if (trip.error) return <ErrorState message={trip.error.message} onRetry={() => trip.refetch()} />;

  const canEdit = ['owner', 'editor'].includes(trip.data.myRole);
  const isFiltered = Boolean(filters.categoryId || filters.paidByMemberId);
  const pages = history.data?.pages;
  const expenses = pages?.flatMap((page) => page.data) ?? [];
  // ยอดรายวันจาก server คิดจากทุกรายการที่ตรงตัวกรอง ไม่ใช่แค่ที่โหลดมาแล้ว
  const dayTotals = new Map(pages?.[0].meta.days.map((day) => [day.date, day]));

  return (
    <section className={`space-y-4 pt-2 ${canEdit ? 'pb-20' : ''}`}>
      <div>
        <BackLink to={`/trips/${tripId}`}>{trip.data.name}</BackLink>
        <h1 className="mt-1 text-2xl font-bold">รายจ่ายทั้งหมด</h1>
      </div>

      {categories.data && (
        <ExpenseFilters
          categories={categories.data}
          members={trip.data.members}
          filters={filters}
          onChange={(next) => setSearchParams(toSearchParams(next), { replace: true })}
        />
      )}

      {history.isPending && <Spinner label="กำลังโหลดรายจ่าย" />}
      {history.error && (
        <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
      )}

      {pages && expenses.length === 0 && (
        <div className="rounded-2xl bg-paper p-4 text-slate ring-1 ring-line">
          {isFiltered ? (
            <>
              <p>ไม่มีรายจ่ายที่ตรงกับตัวกรองนี้</p>
              <button
                type="button"
                onClick={() => setSearchParams({}, { replace: true })}
                className="mt-1 min-h-11 font-medium text-teal"
              >
                ดูทั้งหมด
              </button>
            </>
          ) : (
            <p>ยังไม่มีรายจ่าย แตะปุ่ม + มุมขวาล่างเพื่อจดรายการแรก</p>
          )}
        </div>
      )}

      {expenses.length > 0 && (
        <ExpenseDayGroups
          trip={trip.data}
          expenses={expenses}
          dayTotals={dayTotals}
          onSelect={canEdit ? setEditing : undefined}
        />
      )}

      {history.hasNextPage && (
        <button
          type="button"
          onClick={() => history.fetchNextPage()}
          disabled={history.isFetchingNextPage}
          className="min-h-11 w-full rounded-lg font-medium text-teal ring-1 ring-line active:bg-teal/10 disabled:opacity-60"
        >
          {history.isFetchingNextPage ? 'กำลังโหลด' : 'โหลดรายการก่อนหน้า'}
        </button>
      )}

      {canEdit && (
        <>
          <EditExpenseSheet trip={trip.data} expense={editing} onClose={() => setEditing(null)} />
          <QuickAddExpense trip={trip.data} />
        </>
      )}
    </section>
  );
}
