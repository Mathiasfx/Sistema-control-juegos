import {
  WORK_STATUS,
  WORK_STATUS_BADGE_CLASS,
  WORK_STATUS_OVERDUE_BADGE_CLASS,
} from "@/lib/constants";
import { isWorkOverdue } from "@/lib/order-work-board";
import type { Order } from "@/lib/types";

export function OrderWorkStatusBadge({ order }: { order: Order }) {
  const overdue = isWorkOverdue(order);

  if (overdue) {
    return (
      <span className={WORK_STATUS_OVERDUE_BADGE_CLASS}>
        Vencido · {WORK_STATUS[order.workStatus]}
      </span>
    );
  }

  return (
    <span className={WORK_STATUS_BADGE_CLASS[order.workStatus]}>
      {WORK_STATUS[order.workStatus]}
    </span>
  );
}
