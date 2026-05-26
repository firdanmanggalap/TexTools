export interface AnalyzeRequest {
  text: string;
  msttr_window?: number;
  mattr_window?: number;
  hdd_draws?: number;
}

export interface AnalyzeResponse {
  words: number;
  sentences: number;
  avg_sentence_length: number;
  types: number;
  ttr: number;
  rttr: number;
  cttr: number;
  mtld: number;
  msttr: number;
  mattr: number;
  hdd: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  gunning_fog: number;
  smog_index: number;
}

export interface AnalyzeError {
  error: string;
}

// Empty string = call the same Vercel deployment (where /api/* is the FastAPI
// serverless function). Override via NEXT_PUBLIC_API_URL for split deploys
// (e.g. local dev pointing at uvicorn on :8000).
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export async function analyzeText(
  payload: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as AnalyzeResponse | AnalyzeError;

  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : `Request failed (${res.status})`);
  }

  return data;
}

// ---- Kruskal-Wallis ----

export interface KruskalRequest {
  csv_text: string;
  group_col: string;
  metric_cols: string[];
  alpha?: number;
}

export interface KruskalGroupStats {
  n: number;
  median: number;
  mean: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  values: number[];
}

export interface KruskalPairwise {
  a: string;
  b: string;
  u_stat?: number;
  p_value?: number;
  p_adjusted?: number;
  significant?: boolean;
  error?: string;
}

export interface KruskalMetricResult {
  metric: string;
  h_stat?: number;
  p_value?: number;
  df?: number;
  alpha?: number;
  significant?: boolean;
  groups?: Record<string, KruskalGroupStats>;
  pairwise?: KruskalPairwise[];
  pairwise_test?: string;
  pairwise_correction?: string;
  error?: string;
}

export interface KruskalResponse {
  results: KruskalMetricResult[];
  group_order: string[];
  alpha: number;
}

export async function runKruskal(
  payload: KruskalRequest
): Promise<KruskalResponse> {
  const res = await fetch(`${API_BASE}/api/kruskal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as KruskalResponse | AnalyzeError;
  if (!res.ok || "error" in data) {
    throw new Error(
      "error" in data ? data.error : `Request failed (${res.status})`
    );
  }
  return data;
}
