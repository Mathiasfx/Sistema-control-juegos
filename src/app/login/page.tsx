"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch {
      setErr("Credenciales inválidas o usuario deshabilitado.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        Cargando sesión…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-50 px-4 py-12">
      <div className="mx-auto w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-lg font-semibold tracking-tight text-zinc-900">
          Acceso interno
        </h1>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Gestión de pedidos y catálogo
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {err && (
            <p className="rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-xs text-red-800">
              {err}
            </p>
          )}
          <label className="block text-xs font-medium text-zinc-600">
            Correo
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-600">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
     
      </div>
    </div>
  );
}
