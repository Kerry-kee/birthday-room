import {build} from 'vite';
import postcss from 'postcss';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd(),out=path.join(root,'artifacts/minitool');
if(path.relative(root,out)!==path.join('artifacts','minitool'))throw Error('Unexpected output path');
await build({configFile:false,mode:'minitool',base:'./',publicDir:false,plugins:[{
  name:'offline-renderer',
  transform(code,id){if(id.replaceAll('\\','/').includes('/react-dom/cjs/'))return {code:code.replace(/navigator\.connection/g,'undefined'),map:null};},
  load(id){if(id.replaceAll('\\','/').endsWith('/renderers/webxr/WebXRManager.js'))return `import {EventDispatcher} from '../../core/EventDispatcher.js';export class WebXRManager extends EventDispatcher{constructor(){super();this.enabled=false;this.isPresenting=false;this.cameraAutoUpdate=false;}setAnimationLoop(){}dispose(){}getCamera(camera){return camera;}getSession(){return null;}hasDepthSensing(){return false;}}`;}
}],build:{outDir:out,emptyOutDir:true,target:['es2017','chrome61'],cssTarget:'chrome61',sourcemap:false,assetsInlineLimit:0,cssCodeSplit:false,modulePreload:false,rollupOptions:{input:path.join(root,'src/minitool-entry.js'),output:{format:'iife',inlineDynamicImports:true,entryFileNames:'assets/app.js',assetFileNames:'assets/[name][extname]'}}}});

// Add physical layout and sizing baselines before optional modern declarations.
function splitArgs(value){let depth=0,start=0,result=[];for(let i=0;i<value.length;i++){if(value[i]==='(')depth++;if(value[i]===')')depth--;if(value[i]===','&&depth===0){result.push(value.slice(start,i).trim());start=i+1;}}result.push(value.slice(start).trim());return result;}
function baseline(value){
  value=value.replace(/\bdvh\b/g,'vh').replace(/(\d)dvh/g,'$1vh');
  for(let pass=0;pass<8;pass++){
    const match=/(min|max|clamp)\(/.exec(value);if(!match)break;
    let end=match.index+match[0].length,depth=1;while(end<value.length&&depth){if(value[end]==='(')depth++;if(value[end]===')')depth--;end++;}
    const args=splitArgs(value.slice(match.index+match[0].length,end-1));
    value=value.slice(0,match.index)+(args[match[1]==='clamp'?1:0]||'0px')+value.slice(end);
  }
  value=value.replace(/env\(safe-area-inset-[a-z]+(?:,[^)]*)?\)/g,'0px');
  if(value.includes('color-mix('))value='var(--gift-color,#b4c49b)';
  return value;
}
const cssPath=path.join(out,'assets/style.css'),css=postcss.parse(await fs.readFile(cssPath,'utf8'));
css.walkDecls(decl=>{
  const original=decl.value;
  if(decl.prop==='inset'){const a=postcss.list.space(original),values=[a[0],a[1]||a[0],a[2]||a[0],a[3]||a[1]||a[0]];['top','right','bottom','left'].forEach((prop,i)=>decl.cloneBefore({prop,value:baseline(values[i])}));}
  if(['gap','row-gap','column-gap'].includes(decl.prop)){
    const values=postcss.list.space(original);
    if(decl.prop!=='column-gap')decl.cloneBefore({prop:'--mt-row-gap',value:values[0]});
    if(decl.prop!=='row-gap')decl.cloneBefore({prop:'--mt-column-gap',value:values[1]||values[0]});
    decl.cloneBefore({prop:`grid-${decl.prop}`});
  }
  if(decl.prop==='place-items'){const values=postcss.list.space(original);decl.cloneBefore({prop:'align-items',value:values[0]});decl.cloneBefore({prop:'justify-items',value:values[1]||values[0]});}
  const fallback=baseline(original);if(fallback!==original)decl.cloneBefore({value:fallback});
  decl.value=original.replace(/env\(safe-area-inset-([a-z]+)(?:,[^)]*)?\)/g,(_,side)=>`var(--safe-area-inset-${side},env(safe-area-inset-${side},0px))`);
});
await fs.writeFile(cssPath,css.toString());

// Select existing, unmodified font subset files whose unicode ranges cover source text.
const sources=(await fs.readdir('src')).filter(name=>/\.(jsx?|css)$/.test(name));
const source=(await Promise.all(sources.map(name=>fs.readFile(path.join('src',name),'utf8')))).join('\n');
const codepoints=new Set(Array.from(source,c=>c.codePointAt(0))),fontCss=await fs.readFile('public/fonts/cheese/font.css','utf8');
const faces=fontCss.match(/@font-face\{[^}]+\}/g),selected=[];
const fontDir=path.join(out,'fonts/cheese');await fs.mkdir(fontDir,{recursive:true});
for(const face of faces){
  const range=/unicode-range:([^;]+)/.exec(face)?.[1];
  const used=!range||range.split(',').some(part=>{const [a,b]=part.trim().replace(/^U\+/i,'').split('-').map(s=>parseInt(s,16));return Array.from(codepoints).some(n=>n>=a&&n<=(b??a));});
  if(!used)continue;
  const file=/url\("\.\/([^"/]+)"\)/.exec(face)[1];await fs.copyFile(path.join('public/fonts/cheese',file),path.join(fontDir,file));selected.push(face);
}
await fs.writeFile(path.join(fontDir,'font.css'),fontCss.slice(0,fontCss.indexOf('@font-face'))+selected.join('\n'));
await fs.writeFile(path.join(fontDir,'NOTICE.json'),JSON.stringify({font:'小可奶酪体 / ZQKNLT',notice:await fs.readFile('public/fonts/cheese/NOTICE.txt','utf8'),packaging:'Only existing subset files required by the current source text are included. Font binaries are unmodified.'},null,2));
await fs.writeFile(path.join(out,'index.html'),'<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#eee5d1"><title>生日小屋</title><link rel="stylesheet" href="./fonts/cheese/font.css"><link rel="stylesheet" href="./assets/style.css"><script defer src="./assets/app.js"></script></head><body><div id="root"></div></body></html>\n');
const js=await fs.readFile(path.join(out,'assets/app.js'),'utf8');
const forbidden=[/\bfetch\s*\(/,/XMLHttpRequest/,/\beval\s*\(/,/new\s+Function\s*\(/,/WebAssembly/,/\b(?:SharedWorker|Worker|WebSocket|EventSource|RTCPeerConnection)\s*\(/,/requestPointerLock|exitPointerLock|pointerlockchange|requestFullscreen/,/navigator\.(?:xr|serviceWorker|geolocation|clipboard|bluetooth|usb|hid|serial|credentials|locks|connection)/,/window\.(?:open|prompt)\s*\(/];
const violations=forbidden.filter(pattern=>pattern.test(js));if(violations.length)throw Error('Forbidden API residue: '+violations.join(', '));
console.log(JSON.stringify({output:out,fontSubsets:selected.length,originalFontSubsets:faces.length,scriptBytes:Buffer.byteLength(js),forbiddenApiResidue:0},null,2));
