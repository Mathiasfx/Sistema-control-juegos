import { PAYMENT_STATUS, PAYMENT_STATUS_BADGE_COLORS } from "@/lib/constants";
import type { Order } from "@/lib/types";

export function OrderPaymentStatusBadge({ order }: { order: Order }) {
  const { bg, text, dot } = PAYMENT_STATUS_BADGE_COLORS[order.paymentStatus];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {PAYMENT_STATUS[order.paymentStatus]}
    </span>
  );
}
