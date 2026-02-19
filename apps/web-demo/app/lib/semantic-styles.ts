const roleToneClasses = {
  owner: "border-[var(--role-owner-border)] bg-[var(--role-owner-bg)] text-[var(--role-owner-fg)]",
  admin: "border-[var(--role-admin-border)] bg-[var(--role-admin-bg)] text-[var(--role-admin-fg)]",
  editor:
    "border-[var(--role-editor-border)] bg-[var(--role-editor-bg)] text-[var(--role-editor-fg)]",
  viewer:
    "border-[var(--role-viewer-border)] bg-[var(--role-viewer-bg)] text-[var(--role-viewer-fg)]",
} as const;

const statusToneClasses = {
  active:
    "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
  suspended:
    "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)]",
} as const;

const toneSurfaceClasses = {
  success:
    "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
  warning:
    "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)]",
  error: "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)]",
  info: "border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] text-[var(--tone-info-fg)]",
  secondary:
    "border-[var(--tone-secondary-border)] bg-[var(--tone-secondary-bg)] text-[var(--tone-secondary-fg)]",
} as const;

export const badgeVariantClasses = {
  default: "border-[var(--border)] text-[var(--foreground)]",
  ...roleToneClasses,
  ...statusToneClasses,
} as const;

export type BadgeVariant = keyof typeof badgeVariantClasses;

export function roleBadgeVariant(role: string): BadgeVariant {
  if (role in roleToneClasses) return role as keyof typeof roleToneClasses;
  return "default";
}

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status in statusToneClasses) return status as keyof typeof statusToneClasses;
  return "default";
}

export function actionBadgeVariant(action: string): BadgeVariant {
  const normalized = action.toLowerCase();
  if (normalized === "created") return "admin";
  if (normalized === "updated") return "editor";
  if (normalized === "activated") return "active";
  if (normalized === "suspended") return "suspended";
  return "default";
}

export const avatarPaletteClasses = [
  roleToneClasses.admin,
  toneSurfaceClasses.success,
  roleToneClasses.owner,
  toneSurfaceClasses.secondary,
  roleToneClasses.editor,
  toneSurfaceClasses.error,
  roleToneClasses.viewer,
] as const;

export const confirmToneClasses = {
  danger: `${toneSurfaceClasses.error} hover:opacity-90`,
  warning: `${toneSurfaceClasses.warning} hover:opacity-90`,
  default:
    "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
} as const;

export const statToneClasses = {
  default: "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)]",
  good: toneSurfaceClasses.success,
  warn: toneSurfaceClasses.error,
} as const;

export const toastVariantClasses = {
  success: {
    container: toneSurfaceClasses.success,
    bar: "bg-[var(--tone-success-fg)]",
  },
  error: {
    container: toneSurfaceClasses.error,
    bar: "bg-[var(--tone-error-fg)]",
  },
  warning: {
    container: toneSurfaceClasses.warning,
    bar: "bg-[var(--tone-warning-fg)]",
  },
  info: {
    container: toneSurfaceClasses.info,
    bar: "bg-[var(--tone-info-fg)]",
  },
} as const;

export type ToastVariant = keyof typeof toastVariantClasses;
export type ConfirmTone = keyof typeof confirmToneClasses;
export type StatTone = keyof typeof statToneClasses;

const roleProgressBarClasses = {
  owner: "bg-[var(--role-owner-fg)]",
  admin: "bg-[var(--role-admin-fg)]",
  editor: "bg-[var(--role-editor-fg)]",
  viewer: "bg-[var(--role-viewer-fg)]",
} as const;

export function roleProgressBarClass(role: string) {
  return (
    roleProgressBarClasses[role as keyof typeof roleProgressBarClasses] ?? "bg-[var(--accent)]"
  );
}
