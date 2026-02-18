import type { ReactNode } from "react";
import {
  actionBadgeVariant,
  type BadgeVariant,
  badgeVariantClasses,
  roleBadgeVariant,
  statusBadgeVariant,
} from "~/lib/semantic-styles";

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${badgeVariantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export { actionBadgeVariant, roleBadgeVariant, statusBadgeVariant };
