import { content } from './learning-content.js';
import { lessonKnowledgeCheck } from './learning-quizzes.js';
import type { LessonInfographic, InfographicRegion } from './learning-infographics.js';
import { measuredInfographicPanels } from './infographic-panel-bounds.js';

const poses = [
  'Floating sideways while turning a holographic control dial',
  'Standing with one boot on a platform and pointing at a diagram',
  'Kneeling while examining a holographic document with a magnifier',
  'Leaning backward in zero gravity while holding two linked modules',
  'Sitting cross-legged in zero gravity and arranging labeled cards',
  'Crouching while placing a block into a queue',
  'Reaching upward to connect two suspended interface panels',
  'Standing with a clipboard and raising a gloved stop palm',
  'Seated at a console and pointing at the evidence screen',
  'Floating diagonally while guiding a glowing arrow between panels',
  'Bracing one knee while checking a shield-shaped control panel',
  'Turning over one shoulder to present a before-and-after comparison',
];
export function courseAstronautPose(lessonId: number, kind: string) {
  const index = (lessonId * 2 + (kind === 'lab' ? 1 : 0)) % poses.length;
  const turn = ['left shoulder forward, looking down at the prop', 'right shoulder forward, looking toward the viewer',
    'three-quarter side view, looking upward toward the diagram', 'front view with the working prop raised at shoulder level',
    'side view with one arm extended toward the evidence', 'tilted diagonal view with the prop held close to the chest',
    'backpack partly visible, turning the helmet toward the viewer', 'low reaching posture with the prop at knee level',
    'upright posture with the prop held above the waist', 'relaxed diagonal posture with elbows spread',
    'focused side posture with one glove pointing to a label', 'three-quarter view with the prop beside the helmet',
    'dynamic forward lean with the prop held in both hands'][Math.floor((lessonId - 1) / 6)]!;
  return `${poses[index]}, ${turn}. The prop illustrates ${titles[lessonId]}. ${kind === 'lab' ? 'Show the astronaut actively carrying out the learner workflow.' : 'Show the astronaut presenting the core concept.'} Vary the body angle, arm positions and topic-specific prop from every other poster; preserve the white suit and blue visor design.`;
}

type Card = [string, string, string, InfographicRegion['target'], string];
export function courseInfographics(): LessonInfographic[] {
  return Object.keys(titles).map(Number).filter(id => ![1, 12, 65].includes(id)).flatMap(lessonId => {
    const lesson = content[lessonId]!, quiz = lessonKnowledgeCheck(lessonId);
    const correct = quiz.choices[quiz.correctIndex]!;
    const schema = lesson.inspect.find(path => /^shared\/.*\.ts$/.test(path))!;
    const handler = lesson.inspect.find(path => /^server\/.*\.ts$/.test(path))!;
    if (!schema || !handler) throw new Error(`Missing infographic teaching sources: ${lessonId}`);
    const evidence = `${correct} ${quiz.explanation}`;
    const concepts: Card[] = [
      ['The objective', lesson.objective, lesson.objective, 'goal', schema],
      ['Core rule', correct, `${quiz.question} ${correct}`, 'source', schema],
      ['Keep the boundary clear', quiz.explanation, quiz.explanation, 'evidence', handler],
      ['How the flow works', lesson.steps[0]!, `${lesson.steps[0]} ${lesson.steps[1] ?? ''}`, 'example', handler],
      ['Evidence to inspect', correct, `${evidence} Inspect the reported outcome and the host evidence before drawing a conclusion.`, 'evidence', handler],
      ['Put it to the test', lesson.challenge, `${lesson.challenge} Record what your evidence establishes and what remains unverified.`, 'practice', schema],
    ];
    const titlesForSteps = ['Prepare the baseline', 'Run the comparison', 'Inspect the boundary', 'Follow the workflow'];
    const steps = [...lesson.steps];
    const walkthrough: Card[] = Array.from({ length: 4 }, (_, index) => {
      const step = steps[index] ?? (index === 3 ? lesson.challenge : quiz.explanation);
      return [titlesForSteps[index]!, step, step, index === 0 ? 'preparation' : index === 2 ? 'evidence' : 'controls', handler];
    });
    walkthrough.push(['Verify the result', correct, `${evidence} Compare the result with your baseline.`, 'evidence', handler],
      ['Reflect and record', lesson.challenge, `${lesson.challenge} Save the observed result and its limitations in your notebook. A saved note is self-assessment, not proof of a new live run.`, 'practice', schema]);
    return (['concepts', 'lab'] as const).map(kind => ({ lessonId, kind,
      title: `${titles[lessonId]}${kind === 'lab' ? ': guided experiment' : ''}`,
      regions: (kind === 'concepts' ? concepts : walkthrough).map(([title, summary, narration, target, source], index) => ({
        id: `${kind}-region-${index + 1}`, title, summary, narration, target, source,
        box: [{ x: 1.4, y: 23, width: 37.2, height: 33.5 }, { x: 39, y: 23, width: 27.8, height: 33.5 },
          { x: 67.4, y: 23, width: 31.2, height: 33.5 }, { x: 1.4, y: 57.3, width: 57.6, height: 28.3 },
          { x: 59.6, y: 57.3, width: 39, height: 28.3 }, { x: 1.4, y: 86.4, width: 97.2, height: 9.5 }][index]!,
      })),
    })).map(visual => {
      const measured = measuredInfographicPanels[`${lessonId}:${visual.kind}`];
      if (measured) visual.regions.forEach((region, index) => {
        const [x, y, width, height] = measured.panels[index]!;
        region.box = { x: x / measured.width * 100, y: y / measured.height * 100,
          width: width / measured.width * 100, height: height / measured.height * 100 };
      });
      return visual;
    });
  });
}

