import { quoteForDate } from "@/lib/quotes";

export function DailyQuote({ date }: { date: string }) {
  const quote = quoteForDate(date);
  return (
    <div className="rounded-2xl bg-ink px-5 py-4 text-surface">
      <p className="text-[15px] leading-snug font-medium">{quote.text}</p>
      <p className="mt-2 text-xs text-surface/60">
        {quote.character} · {quote.anime}
      </p>
    </div>
  );
}
