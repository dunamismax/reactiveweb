import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,var(--accent,#8464c6))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background,#15141b)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent,#8464c6)] text-[var(--accent-foreground,#15141b)] hover:bg-[color-mix(in_srgb,var(--accent,#8464c6)_86%,white_14%)]",
        outline:
          "border border-[var(--border,#3d375e)] bg-transparent text-[var(--foreground,#bdbdbd)] hover:bg-[var(--overlay-soft,#3d375e3d)]",
        ghost: "text-[var(--foreground,#bdbdbd)] hover:bg-[var(--overlay-soft,#3d375e3d)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
