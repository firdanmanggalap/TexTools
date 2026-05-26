"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ClipboardPaste,
  Eraser,
  Loader2,
  Pin,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { analyzeText, type AnalyzeResponse } from "@/lib/api";
import { basicStats, lexicalRichness, readability } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { MetricGroup } from "./metric-group";
import {
  PinnedCustomizer,
  PinnedSection,
  usePinnedMetrics,
} from "./pinned-metrics";

const SAMPLE_TEXT =
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. " +
  "How vexingly quick daft zebras jump! Bright vixens jump; dozy fowl quack. " +
  "Sphinx of black quartz, judge my vow. Waltz, bad nymph, for quick jigs vex.";

interface Params {
  msttr: number;
  mattr: number;
  hdd: number;
}

const DEFAULTS: Params = { msttr: 50, mattr: 50, hdd: 42 };

export function Analyzer() {
  const [text, setText] = useState("");
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [showParams, setShowParams] = useState(false);
  const [showPinPicker, setShowPinPicker] = useState(false);
  const { pinned, toggle: togglePinned, clear: clearPinned } = usePinnedMetrics();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [text]);

  const charCount = text.length;

  const runAnalysis = useCallback(
    async (rawText: string) => {
      const value = rawText.trim();
      if (!value) return;

      const wc = value.split(/\s+/).filter(Boolean).length;
      const adjusted: Params = { ...params };
      const notes: string[] = [];

      if (wc < params.msttr * 2) {
        adjusted.msttr = Math.max(1, Math.floor(wc / 2));
        notes.push(`MSTTR window → ${adjusted.msttr}`);
      }
      if (wc < params.mattr) {
        adjusted.mattr = Math.max(1, wc);
        notes.push(`MATTR window → ${adjusted.mattr}`);
      }
      if (wc <= params.hdd) {
        adjusted.hdd = Math.max(1, wc - 1);
        notes.push(`HD-D draws → ${adjusted.hdd}`);
      }

      setNotice(
        notes.length ? `Auto-adjusted for short text: ${notes.join(", ")}` : null
      );
      setError(null);
      setLoading(true);

      try {
        const data = await analyzeText({
          text: value,
          msttr_window: adjusted.msttr,
          mattr_window: adjusted.mattr,
          hdd_draws: adjusted.hdd,
        });
        setResults(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  const handleAnalyze = useCallback(() => {
    if (!text.trim()) {
      textareaRef.current?.focus();
      return;
    }
    void runAnalysis(text);
  }, [text, runAnalysis]);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        setError("Clipboard is empty.");
        return;
      }
      setText(clip);
      await runAnalysis(clip);
    } catch {
      setError("Couldn't read from clipboard.");
    }
  }, [runAnalysis]);

  // Handoff from /clean: if cleaner page stashed text in sessionStorage,
  // pick it up on mount and auto-run analysis.
  useEffect(() => {
    try {
      const handoff = sessionStorage.getItem("textools:handoff");
      const autorun = sessionStorage.getItem("textools:handoff:autorun");
      if (handoff) {
        setText(handoff);
        sessionStorage.removeItem("textools:handoff");
        sessionStorage.removeItem("textools:handoff:autorun");
        if (autorun) void runAnalysis(handoff);
      }
    } catch {
      // sessionStorage unavailable — ignore
    }
    // Intentionally run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = useCallback(() => {
    setText("");
    setResults(null);
    setError(null);
    setNotice(null);
    textareaRef.current?.focus();
  }, []);

  const handleLoadSample = useCallback(() => {
    setText(SAMPLE_TEXT);
    setError(null);
    setNotice(null);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14 flex flex-col gap-10">
      <Hero />

      {/* Input panel */}
      <div className="rounded-2xl bg-card/60 ring-1 ring-border backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
            <span className="text-sm font-medium">Input</span>
            <span className="text-xs text-muted-foreground">
              · {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
            </span>
          </div>
          <button
            onClick={handleLoadSample}
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            Try sample
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Paste a paragraph, essay, or article in English. Then hit Analyze (⌘/Ctrl + Enter)."
          className={cn(
            "w-full min-h-[220px] sm:min-h-[280px] resize-y bg-transparent px-5 py-4",
            "text-[15px] leading-relaxed placeholder:text-muted-foreground/60",
            "focus:outline-none scroll-thin"
          )}
        />

        {showParams && (
          <ParameterBar params={params} onChange={setParams} onClose={() => setShowParams(false)} />
        )}

        {showPinPicker && (
          <PinnedCustomizer
            pinned={pinned}
            onToggle={togglePinned}
            onClear={clearPinned}
            onClose={() => setShowPinPicker(false)}
          />
        )}

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border/60 bg-background/40">
          <PrimaryButton onClick={handleAnalyze} disabled={loading || !text.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Analyze
              </>
            )}
          </PrimaryButton>

          <GhostButton onClick={handlePaste} disabled={loading}>
            <ClipboardPaste className="h-4 w-4" /> Paste &amp; Analyze
          </GhostButton>

          <GhostButton onClick={handleClear} disabled={loading || !text}>
            <Eraser className="h-4 w-4" /> Clear
          </GhostButton>

          <div className="flex-1" />

          <GhostButton
            onClick={() => setShowPinPicker((s) => !s)}
            aria-pressed={showPinPicker}
          >
            <Pin className="h-4 w-4" />
            Pinned{pinned.length > 0 ? ` · ${pinned.length}` : ""}
          </GhostButton>

          <GhostButton
            onClick={() => setShowParams((s) => !s)}
            aria-pressed={showParams}
          >
            <Settings2 className="h-4 w-4" /> Parameters
          </GhostButton>
        </div>
      </div>

      {/* Notice / error */}
      {(notice || error) && (
        <div className="flex flex-col gap-2 -mt-4">
          {error && (
            <Banner tone="danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </Banner>
          )}
          {notice && !error && <Banner tone="accent">{notice}</Banner>}
        </div>
      )}

      {/* Results */}
      <div
        key={results ? "filled" : "empty"}
        className={cn(
          "flex flex-col gap-8",
          results && "animate-fade-in-up"
        )}
      >
        <PinnedSection pinned={pinned} results={results} loading={loading} />
        <MetricGroup
          title="Basic stats"
          metrics={basicStats}
          results={results}
          loading={loading}
        />
        <MetricGroup
          title="Lexical richness"
          metrics={lexicalRichness}
          results={results}
          loading={loading}
        />
        <MetricGroup
          title="Readability"
          metrics={readability}
          results={results}
          loading={loading}
        />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="flex flex-col gap-3">
      <span className="self-start inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-accent/20">
        <Sparkles className="h-3 w-3" />
        Lexical &amp; readability analyzer
      </span>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
        Measure how rich and readable your writing is.
      </h1>
      <p className="text-muted-foreground max-w-2xl">
        Paste English text to instantly compute lexical diversity (TTR, MTLD, MSTTR, MATTR, HD-D)
        and readability scores (Flesch, Gunning Fog, SMOG, Flesch-Kincaid).
      </p>
    </div>
  );
}

