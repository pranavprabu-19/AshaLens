"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { DEMO_LOGIN, PHC_BLOCK, PHC_NAME } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { session, login } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_LOGIN.asha.email);
  const [password, setPassword] = useState(DEMO_LOGIN.asha.password);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) router.replace("/app");
  }, [session, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const msg = await login(email, password);
    setBusy(false);
    if (msg) setError(msg);
    else router.push("/app");
  }

  return (
    <div className="paper-grid min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-between px-5 py-8">
        <div>
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            AshaLens
          </Link>
          <h1 className="mt-3 font-display text-4xl leading-tight text-teal-dark">Enter the clinic</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/75">
            Demo auth works without Supabase. Add NEXT_PUBLIC_SUPABASE_URL to use real email login later.
          </p>
          <p className="mt-4 text-xs text-ink/55">
            {PHC_NAME} · {PHC_BLOCK}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3 rounded-3xl bg-cream/90 p-5 shadow-card">
          <label className="block text-sm font-medium">
            Email
            <Input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-alert">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Enter the clinic"}
          </Button>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-ink/70">
            <Button
              type="button"
              variant="outline"
              className="py-2 text-xs"
              onClick={() => {
                setEmail(DEMO_LOGIN.asha.email);
                setPassword(DEMO_LOGIN.asha.password);
              }}
            >
              ASHA Meena
            </Button>
            <Button
              type="button"
              variant="outline"
              className="py-2 text-xs"
              onClick={() => {
                setEmail(DEMO_LOGIN.doctor.email);
                setPassword(DEMO_LOGIN.doctor.password);
              }}
            >
              Dr. Kumar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
