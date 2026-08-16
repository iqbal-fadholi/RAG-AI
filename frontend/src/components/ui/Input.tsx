"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, inputSize = "md", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-label-md text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl",
              "bg-surface-container-high/60 border border-outline-variant/40",
              "text-on-surface font-body-sm text-body-sm",
              "placeholder:text-on-surface-variant/50",
              "focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
              "transition-all duration-200 backdrop-blur-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              sizeClasses[inputSize],
              icon ? "pl-10" : "",
              error ? "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20" : "",
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400 font-body-sm">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
