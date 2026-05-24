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
