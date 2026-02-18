import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type ToastVariant, toastVariantClasses } from "~/lib/semantic-styles";

export type { ToastVariant } from "~/lib/semantic-styles";

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  removing: boolean;
}

interface ToastContextValue {
  addToast: (message: string, variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 4000;
const EXIT_MS = 200;

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const cfg = toastVariantClasses[toast.variant];

  return (
    <div
      aria-live="assertive"
      className={`toast-item relative overflow-hidden rounded-xl border shadow-lg ${cfg.container} ${
        toast.removing ? "toast-exit" : "toast-enter"
      }`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <p className="text-sm leading-relaxed">{toast.message}</p>
        <button
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-0.5 opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          onClick={onDismiss}
          type="button"
        >
          ×
        </button>
      </div>
      <div
        className={`toast-progress-bar h-0.5 ${cfg.bar}`}
        style={{ animationDuration: `${DISMISS_MS}ms` }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = crypto.randomUUID();
      setToasts((prev) => {
        const next = [...prev, { id, message, variant, removing: false }];
        return next.slice(-3);
      });
      const timer = setTimeout(() => removeToast(id), DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <section
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} onDismiss={() => removeToast(toast.id)} toast={toast} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
