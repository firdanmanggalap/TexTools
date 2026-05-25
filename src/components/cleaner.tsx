"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Copy,
  Eraser,
  Sparkles,
} from "lucide-react";
import {
  CATEGORY_META,
  DEFAULT_OPTIONS,
  cleanText,
  type CleanCategory,
  type CleanOptions,
} from "@/lib/cleanText";
import { cn } from "@/lib/utils";

const SAMPLE = `## Mathematical outcome
If each centre's range (R) is the same in all directions, its market area becomes \\(A = \\frac{3\\sqrt{3}}{2}R^{2}\\).

**Key points:**
- Areas tessellate as hexagons.
- See [Christaller 1933](https://example.com) for more.
- Citations like [1] and (Smith, 2020) are common.

➤ This bullet has an emoji prefix.`;

const ALL_CATEGORIES: CleanCategory[] = [
  "markdown",
  "latex",
  "citations",
  "htmlEmoji",
  "whitespace",
];

export function Cleaner() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [opts, setOpts] = useState<CleanOptions>(DEFAULT_OPTIONS);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const cleaned = useMemo(() => cleanText(input, opts), [input, opts]);

  const inputWords = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).filter(Boolean).length : 0),
    [input]
  );
  const outputWords = useMemo(
    () =>
      cleaned.trim() ? cleaned.trim().split(/\s+/).filter(Boolean).length : 0,
    [cleaned]
  );
  const removedChars = Math.max(0, input.length - cleaned.length);
  const removedWords = Math.max(0, inputWords - outputWords);

  const toggle = useCallback((key: CleanCategory) => {
    setOpts((o) => ({ ...o, [key]: !o[key] }));
  }, []);

  const setAll = useCallback((on: boolean) => {
    setOpts(() => ({
      markdown: on,
      latex: on,
      citations: on,
      htmlEmoji: on,
      whitespace: on,
    }));
  }, []);

  const handleCopy = useCallback(async () => {
    if (!cleaned) return;
    try {
      await navigator.clipboard.writeText(cleaned);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore (insecure context, etc.)
    }
  }, [cleaned]);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInput(clip);
    } catch {
      // ignore
    }
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    inputRef.current?.focus();
  }, []);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE);
  }, []);

  const handleSendToAnalyzer = useCallback(() => {
    if (!cleaned.trim()) return;
    try {
      sessionStorage.setItem("textools:handoff", cleaned);
      sessionStorage.setItem("textools:handoff:autorun", "1");
    } catch {
      // sessionStorage might be disabled — fall back to URL hash
    }
    router.push("/");
  }, [cleaned, router]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14 flex flex-col gap-8">
      <Hero />

      {/* Toggle row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider mr-1">
          Strip:
        </span>
        {ALL_CATEGORIES.map((key) => {
          const meta = CATEGORY_META[key];
          const on = opts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              title={meta.hint}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ring-1",
                on
                  ? "bg-accent-soft text-accent ring-accent/30"
                  : "bg-muted text-muted-foreground ring-border hover:text-foreground"
              )}
            >
              {on && <Check className="h-3 w-3" />}
              {meta.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setAll(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          All
        </button>
        <span className="text-muted-foreground/40">·</span>
        <button
          type="button"
          onClick={() => setAll(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          None
        </button>
      </div>

      {/* Side-by-side panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="rounded-2xl bg-card/60 ring-1 ring-border overflow-hidden flex flex-col">
          <PanelHeader
            title="Input"
            stats={`${inputWords.toLocaleString()} words · ${input.length.toLocaleString()} chars`}
            right={
              <button
                onClick={handleLoadSample}
                className="text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                Try sample
              </button>
            }
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text with markdown / LaTeX / tables here."
            className={cn(
              "w-full min-h-[320px] sm:min-h-[420px] resize-y bg-transparent px-5 py-4",
              "text-[14px] leading-relaxed placeholder:text-muted-foreground/60 font-mono",
              "focus:outline-none scroll-thin"
            )}
          />
          <PanelFooter>
            <SmallButton onClick={handlePaste} disabled={false}>
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </SmallButton>
            <SmallButton onClick={handleClear} disabled={!input}>
              <Eraser className="h-3.5 w-3.5" /> Clear
            </SmallButton>
          </PanelFooter>
        </div>

        {/* Cleaned */}
        <div className="rounded-2xl bg-card/60 ring-1 ring-accent/20 overflow-hidden flex flex-col">
          <PanelHeader
            title="Cleaned"
            stats={
              input
                ? `${outputWords.toLocaleString()} words · ${cleaned.length.toLocaleString()} chars`
                : "—"
            }
            accent
            right={
              input ? (
                <span className="text-xs text-muted-foreground">
                  −{removedChars.toLocaleString()} chars
                  {removedWords > 0 && ` · −${removedWords.toLocaleString()} words`}
                </span>
              ) : null
            }
          />
          <textarea
            readOnly
            value={cleaned}
            placeholder="Cleaned output will appear here."
            className={cn(
              "w-full min-h-[320px] sm:min-h-[420px] resize-y bg-transparent px-5 py-4",
              "text-[14px] leading-relaxed font-mono placeholder:text-muted-foreground/50",
              "focus:outline-none scroll-thin",
              cleaned ? "text-foreground" : "text-muted-foreground"
            )}
          />
          <PanelFooter>
            <SmallButton
              onClick={handleCopy}
              disabled={!cleaned}
              primary={copied}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </SmallButton>
            <SmallButton
              onClick={handleSendToAnalyzer}
              disabled={!cleaned.trim()}
              primary
            >
              <Sparkles className="h-3.5 w-3.5" /> Analyze cleaned
              <ArrowRight className="h-3.5 w-3.5" />
            </SmallButton>
          </PanelFooter>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="flex flex-col gap-3">
      <span className="self-start inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-accent/20">
        <Eraser className="h-3 w-3" />
        Text cleaner
      </span>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Strip formatting before you analyze.
      </h1>
      <p className="text-muted-foreground max-w-2xl">
        Remove markdown markers, LaTeX commands, citations, HTML tags, and
        noisy whitespace so the analyzer sees clean prose only. Tables are
        kept intact. Toggle the categories you want stripped — the cleaned
        output updates in real time.
      </p>
    </div>
  );
}

function PanelHeader({
  title,
  stats,
  right,
  accent,
}: {
  title: string;
  stats: string;
  right?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            accent
              ? "bg-accent shadow-[0_0_8px_var(--color-accent)]"
              : "bg-muted-foreground/40"
          )}
        />
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">· {stats}</span>
      </div>
      {right}
    </div>
  );
}

function PanelFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border/60 bg-background/40">
      {children}
    </div>
  );
}

function SmallButton({
  children,
  primary,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ring-1",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        primary
          ? "bg-accent text-accent-foreground ring-accent/40 hover:bg-accent/90"
          : "bg-transparent text-muted-foreground ring-border hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}
