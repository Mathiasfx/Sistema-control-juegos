import { isDateInMonth, parseYearMonth } from "@/lib/dates";
import { getOrderBilling } from "@/lib/firestore/orders";
import type { MonthCriterion } from "@/lib/types";
import type { Order } from "@/lib/types";

export function filterOrdersForMonth(
  orders: Order[],
  ym: string,
  criterion: MonthCriterion
): Order[] {
  const { year, month0 } = parseYearMonth(ym);
  return orders.filter((o) => {
    const raw =
      criterion === "delivery"
        ? o.deliveryDate.toDate()
        : o.createdAt.toDate();
    return isDateInMonth(raw, year, month0);
  });
}

export function orderCrossesCalendarMonths(order: Order): boolean {
  const c = order.createdAt.toDate();
  const e = order.deliveryDate.toDate();
  return c.getFullYear() !== e.getFullYear() || c.getMonth() !== e.getMonth();
}

export function countPendingWork(orders: Order[]): number {
  return orders.filter((o) => o.workStatus !== "completado").length;
}

export async function computeFinancialKpisForMonth(
  ordersInTemporalContext: Order[],
  ym: string
): Promise<{ ingresosMes: number; porCobrar: number }> {
  const { year, month0 } = parseYearMonth(ym);
  let ingresosMes = 0;
  let porCobrar = 0;

  await Promise.all(
    ordersInTemporalContext.map(async (o) => {
      try {
        const bill = await getOrderBilling(o.id);
        const total = bill?.totalAmount ?? 0;
        const paid = bill?.amountPaid ?? 0;
        porCobrar += Math.max(0, total - paid);
        const pd = bill?.paymentDate;
        if (pd && isDateInMonth(pd.toDate(), year, month0)) {
          ingresosMes += paid;
        }
      } catch {
        // Sin documento de billing o sin permisos: ignora en el agregado.
      }
    })
  );

  return { ingresosMes, porCobrar };
}
