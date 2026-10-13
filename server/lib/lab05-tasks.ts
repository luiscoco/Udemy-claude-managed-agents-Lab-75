import { setTimeout as delay } from 'node:timers/promises';
import { taskLimits, toolShapes } from '../../shared/lab05-custom-tools.js';
import type { CustomCall, HandlerCalls, Task, ToolInput, ToolName } from '../../shared/lab05-custom-tools.js';
import { redact } from '../../src/lib/presentation.js';

/** Every run starts from the same two tasks, so runs are comparable and isolated. */
export const seedTasks: readonly Task[] = Object.freeze([
  { id: 'task_1', title: 'Read the Lab 05 guide', priority: 'normal', status: 'open' },
  { id: 'task_2', title: 'Provision the shared environment', priority: 'low', status: 'done' },
]);

/** A handler's own failure: the call was valid, but the operation cannot be done. */
export class ToolError extends Error {}

/** One run's tasks. Nothing is shared between runs; the registry hands each run its own store. */
export class TaskStore {
  private readonly tasks = new Map<string, Task>();
  private next: number;
  readonly handlerCalls: HandlerCalls = { list_tasks: 0, add_task: 0, complete_task: 0 };
  constructor(seed: readonly Task[] = seedTasks) {
    for (const task of seed) this.tasks.set(task.id, { ...task });
    this.next = seed.length + 1;
  }
  snapshot(): Task[] { return [...this.tasks.values()].map((task) => ({ ...task })); }
  list(status?: Task['status']) { return this.snapshot().filter((task) => !status || task.status === status); }
  add(title: string, priority: Task['priority']): Task {
    if (this.tasks.size >= taskLimits.maxTasks) throw new ToolError(`This exercise holds at most ${taskLimits.maxTasks} tasks; complete or reuse one instead.`);
    const clean = title.trim();
    const open = [...this.tasks.values()].find((task) => task.status === 'open' && task.title.toLowerCase() === clean.toLowerCase());
    if (open) throw new ToolError(`An open task titled "${open.title}" already exists as ${open.id}.`);
    const task: Task = { id: `task_${this.next++}`, title: clean, priority, status: 'open' };
    this.tasks.set(task.id, task);
    return { ...task };
  }
  complete(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new ToolError(`No task has the ID ${id}. Call list_tasks to see valid IDs; nothing was changed.`);
    if (task.status === 'done') throw new ToolError(`${id} is already done; nothing was changed.`);
    task.status = 'done';
    return { ...task };
  }
}

/**
 * Handlers receive input that has already passed the Zod shape. `commit` is the only place state changes:
 * it is called after any slow work, and only if the call has not been aborted (handler deadline or cancel).
 */
type Handler<N extends ToolName> = (input: ToolInput<N>, store: TaskStore) => unknown;
export const handlers: { [N in ToolName]: Handler<N> } = {
  list_tasks: (input, store) => ({ tasks: store.list(input.status) }),
  add_task: (input, store) => ({ task: store.add(input.title, input.priority ?? 'normal') }),
  complete_task: (input, store) => ({ task: store.complete(input.id) }),
};
const isToolName = (name: string): name is ToolName => Object.hasOwn(toolShapes, name);

export interface DispatchOptions {
  timeoutMs: number; signal: AbortSignal;
  /** Offline teaching aid: delays a handler before it commits, so the deadline can be observed. */
  slowTools?: Partial<Record<ToolName, number>> | undefined;
}
export type Dispatched = Omit<CustomCall, 'id' | 'name' | 'rawInput'>;

/**
 * Validates first, then runs one handler under a deadline. A rejected input never reaches a handler,
 * so handlerCalls and the task list stay exactly as they were.
 */
export async function dispatch(name: string, input: unknown, store: TaskStore, options: DispatchOptions): Promise<Dispatched> {
  const started = Date.now();
  const before = store.snapshot();
  const done = (outcome: Dispatched['outcome'], isError: boolean, text: string, extra: Partial<Dispatched> = {}): Dispatched => ({
    validation: { ok: true, issues: [] }, handlerRan: false, ...extra, outcome,
    result: { isError, text: redact(text).slice(0, 4000) }, before, after: store.snapshot(), durationMs: Date.now() - started });
  if (!isToolName(name)) return done('unknown-tool', true, `Unknown tool ${name.slice(0, 60)}. This agent has list_tasks, add_task and complete_task.`,
    { validation: { ok: false, issues: [{ path: 'name', message: 'Not a declared custom tool.' }] } });
  const parsed = toolShapes[name].safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 20).map((issue) => ({ path: issue.path.map(String).join('.') || 'input', message: issue.message.slice(0, 300) }));
    return done('rejected', true, `Invalid input for ${name}: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}. The handler did not run and nothing changed.`,
      { validation: { ok: false, issues } });
  }
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort('handler-deadline'), options.timeoutMs);
  const signal = AbortSignal.any([options.signal, timeout.signal]);
  try {
    store.handlerCalls[name]++;
    const slow = options.slowTools?.[name];
    if (slow) await delay(slow, undefined, { signal });
    signal.throwIfAborted();
    const value = (handlers[name] as Handler<typeof name>)(parsed.data as never, store);
    return done('ok', false, JSON.stringify(value), { handlerRan: true });
  } catch (error) {
    if (error instanceof ToolError) return done('tool-error', true, error.message, { handlerRan: true });
    if (timeout.signal.aborted && !options.signal.aborted)
      return done('timeout', true, `${name} exceeded the ${options.timeoutMs} ms host handler deadline; no change was saved.`, { handlerRan: true });
    throw error; // Run cancellation: the runner stops and sends nothing for this call.
  } finally { clearTimeout(timer); }
}

/** Per-run stores, bounded. A finished run stays readable through GET /tasks until newer runs push it out. */
export class TaskStoreRegistry {
  private readonly stores = new Map<string, { store: TaskStore; active: boolean }>();
  constructor(private readonly maxRuns = 16) {}
  open(runId: string): TaskStore {
    if (this.stores.has(runId)) throw new Error('Run already has a task store.');
    for (const [id, entry] of this.stores) {
      if (this.stores.size < this.maxRuns) break;
      if (!entry.active) this.stores.delete(id);
    }
    const store = new TaskStore();
    this.stores.set(runId, { store, active: true });
    return store;
  }
  finish(runId: string) { const entry = this.stores.get(runId); if (entry) entry.active = false; }
  get(runId: string) { const entry = this.stores.get(runId); return entry ? { store: entry.store, active: entry.active } : undefined; }
  get size() { return this.stores.size; }
  activeCount() { return [...this.stores.values()].filter((entry) => entry.active).length; }
}
