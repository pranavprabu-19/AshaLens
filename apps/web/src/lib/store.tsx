"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_LOGIN, PATIENTS } from "./seed";
import { loadState } from "./storage";
import type { Patient, Role, Session } from "./types";
import { VAULT_DEFAULTS } from "./vault";

type Store = {
  session: Session | null;
  patients: Patient[];
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  refresh: () => void;
};

const SESSION_KEY = "ashalens.session";
const Ctx = createContext<Store | null>(null);

function mergePatients(): Patient[] {
  const extra = loadState().extraByPatient;
  return PATIENTS.map((p) => {
    const e = extra[p.id];
    const seeded = VAULT_DEFAULTS[p.id];
    return {
      ...p,
      medicines: e?.medicines ?? p.medicines,
      documents: e?.documents ?? p.documents,
      vitals: e?.vitals ?? p.vitals,
      abhaId: e?.abhaId ?? p.abhaId,
      allergies: e?.allergies ?? seeded?.allergies ?? p.allergies,
      bloodGroup: e?.bloodGroup ?? seeded?.bloodGroup ?? p.bloodGroup,
      householdId: e?.householdId ?? seeded?.householdId ?? p.householdId,
      vaultRecords: e?.vaultRecords ?? seeded?.vaultRecords ?? p.vaultRecords,
      shareUntil: e?.shareUntil || undefined,
    };
  });
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setPatients(mergePatients());
    setReady(true);
  }, []);

  const value = useMemo<Store>(
    () => ({
      session,
      patients:
        session?.role === "asha" && session.ashaId
          ? patients.filter((p) => p.ashaId === session.ashaId)
          : patients,
      login: async (email, password) => {
        const asha = DEMO_LOGIN.asha;
        const doctor = DEMO_LOGIN.doctor;
        let next: Session | null = null;
        if (email.trim().toLowerCase() === asha.email && password === asha.password) {
          next = { role: "asha" as Role, name: asha.name, ashaId: asha.ashaId };
        } else if (email.trim().toLowerCase() === doctor.email && password === doctor.password) {
          next = { role: "doctor" as Role, name: doctor.name };
        } else {
          const { getSupabase } = await import("./supabase");
          const sb = getSupabase();
          if (sb) {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (!error) {
              next = { role: "asha", name: email.split("@")[0] };
            } else {
              return error.message;
            }
          }
        }
        if (!next) return "Use the demo emails on this screen. Password is demo123.";
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
        setSession(next);
        return null;
      },
      logout: () => {
        sessionStorage.removeItem(SESSION_KEY);
        setSession(null);
      },
      refresh: () => setPatients(mergePatients()),
    }),
    [session, patients],
  );

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-teal-dark">
        Loading AshaLens…
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
