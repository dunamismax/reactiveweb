import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

type Command = {
  label: string;
  to: string;
  group: string;
};

const commands: Command[] = [
  { label: "Command Center", to: "/", group: "Main" },
  { label: "User Management", to: "/users", group: "Main" },
  { label: "Activity Log", to: "/activity", group: "Main" },
  { label: "Auth Lab", to: "/auth", group: "System" },
  { label: "Stack Matrix", to: "/stack", group: "System" },
  { label: "Settings", to: "/settings", group: "System" },
];

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query.trim()
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.group.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length && filtered.length > 0) {
      setActiveIndex(filtered.length - 1);
    }
  }, [filtered.length, activeIndex]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const cmd = filtered[activeIndex];
        if (cmd) {
          navigate(cmd.to);
          onClose();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, filtered, activeIndex, navigate]);

  if (!open) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop closes on click
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled via document listener
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[20vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ background: "var(--overlay-strong)" }}
    >
      <div
        aria-label="Command palette"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl"
        role="dialog"
      >
        <div className="border-b border-[var(--border)] px-4 py-3">
          <input
            ref={inputRef}
            aria-label="Search commands"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search commands..."
            type="text"
            value={query}
          />
        </div>
        <div className="max-h-72 overflow-y-auto py-2" role="listbox">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">No commands found</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.to}
                aria-selected={i === activeIndex}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
                onClick={() => {
                  navigate(cmd.to);
                  onClose();
                }}
                onMouseEnter={() => setActiveIndex(i)}
                role="option"
                type="button"
              >
                <span>{cmd.label}</span>
                <span
                  className={`text-xs ${i === activeIndex ? "text-[var(--accent-foreground)]/70" : "text-[var(--muted)]"}`}
                >
                  {cmd.group}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
