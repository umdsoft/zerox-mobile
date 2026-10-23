/**
 * UI hook'lari: navbat holati va xulosa (banner, Sinxron sahifasi, nishonlar).
 */
import { useMemo, useSyncExternalStore } from 'react';
import { currentActor, getOutbox } from './offlineStore';
import { OutboxState } from './outbox';
import { OutboxOp } from './types';

const subscribe = (fn: () => void) => getOutbox().subscribe(() => fn());
const snapshot = (): OutboxState => getOutbox().getState();

export function useOutboxState(): OutboxState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export interface OfflineSummary {
  /** Joriy sessiyaning hali yuborilmagan amallari (pending + syncing). */
  queued: number;
  failed: number;
  blocked: number;
  /** Boshqa sessiyada (masalan xodim rejimida) yaratilgan faol amallar. */
  otherSession: number;
  ops: OutboxOp[];
}

export function useOfflineSummary(): OfflineSummary {
  const state = useOutboxState();
  return useMemo(() => {
    const actor = currentActor()?.key;
    const mine = actor ? state.ops.filter(o => o.actor === actor) : [];
    const count = (pred: (o: OutboxOp) => boolean) => mine.filter(pred).length;
    return {
      queued: count(o => o.status === 'pending' || o.status === 'syncing'),
      failed: count(o => o.status === 'failed'),
      blocked: count(o => o.status === 'blocked'),
      otherSession: state.ops.filter(o => o.actor !== actor && o.status !== 'done').length,
      ops: mine,
    };
  }, [state]);
}

/** Logout oynasi uchun (hook emas): joriy sessiyaning yuborilmagan amallari soni. */
export function unsyncedCount(): number {
  try {
    const actor = currentActor()?.key;
    if (!actor) return 0;
    return getOutbox().activeOps(actor).length;
  } catch {
    return 0;
  }
}
