import type { Alert, Severity } from "@/lib/types";
import { cn } from "@/lib/cn";

const tone: Record<Severity, string> = {
  high: "border-alert/30 bg-alert/10 text-alert",
  medium: "border-warn/30 bg-warn/10 text-warn",
  info: "border-teal/30 bg-teal/10 text-teal-dark",
};

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="rounded-2xl border border-ok/20 bg-ok/10 px-4 py-3 text-sm text-ok">
        No safety flags on the current record. Still confirm every field with a person.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {alerts.map((a) => (
        <li key={a.id} className={cn("rounded-2xl border px-4 py-3 text-sm", tone[a.severity])}>
          <p className="text-[11px] font-semibold uppercase tracking-wide">{a.kind.replace("_", " ")}</p>
          <p className="mt-1 font-medium leading-snug">{a.message}</p>
          {a.messageTa ? <p className="mt-1 text-[13px] opacity-90">{a.messageTa}</p> : null}
        </li>
      ))}
    </ul>
  );
}
