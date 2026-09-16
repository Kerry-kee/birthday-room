import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import assert from 'node:assert/strict';

// Serve the production artifact under a repository path, with real 404s.
const root=resolve('dist'),prefix='/birthday-room/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,path.slice(prefix.length)||'index.html');
  if(!path.startsWith(prefix)||!file.startsWith(root+sep)){res.writeHead(404).end();return;}
  try{const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}).end(data);}catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader']});
  const errors=[],failed=[];
  const url=`http://127.0.0.1:${server.address().port}${prefix}`;
  for(const device of [{viewport:{width:1440,height:1000}},{viewport:{width:844,height:390},isMobile:true,hasTouch:true}]){
    const page=await browser.newPage(device);
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
    await page.goto(url);await page.locator('canvas').waitFor();await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(()=>document.fonts.check('24px "Birthday Hand"','生日快乐')));
    const loaded=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('.woff2')).map(r=>r.name));
    assert(loaded.length>0&&loaded.every(name=>name.includes('/birthday-room/fonts/cheese/')),'Font files must load from the repository subpath');
    await page.getByRole('button',{name:'走进小屋',exact:true}).click();await page.waitForTimeout(200);
    await page.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();});
    await page.getByRole('button',{name:'手记',exact:true}).click();await page.getByRole('dialog',{name:'探索手记'}).waitFor();
    assert.equal(await page.evaluate(()=>document.body.scrollWidth>innerWidth),false);
    await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('PASS: production build runs under /birthday-room/ on desktop and phone landscape; local fonts, WebGL, and dialogs load without errors or 404s.');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
