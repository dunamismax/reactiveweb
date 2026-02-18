import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,var(--accent,#8464c6))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background,#15141b)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--action-primary-bg,var(--accent,#8464c6))] text-[var(--action-primary-fg,var(--accent-foreground,#15141b))] hover:bg-[var(--action-primary-hover-bg,var(--action-primary-bg,var(--accent,#8464c6)))]",
        outline:
          "border border-[var(--action-outline-border,var(--border,#3d375e))] bg-transparent text-[var(--foreground,#bdbdbd)] hover:bg-[var(--action-outline-hover-bg,var(--overlay-soft,#3d375e3d))]",
        ghost:
          "text-[var(--foreground,#bdbdbd)] hover:bg-[var(--action-ghost-hover-bg,var(--overlay-soft,#3d375e3d))]",
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

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
