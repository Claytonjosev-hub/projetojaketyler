"use client";

import { useState } from "react";
import { switchUser } from "@/app/actions";
import type { User } from "@/lib/types";

export function UserPicker({ users }: { users: User[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function choose(userId: string) {
    setBusyId(userId);
    await switchUser(userId);
    // Full load, so the whole tree is rebuilt for the profile that just signed in.
    window.location.assign("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="text-[32px] font-extrabold leading-none tracking-tight">Quem é você?</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Fica salvo neste aparelho. Dá pra trocar depois, no topo da tela.
        </p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => choose(user.id)}
            disabled={busyId !== null}
            className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-line bg-surface px-5 text-left active:bg-canvas disabled:opacity-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-lg font-bold text-surface">
              {user.name.charAt(0)}
            </span>
            <span className="text-lg font-semibold">
              {busyId === user.id ? "Entrando…" : user.name}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
