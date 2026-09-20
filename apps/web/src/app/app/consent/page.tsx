"use client";

import { useRouter } from "next/navigation";
import { acceptConsent } from "@/lib/storage";

export default function ConsentPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-teal-dark">Before you use AshaLens</h1>
      <div className="space-y-3 rounded-3xl border border-sand bg-white p-4 text-sm leading-relaxed text-ink/80">
        <p>
          AshaLens is a <strong>patient-safety companion</strong> for training and demonstration. It does not diagnose,
          prescribe, or replace a doctor, ANM, or ASHA.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Every extracted field must be confirmed by a person.</li>
          <li>Safety flags are rule-based reminders, not medical advice.</li>
          <li>This demo uses <strong>synthetic</strong> village data only. Do not photograph real patients yet.</li>
          <li>Do not upload identifiable health records to public clouds without ethics approval.</li>
        </ul>
        <p className="text-ink/60">
          நான் மருத்துவர் அல்ல. இது நோய் கண்டறிதல் அல்ல. உறுதி செய்த பிறகே பதிவு செய்யுங்கள்.
        </p>
      </div>
      <button
        className="w-full rounded-2xl bg-teal py-3 font-semibold text-cream"
        onClick={() => {
          acceptConsent();
          router.replace("/app");
        }}
      >
        I understand — continue
      </button>
    </div>
  );
}
