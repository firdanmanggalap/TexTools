"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  bandForMetric,
  formatMetric,
  type MetricDef,
} from "@/lib/metrics";

interface Props {
  def: MetricDef;
  value: number | undefined;
  loading?: boolean;
}

const toneClass: Record<string, string> = {
  easy: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20",
  fair: "text-amber-200 bg-amber-500/10 ring-amber-500/20",
  hard: "text-orange-200 bg-orange-500/10 ring-orange-500/20",
  "very-hard": "text-rose-200 bg-rose-500/10 ring-rose-500/20",
};

export function MetricCard({ def, value, loading }: Props) {
  const [copied, setCopied] = useState(false);
  const display = formatMetric(value, def.kind);
  const band = value !== undefined ? bandForMetric(def.key, value) : null;
  const interactive = value !== undefined && !loading;

  async function copyValue() {
    if (!interactive) return;
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API can fail in insecure contexts — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      disabled={!interactive}
      aria-label={interactive ? `Copy ${def.label}: ${display}` : def.label}
      className={cn(
        "group relative w-full text-left rounded-xl bg-card/70 ring-1 ring-border px-4 py-3.5",
        "transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        interactive && "cursor-pointer hover:ring-accent/40 hover:bg-card/95 active:scale-[0.985]",
        copied && "ring-accent/60 bg-accent-soft",
        !interactive && "cursor-default"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {def.abbr ?? def.label}
            </span>
            <span
              className="text-muted-foreground/70"
              title={def.hint}
            >
              <Info className="h-3 w-3" />
            </span>
          </div>
          {def.abbr && (
            <div className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
              {def.label}
            </div>
          )}
        </div>

        {band && !copied && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
              toneClass[band.tone]
            )}
          >
            {band.label}
          </span>
        )}

        {copied && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
            <Check className="h-3 w-3" /> Copied
          </span>
        )}
      </div>

      <div className="mt-2">
        <div
          className={cn(
            "font-mono text-2xl font-semibold tabular-nums tracking-tight",
            value === undefined ? "text-muted-foreground/40" : "text-foreground",
            loading && "animate-pulse"
          )}
        >
          {loading ? "···" : display}
        </div>
      </div>
    </button>
  );
}
