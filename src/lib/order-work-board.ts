import type { Order } from "@/lib/types";

export type WorkPriorityGroupKey =
  | "overdue"
  | "en_proceso"
  | "pendiente"
  | "completado"
  | "cancelado";

export const WORK_PRIORITY_GROUP_LABELS: Record<WorkPriorityGroupKey, string> =
  {
    overdue: "Vencidos",
    en_proceso: "En proceso",
    pendiente: "Pendiente",
    completado: "Completado",
    cancelado: "Cancelados",
  };

export const WORK_PRIORITY_GROUP_HEADER_CLASS: Record<
  WorkPriorityGroupKey,
  string
> = {
  overdue: "border-red-200 bg-red-50 text-red-900",
  en_proceso: "border-sky-200 bg-sky-50 text-sky-900",
  pendiente: "border-amber-200 bg-amber-50 text-amber-900",
  completado: "border-zinc-200 bg-zinc-50 text-zinc-600",
  cancelado: "border-zinc-200 bg-zinc-50 text-zinc-400",
};

const GROUP_ORDER: WorkPriorityGroupKey[] = [
  "overdue",
  "en_proceso",
  "pendiente",
  "completado",
  "cancelado",
];

export function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export function isWorkOverdue(order: Order): boolean {
  if (order.workStatus === "completado" || order.workStatus === "cancelado")
    return false;
  const delivery = order.deliveryDate.toDate();
  const deliveryDay = new Date(
    delivery.getFullYear(),
    delivery.getMonth(),
    delivery.getDate(),
    0,
    0,
    0,
    0
  );
  return deliveryDay < startOfTodayLocal();
}

export function compareByDeliveryDateAsc(a: Order, b: Order): number {
  return a.deliveryDate.toMillis() - b.deliveryDate.toMillis();
}

export function classifyWorkPriorityGroup(order: Order): WorkPriorityGroupKey {
  if (order.workStatus === "cancelado") return "cancelado";
  if (order.workStatus === "completado") return "completado";
  if (isWorkOverdue(order)) return "overdue";
  if (order.workStatus === "en_proceso") return "en_proceso";
  return "pendiente";
}

export type WorkPrioritySection = {
  key: WorkPriorityGroupKey;
  label: string;
  orders: Order[];
};

export function groupOrdersByWorkPriority(
  orders: Order[]
): WorkPrioritySection[] {
  const buckets: Record<WorkPriorityGroupKey, Order[]> = {
    overdue: [],
    en_proceso: [],
    pendiente: [],
    completado: [],
    cancelado: [],
  };

  for (const order of orders) {
    buckets[classifyWorkPriorityGroup(order)].push(order);
  }

  return GROUP_ORDER.filter((key) => buckets[key].length > 0).map((key) => ({
    key,
    label: WORK_PRIORITY_GROUP_LABELS[key],
    orders: [...buckets[key]].sort(compareByDeliveryDateAsc),
  }));
}
