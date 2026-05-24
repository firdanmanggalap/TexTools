import { MetricCard } from "./metric-card";
import type { AnalyzeResponse } from "@/lib/api";
import type { MetricDef } from "@/lib/metrics";

interface Props {
  title: string;
  metrics: MetricDef[];
  results: AnalyzeResponse | null;
  loading: boolean;
}

export function MetricGroup({ title, metrics, results, loading }: Props) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {metrics.map((def) => (
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
