"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white border border-white/15 shadow-[0_8px_24px_-4px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_28px_-4px_rgba(124,58,237,0.5)]",
  secondary:
    "bg-white/5 border border-white/10 text-on-surface hover:bg-white/10",
  danger:
    "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30",
  ghost:
    "bg-transparent border border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconOnly = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-label-md rounded-xl cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:scale-[0.97] active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          variants[variant],
          iconOnly ? "p-2.5" : sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {!iconOnly && children}
      </button>
    );
  },
);

Button.displayName = "Button";
