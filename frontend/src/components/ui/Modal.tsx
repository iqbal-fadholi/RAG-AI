"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Modal Root ─── */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
};

function ModalRoot({
  open,
  onClose,
  children,
  className,
  maxWidth = "lg",
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative w-full glass-panel rounded-2xl bg-[#1a162b] border border-outline-variant shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]",
          maxWidthClasses[maxWidth],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
ModalRoot.displayName = "Modal";

/* ─── Modal.Header ─── */
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

function ModalHeader({
  className,
  children,
  onClose,
  ...props
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "px-6 py-5 border-b border-outline-variant/40 bg-white/[0.02] flex items-center justify-between shrink-0",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5 min-w-0 font-headline-md text-lg font-bold text-white">
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-surface-variant/50 hover:bg-surface-variant border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
ModalHeader.displayName = "Modal.Header";

/* ─── Modal.Body ─── */
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

function ModalBody({ className, ...props }: ModalBodyProps) {
  return (
    <div
      className={cn(
        "p-6 overflow-y-auto flex-1 custom-scrollbar",
        className,
      )}
      {...props}
    />
  );
}
ModalBody.displayName = "Modal.Body";

/* ─── Modal.Footer ─── */
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-outline-variant/30 flex items-center justify-end gap-3 shrink-0",
        className,
      )}
      {...props}
    />
  );
}
ModalFooter.displayName = "Modal.Footer";

/* ─── Export Compound Component ─── */
export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
