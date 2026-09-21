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
  const interactive = onClick ? "cursor-pointer active:bg-canvas" : "";
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-line bg-surface transition-colors ${interactive} ${className}`}
    >
      {children}
    </div>
  );
}
