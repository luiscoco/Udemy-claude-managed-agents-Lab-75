import {test,expect} from '@playwright/test';

test('course milestone cards offer all three Managed apps, build prompts and source-only downloads',async({page,request})=>{
  await page.goto('/#course-learning-milestones');
  await expect(page.getByRole('heading',{name:'Three guided milestone apps',exact:true})).toBeVisible();
  const cards=page.locator('.mini-project-card');await expect(cards).toHaveCount(3);
  for(const [index,id] of ['study-coach','agent-evaluation-studio','agent-publishing-studio'].entries()){
    const card=cards.nth(index);await card.locator('summary').first().click();
    await expect(card.locator('.mini-project-stage')).toHaveCount(id==='study-coach'?11:id==='agent-evaluation-studio'?7:8);
    const zip=await request.get(`/api/projects/${id}/starter.zip`);expect(zip.ok()).toBe(true);
    expect((await zip.body()).subarray(0,4).toString('hex')).toBe('504b0304');
  }
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});

test('course launch and stop controls open a prepared Study Coach conversation',async({page,context,request})=>{
  test.setTimeout(90000);
  await page.goto('/#course-learning-milestones');
  const card=page.locator('.mini-project-card').filter({has:page.getByRole('heading',{name:'Study Coach',exact:true})});
  try{
    await card.getByRole('button',{name:'Start Study Coach',exact:true}).click();
    const open=card.getByRole('link',{name:'Open Study Coach',exact:true});await expect(open).toBeVisible({timeout:40000});
    const opened=context.waitForEvent('page');await open.click();const coach=await opened;await coach.waitForLoadState();
    await expect(coach.getByRole('heading',{name:'Study Coach',exact:true})).toBeVisible();await expect(coach.locator('#mode')).toHaveValue('prepared');
    await coach.getByRole('button',{name:'Explain step by step',exact:true}).click();
    await coach.getByRole('button',{name:'Start practice conversation',exact:true}).click();
    await coach.getByRole('button',{name:'Show practice reply',exact:true}).click();
    await expect(coach.locator('.turn')).toContainText('authored practice explanation');
    await expect(coach.locator('.turn pre')).toBeVisible();await coach.close();
    // Shutdown waits for owned child processes; assert the UI after it completes.
    const stopped=page.waitForResponse(response=>response.url().endsWith('/api/projects/study-coach/stop')&&response.request().method()==='POST');
    await card.getByRole('button',{name:'Stop Study Coach',exact:true}).click();
    expect((await stopped).ok()).toBe(true);
    await expect(card).toContainText('Status: stopped');
  }finally{await request.post('/api/projects/study-coach/stop',{data:{}});}
});

test('evaluation and publishing launch in prepared mode and fit a narrow screen',async({page,request})=>{
  test.setTimeout(120000);
  for(const [id,title] of [['agent-evaluation-studio','Agent Evaluation Studio'],['agent-publishing-studio','Agent Publishing Studio']]){
    const started=await request.post(`/api/projects/${id}/start`,{data:{mode:'learner'}});expect(started.ok()).toBe(true);
    const project=await started.json();
    try{
      const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
      await page.setViewportSize({width:390,height:844});await page.goto(project.url);
      await expect(page.locator('.brand')).toContainText(title!);await expect(page.locator('#run-mode')).toHaveValue('prepared');
      if(id==='agent-evaluation-studio'){
        await page.getByRole('button',{name:/Run prepared case/}).click();await expect(page.locator('.result-subtype')).toContainText('prepared_success');
      }else{
        await page.locator('#prompt').fill('Explain Managed Agents sessions with code');
        await page.getByRole('button',{name:/Try prepared answer/}).click();await expect(page.locator('.answer-body pre')).toContainText('beta.sessions.create');
      }
      expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
    }finally{await request.post(`/api/projects/${id}/stop`,{data:{}});}
  }
});
