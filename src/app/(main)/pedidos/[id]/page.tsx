"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderForm } from "@/components/OrderForm";
import { listGames } from "@/lib/firestore/games";
import { getOrder } from "@/lib/firestore/orders";
import type { Game, Order } from "@/lib/types";

export default function EditOrderPage() {
  const params = useParams();
  const orderIdParam = typeof params?.id === "string" ? params.id : "";

  const [games, setGames] = useState<Game[]>([]);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    let ok = true;
    listGames()
      .then((g) => {
        if (ok) setGames(g);
      })
      .catch(console.error);
    return () => {
      ok = false;
    };
  }, []);

  useEffect(() => {
    if (!orderIdParam) {
      setOrder(null);
      return;
    }
    let ok = true;
    getOrder(orderIdParam)
      .then((o) => {
        if (ok) setOrder(o);
      })
      .catch(() => {
        if (ok) setOrder(null);
      });
    return () => {
      ok = false;
    };
  }, [orderIdParam]);

  if (order === undefined) {
    return <p className="text-sm text-zinc-500">Cargando pedido…</p>;
  }

  if (order === null) {
    return (
      <p className="text-sm text-red-700">
        No encontramos ese pedido o no tenés permisos suficientes.
      </p>
    );
  }

  if (!games.length) {
    return <p className="text-sm text-zinc-500">Cargando catálogo para el selector…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Editar pedido</h1>
        <p className="mt-1 text-xs text-zinc-500">{order.id}</p>
      </div>
      <OrderForm games={games} mode="edit" initialOrder={order} />
    </div>
  );
}
