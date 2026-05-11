"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  PAYMENT_STATUS,
  WORK_STATUS,
} from "@/lib/constants";
import { timestampToInputDate } from "@/lib/dates";
import { TableEditIcon, tableIconButtonClass } from "@/components/TableActionIcons";
import { subscribeOrders } from "@/lib/firestore/orders";
import { orderCrossesCalendarMonths } from "@/lib/dashboard-metrics";
import type { Order } from "@/lib/types";

export default function OrdersListPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => subscribeOrders(setOrders), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pedidos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Listado actualizado en tiempo casi real.
          </p>
        </div>
        <Link
          href="/pedidos/nuevo"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nuevo pedido
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">
            Aún no hay pedidos cargados.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4 font-medium">Cliente</th>
                <th className="px-5 py-4 font-medium">Juego</th>
                <th className="px-5 py-4 font-medium">Cant.</th>
                <th className="px-5 py-4 font-medium">Encargado</th>
                <th className="px-5 py-4 font-medium">Entrega</th>
                <th className="px-5 py-4 font-medium">Trabajo</th>
                <th className="px-5 py-4 font-medium">Pago</th>
                <th className="px-5 py-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50/80">
                  <td className="px-5 py-4 font-medium">{o.clientName}</td>
                  <td className="px-5 py-4 text-zinc-700">{o.gameNameSnapshot}</td>
                  <td className="px-5 py-4 text-zinc-600">{o.quantity}</td>
                  <td className="px-5 py-4 text-zinc-600">{o.assigneeEncargado}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-zinc-600">
                    {timestampToInputDate(o.deliveryDate)}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {WORK_STATUS[o.workStatus]}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {PAYMENT_STATUS[o.paymentStatus]}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex flex-wrap justify-end gap-2">
                      {orderCrossesCalendarMonths(o) && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-100">
                          Cruza meses
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push(`/pedidos/${o.id}`)}
                        title="Editar pedido"
                        aria-label="Editar pedido"
                        className={tableIconButtonClass}
                      >
                        <TableEditIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {role === "admin" ? null : (
        <p className="text-xs text-zinc-500">
          Como usuario operativo no verás montos ni fechas de pago en la ficha del pedido.
        </p>
      )}
    </div>
  );
}
