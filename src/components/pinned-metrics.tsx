"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Pin, X } from "lucide-react";
import {
  basicStats,
  formatMetric,
  lexicalRichness,
  readability,
  type MetricDef,
  type MetricKey,
} from "@/lib/metrics";
import type { AnalyzeResponse } from "@/lib/api";
import { MetricCard } from "./metric-card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "textools:pinned";

const GROUPED: { title: string; metrics: MetricDef[] }[] = [
  { title: "Basic stats", metrics: basicStats },
  { title: "Lexical richness", metrics: lexicalRichness },
  { title: "Readability", metrics: readability },
];

const ALL_METRICS: MetricDef[] = GROUPED.flatMap((g) => g.metrics);
const VALID_KEYS = new Set<string>(ALL_METRICS.map((m) => m.key));

export function usePinnedMetrics() {
  const [pinned, setPinned] = useState<MetricKey[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setPinned(
            parsed.filter(
              (k): k is MetricKey =>
                typeof k === "string" && VALID_KEYS.has(k)
            )
          );
        }
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned));
    } catch {
      // ignore storage errors
    }
  }, [pinned, hydrated]);

  const toggle = useCallback((key: MetricKey) => {
    setPinned((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const clear = useCallback(() => setPinned([]), []);

  const move = useCallback((key: MetricKey, direction: "up" | "down") => {
    setPinned((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  return { pinned, toggle, move, clear, hydrated };
}

export function PinnedSection({
  pinned,
  results,
  loading,
}: {
  pinned: MetricKey[];
  results: AnalyzeResponse | null;
  loading: boolean;
}) {
  const [copiedRow, setCopiedRow] = useState(false);

  const pinnedDefs = useMemo(
    () =>
      pinned
        .map((k) => ALL_METRICS.find((m) => m.key === k))
        .filter((m): m is MetricDef => Boolean(m)),
    [pinned]
  );

  const canCopy = !loading && results !== null && pinnedDefs.length > 0;

  const copyRow = useCallback(async () => {
    if (!canCopy || !results) return;
    const row = pinnedDefs
      .map((def) => formatMetric(results[def.key], def.kind))
      .join("\t");
    try {
      await navigator.clipboard.writeText(row);
      setCopiedRow(true);
      setTimeout(() => setCopiedRow(false), 1400);
    } catch {
      // ignore (insecure context)
    }
  }, [canCopy, pinnedDefs, results]);

  const copyHeaders = useCallback(async () => {
    if (pinnedDefs.length === 0) return;
    const headers = pinnedDefs.map((def) => def.abbr ?? def.label).join("\t");
    try {
      await navigator.clipboard.writeText(headers);
    } catch {
      // ignore
    }
  }, [pinnedDefs]);

  if (pinned.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Pin className="h-3.5 w-3.5 text-accent" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Pinned
          </h2>
        </div>
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          {pinned.length} {pinned.length === 1 ? "metric" : "metrics"}
        </span>
        <button
          type="button"
          onClick={copyHeaders}
          disabled={pinnedDefs.length === 0}
          title="Copy header row (metric names, tab-separated)"
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition-colors",
            "bg-transparent text-muted-foreground ring-border hover:text-foreground hover:bg-muted",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          Headers
        </button>
        <button
          type="button"
          onClick={copyRow}
          disabled={!canCopy}
          title="Copy values as one row (tab-separated, paste into Excel)"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors",
            copiedRow
              ? "bg-accent text-accent-foreground ring-accent/40"
              : "bg-accent-soft text-accent ring-accent/30 hover:bg-accent/20",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {copiedRow ? (
            <>
              <Check className="h-3 w-3" /> Copied row
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy row
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {pinnedDefs.map((def) => (
          <MetricCard
            key={def.key}
            def={def}
            value={results?.[def.key]}
            loading={loading}
          />
        ))}
      </div>
    </section>
  );
}

export function PinnedCustomizer({
  pinned,
  onToggle,
  onMove,
  onClear,
  onClose,
}: {
  pinned: MetricKey[];
  onToggle: (key: MetricKey) => void;
  onMove: (key: MetricKey, direction: "up" | "down") => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const orderedDefs = pinned
    .map((k) => ALL_METRICS.find((m) => m.key === k))
    .filter((m): m is MetricDef => Boolean(m));

  return (
    <div className="border-t border-border/60 bg-background/30 px-5 py-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Pin metrics for quick access
        </div>
        <div className="flex items-center gap-3">
          {pinned.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted-foreground/60 hover:text-foreground"
            aria-label="Close customizer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground/70 mb-3">
        Selected metrics appear in a Pinned section above the regular groups.
        Drag-order with the arrows — that order is what &quot;Copy row&quot; uses.
      </div>

      {orderedDefs.length > 0 && (
        <div className="mb-4 rounded-lg bg-card/40 ring-1 ring-border p-2">
          <div className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-1.5 px-1">
            Order ({orderedDefs.length})
          </div>
          <ol className="flex flex-col gap-1">
            {orderedDefs.map((def, idx) => (
              <li
                key={def.key}
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50"
              >
                <span className="text-[10px] font-mono text-muted-foreground/60 w-4 text-right">
                  {idx + 1}
                </span>
                <span className="text-xs font-medium text-foreground flex-1 truncate">
                  {def.abbr ?? def.label}
                  {def.abbr && (
                    <span className="text-muted-foreground/60 font-normal ml-1.5">
                      · {def.label}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onMove(def.key, "up")}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed p-0.5"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(def.key, "down")}
                  disabled={idx === orderedDefs.length - 1}
                  aria-label="Move down"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed p-0.5"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggle(def.key)}
                  aria-label="Remove from pinned"
                  className="text-muted-foreground/60 hover:text-rose-300 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {GROUPED.map((group) => (
          <div key={group.title}>
            <div className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-2">
              {group.title}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.metrics.map((def) => {
                const on = pinned.includes(def.key);
                return (
                  <button
                    key={def.key}
                    type="button"
                    onClick={() => onToggle(def.key)}
                    title={def.hint}
                    aria-pressed={on}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ring-1",
                      on
                        ? "bg-accent-soft text-accent ring-accent/30"
                        : "bg-muted text-muted-foreground ring-border hover:text-foreground"
                    )}
                  >
                    {on && <Check className="h-3 w-3" />}
                    {def.abbr ?? def.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