function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground",
        "hover:bg-accent/90 active:bg-accent/80 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "ring-1 ring-accent/40 shadow-[0_4px_16px_-4px_rgba(59,186,156,0.45)]",
        className
      )}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground",
        "hover:bg-muted hover:text-foreground transition-colors",
        "ring-1 ring-border",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "danger" | "accent";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1",
        tone === "danger" &&
          "bg-rose-500/10 text-rose-200 ring-rose-500/20",
        tone === "accent" && "bg-accent-soft text-accent ring-accent/20"
      )}
    >
      {children}
    </div>
  );
}

function ParameterBar({
  params,
  onChange,
  onClose,
}: {
  params: Params;
  onChange: (p: Params) => void;
  onClose: () => void;
}) {
  return (
    <div className="border-t border-border/60 bg-background/30 px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Advanced parameters
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground/60 hover:text-foreground"
          aria-label="Close parameters"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NumberInput
          label="MSTTR window"
          hint="Segment window size for Mean Segmental TTR. Default 50."
          value={params.msttr}
          onChange={(v) => onChange({ ...params, msttr: v })}
        />
        <NumberInput
          label="MATTR window"
          hint="Sliding window size for Moving Average TTR. Default 50."
          value={params.mattr}
          onChange={(v) => onChange({ ...params, mattr: v })}
        />
        <NumberInput
          label="HD-D draws"
          hint="Sample size for HD-D hypergeometric draws. Default 42."
          value={params.hdd}
          onChange={(v) => onChange({ ...params, hdd: v })}
        />
      </div>
    </div>
  );
}

function NumberInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) && n > 0 ? n : 1);
        }}
        className={cn(
          "bg-input rounded-md px-3 py-2 text-sm font-mono ring-1 ring-border",
          "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:bg-background"
        )}
      />
      <span className="text-[11px] text-muted-foreground/60 leading-snug">{hint}</span>
    </label>
  );
}
