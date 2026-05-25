import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-foreground">
              TexTools
            </div>
            <div className="text-[11px] text-muted-foreground">
              Text analysis toolkit
            </div>
          </div>
        </div>

        <a
          href="https://github.com/firdanmanggalap/textools"
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
