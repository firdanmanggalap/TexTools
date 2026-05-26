"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pin, X } from "lucide-react";
import {
  basicStats,
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

  return { pinned, toggle, clear, hydrated };
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
  const pinnedDefs = useMemo(
    () =>
      pinned
        .map((k) => ALL_METRICS.find((m) => m.key === k))
        .filter((m): m is MetricDef => Boolean(m)),
    [pinned]
  );

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
  onClear,
  onClose,
}: {
  pinned: MetricKey[];
  onToggle: (key: MetricKey) => void;
  onClear: () => void;
  onClose: () => void;
}) {
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
        {pinned.length > 0 && ` · ${pinned.length} selected`}
      </div>
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
