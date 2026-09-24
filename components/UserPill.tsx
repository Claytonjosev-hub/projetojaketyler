"use client";

import { useState } from "react";
import { switchUser } from "@/app/actions";
import type { User } from "@/lib/types";

export function UserPill({ users, currentId }: { users: User[]; currentId: string }) {
  const [open, setOpen] = useState(false);
  const current = users.find((user) => user.id === currentId);
  const others = users.filter((user) => user.id !== currentId);

  if (!current) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface pr-3 pl-1.5 active:bg-canvas"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-surface">
          {current.name.charAt(0)}
        </span>
        <span className="text-sm font-medium">{current.name}</span>
      </button>

      {open && others.length > 0 && (
        <div className="absolute right-0 z-20 mt-1 min-w-40 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          {others.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={async () => {
                setOpen(false);
                await switchUser(user.id);
                // Full load: a soft navigation would keep the previous
                // profile's cards mounted while only the header updated.
                window.location.assign("/");
              }}
              className="flex min-h-12 w-full items-center gap-2 px-3 text-left text-sm active:bg-canvas"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-xs font-bold text-ink-dim">
                {user.name.charAt(0)}
              </span>
              Entrar como {user.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
