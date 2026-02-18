import type { ReactNode } from "react";

type BadgeVariant = "default" | "owner" | "admin" | "editor" | "viewer" | "active" | "suspended";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-[var(--border)] text-[var(--foreground)]",
  owner: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  admin: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  editor: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  viewer: "border-[var(--border)] bg-[var(--overlay-soft)] text-[var(--muted)]",
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  suspended: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function roleBadgeVariant(role: string): BadgeVariant {
  if (role === "owner" || role === "admin" || role === "editor" || role === "viewer") return role;
  return "default";
}

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "active" || status === "suspended") return status;
  return "default";
}
