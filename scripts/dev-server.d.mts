import type { ChildProcess } from 'node:child_process';
export function sourceFingerprint(root: string): Promise<string>;
export function childEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export function stopChild(child: ChildProcess | undefined): Promise<void>;
export function supervise(options: {
  root: string;
  pollMs?: number;
  startChild: () => ChildProcess;
  log?: (message: string) => void;
}): Promise<{ close(): Promise<void> }>;
