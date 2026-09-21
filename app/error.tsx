"use client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-ink-dim">{error.message}</p>
      <button
        onClick={retry}
        className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-surface"
      >
        Tentar novamente
      </button>
    </main>
  );
}
