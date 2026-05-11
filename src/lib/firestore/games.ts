import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { GameCategoryValue } from "@/lib/constants";
import { getDb } from "@/lib/firebase/client";
import type { Game } from "@/lib/types";

const gamesCollection = () => collection(getDb(), "games");

function mapGame(id: string, data: Record<string, unknown>): Game {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? "otros"),
    createdAt: data.createdAt as Game["createdAt"],
    updatedAt: data.updatedAt as Game["updatedAt"],
  };
}

export async function listGames(): Promise<Game[]> {
  const snap = await getDocs(gamesCollection());
  return snap.docs.map((d) => mapGame(d.id, d.data() as Record<string, unknown>));
}

export async function getGame(gameId: string): Promise<Game | null> {
  const ref = doc(getDb(), "games", gameId);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  return mapGame(s.id, s.data() as Record<string, unknown>);
}

export async function getGamePrice(gameId: string): Promise<number | null> {
  const ref = doc(getDb(), "gamePricing", gameId);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  const data = s.data() as { price?: number };
  return typeof data.price === "number" ? data.price : null;
}

export async function createGame(input: {
  name: string;
  description: string;
  category: GameCategoryValue | string;
  price: number;
}): Promise<string> {
  const gameRef = doc(gamesCollection());
  const pricingRef = doc(getDb(), "gamePricing", gameRef.id);
  const ts = serverTimestamp();
  await setDoc(gameRef, {
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    createdAt: ts,
    updatedAt: ts,
  });
  await setDoc(pricingRef, {
    price: input.price,
    updatedAt: ts,
  });
  return gameRef.id;
}

export async function updateGame(input: {
  id: string;
  name: string;
  description: string;
  category: GameCategoryValue | string;
  price: number;
}): Promise<void> {
  const gameRef = doc(getDb(), "games", input.id);
  const pricingRef = doc(getDb(), "gamePricing", input.id);
  const ts = serverTimestamp();
  await updateDoc(gameRef, {
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    updatedAt: ts,
  });
  await setDoc(
    pricingRef,
    { price: input.price, updatedAt: ts },
    { merge: true }
  );
}

export async function deleteGame(gameId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "games", gameId));
  const pricingRef = doc(getDb(), "gamePricing", gameId);
  const ps = await getDoc(pricingRef);
  if (ps.exists()) await deleteDoc(pricingRef);
}
