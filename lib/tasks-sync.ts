import type { Task } from "./types.js";

export type TaskSnapshot = { active: Task[]; trashed: Task[] };
export type TaskSyncState = TaskSnapshot & {
  pendingMutations: number;
  deferredSnapshot: TaskSnapshot | null;
  consecutiveFailures: number;
  stale: boolean;
};

export function createTaskSyncState(): TaskSyncState {
  return { active: [], trashed: [], pendingMutations: 0, deferredSnapshot: null, consecutiveFailures: 0, stale: false };
}

export function receiveTaskSnapshot(state: TaskSyncState, snapshot: TaskSnapshot): TaskSyncState {
  return state.pendingMutations > 0
    ? { ...state, deferredSnapshot: snapshot }
    : { ...state, ...snapshot, deferredSnapshot: null };
}

export function finishTaskMutation(state: TaskSyncState): { state: TaskSyncState; snapshotApplied: boolean } {
  const pendingMutations = Math.max(0, state.pendingMutations - 1);
  const snapshotApplied = pendingMutations === 0 && state.deferredSnapshot !== null;
  const next = snapshotApplied
    ? { ...state, ...state.deferredSnapshot!, pendingMutations, deferredSnapshot: null }
    : { ...state, pendingMutations };
  return { state: next, snapshotApplied };
}

export function recordPollingFailure(state: TaskSyncState): TaskSyncState {
  const consecutiveFailures = state.consecutiveFailures + 1;
  return { ...state, consecutiveFailures, stale: consecutiveFailures >= 3 };
}

export function recordPollingSuccess(state: TaskSyncState): TaskSyncState {
  return { ...state, consecutiveFailures: 0, stale: false };
}
