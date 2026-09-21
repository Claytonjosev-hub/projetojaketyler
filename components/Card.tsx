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
  const interactive = onClick ? "cursor-pointer active:scale-[0.99]" : "";
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition ${interactive} ${className}`}
    >
      {children}
    </div>
  );
}
