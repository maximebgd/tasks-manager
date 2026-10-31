import assert from "node:assert/strict";
import test from "node:test";
import {
  createTaskSyncState,
  receiveTaskSnapshot,
  finishTaskMutation,
  recordPollingFailure,
  recordPollingSuccess,
} from "../../lib/tasks-sync.js";
import type { Task } from "../../lib/types.js";

const task = (id: string, deletedAt: string | null = null): Task => ({
  id,
  title: id,
  status: "todo",
  priority: "medium",
  dueDate: null,
  tagIds: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  deletedAt,
});

const snapshot = (active: Task[], trashed: Task[]) => ({ active, trashed });

test("replaces active and trashed tasks when no local mutation is pending", () => {
  const state = { ...createTaskSyncState(), active: [task("old")], trashed: [task("old-trash", "2025-01-02")] };
  const next = receiveTaskSnapshot(state, snapshot([task("fresh")], [task("fresh-trash", "2025-01-03")]));

  assert.deepEqual(next.active, [task("fresh")]);
  assert.deepEqual(next.trashed, [task("fresh-trash", "2025-01-03")]);
  assert.equal(next.deferredSnapshot, null);
});

test("keeps only the latest snapshot deferred while mutations are pending", () => {
  let state = { ...createTaskSyncState(), active: [task("local")], pendingMutations: 2 };
  state = receiveTaskSnapshot(state, snapshot([task("external-1")], []));
  state = receiveTaskSnapshot(state, snapshot([task("external-2")], [task("trash-2", "2025-01-03")]));

  assert.deepEqual(state.active, [task("local")]);
  assert.deepEqual(state.deferredSnapshot, snapshot([task("external-2")], [task("trash-2", "2025-01-03")]));
});

test("applies the deferred snapshot when the final mutation finishes", () => {
  let state = { ...createTaskSyncState(), active: [task("local")], pendingMutations: 1 };
  state = receiveTaskSnapshot(state, snapshot([task("external")], []));
  const result = finishTaskMutation(state);

  assert.equal(result.state.pendingMutations, 0);
  assert.deepEqual(result.state.active, [task("external")]);
  assert.equal(result.state.deferredSnapshot, null);
  assert.equal(result.snapshotApplied, true);
});

test("does not request a task replacement when a local mutation finishes without a remote snapshot", () => {
  const state = { ...createTaskSyncState(), active: [task("initial")], pendingMutations: 1 };
  const result = finishTaskMutation(state);

  assert.equal(result.state.pendingMutations, 0);
  assert.deepEqual(result.state.active, [task("initial")]);
  assert.equal(result.snapshotApplied, false);
});

test("preserves last good tasks through polling errors and becomes stale on the third", () => {
  let state = { ...createTaskSyncState(), active: [task("last-good")], trashed: [task("last-trash", "2025-01-02")] };
  state = recordPollingFailure(state);
  state = recordPollingFailure(state);
  assert.equal(state.stale, false);
  state = recordPollingFailure(state);

  assert.deepEqual(state.active, [task("last-good")]);
  assert.deepEqual(state.trashed, [task("last-trash", "2025-01-02")]);
  assert.equal(state.consecutiveFailures, 3);
  assert.equal(state.stale, true);
});

test("a successful poll clears stale and consecutive failure state", () => {
  let state = createTaskSyncState();
  state = recordPollingFailure(state);
  state = recordPollingFailure(state);
  state = recordPollingFailure(state);
  state = recordPollingSuccess(state);

  assert.equal(state.stale, false);
  assert.equal(state.consecutiveFailures, 0);
});
