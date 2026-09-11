import {
  WORK_STATUS,
  WORK_STATUS_BADGE_COLORS,
  WORK_STATUS_OVERDUE_COLORS,
} from "@/lib/constants";
import { isWorkOverdue } from "@/lib/order-work-board";
import type { Order } from "@/lib/types";

function StatusBadge({
  bg,
  text,
  dot,
  label,
  lineThrough,
}: {
  bg: string;
  text: string;
  dot: string;
  label: string;
  lineThrough?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${text} ${lineThrough ? "line-through" : ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function OrderWorkStatusBadge({ order }: { order: Order }) {
  if (isWorkOverdue(order)) {
    const c = WORK_STATUS_OVERDUE_COLORS;
    return (
      <StatusBadge
        bg={c.bg}
        text={c.text}
        dot={c.dot}
        label={`Vencido · ${WORK_STATUS[order.workStatus]}`}
      />
    );
  }

  const c = WORK_STATUS_BADGE_COLORS[order.workStatus];
  return (
    <StatusBadge
      bg={c.bg}
      text={c.text}
      dot={c.dot}
      label={WORK_STATUS[order.workStatus]}
      lineThrough={c.lineThrough}
    />
  );
}
