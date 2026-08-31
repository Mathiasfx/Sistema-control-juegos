"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { OrderWorkStatusBadge } from "@/components/OrderWorkStatusBadge";
import {
  TableEditIcon,
  TableOpenIcon,
  tableIconButtonClass,
} from "@/components/TableActionIcons";
import { DELIVERY_DATE_OVERDUE_CLASS, PAYMENT_STATUS } from "@/lib/constants";
import { timestampToInputDate } from "@/lib/dates";
import { orderCrossesCalendarMonths } from "@/lib/dashboard-metrics";
import {
  groupOrdersByWorkPriority,
  isWorkOverdue,
  WORK_PRIORITY_GROUP_HEADER_CLASS,
} from "@/lib/order-work-board";
import type { Order } from "@/lib/types";

type OrdersGroupedTableProps = {
  orders: Order[];
  variant: "list" | "panel";
  emptyMessage: string;
  onEditOrder?: (orderId: string) => void;
};

function DeliveryDateCell({ order }: { order: Order }) {
  const overdue = isWorkOverdue(order);
  return (
    <td
      className={`px-5 py-4 whitespace-nowrap ${
        overdue ? DELIVERY_DATE_OVERDUE_CLASS : "text-zinc-600"
      }`}
    >
      {timestampToInputDate(order.deliveryDate)}
    </td>
  );
}

function CrossMonthBadge() {
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-100">
      Cruza meses
    </span>
  );
}

function ListOrderRow({
  order,
  muted,
  onEdit,
}: {
  order: Order;
  muted: boolean;
  onEdit?: (orderId: string) => void;
}) {
  return (
    <tr
      key={order.id}
      className={`hover:bg-zinc-50/80 ${muted ? "text-zinc-500" : ""}`}
    >
      <td className={`px-5 py-4 font-medium ${muted ? "" : "text-zinc-900"}`}>
        {order.clientName}
      </td>
      <td className="px-5 py-4 text-zinc-700">{order.gameNameSnapshot}</td>
      <td className="px-5 py-4 text-zinc-600">{order.quantity}</td>
      <td className="px-5 py-4 text-zinc-600">{order.assigneeEncargado}</td>
      <DeliveryDateCell order={order} />
      <td className="px-5 py-4">
        <OrderWorkStatusBadge order={order} />
      </td>
      <td className="px-5 py-4 text-zinc-600">
        {PAYMENT_STATUS[order.paymentStatus]}
      </td>
      <td className="px-5 py-4 text-right whitespace-nowrap">
        <div className="flex flex-wrap justify-end gap-2">
          {orderCrossesCalendarMonths(order) && <CrossMonthBadge />}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(order.id)}
              title="Editar pedido"
              aria-label="Editar pedido"
              className={tableIconButtonClass}
            >
              <TableEditIcon />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function PanelOrderRow({ order, muted }: { order: Order; muted: boolean }) {
  return (
    <tr
      key={order.id}
      className={`hover:bg-zinc-50/80 ${muted ? "text-zinc-500" : ""}`}
    >
      <td className={`px-5 py-4 font-medium ${muted ? "" : "text-zinc-900"}`}>
        {order.clientName}
      </td>
      <td className="px-5 py-4 text-zinc-700">{order.gameNameSnapshot}</td>
      <DeliveryDateCell order={order} />
      <td className="px-5 py-4">
        <OrderWorkStatusBadge order={order} />
      </td>
      <td className="px-5 py-4 text-zinc-600">
        {PAYMENT_STATUS[order.paymentStatus]}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          {orderCrossesCalendarMonths(order) && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-100">
              Pedido en otro mes
            </span>
          )}
          <Link
            href={`/pedidos/${order.id}`}
            title="Abrir pedido"
            aria-label="Abrir pedido"
            className={tableIconButtonClass}
          >
            <TableOpenIcon />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function TableHead({ variant }: { variant: "list" | "panel" }) {
  if (variant === "panel") {
    return (
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
    );
  }

  return (
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
  );
}

function SectionBlock({
  title,
  count,
  headerClass,
  children,
}: {
  title: string;
  count: number;
  headerClass: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div
        className={`flex items-center justify-between border-b px-5 py-3 text-sm font-medium ${headerClass}`}
      >
        <h3>{title}</h3>
        <span className="text-xs font-normal opacity-80">
          {count} {count === 1 ? "pedido" : "pedidos"}
        </span>
      </div>
      {children}
    </section>
  );
}

export function OrdersGroupedTable({
  orders,
  variant,
  emptyMessage,
  onEditOrder,
}: OrdersGroupedTableProps) {
  const sections = useMemo(
    () => groupOrdersByWorkPriority(orders),
    [orders]
  );

  if (orders.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <p className="px-4 py-10 text-center text-sm text-zinc-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const muted = section.key === "completado";
        return (
          <SectionBlock
            key={section.key}
            title={section.label}
            count={section.orders.length}
            headerClass={WORK_PRIORITY_GROUP_HEADER_CLASS[section.key]}
          >
            <table className="min-w-full text-left text-sm">
              <TableHead variant={variant} />
              <tbody className="divide-y divide-zinc-100">
                {section.orders.map((order) =>
                  variant === "list" ? (
                    <ListOrderRow
                      key={order.id}
                      order={order}
                      muted={muted}
                      onEdit={onEditOrder}
                    />
                  ) : (
                    <PanelOrderRow
                      key={order.id}
                      order={order}
                      muted={muted}
                    />
                  )
                )}
              </tbody>
            </table>
          </SectionBlock>
        );
      })}
    </div>
  );
}
