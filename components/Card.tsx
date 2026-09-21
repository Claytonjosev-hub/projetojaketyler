import type { ReactNode } from "react";

export function Card({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = onClick ? "cursor-pointer active:bg-ink-field" : "";
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-line bg-ink-raised p-4 transition-colors ${interactive} ${className}`}
    >
      {children}
    </div>
  );
}
