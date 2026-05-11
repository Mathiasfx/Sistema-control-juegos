import type { GameCategoryValue, PaymentStatusKey, WorkStatusKey } from "./constants";
import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "operativo";

export type Game = {
  id: string;
  name: string;
  description: string;
  category: GameCategoryValue | string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type GamePricing = {
  price: number;
  updatedAt: Timestamp;
};

export type Order = {
  id: string;
  clientName: string;
  gameId: string;
  gameNameSnapshot: string;
  quantity: number;
  platformRequested: string;
  assigneeEncargado: string;
  deliveryDate: Timestamp;
  notes: string;
  workStatus: WorkStatusKey;
  paymentStatus: PaymentStatusKey;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type OrderBilling = {
  unitPriceSnapshot: number;
  totalAmount: number;
  amountPaid: number;
  paymentDate: Timestamp | null;
  updatedAt: Timestamp;
};

export type MonthCriterion = "delivery" | "created";
