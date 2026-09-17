import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { canStand, movePlayer, SPAWN } from '../src/walking.js';

await import('./check-puzzles.mjs');

const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 await mkdir('test-results',{recursive:true});
 await page.goto('http://127.0.0.1:5173/');
 const canvas=page.locator('canvas');await canvas.waitFor();await page.waitForTimeout(1000);
 await page.screenshot({path:'test-results/first-person-entry.png'});
 await page.getByRole('button',{name:'走进小屋',exact:true}).click();
 await page.waitForTimeout(400);
 await page.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();});
 await page.waitForTimeout(250);
 const pose=async()=>JSON.parse(await canvas.getAttribute('data-pose'));
 async function look(yaw,pitch=-.04){
   const current=await pose();let difference=yaw-current.yaw;
   difference=Math.atan2(Math.sin(difference),Math.cos(difference));
   let dx=-difference/.0025,dy=-(pitch-current.pitch)/.0025;
   const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/230));
   for(let i=0;i<steps;i++){
     if(Math.hypot(dx,dy)<2)break;
     await page.mouse.move(850,410);await page.mouse.down();
     await page.mouse.move(850+dx/steps,410+dy/steps,{steps:2});await page.mouse.up();
   }
   await page.waitForTimeout(140);
 }
 async function walk(x,z){
   for(let i=0;i<45;i++){
     const p=await pose(),dist=Math.hypot(x-p.x,z-p.z);if(dist<.12)return;
     await look(Math.atan2(p.x-x,p.z-z));await canvas.focus();
     await page.keyboard.down('w');await page.waitForTimeout(Math.min(450,dist/1.65*1000));await page.keyboard.up('w');await page.waitForTimeout(140);
   }
   throw new Error(`Failed to reach ${x},${z}; actual ${JSON.stringify(await pose())}`);
 }
 async function aim(x,y,z){const p=await pose();await look(Math.atan2(p.x-x,p.z-z),Math.atan2(y-SPAWN.y,Math.hypot(x-p.x,z-p.z)));}
 async function openGift(id){await page.locator(`[data-gift="${id}"]`).click();await page.getByRole('button',{name:'拆开礼物'}).click();await page.getByRole('button',{name:'收好这份心意'}).click();await page.waitForTimeout(150);}
 async function collect(){await page.getByRole('button',{name:'看看里面的礼物'}).click();await page.getByRole('button',{name:'拆开礼物'}).click();await page.getByRole('button',{name:'收好这份心意'}).click();await page.waitForTimeout(150);}
 await walk(2.8,3.5);await aim(2.94,1.96,4.53);await page.locator('[data-object="wateringCan"]').click();await page.getByRole('button',{name:'拿起水壶'}).click();
 await walk(2.8,.3);await aim(4.28,1.61,-.95);await page.locator('[data-object="postcard"]').click();await page.getByText('把一天排成一列',{exact:true}).waitFor();await page.keyboard.press('Escape');
 await walk(2.4,-2.95);await walk(4.6,-3.3);await aim(5.84,2.72,-3.05);await page.locator('[data-object="clock"]').click();await page.getByText('4 : 20',{exact:true}).waitFor();await page.keyboard.press('Escape');
 await aim(4.6,1.88,-4.24);await page.locator('[data-gift="books"]').click();
 for(const label of ['晚霞粉','叶子绿','日光金'])await page.getByRole('button',{name:`按下${label}书脊`}).click();
 await page.getByText('书架轻轻响了一声，但暗格没有打开。再想想一天中颜色出现的先后。',{exact:true}).waitFor();
 for(const label of ['叶子绿','日光金','晚霞粉'])await page.getByRole('button',{name:`按下${label}书脊`}).click();
 await page.screenshot({path:'test-results/puzzle-books.png'});await collect();console.log('Book puzzle and clue collection passed.');
 await walk(1.1,-3.2);await aim(1.1,1.24,-3.92);await page.locator('[data-gift="drawer"]').click();
 await page.getByLabel('三位密码').fill('000');await page.getByRole('button',{name:'试着打开'}).click();await page.getByText('锁扣没有弹开。密码是一个小时数字，加上两位分钟。',{exact:true}).waitFor();
 await page.getByLabel('三位密码').fill('420');await page.getByRole('button',{name:'试着打开'}).click();await collect();
 await walk(-2.5,-3.8);await aim(-2.64,2.65,-4.64);await page.locator('[data-gift="plant"]').click();await page.getByRole('button',{name:'轻轻浇一点水'}).click();await collect();
 await walk(-2.9,-1);await aim(-4.35,1.48,-.42);await page.locator('[data-gift="sofa"]').click();await page.getByRole('button',{name:'用钥匙打开'}).click();await collect();
 await walk(-1.9,-1.2);await walk(1.7,-1.2);await walk(1.7,2.5);await walk(-2.9,2.5);await aim(-1.84,1.5,.68);await page.locator('[data-gift="music"]').click();
 for(const note of ['DO','MI','SOL'])await page.getByRole('button',{name:new RegExp(note)}).click();
 await page.getByText('旋律还差一点。翻翻手记，看看唱片封套背面的刻字。',{exact:true}).waitFor();
 for(const note of ['SOL','MI','DO'])await page.getByRole('button',{name:new RegExp(note)}).click();await collect();
 console.log('Solved and collected all five gifts, including incorrect attempts and item chains.');
 await page.getByRole('button',{name:'手记',exact:true}).click();await page.getByRole('heading',{name:'叶子下的小钥匙'}).waitFor();await page.screenshot({path:'test-results/puzzle-journal.png'});await page.keyboard.press('Escape');
 await walk(-1.9,2.5);await walk(1.45,2.72);await aim(.24,1.32,.48);
 await canvas.focus();await page.keyboard.press('e');await page.getByRole('dialog',{name:'许一个生日愿望'}).waitFor();
 const paused=await pose();await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');const after=await pose();assert(Math.hypot(paused.x-after.x,paused.z-after.z)<.001,'Movement must pause in a dialog');
 await page.getByRole('button',{name:'许好啦，吹灭蜡烛'}).click();await page.waitForTimeout(550);
 await page.screenshot({path:'test-results/first-person-finale.png'});
 await page.getByRole('button',{name:'再在小屋待一会儿'}).click();
 await page.reload();await canvas.waitFor();await page.getByRole('button',{name:/口袋里的心意/}).click();
 assert.equal(await page.locator('.progress-number b').innerText(),'5');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'走进小屋',exact:true}).click();await page.evaluate(()=>document.exitPointerLock());await page.waitForTimeout(250);
 await look(Math.PI);await page.screenshot({path:'test-results/first-person-door.png'});
 await page.getByRole('button',{name:'回到门口',exact:true}).click();await page.waitForTimeout(250);
 await page.screenshot({path:'test-results/first-person-desktop.png'});
 await page.getByRole('button',{name:'开启音乐'}).click();await page.getByRole('button',{name:'音乐已开启'}).click();
 const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:5173/');await mobile.locator('canvas').waitFor();
 await mobile.getByRole('button',{name:'走进小屋',exact:true}).tap();await mobile.waitForTimeout(300);
 const mobilePose=async()=>JSON.parse(await mobile.locator('canvas').getAttribute('data-pose'));
 const before=await mobilePose(),forward=mobile.getByRole('button',{name:/移动轮盘/}),bounds=await forward.boundingBox();
 const cdp=await mobile.context().newCDPSession(mobile);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width/2+30,y:bounds.y+bounds.height/2}]});await mobile.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(200);
 const moved=await mobilePose();assert(Math.hypot(moved.x-before.x,moved.z-before.z)>.25,'Touch controls must move the player');
 await mobile.waitForTimeout(400);const stopped=await mobilePose();assert(Math.hypot(stopped.x-moved.x,stopped.z-moved.z)<.02,'Touch release must stop movement');
 await mobile.screenshot({path:'test-results/first-person-mobile.png'});
 assert.equal(await mobile.evaluate(()=>document.body.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log('First-person browser checks passed: keyboard movement, proximity interaction, E, modal pause, persistence, door view, music, and touch movement/release.');
} finally {await browser.close();}
