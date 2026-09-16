import { chromium } from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader'],timeout:20000});
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
await page.goto('http://127.0.0.1:5173/');
await page.waitForTimeout(5000);
console.log((await page.locator('body').innerText()).slice(0,4000));
await mkdir('test-results',{recursive:true});
await page.screenshot({path:'test-results/inspect.png',fullPage:true});
}finally{await browser.close();}
