"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

const nav = [
  { href: "/", label: "Panel" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/catalogo", label: "Catálogo" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, role, logOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
              Gestión de juegos
            </Link>
            <nav className="flex gap-1">
              {nav.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? "bg-zinc-100 font-medium text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium capitalize text-zinc-700">
              {role === "admin" ? "Administrador" : "Operativo"}
            </span>
            <span className="hidden sm:inline truncate max-w-[160px]" title={user?.email ?? ""}>
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => logOut()}
              className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-700 hover:bg-zinc-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
