"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ─── Card Root ─── */
const cardVariants = {
  default: "glass-panel",
  elevated:
    "glass-panel shadow-2xl bg-gradient-to-br from-[rgba(79,70,229,0.06)] to-[rgba(20,20,30,0.4)]",
  flat: "bg-surface-container-high/30 border border-outline-variant/30",
} as const;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
}

function CardRoot({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-200",
        cardVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
CardRoot.displayName = "Card";

/* ─── Card.Header ─── */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "px-6 py-5 border-b border-outline-variant/40 bg-surface-container-high/30 flex items-center justify-between backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
CardHeader.displayName = "Card.Header";

/* ─── Card.Body ─── */
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardBody({ className, ...props }: CardBodyProps) {
  return <div className={cn("p-6", className)} {...props} />;
}
CardBody.displayName = "Card.Body";

/* ─── Card.Footer ─── */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-outline-variant/30 flex items-center justify-end gap-3",
        className,
      )}
      {...props}
    />
  );
}
CardFooter.displayName = "Card.Footer";

/* ─── Export Compound Component ─── */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
