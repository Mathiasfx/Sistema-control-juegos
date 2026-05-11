"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import type { UserRole } from "@/lib/types";

type AuthState = {
  user: User | null;
  role: UserRole;
  loading: boolean;
  idToken: string | null;
  refreshIdToken: () => Promise<void>;
};

const AuthContext = createContext<
  | (AuthState & {
      signIn: (email: string, password: string) => Promise<void>;
      logOut: () => Promise<void>;
    })
  | null
>(null);

function roleFromClaims(claims: Record<string, unknown>): UserRole {
  const raw = claims.role;
  return raw === "admin" ? "admin" : "operativo";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("operativo");
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshIdToken = useCallback(async () => {
    const auth = getAuthClient();
    const u = auth.currentUser;
    if (!u) {
      setIdToken(null);
      return;
    }
    const tok = await u.getIdToken(true);
    setIdToken(tok);
    const res = await u.getIdTokenResult();
    setRole(roleFromClaims(res.claims as Record<string, unknown>));
  }, []);

  useEffect(() => {
    const auth = getAuthClient();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const tok = await u.getIdToken();
        setIdToken(tok);
        const res = await u.getIdTokenResult();
        setRole(roleFromClaims(res.claims as Record<string, unknown>));
      } else {
        setIdToken(null);
        setRole("operativo");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getAuthClient();
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logOut = useCallback(async () => {
    const auth = getAuthClient();
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      idToken,
      refreshIdToken,
      signIn,
      logOut,
    }),
    [user, role, loading, idToken, refreshIdToken, signIn, logOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
