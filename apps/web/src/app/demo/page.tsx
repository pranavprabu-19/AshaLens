import Link from "next/link";

const BEATS = [
  { t: "0:00", title: "Login as Meena", body: "ASHA demo account. Consent screen first." },
  { t: "0:20", title: "Lakshmi’s card", body: "Iron+calcium, overdue ANC, rising BP — rule flags, not a diagnosis." },
  { t: "0:40", title: "Capture paper", body: "Photo → quality gate → document type → NER suggestion → you confirm." },
  { t: "1:05", title: "This week", body: "Ranked households. Doctor copies a briefing. Offline queue if the API is down." },
];

export default function DemoPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-cream px-5 py-8">
      <p className="text-xs uppercase tracking-wide text-teal">Demo video storyboard</p>
      <h1 className="font-display text-3xl text-teal-dark">90 seconds on a phone</h1>
      <p className="mt-2 text-sm text-ink/70">
        Record this on your phone for GitHub and internships. Keep the disclaimer on screen.
      </p>
      <ol className="mt-6 space-y-3">
        {BEATS.map((b) => (
          <li key={b.t} className="rounded-3xl bg-white p-4 shadow-card">
            <p className="text-xs font-semibold text-teal">{b.t}</p>
            <h2 className="font-display text-xl">{b.title}</h2>
            <p className="text-sm text-ink/70">{b.body}</p>
          </li>
        ))}
      </ol>
      <Link href="/login" className="mt-6 block rounded-2xl bg-teal py-3 text-center font-semibold text-cream">
        Start the live demo
      </Link>
    </div>
  );
}
