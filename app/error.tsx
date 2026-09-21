"use client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink p-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-paper">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-paper-dim">{error.message}</p>
      <button
        onClick={retry}
        className="min-h-11 rounded-md bg-ember px-4 text-sm font-medium text-ink"
      >
        Tentar novamente
      </button>
    </main>
  );
}
