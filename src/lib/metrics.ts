import type { AnalyzeResponse } from "./api";

export type MetricKey = keyof AnalyzeResponse;

export interface MetricDef {
  key: MetricKey;
  label: string;
  abbr?: string;
  hint: string;
  kind: "integer" | "decimal" | "score";
}

export const basicStats: MetricDef[] = [
  {
    key: "words",
    label: "Words",
    hint: "Total number of word tokens in the text.",
    kind: "integer",
  },
  {
    key: "sentences",
    label: "Sentences",
    hint: "Sentence count, detected via terminal punctuation.",
    kind: "integer",
  },
  {
    key: "avg_sentence_length",
    label: "Avg. Sentence Length",
    hint: "Average number of words per sentence.",
    kind: "decimal",
  },
  {
    key: "types",
    label: "Types",
    hint: "Number of unique word forms (vocabulary size).",
    kind: "integer",
  },
];

export const lexicalRichness: MetricDef[] = [
  {
    key: "ttr",
    label: "Type-Token Ratio",
    abbr: "TTR",
    hint: "Ratio of unique words to total words. Highly sensitive to text length.",
    kind: "decimal",
  },
  {
    key: "rttr",
    label: "Root TTR",
    abbr: "RTTR",
    hint: "Guiraud's index. Divides types by the square root of tokens to reduce length bias.",
    kind: "decimal",
  },
  {
    key: "cttr",
    label: "Corrected TTR",
    abbr: "CTTR",
    hint: "Carroll's variant. Divides types by √(2·tokens).",
    kind: "decimal",
  },
  {
    key: "mtld",
    label: "MTLD",
    hint: "Measure of Textual Lexical Diversity. Mean length of sequential word strings that maintain a fixed TTR.",
    kind: "decimal",
  },
  {
    key: "msttr",
    label: "MSTTR",
    hint: "Mean Segmental TTR. Splits text into non-overlapping windows and averages their TTR.",
    kind: "decimal",
  },
  {
    key: "mattr",
    label: "MATTR",
    hint: "Moving Average TTR. Averages TTR over a sliding window — less length-biased than TTR.",
    kind: "decimal",
  },
  {
    key: "hdd",
    label: "HD-D",
    hint: "Hypergeometric distribution diversity. Probability-based measure that's robust to text length.",
    kind: "decimal",
  },
];

export const readability: MetricDef[] = [
  {
    key: "flesch_reading_ease",
    label: "Flesch Reading Ease",
    hint: "0–100. Higher means easier. 60+ is considered plain English.",
    kind: "score",
  },
  {
    key: "flesch_kincaid_grade",
    label: "Flesch-Kincaid Grade",
    hint: "Approximate US school grade level needed to comprehend the text.",
    kind: "score",
  },
  {
    key: "gunning_fog",
    label: "Gunning Fog",
    hint: "Years of formal education needed to read on first reading. Lower is easier.",
    kind: "score",
  },
  {
    key: "smog_index",
    label: "SMOG Index",
    hint: "Estimated school grade. Particularly reliable for healthcare and assessment texts.",
    kind: "score",
  },
];

export function formatMetric(value: number | undefined, kind: MetricDef["kind"]) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  if (kind === "integer") return Math.round(value).toLocaleString();
  return value.toFixed(2);
}

export interface ReadabilityBand {
  label: string;
  tone: "easy" | "fair" | "hard" | "very-hard";
}

export function fleschReadingEaseBand(score: number): ReadabilityBand {
  if (score >= 80) return { label: "Very easy", tone: "easy" };
  if (score >= 60) return { label: "Plain English", tone: "easy" };
  if (score >= 50) return { label: "Fairly difficult", tone: "fair" };
  if (score >= 30) return { label: "Difficult", tone: "hard" };
  return { label: "Very difficult", tone: "very-hard" };
}

export function gradeLevelBand(grade: number): ReadabilityBand {
  if (grade <= 6) return { label: "Elementary", tone: "easy" };
  if (grade <= 9) return { label: "Middle school", tone: "easy" };
  if (grade <= 12) return { label: "High school", tone: "fair" };
  if (grade <= 16) return { label: "College", tone: "hard" };
  return { label: "Graduate+", tone: "very-hard" };
}

export function bandForMetric(key: MetricKey, value: number): ReadabilityBand | null {
  switch (key) {
    case "flesch_reading_ease":
      return fleschReadingEaseBand(value);
    case "flesch_kincaid_grade":
    case "gunning_fog":
    case "smog_index":
      return gradeLevelBand(value);
    default:
      return null;
  }
}
