"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Hoje" },
  { href: "/progress", label: "Progresso" },
  { href: "/settings", label: "Config" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-ink-raised pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex-1 py-3.5 text-center text-sm"
          >
            <span className={active ? "text-paper" : "text-paper-faint"}>{tab.label}</span>
            {active && (
              <span className="absolute inset-x-6 -top-px h-0.5 rounded-full bg-ember" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
