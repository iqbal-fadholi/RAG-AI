import { useMemo } from "react";
import { FileText, Layers } from "lucide-react";
import { SourceDocument } from "@/types";

export interface GroupedSource {
  key: string;
  filename: string;
  fileId?: string | null;
  sources: SourceDocument[];
}

interface SourceListProps {
  sources: SourceDocument[];
  onSelectGroup: (group: GroupedSource) => void;
}

export function SourceList({ sources, onSelectGroup }: SourceListProps) {
  const groupedSources = useMemo(() => {
    const groups: { [key: string]: GroupedSource } = {};

    sources.forEach((src) => {
      const key = src.fileId || src.filename;
      if (!groups[key]) {
        groups[key] = {
          key,
          filename: src.filename,
          fileId: src.fileId,
          sources: [],
        };
      }
      groups[key].sources.push(src);
    });

    return Object.values(groups);
  }, [sources]);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-8 border-t border-outline-variant pt-5">
      <h4 className="font-label-md text-label-md text-on-surface-variant mb-4 flex items-center gap-1.5 select-none">
        <FileText className="w-4 h-4 text-primary" />
        <span>Sources</span>
        <span className="text-xs text-on-surface-variant/70 font-normal">
          ({groupedSources.length} {groupedSources.length === 1 ? "document" : "documents"} referenced)
        </span>
      </h4>

      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {groupedSources.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => onSelectGroup(group)}
            className="bg-background/40 hover:bg-surface-variant rounded-xl px-4 py-2.5 flex items-center gap-2.5 cursor-pointer transition-all duration-150 min-w-max border border-outline-variant hover:border-primary/40 shadow-sm backdrop-blur-sm group active:scale-[0.98] text-left"
            title={`View ${group.sources.length} excerpt(s) from ${group.filename}`}
          >
            <div className="w-7 h-7 rounded-lg bg-surface-variant group-hover:bg-primary/20 border border-outline-variant flex items-center justify-center shrink-0 transition-colors">
              <FileText className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            </div>

            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-on-surface group-hover:text-white font-medium transition-colors max-w-[220px] truncate">
                {group.filename}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-on-surface-variant font-mono">
                  {group.sources.map((s) => `[${s.index}]`).join(" ")}
                </span>
                {group.sources.length > 1 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-white/10 text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    {group.sources.length} excerpts
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
