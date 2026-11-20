"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_LOGIN } from "@/lib/seed";
import { acceptConsent } from "@/lib/storage";
import { useStore } from "@/lib/store";

export type TourStep = {
  id: string;
  href: string;
  caption: string;
  ms: number;
  gate?: boolean;
  login?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "landing",
    href: "/",
    caption: "AshaLens is a paper-to-safety companion. It is not a doctor and not a diagnosis.",
    ms: 8000,
  },
  {
    id: "home",
    href: "/app",
    login: true,
    caption: "We are logged in as ASHA Meena at Malligai PHC. The roster is synthetic.",
    ms: 8000,
  },
  {
    id: "lakshmi",
    href: "/app/patients/p-lakshmi",
    caption:
      "Lakshmi is 28 weeks pregnant. Iron and calcium must be two hours apart. Blood pressure 148 over 94 is a checklist flag, not a diagnosis.",
    ms: 8000,
  },
  {
    id: "summary",
    href: "/app/patients/p-lakshmi/summary",
    caption: "This page is held up before a video consult. It is not an eSanjeevani record.",
    ms: 8000,
  },
  {
    id: "capture",
    href: "/app/patients/p-lakshmi/capture",
    gate: true,
    caption: "Sample 2 is a cached slip. Ferrous and Shelcal map to iron and calcium. A person still checks the boxes.",
    ms: 8000,
  },
  {
    id: "dialpad",
    href: "/app/dialpad",
    gate: true,
    caption: "The household hears confirmed medicines in Tamil. Nothing is spoken until a person confirmed it.",
    ms: 8000,
  },
  {
    id: "week",
    href: "/app/week",
    caption: "The week list is a visit order, not a diagnosis.",
    ms: 8000,
  },
  {
    id: "models",
    href: "/app/models",
    caption: "The models suggest quality, document type, and visit order. A person confirms every field.",
    ms: 8000,
  },
  {
    id: "close",
    href: "/app",
    caption: "AshaLens flags paper and checklists. A person confirms every field. It is not a medical device.",
    ms: 8000,
  },
];

type TourValue = {
  step: TourStep | null;
  index: number | null;
  paused: boolean;
  play: () => void;
  pause: () => void;
  replay: () => void;
  stop: () => void;
  markReady: () => void;
};

const TourCtx = createContext<TourValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { login } = useStore();
  const loginRef = useRef(login);
  loginRef.current = login;
  const [index, setIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(true);

  const step = index === null ? null : TOUR_STEPS[index];

  useEffect(() => {
    if (index === null) return;
    setReady(!TOUR_STEPS[index].gate);
    let cancel = false;
    const current = TOUR_STEPS[index];
    void (async () => {
      if (current.login) {
        acceptConsent();
        await loginRef.current(DEMO_LOGIN.asha.email, DEMO_LOGIN.asha.password);
      }
      if (!cancel) router.push(current.href);
    })();
    return () => {
      cancel = true;
    };
  }, [index, router]);

  useEffect(() => {
    if (index === null || paused || !ready) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => {
        if (current === null) return null;
        return current >= TOUR_STEPS.length - 1 ? null : current + 1;
      });
    }, TOUR_STEPS[index].ms);
    return () => window.clearTimeout(timer);
  }, [index, paused, ready]);

  const play = useCallback(() => {
    setPaused(false);
    setIndex(0);
  }, []);

  const pause = useCallback(() => setPaused((value) => !value), []);

  const replay = useCallback(() => {
    setPaused(false);
    setIndex(0);
  }, []);

  const stop = useCallback(() => {
    setPaused(false);
    setIndex(null);
  }, []);

  const markReady = useCallback(() => setReady(true), []);

  const value = useMemo(
    () => ({ step, index, paused, play, pause, replay, stop, markReady }),
    [step, index, paused, play, pause, replay, stop, markReady],
  );

  return (
    <TourCtx.Provider value={value}>
      {children}
      {step ? (
        <div className="fixed inset-x-0 top-0 z-40 border-b border-teal-dark bg-teal px-4 py-3 text-cream print:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-wide">
            Tour {index! + 1} / {TOUR_STEPS.length}
            {paused ? " · paused" : ""}
          </p>
          <p className="mt-1 text-sm leading-snug">{step.caption}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={pause} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-teal-dark">
              {paused ? "Resume" : "Pause"}
            </button>
            <button type="button" onClick={replay} className="rounded-full bg-cream/20 px-3 py-1 text-xs font-semibold">
              Replay
            </button>
            <button type="button" onClick={stop} className="rounded-full bg-cream/20 px-3 py-1 text-xs font-semibold">
              Stop
            </button>
          </div>
        </div>
      ) : null}
    </TourCtx.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourCtx);
  if (!ctx) throw new Error("TourProvider missing");
  return ctx;
}
