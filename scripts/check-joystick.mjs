import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.getByRole('button',{name:'走进小屋',exact:true}).tap();await page.locator('canvas[data-pose]').waitFor();await page.evaluate(()=>document.fonts.ready);
 const joystick=page.getByRole('button',{name:/移动轮盘/}),pose=async()=>JSON.parse(await page.locator('canvas').getAttribute('data-pose')),cdp=await page.context().newCDPSession(page);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const touch=async(type,points)=>{await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});await page.waitForTimeout(90);};
 async function point(x=0,y=0){const b=await joystick.boundingBox(),rotated=await page.locator('.game-viewport').getAttribute('data-landscape-rotated')==='true';return {x:b.x+b.width/2+(rotated?-y:x),y:b.y+b.height/2+(rotated?x:y),id:1};}
 const origin=await pose();await touch('touchStart',[await point()]);await page.waitForTimeout(180);assert(distance(await pose(),origin)<.005,'Center dead zone must not move the player');
 const right=await point(35,0);await touch('touchMove',[right]);await page.waitForTimeout(320);const moved=await pose();assert(distance(moved,origin)>.2,'Rotated joystick moves player');assert((moved.x-origin.x)*Math.cos(origin.yaw)-(moved.z-origin.z)*Math.sin(origin.yaw)>.15,'Rotated right input moves right');
 // Second finger turns the camera while the first finger keeps the joystick pressed.
 await touch('touchStart',[right,{x:200,y:510,id:2}]);await touch('touchMove',[right,{x:200,y:550,id:2}]);const turning=await pose();assert(turning.yaw<moved.yaw-.06);assert(distance(turning,moved)>.05);
 await touch('touchMove',[right]);assert(await joystick.evaluate(el=>el.classList.contains('is-active')),'Releasing the look finger must not cancel the movement finger');
 await touch('touchEnd',[]);await page.waitForTimeout(160);const stopped=await pose();await page.waitForTimeout(220);assert(distance(await pose(),stopped)<.005);assert.equal(await joystick.locator('.joystick-thumb').evaluate(el=>el.style.transform),'translate(0px, 0px)');
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(220);await touch('touchStart',[await point(18,-18)]);const diagonal=await pose();await page.waitForTimeout(220);const diagonalEnd=await pose();assert(distance(diagonalEnd,diagonal)>.15);await touch('touchCancel',[]);await page.waitForTimeout(160);const cancelled=await pose();await page.waitForTimeout(220);assert(distance(await pose(),cancelled)<.005);
 // Opening a dialog must cancel held movement and leave it stopped when closed.
 await touch('touchStart',[await point(-35,0)]);await page.getByRole('button',{name:'手记',exact:true}).evaluate(el=>el.click());await page.getByRole('dialog',{name:'探索手记'}).waitFor();await touch('touchEnd',[]);assert(!(await joystick.evaluate(el=>el.classList.contains('is-active'))));await page.getByRole('button',{name:'合上手记，继续探索'}).tap();await page.waitForTimeout(180);const afterDialog=await pose();await page.waitForTimeout(220);assert(distance(await pose(),afterDialog)<.005);
 // Rotation during a held gesture must release movement as well.
 await touch('touchStart',[await point(35,0)]);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(220);await touch('touchEnd',[]);const afterRotation=await pose();await page.waitForTimeout(220);assert(distance(await pose(),afterRotation)<.005);
 for(const size of [{width:390,height:844},{width:844,height:390},{width:667,height:375}]){
   await page.setViewportSize(size);await page.waitForTimeout(200);
   const boxes=await page.evaluate(()=>{const nodes=['.movement-joystick','.fps-toolbar','.touch-interact'];return nodes.map(s=>{const el=document.querySelector(s);return {left:el.offsetLeft,width:el.offsetWidth};});});
   assert(boxes[0].left>=108,'Reserve at least 108 CSS pixels at the game left edge');assert(boxes[1].left-boxes[1].width/2-(boxes[0].left+boxes[0].width)>=12,'Wheel and toolbar need a visible gap');assert(boxes[2].left-(boxes[1].left+boxes[1].width/2)>=12);
   assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);
   await page.screenshot({path:`test-results/joystick-${size.width}x${size.height}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS: rotated joystick direction, dead zone, analog/diagonal movement, two-finger move/look, release/cancel/modal/rotation reset, 108px navigation inset and toolbar gaps on three phone layouts.');
}finally{await browser.close();}
