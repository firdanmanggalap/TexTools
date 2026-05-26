"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  Eraser,
  Loader2,
  Play,
} from "lucide-react";
import { runKruskal, type KruskalGroupStats, type KruskalResponse } from "@/lib/api";
import { parseCsv, type ParsedCsv } from "@/lib/csvParse";
import { cn } from "@/lib/utils";

const SAMPLE_CSV = `level,flesch_reading_ease,flesch_kincaid_grade,sentence_length,gunning_fog,mtld
Beginner,75.3,5.2,12.4,7.8,89.5
Beginner,72.1,5.5,11.8,7.4,85.2
Beginner,78.4,4.8,13.1,7.1,92.3
Beginner,71.5,5.6,12.8,8.0,87.1
Beginner,76.2,5.0,11.9,7.5,90.0
Intermediate,62.4,8.1,18.5,11.2,105.4
Intermediate,59.8,8.5,19.1,11.8,108.2
Intermediate,64.7,7.8,17.9,10.9,103.1
Intermediate,61.3,8.3,18.7,11.5,106.8
Intermediate,63.9,8.0,18.2,11.3,104.5
Advanced,42.1,12.5,24.3,15.8,135.7
Advanced,38.5,13.2,25.1,16.4,140.2
Advanced,40.8,12.8,23.9,15.5,137.4
Advanced,39.2,13.0,24.7,16.1,138.9
Advanced,41.5,12.6,24.0,15.9,136.3`;

