"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { href: "/", label: "Analyzer", Icon: Activity },
  { href: "/clean", label: "Text Cleaner", Icon: Eraser },
] as const;

export function ModePills() {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl px-6 pt-6 -mb-2 flex justify-center">
      <div
        role="tablist"
        aria-label="Mode"
        className="inline-flex items-center gap-1 rounded-full bg-card/70 ring-1 ring-border p-1 backdrop-blur"
      >
        {MODES.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground shadow-[0_4px_14px_-6px_rgba(59,186,156,0.6)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
