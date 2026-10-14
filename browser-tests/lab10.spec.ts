import { expect,test } from '@playwright/test';
import { lab10SnapshotSchema } from '../shared/lab10-structured-interrupt';
async function open(page:import('@playwright/test').Page){await page.goto('/?lesson=10');await page.getByRole('tab',{name:'Run the exercise'}).click();}
test('report correction is bounded and invalid output never becomes verified',async({page})=>{
  await open(page);await expect(page.getByLabel('Application report schema',{exact:true})).toContainText('"additionalProperties": false');await page.getByLabel('Offline scenario').selectOption('corrected');await page.getByRole('button',{name:'Start offline report'}).click();
  const table=page.getByRole('region',{name:'Report verification'});await expect(table).toContainText('completed: verified');await expect(table).toContainText('Aurora Finch');await expect(table.getByText('Attempts',{exact:true}).locator('..').locator('dd')).toHaveText('2');
  await page.getByRole('button',{name:'Close idle session'}).click();await expect(page.getByLabel('Run evidence')).toContainText('State: closed');
  await page.getByLabel('Offline scenario').selectOption('exhausted');await page.getByRole('button',{name:'Start offline report'}).click();
  await expect(table).toContainText('failed: exhausted');await expect(table).toContainText('No verified report');await expect(table.getByText('Attempts',{exact:true}).locator('..').locator('dd')).toHaveText('2');
  await page.getByRole('button',{name:'Close idle session'}).click();
});

for(const width of [390,1280]) test(`long report is readable at ${width}px without a wide JSON table`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const report={project:'Aurora Finch Observation Notebook',summary:'A fictional field notebook app designed for reliable offline capture. Observers record sightings and synchronize them when connectivity returns. '.repeat(5).trim(),
    risks:Array.from({length:5},(_,i)=>`Risk ${i+1}: remote field work can cause synchronization conflicts and device storage pressure; durable local storage must preserve observations until a connection is available.`),
    nextSteps:Array.from({length:5},(_,i)=>`Step ${i+1}: implement offline capture with durable storage, accessible forms, idempotent synchronization and explicit conflict resolution.`)};
  const runId='ea68c0af-6e7b-41dc-83cc-4e9686f14cbc',turnId='2d7ff73b-1c37-4c9c-963c-d917be800ca3';
  const result=lab10SnapshotSchema.parse({runId,mode:'scripted',source:'authored-fixture',session:{source:'authored-fixture',id:'sesn_readability_fixture',status:'idle',agentId:'agent_fixture',agentVersion:1,environmentId:'env_fixture',budget:null,toolCount:0,mcpServerCount:0},
    state:'idle',turns:[{turnId,state:'completed',outcome:'verified',attempts:1,report,errors:[],text:JSON.stringify(report),reportedUsage:null}],queueDepth:0,interruption:'not-needed',cleanup:'not-needed',effectiveCapabilities:{tools:0,mcpServers:0,skills:0,multiagent:false},message:'Authored fixture report verified.'});
  await page.route('**/api/c10/structured',route=>route.fulfill({contentType:'text/event-stream',body:`id: 1\nevent: result\ndata: ${JSON.stringify(result)}\n\n`}));
  await open(page);await page.getByRole('button',{name:'Start offline report'}).click();
  const region=page.getByRole('region',{name:'Report verification'});await expect(region.getByRole('heading',{name:report.project})).toBeVisible();
  await expect(region.getByRole('heading',{name:'Risks',exact:true})).toBeVisible();await expect(region.getByRole('heading',{name:'Next steps',exact:true})).toBeVisible();
  await expect(region.locator('.validated-report ul li')).toHaveCount(5);await expect(region.locator('.validated-report ol li')).toHaveCount(5);
  await expect(page.getByText('A run is in progress.',{exact:true})).toHaveCount(0);await expect(page.getByText(/This session is retained/)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.validated-report p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(20);
  await region.getByText('View and copy validated JSON',{exact:true}).click();await expect(page.getByLabel('Validated JSON for turn 1',{exact:true})).toContainText('"project": "Aurora Finch Observation Notebook"');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/lab10-readable-${width}.png`,fullPage:true});
  await region.getByText('View and copy validated JSON',{exact:true}).click();
  await region.getByRole('heading',{name:report.project}).scrollIntoViewIfNeeded();
  await page.screenshot({path:`test-results/lab10-readable-viewport-${width}.png`});
});
test('interrupt preserves session identity for a later turn; Close ends future sends',async({page})=>{
  await open(page);await page.getByLabel('Offline scenario').selectOption('hang');await page.getByRole('button',{name:'Start offline report'}).click();
  await expect(page.getByRole('button',{name:'Interrupt and retain session'})).toBeEnabled();await page.getByRole('button',{name:'Interrupt and retain session'}).click();
  const evidence=page.getByLabel('Run evidence');await expect(evidence).toContainText('idle-confirmed');await expect(page.getByRole('region',{name:'Report verification'})).toContainText('interrupted');
  const session=(await evidence.textContent())!.match(/Session: (sesn_[^.]+)/)![1];
  await page.getByLabel('Offline scenario').selectOption('valid');await page.getByRole('button',{name:'Send another turn'}).click();
  await expect(page.getByRole('region',{name:'Report verification'})).toContainText('completed: verified');await expect(evidence).toContainText(session!);
  await page.getByRole('button',{name:'Close idle session'}).click();await expect(evidence).toContainText('State: closed');await expect(page.getByRole('button',{name:'Send another turn'})).toBeDisabled();
});
