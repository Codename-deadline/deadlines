import { isoToMs } from "@/utils/date";
import { normalizeUsername } from "@/utils/validation";
import type { UsernameRolePair } from "../generated/models";

/** Accept existing application timestamps as well as wire-format instants. */
export function toTimestamp(value: string | number): number {
  const timestamp = typeof value === "number" ? value : isoToMs(value);
  if (!Number.isFinite(timestamp)) throw new TypeError("Invalid timestamp");
  return timestamp;
}

export function mapPage<T, U>(page: { data: T[]; totalPages: number }, map: (item: T) => U) {
  return { ...page, data: page.data.map(map) };
}

export function normalizeInvitations(
  invitations: { username: string; role: string }[],
  toRole: (role: string) => UsernameRolePair["role"],
): UsernameRolePair[] {
  const unique = new Map<string, UsernameRolePair>();

  for (const invitation of invitations) {
    const username = normalizeUsername(invitation.username.trim());
    if (username && !unique.has(username)) {
      unique.set(username, { username, role: toRole(invitation.role) });
    }
  }

  return [...unique.values()];
}
