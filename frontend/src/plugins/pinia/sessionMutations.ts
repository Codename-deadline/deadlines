import { type PiniaColadaPlugin, type UseMutationContextCommon, useMutationCache } from "@pinia/colada";
import { onScopeDispose } from "vue";
import { useTokenStore } from "@/stores/TokenStore";
import { QUERY_EMPTY_PENDING_STATE } from "../api";

export type SessionMutationContext = {
  sessionSignal: AbortSignal;
  sessionVersion: number;
};

declare module "@pinia/colada" {
  interface TypesConfig {
    mutationMeta: {
      // Opt out for mutations whose success intentionally replaces the session, such as login.
      sessionBound?: boolean;
      [key: string]: unknown;
    };
  }

  interface UseMutationGlobalContext extends SessionMutationContext {}
}

type Session = {
  signal: AbortSignal;
  version: number;
  bound: boolean;
};

/**
 * Guard mutation execution, callbacks and state commits against session changes.
 * HTTP cancellation stays in the transport; custom async work must observe sessionSignal itself.
 */
export function sessionMutationGuard(): PiniaColadaPlugin {
  return ({ pinia, scope }) => {
    const tokens = useTokenStore(pinia);
    const cache = useMutationCache(pinia);
    const sessions = new WeakMap<object, Session>();
    const patched = new WeakSet<object>();

    const sessionOf = (context: unknown) => {
      const session = sessions.get((context as UseMutationContextCommon).entry);
      if (!session) throw new Error("Missing mutation session");
      return session;
    };
    const stale = (session: Session) => session.bound && session.signal.aborted;
    const check = (context: unknown) => {
      const session = sessionOf(context);
      if (session.bound) session.signal.throwIfAborted();
    };

    const unsubscribe = cache.$onAction(({ name, args, after, onError }) => {
      if (name === "mutate") {
        const [entry] = args;
        const session: Session = {
          signal: tokens.sessionSignal(),
          version: tokens.sessionVersion,
          bound: entry.meta.sessionBound !== false,
        };
        sessions.set(entry, session);

        const finish = () => {
          if (stale(session)) {
            cache.setEntryState(entry, QUERY_EMPTY_PENDING_STATE);
            cache.remove(entry);
            throw session.signal.reason;
          }
        };
        // Cover session changes during the final lifecycle await, including failure/cleanup hooks.
        after(finish);
        onError(finish);
      }

      if (name === "setEntryState") {
        const session = sessions.get(args[0]);
        if (session && stale(session)) {
          // Clearing the cache on logout does not stop a late commit to an entry held by an observer.
          args[1] = QUERY_EMPTY_PENDING_STATE;
        }
      }

      if (name !== "extend") return;
      const options = args[0].options;
      if (patched.has(options)) return;
      patched.add(options);

      const { onMutate, mutation, onSuccess, onError: handleError, onSettled } = options;

      options.onMutate = async (vars, context) => {
        check(context);
        const session = sessionOf(context);
        const captured = { sessionSignal: session.signal, sessionVersion: session.version };
        const result = await onMutate?.(vars, { ...context, ...captured });
        return { ...result, ...captured };
      };
      options.mutation = (vars, context) => {
        check(context);
        return mutation(vars, context);
      };
      options.onSuccess = (data, vars, context) => {
        check(context);
        return onSuccess?.(data, vars, context);
      };

      // Skip obsolete effects without throwing from cleanup hooks.
      options.onError = (error, vars, context) => {
        if (!stale(sessionOf(context))) return handleError?.(error, vars, context);
      };
      options.onSettled = (data, error, vars, context) => {
        if (!stale(sessionOf(context))) return onSettled?.(data, error, vars, context);
      };
    }, true);
    scope.run(() => onScopeDispose(unsubscribe));
  };
}
