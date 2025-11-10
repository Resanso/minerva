import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClassMap: Record<BadgeVariant, string> = {
  default: "bg-blue-500/90 text-white",
  secondary: "bg-slate-800 text-slate-200",
  outline: "border border-slate-600 text-slate-200",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
          variantClassMap[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
