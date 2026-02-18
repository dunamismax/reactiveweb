import { useEffect, useId, useRef } from "react";

type ConfirmTone = "danger" | "warning" | "default";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
};

const toneClasses: Record<ConfirmTone, string> = {
  danger:
    "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)] hover:opacity-90",
  warning:
    "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] text-[var(--tone-warning-fg)] hover:opacity-90",
  default:
    "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      confirmBtnRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      aria-describedby={descId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      style={{ background: "var(--overlay-strong)" }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl"
      >
        <h2 className="text-base font-semibold" id={titleId}>
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]" id={descId}>
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="nav-transition rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${toneClasses[tone]}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
