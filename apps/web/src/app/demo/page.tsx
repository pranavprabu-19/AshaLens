"use client";

import { TOUR_STEPS, useTour } from "@/lib/tour";

export default function DemoPage() {
  const { play, step } = useTour();

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-cream px-5 py-8">
      <p className="text-xs uppercase tracking-wide text-teal">Automatic walkthrough</p>
      <h1 className="font-display text-3xl text-teal-dark">Play the features</h1>
      <p className="mt-2 text-sm text-ink/70">
        Play tour logs in as ASHA Meena and walks the real screens. Record the window if you need a video. It is not a diagnosis.
      </p>
      <button
        type="button"
        onClick={play}
        className="mt-6 w-full rounded-2xl bg-teal py-3 text-center font-semibold text-cream"
      >
        {step ? "Replay tour" : "Play tour"}
      </button>
      <ol className="mt-6 space-y-3">
        {TOUR_STEPS.map((beat, index) => (
          <li key={beat.id} className="rounded-3xl bg-white p-4 shadow-card">
            <p className="text-xs font-semibold text-teal">{index + 1}</p>
            <p className="text-sm text-ink/70">{beat.caption}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
