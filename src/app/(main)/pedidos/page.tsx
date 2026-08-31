"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrdersGroupedTable } from "@/components/OrdersGroupedTable";
import { useAuth } from "@/context/AuthContext";
import { subscribeOrders } from "@/lib/firestore/orders";
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
            Agrupados por urgencia y ordenados por fecha de entrega.
          </p>
        </div>
        <Link
          href="/pedidos/nuevo"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nuevo pedido
        </Link>
      </div>

      <OrdersGroupedTable
        orders={orders}
        variant="list"
        emptyMessage="Aún no hay pedidos cargados."
        onEditOrder={(id) => router.push(`/pedidos/${id}`)}
      />

      {role === "admin" ? null : (
        <p className="text-xs text-zinc-500">
          Como usuario operativo no verás montos ni fechas de pago en la ficha del pedido.
        </p>
      )}
    </div>
  );
}
