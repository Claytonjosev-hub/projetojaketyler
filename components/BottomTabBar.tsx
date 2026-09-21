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
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-200 bg-white/95 backdrop-blur">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-3 text-center text-sm font-medium ${
              active ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
