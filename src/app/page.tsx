import { Analyzer } from "@/components/analyzer";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Analyzer />
      </main>
      <footer className="border-t border-border/60 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>TexTools · Built with Next.js &amp; FastAPI</span>
          <a
            href="https://github.com/firdanmanggalap/textools"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground transition-colors"
          >
            Source
          </a>
        </div>
      </footer>
    </>
  );
}
