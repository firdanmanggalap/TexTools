"use client";

import { useState } from "react";
import { Check, Copy, Info } from "lucide-react";
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

  async function copyValue() {
    if (value === undefined) return;
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div
      className={cn(
        "group relative rounded-xl bg-card/70 ring-1 ring-border px-4 py-3.5 transition-colors",
        "hover:ring-accent/30 hover:bg-card/90"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {def.abbr ?? def.label}
            </span>
            <span
              className="text-muted-foreground/70 hover:text-accent transition-colors"
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

        <button
          type="button"
          onClick={copyValue}
          disabled={value === undefined}
          className={cn(
            "shrink-0 rounded-md p-1 text-muted-foreground/60 transition-all",
            "opacity-0 group-hover:opacity-100",
            "hover:text-accent disabled:opacity-0"
          )}
          aria-label={`Copy ${def.label}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <div
          className={cn(
            "font-mono text-2xl font-semibold tabular-nums tracking-tight",
            value === undefined ? "text-muted-foreground/40" : "text-foreground",
            loading && "animate-pulse"
          )}
        >
          {loading ? "···" : display}
        </div>

        {band && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
              toneClass[band.tone]
            )}
          >
            {band.label}
          </span>
        )}
      </div>
    </div>
  );
}
