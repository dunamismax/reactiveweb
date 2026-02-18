type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name: string;
  size?: AvatarSize;
  className?: string;
};

const PALETTE = [
  "bg-[var(--role-admin-bg)] border-[var(--role-admin-border)] text-[var(--role-admin-fg)]",
  "bg-[var(--tone-success-bg)] border-[var(--tone-success-border)] text-[var(--tone-success-fg)]",
  "bg-[var(--role-owner-bg)] border-[var(--role-owner-border)] text-[var(--role-owner-fg)]",
  "bg-[var(--tone-secondary-bg)] border-[var(--tone-secondary-border)] text-[var(--tone-secondary-fg)]",
  "bg-[var(--role-editor-bg)] border-[var(--role-editor-border)] text-[var(--role-editor-fg)]",
  "bg-[var(--tone-error-bg)] border-[var(--tone-error-border)] text-[var(--tone-error-fg)]",
  "bg-[var(--role-viewer-bg)] border-[var(--role-viewer-border)] text-[var(--foreground)]",
] as const;

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h * 31 + name.charCodeAt(i)) | 0) >>> 0;
  }
  return h % PALETTE.length;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-14 text-xl font-semibold",
};

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const colorClass = PALETTE[hashName(name)];
  const initials = getInitials(name);

  return (
    <div
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-medium ${colorClass} ${sizeClasses[size]} ${className}`}
      role="img"
      title={name}
    >
      {initials}
    </div>
  );
}
