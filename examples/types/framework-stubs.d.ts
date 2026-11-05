// The framework's samples use a few names they don't define. In a real app these come from your
// domain types and components/states/ (BLUEPRINT 10.7). They're declared here only so that the
// samples type-check exactly as the framework prints them.
import type { ReactNode } from 'react';
import type { AppErrorCode } from '../lib/ui/view-state';

declare global {
  type Task = { id: string; title: string };
  const BoardSkeleton: (props: { slow: boolean }) => ReactNode;
  const EmptyBoard: () => ReactNode;
  const NoResults: (props: { query: string }) => ReactNode;
  const Board: (props: { tasks: Task[]; stale?: boolean; readOnly?: boolean }) => ReactNode;
  const ErrorPanel: (props: { code: AppErrorCode; refId: string; onRetry: () => void }) => ReactNode;
  const OfflineBanner: (props: { children?: ReactNode }) => ReactNode;
  const PermissionDenied: (props: { reason: string }) => ReactNode;
  const SessionExpired: () => ReactNode;
  const NotFound: () => ReactNode;
  const RateLimited: (props: { retryAfterSeconds: number }) => ReactNode;
}

export {};
