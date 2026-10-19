import { writeFile, rename } from 'node:fs/promises';
import { allLessonInfographics, infographicLessons } from '../shared/learning-infographics.js';
import { measuredInfographicPanels } from '../shared/infographic-panel-bounds.js';
import { auditInfographicAssets } from './audit-infographic-assets.js';

const args = process.argv.slice(2);
if (args.length !== 1 || !/^--lessons=\d+(?:,\d+)*$/.test(args[0]!)) throw new Error('Explicit reviewed lesson IDs required.');
const selected = args[0]!.slice(10).split(',').map(Number);
if (selected.some(id => id < 1 || id > 75)) throw new Error('Invalid lesson ID.');
for (const id of selected) if (![1, 12, 65].includes(id) && ['concepts', 'lab'].some(kind => !measuredInfographicPanels[`${id}:${kind}`])) throw new Error(`Review both image region maps first: ${id}`);
const published = [...new Set([...infographicLessons, ...selected])].sort((a, b) => a - b);
const visuals = allLessonInfographics.filter(item => published.includes(item.lessonId));
if (visuals.length !== published.length * 2) throw new Error('Incomplete lesson pair.');
const result = await auditInfographicAssets(undefined, visuals);
await writeFile('shared/infographic-published.authoring.tmp', '// Publish a lesson only after both images, recordings and measured regions pass review.\nexport const publishedInfographicLessons: readonly number[] = ' + JSON.stringify(published) + ';\n');
await rename('shared/infographic-published.authoring.tmp', 'shared/infographic-published.ts');
console.log(JSON.stringify({ publishedLessons: published, ...result }));
