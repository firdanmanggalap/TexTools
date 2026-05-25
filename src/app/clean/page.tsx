import type { Metadata } from "next";
import { Cleaner } from "@/components/cleaner";

export const metadata: Metadata = {
  title: "Text Cleaner — TexTools",
  description:
    "Strip markdown, LaTeX, tables, citations, HTML, and noisy whitespace from text before analyzing it.",
};

export default function CleanPage() {
  return <Cleaner />;
}
