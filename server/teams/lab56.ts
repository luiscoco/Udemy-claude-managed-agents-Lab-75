import { lab56ResultSchema, lab56ScenarioSchema } from '../../shared/lab56-agent-teams.js';
import type { z } from 'zod';

type Role = 'researcher' | 'reviewer';
type TaskId = 'research' | 'review';
type Scenario = z.infer<typeof lab56ScenarioSchema>;
export type TeamAction =
  | { type: 'claim'; actor: Role; task: TaskId }
  | { type: 'complete'; actor: Role; task: TaskId; answer: number }
  | { type: 'send'; id: string; from: Role; to: Role; evidence: string }
  | { type: 'deliver'; id: string }
  | { type: 'ack'; id: string; actor: Role }
  | { type: 'shutdown' };
export type TeamState = { tasks: { id: TaskId; owner: Role | null; state: 'blocked' | 'available' | 'claimed' | 'done' }[];
  messages: { id: string; from: Role; to: Role; status: 'queued' | 'delivered' | 'acknowledged'; evidence: string }[];
  researchAnswer: number | null; verifiedAnswer: number | null; shutdown: boolean };
export const initialTeamState = (): TeamState => ({ tasks: [
  { id: 'research', owner: null, state: 'available' }, { id: 'review', owner: null, state: 'blocked' }],
  messages: [], researchAnswer: null, verifiedAnswer: null, shutdown: false });
export function reduceTeam(previous: TeamState, action: TeamAction) {
  const state = structuredClone(previous);
  const reject = (reason: string) => ({ state: previous, accepted: false, reason, effect: 'No state change.' });
  if (state.shutdown) return reject('Team already shut down.');
  if (action.type === 'claim') {
    const task = state.tasks.find(item => item.id === action.task)!;
    if (task.id === 'research' && action.actor !== 'researcher' || task.id === 'review' && action.actor !== 'reviewer')
      return reject('Actor is not authorized for this role.');
    if (task.state !== 'available') return reject(task.state === 'blocked' ? 'Review dependency is blocked.' :
      'Task is already claimed or complete.');
    task.state = 'claimed'; task.owner = action.actor;
    return { state, accepted: true, reason: 'Task claimed.', effect: `${task.id} owned by ${action.actor}.` };
  }
  if (action.type === 'complete') {
    const task = state.tasks.find(item => item.id === action.task)!;
    if (task.state !== 'claimed' || task.owner !== action.actor) return reject('Only the current task owner may complete it.');
    if (action.answer !== 12 + 18 + 7) return reject(`Host arithmetic rejected ${action.answer}; expected 37.`);
    if (action.task === 'review') {
      if (!state.messages.some(message => message.to === 'reviewer' && message.status === 'acknowledged' &&
        message.evidence === '12+18+7=37')) return reject('Acknowledged evidence is required for review completion.');
      state.verifiedAnswer = 37;
    } else state.researchAnswer = 37;
    task.state = 'done'; return { state, accepted: true, reason: 'Host checked 12 + 18 + 7 = 37.',
      effect: `${task.id} completed with checked answer 37.` };
  }
  if (action.type === 'send') {
    if (!/^env_[a-z0-9_-]{1,32}$/.test(action.id)) return reject('Invalid stable envelope ID.');
    if (action.from !== 'researcher' || action.to !== 'reviewer' ||
      state.tasks[0]?.state !== 'done') return reject('Only the completed researcher may send review evidence.');
    if (action.evidence !== '12+18+7=37') return reject('Envelope evidence failed host arithmetic.');
    const existing = state.messages.find(message => message.id === action.id);
    if (existing) { if (existing.from !== action.from || existing.to !== action.to || existing.evidence !== action.evidence)
      return reject('Conflicting duplicate envelope ID.');
      return { state: previous, accepted: true, reason: 'Identical envelope replay ignored.', effect: 'No duplicate delivery or task completion.' }; }
    if (state.messages.length >= 8) return reject('Message capacity reached.');
    state.messages.push({ id: action.id, from: action.from, to: action.to, evidence: action.evidence, status: 'queued' });
    return { state, accepted: true, reason: 'Envelope queued.', effect: 'Delivery and acknowledgment remain pending.' };
  }
  if (action.type === 'deliver') {
    const message = state.messages.find(item => item.id === action.id); if (!message) return reject('Unknown envelope.');
    if (message.status !== 'queued') return reject('Envelope was already delivered.');
    message.status = 'delivered'; return { state, accepted: true, reason: 'Envelope delivered.',
      effect: 'No task completed by delivery alone.' };
  }
  if (action.type === 'ack') {
    const message = state.messages.find(item => item.id === action.id); if (!message) return reject('Unknown envelope.');
    if (message.to !== action.actor) return reject('Only the addressed role may acknowledge.');
    if (message.status !== 'delivered') return reject('Acknowledgment requires delivery first.');
    message.status = 'acknowledged'; state.tasks[1]!.state = 'available';
    return { state, accepted: true, reason: 'Evidence acknowledged.', effect: 'Review dependency is now available; not complete.' };
  }
  if (state.tasks.some(task => task.state !== 'done') || state.messages.some(message => message.status !== 'acknowledged'))
    return reject('Busy team cannot shut down until tasks and messages finish.');
  state.shutdown = true; return { state, accepted: true, reason: 'Clean shutdown.', effect: 'All checked work and acknowledgments complete.' };
}
const claim = (actor: Role, task: TaskId): TeamAction => ({ type: 'claim', actor, task });
const complete = (actor: Role, task: TaskId, answer: number): TeamAction => ({ type: 'complete', actor, task, answer });
const send: TeamAction = { type: 'send', id: 'env_research_37', from: 'researcher', to: 'reviewer', evidence: '12+18+7=37' };
const deliver: TeamAction = { type: 'deliver', id: 'env_research_37' };
const ack: TeamAction = { type: 'ack', id: 'env_research_37', actor: 'reviewer' };
const full: TeamAction[] = [claim('researcher', 'research'), complete('researcher', 'research', 37), send, deliver,
  ack, claim('reviewer', 'review'), complete('reviewer', 'review', 37)];
export function replayTeam(scenario: Scenario) {
  const actions: Record<Scenario, TeamAction[]> = {
    'blocked-review': [claim('reviewer', 'review')],
    'competing-claim': [claim('researcher', 'research'), claim('reviewer', 'research')],
    'busy-shutdown': [claim('researcher', 'research'), { type: 'shutdown' }],
    'duplicate-envelope': [claim('researcher', 'research'), complete('researcher', 'research', 37), send, send],
    'ack-before-delivery': [claim('researcher', 'research'), complete('researcher', 'research', 37), send, ack],
    'rejected-30': [claim('researcher', 'research'), complete('researcher', 'research', 30)],
    'verified-37': full,
    'clean-shutdown': [...full, { type: 'shutdown' }],
  };
  let state = initialTeamState(); const timeline: z.infer<typeof lab56ResultSchema>['timeline'] = [];
  for (const [index, action] of actions[scenario].entries()) {
    if (index >= 24) throw new Error('Replay action bound exceeded.');
    const step = reduceTeam(state, action); state = step.state;
    timeline.push({ step: index + 1, action: action.type, accepted: step.accepted,
      reason: step.reason, effect: step.effect }); }
  return lab56ResultSchema.parse({ source: 'offline-team-reducer', scenario, timeline,
    tasks: state.tasks, messages: state.messages, verifiedAnswer: state.verifiedAnswer,
    shutdown: state.shutdown, providerCalls: 0,
    note: 'Application-owned reducer. Delivery is not completion; no Claude Code mailbox or native delegation call.' });
}
