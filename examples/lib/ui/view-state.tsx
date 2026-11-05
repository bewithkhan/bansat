// lib/ui/view-state.tsx — one discriminated union for every async screen
export type AppErrorCode =
  | 'VALIDATION_FAILED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'
  | 'RATE_LIMITED' | 'TIMEOUT' | 'UPSTREAM_UNAVAILABLE' | 'INTERNAL';

export type ViewState<T> =
  | { kind: 'loading'; slow: boolean }                        // S2 / S5
  | { kind: 'empty' }                                         // S1
  | { kind: 'noResults'; query: string }                      // S6
  | { kind: 'ready'; data: T; stale: boolean }                // normal (+ stale after reconnect)
  | { kind: 'error'; code: AppErrorCode; ref: string }        // S3
  | { kind: 'offline'; cached?: T }                           // S4
  | { kind: 'forbidden'; reason: string }                     // S7
  | { kind: 'sessionExpired' }                                // S8
  | { kind: 'notFound' }                                      // S11
  | { kind: 'rateLimited'; retryAfterSeconds: number };       // S13

// Forms and mutations: S9 and S10 belong to the form, not to the view around it
export type FormState<Field extends string> =
  | { kind: 'editing' }
  | { kind: 'submitting' }                                      // S2 inline progress
  | { kind: 'invalid'; errors: Partial<Record<Field, string>> } // S9: the inputs are kept
  | { kind: 'failed'; code: AppErrorCode; ref: string; retryAfterSeconds?: number } // S3, S7, S8, S13
  | { kind: 'succeeded'; message: string; undo?: () => void };  // S10

export function assertNever(x: never): never {
  throw new Error(`Unhandled view state: ${JSON.stringify(x)}`);
}

// The status line under a form: what happened, then what to do next (10.5 content rules)
export function formStatus<Field extends string>(state: FormState<Field>): string | null {
  switch (state.kind) {
    case 'editing':    return null;
    case 'submitting': return 'Saving…';
    case 'invalid':    return 'Check the highlighted fields.'; // focus moves to the first error
    case 'failed':     return failureMessage(state.code, state.ref, state.retryAfterSeconds);
    case 'succeeded':  return state.message;
    default:           return assertNever(state);
  }
}

function failureMessage(code: AppErrorCode, ref: string, retryAfterSeconds?: number): string {
  switch (code) {
    case 'FORBIDDEN':       return "You don't have permission to do this. Ask an admin for access."; // S7
    case 'UNAUTHENTICATED': return 'Your session ended for security. Sign in again to continue. We kept your draft.'; // S8
    case 'RATE_LIMITED':    return `Too many attempts. Try again in ${retryAfterSeconds ?? 60} seconds.`; // S13
    default:                return `We couldn't save your changes. Try again. Ref ${ref}`; // S3
  }
}

// ---- usage: the compiler fails the build if a new state is added but not handled ----
// (Task and the state components are imported from your domain types and components/states/)
export function TaskBoardView({ state, onRetry }: { state: ViewState<Task[]>; onRetry: () => void }) {
  switch (state.kind) {
    case 'loading':        return <BoardSkeleton slow={state.slow} />;
    case 'empty':          return <EmptyBoard />;
    case 'noResults':      return <NoResults query={state.query} />;
    case 'ready':          return <Board tasks={state.data} stale={state.stale} />;
    case 'error':          return <ErrorPanel code={state.code} refId={state.ref} onRetry={onRetry} />;
    case 'offline':        return <OfflineBanner>{state.cached && <Board tasks={state.cached} readOnly />}</OfflineBanner>;
    case 'forbidden':      return <PermissionDenied reason={state.reason} />;
    case 'sessionExpired': return <SessionExpired />;
    case 'notFound':       return <NotFound />;
    case 'rateLimited':    return <RateLimited retryAfterSeconds={state.retryAfterSeconds} />;
    default:               return assertNever(state);
  }
}
