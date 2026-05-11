"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  computeFinancialKpisForMonth,
  countPendingWork,
  filterOrdersForMonth,
  orderCrossesCalendarMonths,
} from "@/lib/dashboard-metrics";
import { formatYearMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/formatMoney";
import { subscribeOrders } from "@/lib/firestore/orders";
import { timestampToInputDate } from "@/lib/dates";
import { TableOpenIcon, tableIconButtonClass } from "@/components/TableActionIcons";
import type { MonthCriterion } from "@/lib/types";
import type { Order } from "@/lib/types";
import { WORK_STATUS, PAYMENT_STATUS } from "@/lib/constants";

function defaultYearMonth(): string {
  return formatYearMonth(new Date());
}

export default function DashboardPage() {
  const { role } = useAuth();
  const [ym, setYm] = useState(defaultYearMonth);
  const [criterion, setCriterion] = useState<MonthCriterion>("delivery");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => subscribeOrders(setOrders), []);

  const filtered = useMemo(
    () => filterOrdersForMonth(orders, ym, criterion),
    [orders, ym, criterion]
  );

  const pending = useMemo(() => countPendingWork(filtered), [filtered]);

  const [financial, setFinancial] = useState({
    ingresosMes: 0,
    porCobrar: 0,
  });

  useEffect(() => {
    if (role !== "admin") {
      setFinancial({ ingresosMes: 0, porCobrar: 0 });
      return;
    }
    let alive = true;
    (async () => {
      const kpis = await computeFinancialKpisForMonth(filtered, ym);
      if (alive) setFinancial(kpis);
    })();
    return () => {
      alive = false;
    };
  }, [filtered, ym, role]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Panel
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Métricas del mes según el criterio seleccionado.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col text-xs font-medium text-zinc-600">
            Mes
            <input
              type="month"
              value={ym}
              onChange={(e) => setYm(e.target.value)}
              className="mt-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
            />
          </label>
          <fieldset className="flex flex-col text-xs font-medium text-zinc-600">
            <legend className="sr-only">Criterio temporal</legend>
            <span>Agrupar por</span>
            <div className="mt-1 flex gap-2">
              <label className="flex items-center gap-1.5 text-sm font-normal text-zinc-800">
                <input
                  type="radio"
                  name="criterion"
                  checked={criterion === "delivery"}
                  onChange={() => setCriterion("delivery")}
                />
                Entrega
              </label>
              <label className="flex items-center gap-1.5 text-sm font-normal text-zinc-800">
                <input
                  type="radio"
                  name="criterion"
                  checked={criterion === "created"}
                  onChange={() => setCriterion("created")}
                />
                Alta del pedido
              </label>
            </div>
          </fieldset>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Pedidos en el período" value={String(filtered.length)} />
        <MetricCard title="Pendientes (trabajo)" value={String(pending)} hint="Sin completado" />
        {role === "admin" ? (
          <>
            <MetricCard
              title="Ingresos del mes"
              value={formatMoney(financial.ingresosMes)}
              hint="Suma cobrada con fecha de pago en este mes"
            />
            <MetricCard
              title="Por cobrar"
              value={formatMoney(financial.porCobrar)}
              hint="Pedidos dentro del período seleccionado"
            />
          </>
        ) : (
          <>
            <MetricCard hiddenValue title="Ingresos" value="Oculto" hint="Visible solo administración" />
            <MetricCard hiddenValue title="Por cobrar" value="Oculto" hint="Visible solo administración" />
          </>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-800">
            Pedidos del período
          </h2>
          <Link
            href="/pedidos"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              No hay pedidos en este mes con el criterio elegido.
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Cliente</th>
                  <th className="px-5 py-4 font-medium">Juego</th>
                  <th className="px-5 py-4 font-medium">Entrega</th>
                  <th className="px-5 py-4 font-medium">Estado trabajo</th>
                  <th className="px-5 py-4 font-medium">Pago</th>
                  <th className="px-5 py-4 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/80">
                    <td className="px-5 py-4 font-medium text-zinc-900">
                      {o.clientName}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {o.gameNameSnapshot}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {timestampToInputDate(o.deliveryDate)}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {WORK_STATUS[o.workStatus]}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {PAYMENT_STATUS[o.paymentStatus]}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {orderCrossesCalendarMonths(o) && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-100">
                            Pedido en otro mes
                          </span>
                        )}
                        <Link
                          href={`/pedidos/${o.id}`}
                          title="Abrir pedido"
                          aria-label="Abrir pedido"
                          className={tableIconButtonClass}
                        >
                          <TableOpenIcon />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  hiddenValue,
}: {
  title: string;
  value: string;
  hint?: string;
  hiddenValue?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          hiddenValue ? "text-zinc-400" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
