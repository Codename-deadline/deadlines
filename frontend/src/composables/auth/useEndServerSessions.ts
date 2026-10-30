import { useMutation } from "@pinia/colada";
import { signOut } from "@/api/generated/endpoints/authentication/authentication";

export function useEndServerSessions() {
  // The server uses GET, but this is an explicit action, never an automatic query.
  return useMutation({ mutation: () => signOut() });
}
