"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ─── DataTable Root ─── */
export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {}

function DataTableRoot({ className, children, ...props }: DataTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)} {...props}>
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}
DataTableRoot.displayName = "DataTable";

/* ─── DataTable.Head ─── */
export interface DataTableHeadProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

function DataTableHead({ className, ...props }: DataTableHeadProps) {
  return (
    <thead
      className={cn(
        "text-on-surface-variant font-label-md text-label-md border-b border-outline-variant",
        className,
      )}
      {...props}
    />
  );
}
DataTableHead.displayName = "DataTable.Head";

/* ─── DataTable.Header (th) ─── */
export interface DataTableHeaderProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

function DataTableHeader({ className, ...props }: DataTableHeaderProps) {
  return (
    <th
      className={cn("px-5 py-3.5 font-medium text-sm", className)}
      {...props}
    />
  );
}
DataTableHeader.displayName = "DataTable.Header";

/* ─── DataTable.Body ─── */
export interface DataTableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

function DataTableBody({ className, ...props }: DataTableBodyProps) {
  return (
    <tbody
      className={cn("text-body-sm text-on-surface", className)}
      {...props}
    />
  );
}
DataTableBody.displayName = "DataTable.Body";

/* ─── DataTable.Row ─── */
export interface DataTableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {}

function DataTableRow({ className, ...props }: DataTableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-outline-variant/30 hover:bg-surface-variant/40 transition-colors duration-150",
        className,
      )}
      {...props}
    />
  );
}
DataTableRow.displayName = "DataTable.Row";

/* ─── DataTable.Cell ─── */
export interface DataTableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

function DataTableCell({ className, ...props }: DataTableCellProps) {
  return (
    <td className={cn("px-5 py-3.5", className)} {...props} />
  );
}
DataTableCell.displayName = "DataTable.Cell";

/* ─── DataTable.Empty ─── */
export interface DataTableEmptyProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  colSpan: number;
  message?: string;
}

function DataTableEmpty({
  colSpan,
  message = "No data found.",
  className,
  ...props
}: DataTableEmptyProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          "px-5 py-12 text-center text-on-surface-variant font-body-sm",
          className,
        )}
        {...props}
      >
        {message}
      </td>
    </tr>
  );
}
DataTableEmpty.displayName = "DataTable.Empty";

/* ─── Export Compound Component ─── */
export const DataTable = Object.assign(DataTableRoot, {
  Head: DataTableHead,
  Header: DataTableHeader,
  Body: DataTableBody,
  Row: DataTableRow,
  Cell: DataTableCell,
  Empty: DataTableEmpty,
});
