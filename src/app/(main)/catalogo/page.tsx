"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GAME_CATEGORIES, categoryLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/formatMoney";
import {
  createGame,
  deleteGame,
  listGames,
  getGamePrice,
  updateGame,
} from "@/lib/firestore/games";
import {
  TableEditIcon,
  TableTrashIcon,
  tableIconButtonClass,
  tableIconButtonDangerClass,
} from "@/components/TableActionIcons";
import type { Game } from "@/lib/types";

type Row = Game & { price?: number | null };

export default function CatalogPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("memoria");
  const [price, setPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const isAdmin = role === "admin";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const gs = await listGames();
      if (isAdmin) {
        const withPrices = await Promise.all(
          gs.map(async (g) => {
            const p = await getGamePrice(g.id);
            return { ...g, price: p };
          })
        );
        setRows(withPrices);
      } else {
        setRows(gs.map((g) => ({ ...g, price: null })));
      }
    } catch (e) {
      console.error(e);
      setError("No pudimos leer Firestore.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(ev: FormEvent) {
    ev.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      await createGame({
        name,
        description,
        category,
        price,
      });
      setName("");
      setDescription("");
      setCategory("memoria");
      setPrice(0);
      await refresh();
    } catch (e) {
      console.error(e);
      setError("No pudimos crear el juego.");
    } finally {
      setSaving(false);
    }
  }

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.name.localeCompare(b.name)),
    [rows]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Catálogo de juegos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Catalogo de juegos para la venta en fiestas interactivas.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Dar de alta juego</h2>
          <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-zinc-600 sm:col-span-2">
              Nombre
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-zinc-600 sm:col-span-2">
              Descripción
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-zinc-600">
              Categoría
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
              >
                {GAME_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-zinc-600">
              Precio
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={Number.isNaN(price) ? "" : price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
              />
            </label>
            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                Guardar juego
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            Leyendo colección games…
          </p>
        ) : sorted.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No hay juegos todavía.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-4 font-medium">Nombre</th>
                <th className="px-5 py-4 font-medium">Categoría</th>
                {isAdmin && <th className="px-5 py-4 font-medium">Precio</th>}
                <th className="px-5 py-4 font-medium">Descripción</th>
                {isAdmin && <th className="px-5 py-4 font-medium" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sorted.map((g) => (
                <CatalogRow key={g.id} game={g} isAdmin={isAdmin} onChanged={refresh} />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {!isAdmin && (
        <p className="text-xs text-zinc-500">
          Como perfil operativo ves nombre, tipo y descripción únicamente — los montos sólo están visibles para la administración.
        </p>
      )}
    </div>
  );
}

function CatalogRow({
  game,
  isAdmin,
  onChanged,
}: {
  game: Row;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(game.name);
  const [description, setDescription] = useState(game.description);
  const [category, setCategory] = useState(game.category);
  const [price, setPrice] = useState(game.price ?? 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(game.name);
    setDescription(game.description);
    setCategory(game.category);
    setPrice(game.price ?? 0);
  }, [game]);

  async function handleSave(ev: FormEvent) {
    ev.preventDefault();
    if (!isAdmin) return;
    setBusy(true);
    try {
      await updateGame({
        id: game.id,
        name,
        description,
        category,
        price,
      });
      setEdit(false);
      onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar juego permanentemente del catálogo?")) return;
    setBusy(true);
    try {
      await deleteGame(game.id);
      onChanged();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin || !edit) {
    return (
      <tr>
        <td className="px-5 py-4 font-medium">{game.name}</td>
        <td className="px-5 py-4 text-zinc-600">{categoryLabel(game.category)}</td>
        {isAdmin && (
          <td className="whitespace-nowrap px-5 py-4 text-zinc-700">
            {typeof game.price === "number"
              ? formatMoney(game.price)
              : formatMoney(0)}
          </td>
        )}
        <td className="px-5 py-4 text-zinc-600">{game.description}</td>
        {isAdmin && (
          <td className="px-5 py-4 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEdit(true)}
                title="Editar juego"
                aria-label="Editar juego"
                className={tableIconButtonClass}
              >
                <TableEditIcon />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                title="Eliminar juego"
                aria-label="Eliminar juego del catálogo"
                className={tableIconButtonDangerClass}
              >
                <TableTrashIcon />
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={isAdmin ? 5 : 3}>
        <form onSubmit={handleSave} className="grid gap-3 py-3 sm:grid-cols-5">
          <label className="text-xs font-medium text-zinc-600">
            Nombre
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Categoría
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
            >
              {GAME_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Precio
            <input
              type="number"
              step={0.01}
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
            />
          </label>
          <label className="sm:col-span-2 text-xs font-medium text-zinc-600">
            Descripción
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-5">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Guardar fila
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-md border px-3 py-1.5 text-xs font-semibold text-zinc-700"
              onClick={() => setEdit(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
