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
