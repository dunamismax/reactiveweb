type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name: string;
  size?: AvatarSize;
  className?: string;
};

const PALETTE = [
  "bg-violet-500/20 border-violet-500/40 text-violet-300",
  "bg-sky-500/20 border-sky-500/40 text-sky-300",
  "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  "bg-amber-500/20 border-amber-500/40 text-amber-300",
  "bg-rose-500/20 border-rose-500/40 text-rose-300",
  "bg-pink-500/20 border-pink-500/40 text-pink-300",
  "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
  "bg-teal-500/20 border-teal-500/40 text-teal-300",
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
