import Button from '../../../components/ui/Button.jsx';
import { useChangeTripStatus } from '../hooks.js';

// ปุ่มเดียวตามสถานะปัจจุบัน ลำดับเดียวกับ TRANSITIONS ฝั่ง server
const ACTIONS = {
  planning: { to: 'active', label: 'เริ่มทริป', variant: 'primary' },
  active: { to: 'completed', label: 'จบทริป', variant: 'primary' },
  completed: { to: 'active', label: 'กลับไปเดินทางต่อ', variant: 'ghost' },
};

export default function TripStatusActions({ trip }) {
  const changeStatus = useChangeTripStatus();
  const action = ACTIONS[trip.status];
  if (!action) return null;

  return (
    <div>
      <Button
        variant={action.variant}
        loading={changeStatus.isPending}
        onClick={() => changeStatus.mutate({ tripId: trip.id, status: action.to })}
        className="w-full"
      >
        {action.label}
      </Button>
      {changeStatus.error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {changeStatus.error.message}
        </p>
      )}
    </div>
  );
}