function fmt(n: number | undefined, digits = 2): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtP(p: number | undefined): string {
  if (p === undefined || !Number.isFinite(p)) return "—";
  if (p < 0.0001) return "<0,0001";
  return p.toLocaleString("id-ID", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function Kruskal() {
  const [csvText, setCsvText] = useState("");
  const [groupCol, setGroupCol] = useState("level");
  const [metricCols, setMetricCols] = useState<string[]>([]);
  const [alpha, setAlpha] = useState(0.05);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<KruskalResponse | null>(null);

  const parsed = useMemo<ParsedCsv>(() => parseCsv(csvText), [csvText]);

  // When the CSV changes: keep groupCol/metricCols valid against new headers.
  useEffect(() => {
    if (parsed.headers.length === 0) return;
    if (!parsed.headers.includes(groupCol)) {
      const guess =
        parsed.headers.find((h) => h.toLowerCase() === "level") ||
        Object.keys(parsed.uniqueValues)[0] ||
        parsed.headers[0];
      setGroupCol(guess);
    }
    setMetricCols((prev) => prev.filter((m) => parsed.numericColumns.includes(m)));
  }, [parsed, groupCol]);

  const candidateGroupCols = useMemo(() => {
    const cats = parsed.categoricalColumns.filter(
      (h) => parsed.uniqueValues[h] && parsed.uniqueValues[h].length >= 2
    );
    return cats.length ? cats : parsed.headers;
  }, [parsed]);

  const toggleMetric = useCallback((m: string) => {
    setMetricCols((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) setCsvText(clip);
    } catch {
      // ignore (insecure context)
    }
  }, []);

  const handleClear = useCallback(() => {
    setCsvText("");
    setResults(null);
    setError(null);
  }, []);

  const handleLoadSample = useCallback(() => {
    setCsvText(SAMPLE_CSV);
    setGroupCol("level");
    setMetricCols([
      "flesch_reading_ease",
      "flesch_kincaid_grade",
      "sentence_length",
      "gunning_fog",
      "mtld",
    ]);
    setError(null);
  }, []);

  const handleRun = useCallback(async () => {
    if (!csvText.trim()) {
      setError("Paste a CSV first.");
      return;
    }
    if (!groupCol) {
      setError("Pick a grouping column.");
      return;
    }
    if (metricCols.length === 0) {
      setError("Select at least one metric column.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await runKruskal({
        csv_text: csvText,
        group_col: groupCol,
        metric_cols: metricCols,
        alpha,
      });
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [csvText, groupCol, metricCols, alpha]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14 flex flex-col gap-8">
      <Hero />

      {/* Input panel */}
      <div className="rounded-2xl bg-card/60 ring-1 ring-border backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
            <span className="text-sm font-medium">CSV input</span>
            <span className="text-xs text-muted-foreground">
              · {parsed.rowCount.toLocaleString("id-ID")} rows ·{" "}
              {parsed.headers.length} columns
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
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Paste CSV here. First row is the header. Use a column like 'level' for the group, and numeric columns for the metrics."
          spellCheck={false}
          className={cn(
            "w-full min-h-[220px] sm:min-h-[260px] resize-y bg-transparent px-5 py-4",
            "text-[13px] leading-relaxed font-mono placeholder:text-muted-foreground/60",
            "focus:outline-none scroll-thin"
          )}
        />

        {/* Column picker */}
        {parsed.headers.length > 0 && (
          <div className="border-t border-border/60 bg-background/30 px-5 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <div>
                <div className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-2">
                  Grouping column
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidateGroupCols.map((h) => {
                    const on = h === groupCol;
                    const distinct = parsed.uniqueValues[h]?.length;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setGroupCol(h)}
                        aria-pressed={on}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ring-1",
                          on
                            ? "bg-accent-soft text-accent ring-accent/30"
                            : "bg-muted text-muted-foreground ring-border hover:text-foreground"
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                        {h}
                        {distinct !== undefined && (
                          <span className="text-muted-foreground/60">
                            · {distinct}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {groupCol && parsed.uniqueValues[groupCol] && (
                  <div className="text-[11px] text-muted-foreground/70 mt-2">
                    Groups: {parsed.uniqueValues[groupCol].join(" · ")}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mb-2">
                  Significance (α)
                </div>
                <input
                  type="number"
                  value={alpha}
                  step={0.01}
                  min={0.0001}
                  max={0.5}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value);
                    setAlpha(Number.isFinite(n) && n > 0 && n < 1 ? n : 0.05);
                  }}
                  className={cn(
                    "bg-input rounded-md px-3 py-1.5 text-sm font-mono ring-1 ring-border w-24",
                    "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:bg-background"
                  )}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider">
                  Metric columns
                </div>
                <span className="text-[11px] text-muted-foreground/60">
                  · numeric only · {metricCols.length} selected
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setMetricCols(parsed.numericColumns)}
                  disabled={parsed.numericColumns.length === 0}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                >
                  All
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={() => setMetricCols([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  None
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsed.numericColumns.length === 0 && (
                  <span className="text-xs text-muted-foreground/60">
                    No fully-numeric columns detected yet.
                  </span>
                )}
                {parsed.numericColumns.map((m) => {
                  const on = metricCols.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMetric(m)}
                      aria-pressed={on}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ring-1",
                        on
                          ? "bg-accent-soft text-accent ring-accent/30"
                          : "bg-muted text-muted-foreground ring-border hover:text-foreground"
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border/60 bg-background/40">
          <PrimaryButton
            onClick={handleRun}
            disabled={loading || !csvText.trim() || metricCols.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Running
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Run Kruskal-Wallis
              </>
            )}
          </PrimaryButton>
          <GhostButton onClick={handlePaste} disabled={loading}>
            <ClipboardPaste className="h-4 w-4" /> Paste CSV
          </GhostButton>
          <GhostButton onClick={handleClear} disabled={loading || !csvText}>
            <Eraser className="h-4 w-4" /> Clear
          </GhostButton>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 bg-rose-500/10 text-rose-200 ring-rose-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results && results.results.length > 0 && (
        <ResultsView response={results} groupCol={groupCol} />
      )}
    </div>
  );
}

function ResultsView({
  response,
  groupCol,
}: {
  response: KruskalResponse;
  groupCol: string;
}) {
  const { results, group_order, alpha } = response;
  const [copiedTable, setCopiedTable] = useState(false);

  const copyTable = useCallback(async () => {
    const lines: string[] = [];
    lines.push(["Metric", "H", "p", "df", "Significant"].join("\t"));
    for (const r of results) {
      if (r.error) {
        lines.push([r.metric, "—", "—", "—", r.error].join("\t"));
      } else {
        lines.push(
          [
            r.metric,
            fmt(r.h_stat, 4),
            fmtP(r.p_value),
            String(r.df ?? "—"),
            r.significant ? "Yes" : "No",
          ].join("\t")
        );
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 1400);
    } catch {
      // ignore
    }
  }, [results]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Summary table */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-accent" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Test results
            </h2>
          </div>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">
            α = {fmt(alpha, 2)} · {results.length}{" "}
            {results.length === 1 ? "metric" : "metrics"}
          </span>
          <button
            type="button"
            onClick={copyTable}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ring-1 transition-colors",
              copiedTable
                ? "bg-accent text-accent-foreground ring-accent/40"
                : "bg-accent-soft text-accent ring-accent/30 hover:bg-accent/20"
            )}
          >
            {copiedTable ? (
              <>
                <Check className="h-3 w-3" /> Copied table
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy table
              </>
            )}
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl ring-1 ring-border bg-card/40">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 font-medium">Metric</th>
                <th className="px-4 py-2.5 font-medium text-right">H</th>
                <th className="px-4 py-2.5 font-medium text-right">p-value</th>
                <th className="px-4 py-2.5 font-medium text-right">df</th>
                <th className="px-4 py-2.5 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {results.map((r) => (
                <tr key={r.metric} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-foreground">
                    {r.metric}
                  </td>
                  {r.error ? (
                    <td
                      colSpan={4}
                      className="px-4 py-2.5 text-rose-300 text-xs"
                    >
                      {r.error}
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {fmt(r.h_stat, 4)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {fmtP(r.p_value)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {r.df}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                            r.significant
                              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                              : "bg-muted text-muted-foreground ring-border"
                          )}
                        >
                          {r.significant
                            ? "Significant"
                            : "Not significant"}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-metric box plots + group stats */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Distribution by group
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results
            .filter((r) => !r.error && r.groups)
            .map((r) => (
              <MetricDetail
                key={r.metric}
                metric={r.metric}
                groupCol={groupCol}
                groups={r.groups!}
                groupOrder={group_order}
                pValue={r.p_value}
                significant={r.significant}
              />
            ))}
        </div>
      </section>
    </div>
  );
}

function MetricDetail({
  metric,
  groupCol,
  groups,
  groupOrder,
  pValue,
  significant,
}: {
  metric: string;
  groupCol: string;
  groups: Record<string, KruskalGroupStats>;
  groupOrder: string[];
  pValue: number | undefined;
  significant: boolean | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = useCallback(() => {
    if (svgRef.current) {
      downloadSvgAsPng(svgRef.current, `kruskal_${metric}_boxplot.png`);
    }
  }, [metric]);

  return (
    <div className="rounded-xl ring-1 ring-border bg-card/40 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium text-foreground">
          {metric}
        </span>
        <div className="flex-1" />
        <span className="text-[11px] text-muted-foreground font-mono">
          p = {fmtP(pValue)}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
            significant
              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
              : "bg-muted text-muted-foreground ring-border"
          )}
        >
          {significant ? "Significant" : "n.s."}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          title="Download box plot as PNG"
          aria-label="Download box plot"
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ring-1",
            "bg-transparent text-muted-foreground ring-border hover:text-foreground hover:bg-muted transition-colors"
          )}
        >
          <Download className="h-3 w-3" />
          PNG
        </button>
      </div>
      <BoxPlot
        ref={svgRef}
        metric={metric}
        groupCol={groupCol}
        groups={groups}
        groupOrder={groupOrder}
      />
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="self-start inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-180"
          )}
        />
        {expanded ? "Hide" : "Show"} group stats
      </button>
      {expanded && <StatsTable groups={groups} groupOrder={groupOrder} />}
    </div>
  );
}

function StatsTable({
  groups,
  groupOrder,
}: {
  groups: Record<string, KruskalGroupStats>;
  groupOrder: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-left text-[10px] text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="py-1.5 pr-3 font-medium">Group</th>
            <th className="py-1.5 px-2 font-medium text-right">n</th>
            <th className="py-1.5 px-2 font-medium text-right">Median</th>
            <th className="py-1.5 px-2 font-medium text-right">Mean</th>
            <th className="py-1.5 px-2 font-medium text-right">Q1</th>
            <th className="py-1.5 px-2 font-medium text-right">Q3</th>
            <th className="py-1.5 px-2 font-medium text-right">Min</th>
            <th className="py-1.5 pl-2 font-medium text-right">Max</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 font-mono tabular-nums">
          {groupOrder
            .filter((g) => groups[g])
            .map((g) => {
              const s = groups[g];
              return (
                <tr key={g}>
                  <td className="py-1.5 pr-3 font-sans text-foreground">{g}</td>
                  <td className="py-1.5 px-2 text-right text-muted-foreground">
                    {s.n}
                  </td>
                  <td className="py-1.5 px-2 text-right">{fmt(s.median)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(s.mean)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(s.q1)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(s.q3)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(s.min)}</td>
                  <td className="py-1.5 pl-2 text-right">{fmt(s.max)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

// Style tokens used by both on-screen render AND PNG export. They're plain
// hex so XMLSerializer output doesn't carry CSS-variable references that
// the off-screen <Image> wouldn't resolve.
const BOX_FILL = "#3bba9c";
const BOX_STROKE = "#3bba9c";
const MEDIAN_STROKE = "#f59e0b"; // amber-500 — like matplotlib's orange median
const AXIS_COLOR = "#e6e8ef";
const GRID_COLOR = "#e6e8ef";
const BG_COLOR = "#11151f";

const BoxPlot = function BoxPlot({
  ref,
  metric,
  groupCol,
  groups,
  groupOrder,
  height = 240,
}: {
  ref?: React.Ref<SVGSVGElement>;
  metric: string;
  groupCol: string;
  groups: Record<string, KruskalGroupStats>;
  groupOrder: string[];
  height?: number;
}) {
  const width = 520;
  const padL = 56;
  const padR = 18;
  const padT = 36;
  const padB = 48;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const valid = groupOrder.filter((g) => groups[g]);
  if (valid.length === 0) return null;

  // Tukey outliers come from raw values (we have them per-group).
  const outliersByGroup: Record<string, number[]> = {};
  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const name of valid) {
    const g = groups[name];
    const iqr = g.q3 - g.q1;
    const lo = g.q1 - 1.5 * iqr;
    const hi = g.q3 + 1.5 * iqr;
    const outliers = g.values.filter((v) => v < lo || v > hi);
    const inliers = g.values.filter((v) => v >= lo && v <= hi);
    outliersByGroup[name] = outliers;
    const whiskerLo = inliers.length ? Math.min(...inliers) : g.min;
    const whiskerHi = inliers.length ? Math.max(...inliers) : g.max;
    dataMin = Math.min(dataMin, whiskerLo, g.min);
    dataMax = Math.max(dataMax, whiskerHi, g.max);
  }
  const range = dataMax - dataMin || 1;
  const pad = range * 0.08;
  const yLo = dataMin - pad;
  const yHi = dataMax + pad;

  const y = (v: number) => padT + ((yHi - v) / (yHi - yLo)) * plotH;

  const N = valid.length;
  const slotW = plotW / N;
  const boxW = Math.min(slotW * 0.5, 60);

  const tickCount = 5;
  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, i) => yLo + ((yHi - yLo) * i) / tickCount
  );
  const tickDecimals = range >= 10 ? 1 : 2;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      data-bg={BG_COLOR}
    >
      {/* Title */}
      <text
        x={width / 2}
        y={20}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill={AXIS_COLOR}
      >
        Distribution of {metric} by {groupCol}
      </text>

      {/* Y-axis grid + tick labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={width - padR}
            y1={y(t)}
            y2={y(t)}
            stroke={GRID_COLOR}
            strokeOpacity={0.12}
            strokeDasharray="3 4"
          />
          <text
            x={padL - 8}
            y={y(t) + 4}
            textAnchor="end"
            fontSize="10"
            fill={AXIS_COLOR}
            opacity={0.7}
          >
            {fmt(t, tickDecimals)}
          </text>
        </g>
      ))}

      {/* Plot frame */}
      <line
        x1={padL}
        x2={padL}
        y1={padT}
        y2={padT + plotH}
        stroke={AXIS_COLOR}
        strokeOpacity={0.4}
      />
      <line
        x1={padL}
        x2={width - padR}
        y1={padT + plotH}
        y2={padT + plotH}
        stroke={AXIS_COLOR}
        strokeOpacity={0.4}
      />

      {/* Axis labels */}
      <text
        x={14}
        y={padT + plotH / 2}
        textAnchor="middle"
        fontSize="11"
        fill={AXIS_COLOR}
        opacity={0.85}
        transform={`rotate(-90 14 ${padT + plotH / 2})`}
      >
        {metric}
      </text>
      <text
        x={padL + plotW / 2}
        y={height - 8}
        textAnchor="middle"
        fontSize="11"
        fill={AXIS_COLOR}
        opacity={0.85}
      >
        {groupCol}
      </text>

      {/* Boxes */}
      {valid.map((name, idx) => {
        const g = groups[name];
        const cx = padL + slotW * (idx + 0.5);
        const x1 = cx - boxW / 2;
        const iqr = g.q3 - g.q1;
        const lo = g.q1 - 1.5 * iqr;
        const hi = g.q3 + 1.5 * iqr;
        const inliers = g.values.filter((v) => v >= lo && v <= hi);
        const whiskerLo = inliers.length ? Math.min(...inliers) : g.min;
        const whiskerHi = inliers.length ? Math.max(...inliers) : g.max;

        return (
          <g key={name}>
            {/* whiskers */}
            <line
              x1={cx}
              x2={cx}
              y1={y(whiskerLo)}
              y2={y(g.q1)}
              stroke={AXIS_COLOR}
              strokeOpacity={0.65}
            />
            <line
              x1={cx}
              x2={cx}
              y1={y(g.q3)}
              y2={y(whiskerHi)}
              stroke={AXIS_COLOR}
              strokeOpacity={0.65}
            />
            {/* whisker caps */}
            <line
              x1={cx - boxW * 0.22}
              x2={cx + boxW * 0.22}
              y1={y(whiskerLo)}
              y2={y(whiskerLo)}
              stroke={AXIS_COLOR}
              strokeOpacity={0.65}
            />
            <line
              x1={cx - boxW * 0.22}
              x2={cx + boxW * 0.22}
              y1={y(whiskerHi)}
              y2={y(whiskerHi)}
              stroke={AXIS_COLOR}
              strokeOpacity={0.65}
            />
            {/* box */}
            <rect
              x={x1}
              y={y(g.q3)}
              width={boxW}
              height={Math.max(1, y(g.q1) - y(g.q3))}
              fill={BOX_FILL}
              fillOpacity={0.22}
              stroke={BOX_STROKE}
              strokeOpacity={0.85}
            />
            {/* median */}
            <line
              x1={x1}
              x2={x1 + boxW}
              y1={y(g.median)}
              y2={y(g.median)}
              stroke={MEDIAN_STROKE}
              strokeWidth={2}
            />
            {/* outliers */}
            {outliersByGroup[name].map((o, oi) => (
              <circle
                key={oi}
                cx={cx}
                cy={y(o)}
                r={3}
                fill="none"
                stroke={AXIS_COLOR}
                strokeOpacity={0.7}
              />
            ))}
            {/* group label */}
            <text
              x={cx}
              y={padT + plotH + 18}
              textAnchor="middle"
              fontSize="11"
              fill={AXIS_COLOR}
              opacity={0.9}
            >
              {name}
            </text>
            {/* median value label */}
            <text
              x={cx}
              y={y(g.median) - 4}
              textAnchor="middle"
              fontSize="10"
              fill={MEDIAN_STROKE}
              opacity={0.95}
            >
              {fmt(g.median, tickDecimals)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

async function downloadSvgAsPng(svg: SVGSVGElement, filename: string) {
  const bg = svg.dataset.bg || BG_COLOR;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Resolve viewBox dimensions
  const vb = svg.viewBox.baseVal;
  const w = vb && vb.width ? vb.width : svg.clientWidth || 520;
  const h = vb && vb.height ? vb.height : svg.clientHeight || 240;

  // Inject background as the first child so the PNG isn't transparent
  const bgRect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  bgRect.setAttribute("width", String(w));
  bgRect.setAttribute("height", String(h));
  bgRect.setAttribute("fill", bg);
  clone.insertBefore(bgRect, clone.firstChild);

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });

    const scale = 2; // ~2x pixel density for crisper PNG
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pngBlob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!pngBlob) return;
    const dlUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(dlUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Hero() {
  return (
    <div className="flex flex-col gap-3">
      <span className="self-start inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent ring-1 ring-accent/20">
        <BarChart3 className="h-3 w-3" />
        Kruskal-Wallis test
      </span>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
        Compare metrics across groups.
      </h1>
      <p className="text-muted-foreground max-w-2xl">
        Non-parametric test of whether groups (e.g. Beginner / Intermediate /
        Advanced) come from the same distribution. Paste a CSV, pick a grouping
        column and the numeric metrics you want to test — see H, p-value,
        verdict, and a box plot per metric.
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
