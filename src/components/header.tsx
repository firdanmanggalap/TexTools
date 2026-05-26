"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Analyzer", Icon: Sparkles },
  { href: "/kruskal", label: "Kruskal-Wallis", Icon: BarChart3 },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/60 backdrop-blur-md bg-background/60 sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
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
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-card/60 ring-1 ring-border p-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground shadow-[0_4px_14px_-6px_rgba(59,186,156,0.6)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <a
          href="https://github.com/firdanmanggalap/textools"
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
