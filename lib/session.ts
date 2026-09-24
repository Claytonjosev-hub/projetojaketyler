import { cookies } from "next/headers";
import { listUsers } from "./db";
import type { User } from "./types";

export const USER_COOKIE = "jt_user";
export const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface Session {
  users: User[];
  /** Null until someone picks a profile on this device. */
  current: User | null;
}

export async function getSession(): Promise<Session> {
  const [users, store] = await Promise.all([listUsers(), cookies()]);
  const id = store.get(USER_COOKIE)?.value;
  return { users, current: users.find((user) => user.id === id) ?? null };
}

/** The signed-in profile, for code paths that cannot run without one. */
export async function requireUserId(): Promise<string> {
  const { current } = await getSession();
  if (!current) {
    throw new Error("Nenhum perfil selecionado neste aparelho.");
  }
  return current.id;
}
