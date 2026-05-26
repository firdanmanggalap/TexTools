import type { Metadata } from "next";
import { Kruskal } from "@/components/kruskal";

export const metadata: Metadata = {
  title: "Kruskal-Wallis test — TexTools",
  description:
    "Non-parametric test for differences in metrics across multiple groups. Paste a CSV, pick a grouping column and metric columns, get H, p-value, and box plots.",
};

export default function KruskalPage() {
  return <Kruskal />;
}
