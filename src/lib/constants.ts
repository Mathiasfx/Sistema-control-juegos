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
  cancelado: "Cancelado",
} as const;

export type WorkStatusKey = keyof typeof WORK_STATUS;

export const WORK_STATUS_BADGE_COLORS: Record<
  WorkStatusKey,
  { bg: string; text: string; dot: string; lineThrough?: boolean }
> = {
  pendiente: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  en_proceso: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
  completado: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  cancelado: { bg: "bg-zinc-200", text: "text-zinc-500", dot: "bg-zinc-400", lineThrough: true },
};

export const WORK_STATUS_OVERDUE_COLORS = {
  bg: "bg-red-100",
  text: "text-red-800",
  dot: "bg-red-500",
} as const;

export const DELIVERY_DATE_OVERDUE_CLASS = "font-semibold text-red-700";

export const PAYMENT_STATUS = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagado: "Pagado",
} as const;

export type PaymentStatusKey = keyof typeof PAYMENT_STATUS;

export const PAYMENT_STATUS_BADGE_COLORS: Record<
  PaymentStatusKey,
  { bg: string; text: string; dot: string }
> = {
  pendiente: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  parcial: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
  pagado: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
};

export function categoryLabel(value: string): string {
  const found = GAME_CATEGORIES.find((c) => c.value === value);
  return found?.label ?? value;
}
