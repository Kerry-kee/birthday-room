import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.getByRole('dialog',{name:'请横屏体验'}).waitFor();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'test-results/phone-rotate.png'});
 await page.setViewportSize({width:844,height:390});await page.getByRole('dialog',{name:'请横屏体验'}).waitFor({state:'detached'});await page.getByRole('button',{name:'走进小屋',exact:true}).tap();await page.waitForTimeout(350);
 const canvas=page.locator('canvas'),pose=async()=>JSON.parse(await canvas.getAttribute('data-pose'));
 assert(!await page.locator('.interaction-prompt kbd').count());assert(!/\bE\b/.test(await page.locator('.interaction-prompt').innerText()));
 const before=await pose(),button=await page.getByRole('button',{name:'右移',exact:true}).boundingBox(),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:button.x+20,y:button.y+20}]});await page.waitForTimeout(400);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);const moved=await pose();assert(Math.hypot(moved.x-before.x,moved.z-before.z)>.15);
 await page.setViewportSize({width:390,height:844});await page.getByRole('dialog',{name:'请横屏体验'}).waitFor();await page.waitForTimeout(250);const paused=await pose();assert(paused.paused);await page.keyboard.down('w');await page.waitForTimeout(350);await page.keyboard.up('w');const still=await pose();assert(Math.hypot(still.x-paused.x,still.z-paused.z)<.001);
 await page.setViewportSize({width:844,height:390});await page.getByRole('dialog',{name:'请横屏体验'}).waitFor({state:'detached'});await page.waitForTimeout(250);assert(!(await pose()).paused);await page.screenshot({path:'test-results/phone-landscape.png'});
 const prompt=await page.locator('.interaction-prompt').boundingBox(),pad=await page.locator('.touch-controls').boundingBox(),bar=await page.locator('.fps-toolbar').boundingBox(),action=await page.locator('.touch-interact').boundingBox();assert(prompt.y+prompt.height<pad.y);assert(pad.x+pad.width<bar.x&&bar.x+bar.width<action.x);assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:667,height:375});await page.waitForTimeout(200);const smallPad=await page.locator('.touch-controls').boundingBox(),smallBar=await page.locator('.fps-toolbar').boundingBox(),smallAction=await page.locator('.touch-interact').boundingBox();assert(smallPad.x+smallPad.width<smallBar.x&&smallBar.x+smallBar.width<smallAction.x);await page.screenshot({path:'test-results/phone-landscape-small.png'});
 assert.deepEqual(errors,[]);console.log('PASS: portrait rotation notice, landscape touch movement, rotation pauses/resumes at same position, no E prompt, 844x390 and 667x375 controls do not overlap.');
}finally{await browser.close();}
