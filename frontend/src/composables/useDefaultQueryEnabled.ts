import type { Pinia } from "pinia";
import { useTokenStore } from "@/stores/TokenStore";

export function useDefaultQueryEnabled(pinia?: Pinia): () => boolean {
  const tokens = useTokenStore(pinia);

  return () => Boolean(tokens.accessToken || tokens.refreshToken);
}
