"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>((props, ref) => {
  const { className, sideOffset = 4, ...rest } = props;
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-foreground px-3 py-1.5 text-xs text-background shadow-md",
        className
      )}
      {...rest}
    />
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>((props, ref) => {
  const { className, ...rest } = props;
  return (
    <TooltipPrimitive.Arrow
      ref={ref}
      className={cn("fill-foreground", className)}
      {...rest}
    />
  );
});
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

export {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};
