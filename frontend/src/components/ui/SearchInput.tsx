"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    const hasValue = value !== undefined && value !== "";

    return (
      <div className={cn("relative", className)}>
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            "w-full pl-9 pr-4 py-2 rounded-xl",
            "bg-surface-container-high/60 border border-outline-variant/40",
            "text-on-surface font-body-sm text-body-sm",
            "placeholder:text-on-surface-variant/50",
            "focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
            "transition-all duration-200 backdrop-blur-sm",
            hasValue && onClear ? "pr-9" : "",
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
