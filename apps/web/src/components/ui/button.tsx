import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" }) {
  const styles = {
    default: "bg-teal text-cream hover:bg-teal-light",
    outline: "border border-sand bg-white text-ink hover:bg-paper",
    ghost: "text-teal-dark hover:bg-sand",
  }[variant];
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold", styles, className)}
      {...props}
    />
  );
}
