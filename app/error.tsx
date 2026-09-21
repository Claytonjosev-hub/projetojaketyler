"use client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-lg font-semibold">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-neutral-500">{error.message}</p>
      <button
        onClick={retry}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Tentar novamente
      </button>
    </main>
  );
}
