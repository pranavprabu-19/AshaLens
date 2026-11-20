"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { hasConsent } from "@/lib/storage";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useStore();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!hasConsent() && path !== "/app/consent") {
      router.replace("/app/consent");
    }
  }, [session, path, router]);

  if (!session) return null;

  const hideNav = path === "/app/consent";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-cream pb-24 print:bg-white print:pb-0">
      <header className="flex items-center justify-between border-b border-sand px-4 py-3 print:hidden">
        <div>
          <p className="font-display text-lg text-teal-dark">AshaLens</p>
          <p className="text-xs text-ink/60">
            {session.role === "asha" ? `ASHA · ${session.name}` : `Visiting doctor · ${session.name}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="rounded-full bg-sand px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-dark"
        >
          Sign out
        </button>
      </header>
      <main className="px-4 py-4">{children}</main>
      {hideNav ? null : <BottomNav />}
    </div>
  );
}
