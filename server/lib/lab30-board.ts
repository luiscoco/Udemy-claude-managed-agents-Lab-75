import { randomUUID } from 'node:crypto';
import { lab30ResultSchema, lab30ToolShapes } from '../../shared/lab30-todo-tracking.js';
import type { Lab30Call, Lab30Replace, Lab30Run } from '../../shared/lab30-todo-tracking.js';

export class Lab30Error extends Error { constructor(public statusCode: number, message: string) { super(message); } }
type Task = { id: string; title: string; status: 'open' | 'done'; dependsOn: string[]; version: number; evidence: string | null };
type Result = { eventId: string; name: string; isError: boolean; text: string; effectApplied: boolean };
type Board = { id: string; owner: string; version: number; tasks: Task[]; results: Result[]; seen: Map<string, { fingerprint: string; result: Result }>; claim: string | null; expires: number };
const evidenceFor = (task: Task) => task.title.toLowerCase().includes('review') ? 'review-approved' :
  task.title.toLowerCase().includes('publish') ? 'published-link' : 'draft-checked';
export class Lab30BoardManager {
  private boards = new Map<string, Board>(); private closed = false;
  constructor(private now = () => Date.now()) {}
  private get(owner: string, id: string) { const board = this.boards.get(id);
    if (!board || board.owner !== owner || this.now() > board.expires) throw new Lab30Error(404, 'Unknown or expired owned task board.'); return board; }
  private view(board: Board) { return lab30ResultSchema.parse({ boardId: board.id, source: 'authored-fixture', boardVersion: board.version,
    tasks: board.tasks, results: board.results, providerCalls: 0, agentClaim: board.claim,
    note: 'Host state decides completion. Agent claims and tool-call text cannot bypass dependency or evidence gates.' }); }
  private create(owner: string) { if (this.closed || this.boards.size >= 20 || [...this.boards.values()].filter(b => b.owner === owner).length >= 6)
    throw new Lab30Error(429, 'Task-board capacity reached.');
    const board: Board = { id: randomUUID(), owner, version: 1, tasks: [], results: [], seen: new Map(), claim: null, expires: this.now() + 300_000 };
    this.boards.set(board.id, board); return board; }
  private execute(board: Board, eventId: string, name: string, rawInput: unknown, handler: () => string): Result {
    const fingerprint = JSON.stringify({ name, rawInput }), prior = board.seen.get(eventId);
    if (prior) { if (prior.fingerprint !== fingerprint) throw new Lab30Error(409, 'Event ID was reused with conflicting input.'); return prior.result; }
    let result: Result;
    try { const text = handler(); result = { eventId, name, isError: false, text, effectApplied: ['create_task', 'update_task', 'replace_plan'].includes(name) }; }
    catch (error) { result = { eventId, name, isError: true, text: error instanceof Error ? error.message : 'Tool rejected.', effectApplied: false }; }
    board.seen.set(eventId, { fingerprint, result }); board.results.push(result); return result;
  }
  call(owner: string, input: Lab30Call) { const board = this.get(owner, input.boardId);
    const result = this.execute(board, input.eventId, input.name, input.input, () => {
      const parsed = lab30ToolShapes[input.name].safeParse(input.input); if (!parsed.success) throw new Error('Closed tool input validation failed.');
      if (input.name === 'list_tasks') return JSON.stringify(board.tasks);
      if (input.name === 'get_task') { const id = (parsed.data as { id: string }).id;
        const task = board.tasks.find(task => task.id === id); if (!task) throw new Error('Unknown task ID.'); return JSON.stringify(task); }
      if (input.name === 'create_task') { const data = parsed.data as { title: string; dependsOn: string[] };
        if (board.tasks.length >= 8 || data.dependsOn.some(id => !board.tasks.some(task => task.id === id))) throw new Error('Dependency is unknown or task capacity reached.');
        const task: Task = { id: `task_${board.tasks.length + 1}`, title: data.title, status: 'open', dependsOn: [...new Set(data.dependsOn)], version: 1, evidence: null };
        board.tasks.push(task); board.version++; return JSON.stringify(task); }
      const data = parsed.data as { id: string; expectedVersion: number; action: 'rename' | 'complete'; title?: string; evidence?: string };
      const task = board.tasks.find(task => task.id === data.id); if (!task) throw new Error('Unknown task ID.');
      if (task.version !== data.expectedVersion) throw new Error('Conflicting task version.');
      if (task.status === 'done') throw new Error('Completed task cannot be changed.');
      if (data.action === 'rename') { if (!data.title) throw new Error('Rename needs a title.'); task.title = data.title; }
      else { if (task.dependsOn.some(id => board.tasks.find(item => item.id === id)?.status !== 'done')) throw new Error('Dependencies are incomplete.');
        if (data.evidence !== evidenceFor(task)) throw new Error(`Completion needs checked evidence: ${evidenceFor(task)}.`);
        task.status = 'done'; task.evidence = data.evidence; }
      task.version++; board.version++; return JSON.stringify(task);
    }); return { ...this.view(board), latest: result }; }
  replace(owner: string, input: Lab30Replace) { const board = this.get(owner, input.boardId);
    const result = this.execute(board, input.eventId, input.operation, input, () => {
      if (board.version !== input.expectedBoardVersion) throw new Error('Conflicting board version.');
      if (board.tasks.some(task => task.status === 'done')) throw new Error('Completed work cannot be erased by plan replacement.');
      if (input.tasks.some((task, index) => task.dependsOn.some(dep => dep >= index))) throw new Error('Plan dependencies must refer to earlier tasks.');
      board.tasks = input.tasks.map((task, index) => ({ id: `task_${index + 1}`, title: task.title, status: 'open' as const,
        dependsOn: task.dependsOn.map(dep => `task_${dep + 1}`), version: 1, evidence: null }));
      board.version++; return 'Explicit host plan replacement accepted.';
    }); return { ...this.view(board), latest: result }; }
  run(owner: string, input: Lab30Run) { if (input.mode !== 'scripted') throw new Lab30Error(422, 'Live custom-tool board requires a separately configured dedicated agent.');
    const board = this.create(owner); const invoke = (eventId: string, name: Lab30Call['name'], data: Record<string, unknown>) =>
      this.call(owner, { boardId: board.id, eventId: `sevt_${eventId}`, name, input: data });
    invoke('create1', 'create_task', { title: 'Draft field note', dependsOn: [] });
    invoke('create2', 'create_task', { title: 'Review field note', dependsOn: ['task_1'] });
    invoke('create3', 'create_task', { title: 'Publish field note', dependsOn: ['task_2'] });
    board.claim = 'The agent claims the three-step plan is complete.';
    if (input.scenario === 'blocked-review') invoke('blocked', 'update_task', { id: 'task_2', expectedVersion: 1, action: 'complete', evidence: 'review-approved' });
    if (input.scenario === 'refused-completion') invoke('refused', 'update_task', { id: 'task_3', expectedVersion: 1, action: 'complete', evidence: 'published-link' });
    if (input.scenario === 'validated-completion') {
      invoke('draftdone', 'update_task', { id: 'task_1', expectedVersion: 1, action: 'complete', evidence: 'draft-checked' });
      invoke('reviewdone', 'update_task', { id: 'task_2', expectedVersion: 1, action: 'complete', evidence: 'review-approved' });
      invoke('publishdone', 'update_task', { id: 'task_3', expectedVersion: 1, action: 'complete', evidence: 'published-link' });
    }
    if (input.scenario === 'invalid-plan-replacement') this.replace(owner, { boardId: board.id, eventId: 'host_invalid', operation: 'replace_plan',
      expectedBoardVersion: board.version, tasks: [{ title: 'Invalid future dependency', dependsOn: [1] }, { title: 'Second', dependsOn: [] }] });
    return this.view(board);
  }
  close() { this.closed = true; this.boards.clear(); }
}
