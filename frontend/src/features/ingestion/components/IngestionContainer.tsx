"use client";

import { UploadZone } from "./UploadZone";
import { ReviewDashboard } from "./ReviewDashboard";
import { HistoryTable } from "./HistoryTable";

export function IngestionContainer() {
  return (
    <div className="w-full flex flex-col gap-12">
      <UploadZone />
      <ReviewDashboard />
      <HistoryTable />
    </div>
  );
}
