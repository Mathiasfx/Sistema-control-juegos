"use client";

import { useEffect, useState } from "react";
import { OrderForm } from "@/components/OrderForm";
import { listGames } from "@/lib/firestore/games";
import type { Game } from "@/lib/types";

export default function NewOrderPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    listGames()
      .then((g) => {
        if (alive) setGames(g);
      })
      .catch(console.error)
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="text-sm text-zinc-500">Cargando catálogo disponible…</div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Nuevo pedido</h1>
        <p className="text-sm text-zinc-600">
          Aún no hay juegos cargados para asociar. Pedí en administración que den de
          alta el catálogo (con precios) antes de cargar pedidos.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Nuevo pedido</h1>
        <p className="mt-1 text-sm text-zinc-500">
          La fecha de entrega alimenta el panel cuando agrupamos por mes de entrega.
        </p>
      </div>
      <OrderForm games={games} mode="create" />
    </div>
  );
}
