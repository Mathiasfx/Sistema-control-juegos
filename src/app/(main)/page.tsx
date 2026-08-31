"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OrdersGroupedTable } from "@/components/OrdersGroupedTable";
import { useAuth } from "@/context/AuthContext";
import {
  computeFinancialKpisForMonth,
  countPendingWork,
  filterOrdersForMonth,
} from "@/lib/dashboard-metrics";
import { formatYearMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/formatMoney";
import { subscribeOrders } from "@/lib/firestore/orders";
import type { MonthCriterion } from "@/lib/types";
import type { Order } from "@/lib/types";

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
        <OrdersGroupedTable
          orders={filtered}
          variant="panel"
          emptyMessage="No hay pedidos en este mes con el criterio elegido."
        />
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
