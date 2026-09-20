"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Cpu, Stethoscope, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/app", label: "Home", icon: Stethoscope },
  { href: "/app/patients", label: "Patients", icon: Users },
  { href: "/app/week", label: "This week", icon: CalendarDays },
  { href: "/app/models", label: "Models", icon: Cpu },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-cream/95 backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">
        {items.map((item) => {
          const active = item.href === "/app" ? path === "/app" : path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                  active ? "bg-teal text-cream" : "text-ink/70",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
