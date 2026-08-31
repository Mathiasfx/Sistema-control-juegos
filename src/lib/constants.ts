export const GAME_CATEGORIES = [
  { value: "memoria", label: "Memoria" },
  { value: "trivia", label: "Trivia" },
  { value: "ruleta", label: "Ruleta" },
  { value: "deportes", label: "Deportes" },
  { value: "casino", label: "Casino" },
  { value: "puzzle", label: "Puzzle" },
  { value: "otros", label: "Otros" },
] as const;

export type GameCategoryValue = (typeof GAME_CATEGORIES)[number]["value"];

export const WORK_STATUS = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completado: "Completado",
} as const;

export type WorkStatusKey = keyof typeof WORK_STATUS;

export const WORK_STATUS_BADGE_CLASS: Record<WorkStatusKey, string> = {
  pendiente:
    "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-100",
  en_proceso:
    "rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-100",
  completado:
    "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100",
};

export const WORK_STATUS_OVERDUE_BADGE_CLASS =
  "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-100";

export const DELIVERY_DATE_OVERDUE_CLASS = "font-semibold text-red-700";

export const PAYMENT_STATUS = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagado: "Pagado",
} as const;

export type PaymentStatusKey = keyof typeof PAYMENT_STATUS;

export function categoryLabel(value: string): string {
  const found = GAME_CATEGORIES.find((c) => c.value === value);
  return found?.label ?? value;
}
