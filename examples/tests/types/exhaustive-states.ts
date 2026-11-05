// Proves the claim in 10.7 that the build fails when a screen forgets a state. Each switch below
// leaves states out on purpose, so assertNever() must be a type error. If it ever compiled (for
// example because assertNever stopped taking `never`), the unused @ts-expect-error would fail the
// type-check instead.
import { assertNever, type FormState, type ViewState } from '../../lib/ui/view-state';

export function viewWithMissingStates(state: ViewState<string[]>): string {
  switch (state.kind) {
    case 'loading':
      return 'loading';
    case 'ready':
      return 'ready';
    default:
      // @ts-expect-error: empty, noResults, error, offline and the other states aren't handled
      return assertNever(state);
  }
}

export function formWithMissingStates(state: FormState<'email'>): string {
  switch (state.kind) {
    case 'editing':
      return 'editing';
    case 'submitting':
      return 'saving';
    default:
      // @ts-expect-error: invalid (S9), failed and succeeded (S10) aren't handled
      return assertNever(state);
  }
}
