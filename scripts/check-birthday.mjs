import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {BIRTHDAY_MELODY,birthdayEvents,BIRTHDAY_DURATION} from '../src/birthday-score.js';
assert.deepEqual(BIRTHDAY_MELODY.slice(0,6).map(n=>n[0]),[67,67,69,67,72,71]);
assert.equal(BIRTHDAY_MELODY.length,25);
assert(birthdayEvents().length>BIRTHDAY_MELODY.length);
assert(BIRTHDAY_DURATION>18&&BIRTHDAY_DURATION<30);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 const state={found:['books','drawer','plant','sofa'],wished:false,puzzles:{solved:['books','drawer','plant','sofa','music'],items:['record','wateringCan','key'],clues:['postcard','clock','record','key']}};
 await page.goto('http://127.0.0.1:5173/');
 await page.evaluate(s=>localStorage.setItem('birthday-little-room-v2',JSON.stringify(s)),state);await page.reload();
 const canvas=page.locator('canvas'),app=page.locator('main');await canvas.waitFor();await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>document.fonts.check('24px "Birthday Hand"','生日快乐')));
 assert.match(await app.evaluate(el=>getComputedStyle(el).fontFamily),/Birthday Hand/);
 async function approach(){await page.getByRole('button',{name:'走进小屋',exact:true}).click();await page.waitForTimeout(200);await page.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();});await canvas.focus();await page.keyboard.down('w');await page.waitForTimeout(1100);await page.keyboard.up('w');await page.waitForTimeout(250);}
 await approach();await page.locator('.cake-hotspot').click();assert.equal(await app.getAttribute('data-music-playing'),'false');assert.equal(await page.locator('dialog').count(),0);
 state.found.push('music');await page.evaluate(s=>localStorage.setItem('birthday-little-room-v2',JSON.stringify(s)),state);await page.reload();await canvas.waitFor();await approach();
 await page.locator('.cake-hotspot').click();await page.getByRole('dialog',{name:'许一个生日愿望'}).waitFor();await page.waitForTimeout(300);
 assert.equal(await app.getAttribute('data-music-track'),'birthday');assert.equal(await app.getAttribute('data-music-playing'),'true');assert.equal(await canvas.getAttribute('data-record-playing'),'true');
 await page.getByRole('button',{name:'暂停生日音乐'}).click();assert.equal(await app.getAttribute('data-music-playing'),'false');assert.equal(await canvas.getAttribute('data-record-playing'),'false');
 await page.getByRole('button',{name:'播放生日音乐'}).click();await page.waitForTimeout(200);assert.equal(await app.getAttribute('data-music-playing'),'true');
 await page.getByRole('button',{name:'许好啦，吹灭蜡烛'}).click();await page.waitForTimeout(550);await page.screenshot({path:'test-results/handwritten-birthday.png'});
 await page.getByRole('button',{name:'再在小屋待一会儿'}).click();assert.equal(await app.getAttribute('data-music-playing'),'true');
 await page.locator('.cake-hotspot').click();await page.waitForTimeout(100);assert.equal(await app.getAttribute('data-music-playing'),'true');await page.keyboard.press('Escape');
 await page.waitForTimeout(BIRTHDAY_DURATION*1000);assert.equal(await app.getAttribute('data-music-playing'),'false');assert.equal(await canvas.getAttribute('data-record-playing'),'false');
 await page.locator('.cake-hotspot').click();await page.waitForTimeout(200);assert.equal(await app.getAttribute('data-music-playing'),'true');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:/口袋里的心意/}).click();await page.getByRole('button',{name:'重新探索',exact:true}).click();await page.getByRole('button',{name:'重新开始',exact:true}).click();assert.equal(await app.getAttribute('data-music-playing'),'false');assert.equal(await app.getAttribute('data-music-track'),'ambient');
 // Render the actual synthesizer offline and verify the result is audible, finite and unclipped.
 const render=await page.evaluate(async()=>{
   const {createAudio}=await import('/src/audio.js');const Native=window.AudioContext;
   const ctx=new OfflineAudioContext(1,44100*25,44100);ctx.resume=async()=>{};ctx.close=async()=>{};
   window.AudioContext=function(){return ctx;};
   const player=createAudio();
   try{await player.playBirthday();const voices=player.getState().voiceCount;await player.playBirthday();const duplicateVoices=player.getState().voiceCount;const buffer=await ctx.startRendering();const data=buffer.getChannelData(0);let max=0,sum=0;for(const sample of data){max=Math.max(max,Math.abs(sample));sum+=sample*sample;}player.dispose();return {max,rms:Math.sqrt(sum/data.length),voices,duplicateVoices};}
   finally{window.AudioContext=Native;}
 });
 assert(render.max>.01&&render.max<1);assert(render.rms>.001);assert.equal(render.voices,render.duplicateVoices);
 const mobile=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:5173/');await mobile.locator('canvas').waitFor();await mobile.evaluate(()=>document.fonts.ready);await mobile.screenshot({path:'test-results/handwritten-mobile.png'});assert.equal(await mobile.evaluate(()=>document.body.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:['handwriting font loaded','4 gifts do not trigger','5 gifts automatically start birthday instrumental','pause/replay','record synchronization','finish stops record','reopening restarts','reset clears audio','no duplicate voices','actual offline synthesis','mobile layout'],render}));
}finally{await browser.close();}
