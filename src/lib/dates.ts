import { Timestamp } from "firebase/firestore";

export function startOfMonthUtc(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0));
}

export function endOfMonthUtc(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0 + 1, 1, 0, 0, 0, 0));
}

export function parseYearMonth(ym: string): { year: number; month0: number } {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) throw new Error("Formato de mes inválido (use YYYY-MM)");
  return { year: y, month0: m - 1 };
}

export function formatYearMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function timestampToInputDate(ts: Timestamp): string {
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inputDateToLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function inputDateToTimestamp(value: string): Timestamp {
  return Timestamp.fromDate(inputDateToLocalDate(value));
}

export function sameYearMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Inicio del mes en hora local (inclusive). */
export function startOfMonthLocal(year: number, monthIndex0: number): Date {
  return new Date(year, monthIndex0, 1, 0, 0, 0, 0);
}

/** Primer instante del mes siguiente en hora local (exclusivo del rango). */
export function endOfMonthExclusiveLocal(year: number, monthIndex0: number): Date {
  return new Date(year, monthIndex0 + 1, 1, 0, 0, 0, 0);
}

export function isDateInMonth(d: Date, year: number, monthIndex0: number): boolean {
  const start = startOfMonthLocal(year, monthIndex0);
  const end = endOfMonthExclusiveLocal(year, monthIndex0);
  return d >= start && d < end;
}
