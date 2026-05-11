import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { PaymentStatusKey, WorkStatusKey } from "@/lib/constants";
import { getDb } from "@/lib/firebase/client";
import type { Order, OrderBilling } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

const ordersCollection = () => collection(getDb(), "orders");

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    clientName: String(data.clientName ?? ""),
    gameId: String(data.gameId ?? ""),
    gameNameSnapshot: String(data.gameNameSnapshot ?? ""),
    quantity: Number(data.quantity ?? 1),
    platformRequested: String(data.platformRequested ?? ""),
    assigneeEncargado: String(data.assigneeEncargado ?? ""),
    deliveryDate: data.deliveryDate as Timestamp,
    notes: String(data.notes ?? ""),
    workStatus: data.workStatus as WorkStatusKey,
    paymentStatus: data.paymentStatus as PaymentStatusKey,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

export function billingDocRef(orderId: string) {
  return doc(getDb(), "orders", orderId, "billing", "summary");
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const ref = doc(getDb(), "orders", orderId);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  return mapOrder(s.id, s.data() as Record<string, unknown>);
}

export async function getOrderBilling(orderId: string): Promise<OrderBilling | null> {
  const s = await getDoc(billingDocRef(orderId));
  if (!s.exists()) return null;
  const d = s.data() as Record<string, unknown>;
  return {
    unitPriceSnapshot: Number(d.unitPriceSnapshot ?? 0),
    totalAmount: Number(d.totalAmount ?? 0),
    amountPaid: Number(d.amountPaid ?? 0),
    paymentDate: (d.paymentDate as Timestamp | null | undefined) ?? null,
    updatedAt: d.updatedAt as Timestamp,
  };
}

export async function createOrder(input: {
  clientName: string;
  gameId: string;
  gameNameSnapshot: string;
  quantity: number;
  platformRequested: string;
  assigneeEncargado: string;
  deliveryDate: Timestamp;
  notes: string;
}): Promise<string> {
  const orderRef = doc(ordersCollection());
  const ts = serverTimestamp();
  await setDoc(orderRef, {
    clientName: input.clientName.trim(),
    gameId: input.gameId,
    gameNameSnapshot: input.gameNameSnapshot.trim(),
    quantity: input.quantity,
    platformRequested: input.platformRequested.trim(),
    assigneeEncargado: input.assigneeEncargado.trim(),
    deliveryDate: input.deliveryDate,
    notes: input.notes.trim(),
    workStatus: "pendiente",
    paymentStatus: "pendiente",
    createdAt: ts,
    updatedAt: ts,
  });
  return orderRef.id;
}

export async function updateOrderCore(input: {
  orderId: string;
  clientName: string;
  gameId: string;
  gameNameSnapshot: string;
  quantity: number;
  platformRequested: string;
  assigneeEncargado: string;
  deliveryDate: Timestamp;
  notes: string;
  workStatus: WorkStatusKey;
}): Promise<void> {
  const ref = doc(getDb(), "orders", input.orderId);
  await updateDoc(ref, {
    clientName: input.clientName.trim(),
    gameId: input.gameId,
    gameNameSnapshot: input.gameNameSnapshot.trim(),
    quantity: input.quantity,
    platformRequested: input.platformRequested.trim(),
    assigneeEncargado: input.assigneeEncargado.trim(),
    deliveryDate: input.deliveryDate,
    notes: input.notes.trim(),
    workStatus: input.workStatus,
    updatedAt: serverTimestamp(),
  });
}

/** Solo admin: actualiza estado de pago en el pedido y facturación. */
export async function updateOrderBilling(input: {
  orderId: string;
  paymentStatus: PaymentStatusKey;
  unitPriceSnapshot: number;
  totalAmount: number;
  amountPaid: number;
  paymentDate: Timestamp | null;
}): Promise<void> {
  const orderRef = doc(getDb(), "orders", input.orderId);
  const billRef = billingDocRef(input.orderId);
  const ts = serverTimestamp();
  await updateDoc(orderRef, {
    paymentStatus: input.paymentStatus,
    updatedAt: ts,
  });
  await setDoc(
    billRef,
    {
      unitPriceSnapshot: input.unitPriceSnapshot,
      totalAmount: input.totalAmount,
      amountPaid: input.amountPaid,
      paymentDate: input.paymentDate,
      updatedAt: ts,
    },
    { merge: true }
  );
}

export async function deleteOrder(
  orderId: string,
  options: { removeBillingIfPossible: boolean }
): Promise<void> {
  if (options.removeBillingIfPossible) {
    const billRef = billingDocRef(orderId);
    const bs = await getDoc(billRef);
    if (bs.exists()) await deleteDoc(billRef);
  }
  await deleteDoc(doc(getDb(), "orders", orderId));
}

export function subscribeOrders(callback: (orders: Order[]) => void) {
  const q = query(ordersCollection(), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>))
    );
  });
}