// Lesson titles and explanations come from the implemented course contracts.
const titles: Record<number, string> = {
  "1": "Session event streaming",
  "2": "Session options",
  "3": "Built-in tools",
  "4": "Permissions",
  "5": "Custom tools",
  "6": "Sessions and retained context",
  "7": "Tool policy and execution audit",
  "8": "Delegation and session threads",
  "9": "System instructions and explicit context",
  "10": "Validated reports and interruption",
  "11": "Managed skills and progressive loading",
  "12": "Multiple messages in one session",
  "13": "MCP connections and reachability",
  "14": "Models and supported effort",
  "15": "Usage and session budgets",
  "16": "Environment and configuration provenance",
  "17": "Host snapshots and file restoration",
  "18": "Cloud sandbox and host boundaries",
  "19": "Session inventory and explicit branches",
  "20": "Lifecycle events and host interceptors",
  "21": "Host commands and prompt expansion",
  "22": "Explicit project context and memory",
  "23": "Reusable capability bundles",
  "24": "Who owns the agent loop",
  "25": "Context growth and compaction evidence",
  "26": "Session controls and supported updates",
  "27": "Remote work beyond a browser connection",
  "28": "Errors, retries and reconciliation",
  "29": "Images, documents and mounted files",
  "30": "Host task board and completion gates",
  "31": "Host questions and correlated answers",
  "32": "Plan review and execution gate",
  "33": "Human forms during tool work",
  "34": "Output instruction variants",
  "35": "Event mirrors and conversation indexes",
  "36": "Remote transport and host runners",
  "37": "External policy decision service",
  "38": "Application follow up suggestions",
  "39": "Trusted configuration and untrusted checkouts",
  "40": "Safe recovery boundaries",
  "41": "Managed session lifecycle comparison",
  "42": "Bounded web research and citations",
  "43": "MCP resources through a host bridge",
  "44": "Host telemetry and provider event traces",
  "45": "Provider availability and configuration",
  "46": "Observed cache usage and cost",
  "47": "Model driven and host driven orchestration",
  "48": "Security hardening",
  "49": "Headless host and CI outcomes",
  "50": "Full stack capstone",
  "51": "Testing the Managed host offline",
  "52": "Evals, judges and regression baselines",
  "53": "Debugging session and host traces",
  "54": "Designing tools the model uses well",
  "55": "Official SDK and API upgrades",
  "56": "Teams and evidence messages",
  "57": "Workers in host Git worktrees",
  "58": "Tool catalogs and bounded discovery",
  "59": "Routing with verified outcomes",
  "60": "Durable long running agents",
  "61": "Exposing an agent as an MCP server",
  "62": "Retrieval RAG through custom tools",
  "63": "A safe database agent",
  "64": "Browser tools across host and cloud",
  "65": "Human approval over Slack, Teams or email",
  "66": "Real-time frontends over WebSocket",
  "67": "A multi-tenant SaaS architecture",
  "68": "Scheduled and event-driven agents",
  "69": "Desktop and IDE host integration",
  "70": "Python client for Managed Agents",
  "71": "A data analysis agent",
  "72": "Document generation with Skills",
  "73": "An autonomous PR reviewer and fixer",
  "74": "Prompt injection red teaming",
  "75": "Capstone 2 an autonomous engineering team"
};
