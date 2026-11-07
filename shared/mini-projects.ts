export const miniProjects = [
  { id: 'study-coach', title: 'Study Coach', frontend: 5191, backend: 5291, prerequisite: 1, stages: 'M01–M07',
    summary: 'Explore 127 learning topics in 17 sections, ask guided questions, and build a conversational study plan.' },
  { id: 'agent-evaluation-studio', title: 'Agent Evaluation Studio', frontend: 5192, backend: 5292, prerequisite: 15, stages: 'M08–M14',
    summary: 'Work through 170 evaluation cases, compare instructions, inspect run evidence, and review criteria.' },
  { id: 'agent-publishing-studio', title: 'Agent Publishing Studio', frontend: 5193, backend: 5293, prerequisite: 72, stages: 'M15–M22',
    summary: 'Follow 173 prompts and turn selected answers into Word, PDF, SVG, and PNG files with optional image references.' },
] as const;
export type MiniProjectId = typeof miniProjects[number]['id'];
export type MiniProjectStatus = Omit<typeof miniProjects[number], 'frontend' | 'backend'> & {
  frontend: number; backend: number;
  status: 'stopped' | 'starting' | 'running'; mode: 'learner' | 'reference' | null;
  url: string | null; notice: string | null; dependenciesReady: boolean;
};
