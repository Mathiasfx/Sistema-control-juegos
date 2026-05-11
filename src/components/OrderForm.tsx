"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  PAYMENT_STATUS,
  WORK_STATUS,
  type PaymentStatusKey,
  type WorkStatusKey,
} from "@/lib/constants";
import { inputDateToTimestamp, timestampToInputDate } from "@/lib/dates";
import { formatMoney } from "@/lib/formatMoney";
import { getGamePrice } from "@/lib/firestore/games";
import {
  createOrder,
  deleteOrder,
  getOrderBilling,
  updateOrderBilling,
  updateOrderCore,
} from "@/lib/firestore/orders";
import type { Game, Order } from "@/lib/types";

type Props = {
  games: Game[];
  mode: "create" | "edit";
  initialOrder?: Order | null;
};

export function OrderForm({ games, mode, initialOrder }: Props) {
  const router = useRouter();
  const { role } = useAuth();

  const [clientName, setClientName] = useState("");
  const [gameId, setGameId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [platformRequested, setPlatformRequested] = useState("");
  const [assigneeEncargado, setAssigneeEncargado] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [workStatus, setWorkStatus] = useState<WorkStatusKey>("pendiente");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusKey>("pendiente");
  const [unitPrice, setUnitPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const gameNameSnapshot = useMemo(() => {
    const g = games.find((x) => x.id === gameId);
    return g?.name ?? "";
  }, [games, gameId]);

  useEffect(() => {
    if (mode !== "edit" || !initialOrder) return;
    setClientName(initialOrder.clientName);
    setGameId(initialOrder.gameId);
    setQuantity(initialOrder.quantity);
    setPlatformRequested(initialOrder.platformRequested);
    setAssigneeEncargado(initialOrder.assigneeEncargado);
    setDeliveryDate(timestampToInputDate(initialOrder.deliveryDate));
    setNotes(initialOrder.notes);
    setWorkStatus(initialOrder.workStatus);
    setPaymentStatus(initialOrder.paymentStatus);
  }, [mode, initialOrder]);

  useEffect(() => {
    if (role !== "admin") return;
    if (mode !== "edit" || !initialOrder?.id) return;
    let ok = true;
    (async () => {
      try {
        const b = await getOrderBilling(initialOrder.id);
        if (!ok) return;
        if (b) {
          setUnitPrice(b.unitPriceSnapshot);
          setTotalAmount(b.totalAmount);
          setAmountPaid(b.amountPaid);
          setPaymentDate(
            b.paymentDate ? timestampToInputDate(b.paymentDate) : ""
          );
        } else {
          setUnitPrice(0);
          setTotalAmount(0);
          setAmountPaid(0);
          setPaymentDate("");
        }
      } catch {
        if (ok) setMsg("No pudimos cargar datos de facturación (¿permisos?)");
      }
    })();
    return () => {
      ok = false;
    };
  }, [role, mode, initialOrder?.id]);

  useEffect(() => {
    if (role !== "admin") return;
    setTotalAmount(Math.max(0, unitPrice) * Math.max(1, quantity));
  }, [unitPrice, quantity, role]);

  async function handleApplyCatalogPrice() {
    if (!gameId) {
      setMsg("Seleccioná un juego primero");
      return;
    }
    const p = await getGamePrice(gameId);
    if (p == null) {
      setMsg(
        "No hay precio en catálogo para este juego (solo admins lo gestionan)."
      );
      return;
    }
    setUnitPrice(p);
    setMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!deliveryDate) {
      setMsg("La fecha de entrega es obligatoria");
      return;
    }
    if (!gameId || !games.some((g) => g.id === gameId)) {
      setMsg("Seleccioná un juego válido");
      return;
    }
    const deliveryTs = inputDateToTimestamp(deliveryDate);
    setSaving(true);
    try {
      const qty = Math.max(1, quantity);
      const computedTotal =
        Math.max(0, Number(unitPrice) || 0) * qty;
      const finalTotal =
        Number.isFinite(totalAmount) && totalAmount > 0
          ? totalAmount
          : computedTotal;

      if (mode === "create") {
        const id = await createOrder({
          clientName,
          gameId,
          gameNameSnapshot,
          quantity: Math.max(1, quantity),
          platformRequested,
          assigneeEncargado,
          deliveryDate: deliveryTs,
          notes,
        });
        if (role === "admin") {
          const payTs =
            paymentDate.trim() !== ""
              ? inputDateToTimestamp(paymentDate.trim())
              : null;
          await updateOrderBilling({
            orderId: id,
            paymentStatus,
            unitPriceSnapshot: unitPrice,
            totalAmount: finalTotal,
            amountPaid,
            paymentDate: payTs,
          });
        }
        router.replace(`/pedidos/${id}`);
        return;
      }
      if (!initialOrder) return;
      await updateOrderCore({
        orderId: initialOrder.id,
        clientName,
        gameId,
        gameNameSnapshot,
        quantity: Math.max(1, quantity),
        platformRequested,
        assigneeEncargado,
        deliveryDate: deliveryTs,
        notes,
        workStatus,
      });
      if (role === "admin") {
        const payTs =
          paymentDate.trim() !== ""
            ? inputDateToTimestamp(paymentDate.trim())
            : null;
        await updateOrderBilling({
          orderId: initialOrder.id,
          paymentStatus,
          unitPriceSnapshot: unitPrice,
          totalAmount: finalTotal,
          amountPaid,
          paymentDate: payTs,
        });
      }
      router.refresh();
      setMsg("Guardado.");
    } catch (err) {
      console.error(err);
      setMsg("No se pudo guardar. Revisa la consola o tus reglas Firestore.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialOrder) return;
    if (!confirm("¿Eliminar este pedido de forma permanente?")) return;
    setSaving(true);
    try {
      await deleteOrder(initialOrder.id, {
        removeBillingIfPossible: role === "admin",
      });
      router.replace("/pedidos");
    } catch (err) {
      console.error(err);
      setMsg("No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  }

  const disabled = saving;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      {msg && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {msg}
        </p>
      )}

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Pedido</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <input
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={disabled}
            />
          </Field>
          <Field label="Juego">
            <select
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              disabled={disabled}
            >
              <option value="">Seleccionar…</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad">
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={disabled}
            />
          </Field>
          <Field label="Plataforma pedida">
            <input
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
              value={platformRequested}
              onChange={(e) => setPlatformRequested(e.target.value)}
              disabled={disabled}
            />
          </Field>
          <Field label="Encargado">
            <input
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
              value={assigneeEncargado}
              onChange={(e) => setAssigneeEncargado(e.target.value)}
              disabled={disabled}
            />
          </Field>
          <Field label="Fecha de entrega">
            <input
              type="date"
              required
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              disabled={disabled}
            />
          </Field>
        </div>
        <Field label="Notas">
          <textarea
            className="mt-1 min-h-[96px] w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled}
          />
        </Field>
        <Field label="Estado del trabajo">
          <select
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
            value={workStatus}
            onChange={(e) => setWorkStatus(e.target.value as WorkStatusKey)}
            disabled={disabled}
          >
            {(Object.keys(WORK_STATUS) as WorkStatusKey[]).map((k) => (
              <option key={k} value={k}>
                {WORK_STATUS[k]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Pago</h2>
        {role === "admin" ? (
          <>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleApplyCatalogPrice()}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                disabled={disabled}
              >
                Usar precio del catálogo
              </button>
              <p className="self-center text-xs text-zinc-500">
                Total calculado ({quantity} × precio unit.):{" "}
                <span className="font-medium text-zinc-800">
                  {formatMoney(Math.max(0, unitPrice) * Math.max(1, quantity))}
                </span>
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Precio unitario (snapshot)">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
                  value={Number.isNaN(unitPrice) ? "" : unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  disabled={disabled}
                />
              </Field>
              <Field label="Total esperado">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
                  value={Number.isNaN(totalAmount) ? "" : totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  disabled={disabled}
                />
              </Field>
              <Field label="Importe ya pagado">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
                  value={Number.isNaN(amountPaid) ? "" : amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  disabled={disabled}
                />
              </Field>
              <Field label="Estado de pago">
                <select
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as PaymentStatusKey)
                  }
                  disabled={disabled}
                >
                  {(Object.keys(PAYMENT_STATUS) as PaymentStatusKey[]).map(
                    (k) => (
                      <option key={k} value={k}>
                        {PAYMENT_STATUS[k]}
                      </option>
                    )
                  )}
                </select>
              </Field>
              <Field label="Fecha de pago">
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={disabled}
                />
              </Field>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-600">
            Estado de pago registrado solo por administración. Vista operativa sin
            importes ni fechas de cobro — consultá con tu referente financiero si
            hace falta:{" "}
            <span className="font-medium text-zinc-900">
              {PAYMENT_STATUS[paymentStatus]}
            </span>
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {mode === "create" ? "Crear pedido" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-50"
        >
          Volver
        </button>
        {mode === "edit" && initialOrder && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={disabled}
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900 hover:bg-red-100 disabled:opacity-50"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-zinc-600">
      {label}
      {children}
    </label>
  );
}
