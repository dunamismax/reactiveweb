import type { ReactNode } from "react";

type BadgeVariant = "default" | "owner" | "admin" | "editor" | "viewer" | "active" | "suspended";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-[var(--border)] text-[var(--foreground)]",
  owner: "border-[var(--role-owner-border)] bg-[var(--role-owner-bg)] text-[var(--role-owner-fg)]",
  admin: "border-[var(--role-admin-border)] bg-[var(--role-admin-bg)] text-[var(--role-admin-fg)]",
  editor:
    "border-[var(--role-editor-border)] bg-[var(--role-editor-bg)] text-[var(--role-editor-fg)]",
  viewer:
    "border-[var(--role-viewer-border)] bg-[var(--role-viewer-bg)] text-[var(--role-viewer-fg)]",
  active:
    "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
  suspended:
    "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)]",
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
