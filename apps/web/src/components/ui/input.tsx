import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("mt-1 w-full rounded-2xl border border-sand bg-white px-3 py-2 text-sm outline-none focus:border-teal", className)}
      {...props}
    />
  );
}
