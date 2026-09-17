// Small, feature-specific fallbacks for the offline Chrome 61 baseline.
document.documentElement.classList.add('minitool');
if(!Promise.allSettled)Promise.allSettled=function(values){return Promise.all(Array.from(values,value=>Promise.resolve(value).then(value=>({status:'fulfilled',value}),reason=>({status:'rejected',reason}))));};
const mediaPrototype=Object.getPrototypeOf(matchMedia('all'));
if(!mediaPrototype.addEventListener){mediaPrototype.addEventListener=function(type,fn){if(type==='change')this.addListener(fn);};mediaPrototype.removeEventListener=function(type,fn){if(type==='change')this.removeListener(fn);};}
const setHeight=()=>document.documentElement.style.setProperty('--app-height',`${window.visualViewport?window.visualViewport.height:innerHeight}px`);
setHeight();window.addEventListener('resize',setHeight);if(window.visualViewport)window.visualViewport.addEventListener('resize',setHeight);
const flex=document.createElement('div');flex.style.cssText='position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px';flex.appendChild(document.createElement('div'));flex.appendChild(document.createElement('div'));document.body.appendChild(flex);const flexGap=flex.scrollHeight===1;flex.remove();
if(!flexGap){
  document.documentElement.classList.add('no-flex-gap');
  const mark=()=>document.querySelectorAll('#root *').forEach(el=>{const css=getComputedStyle(el);if(css.display==='flex'||css.display==='inline-flex')el.setAttribute('data-mt-flex',css.flexDirection.indexOf('column')===0?'column':'row');});
  let pending=false;new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;mark();});}}).observe(document.getElementById('root'),{childList:true,subtree:true});
}
const sample=document.createElement('dialog');
if(typeof sample.showModal!=='function'){
  const proto=Object.getPrototypeOf(sample),stack=[];
  proto.showModal=function(){if(this.hasAttribute('open'))return;this.classList.add('mt-dialog-fallback');this.setAttribute('open','');this.setAttribute('role','dialog');this.setAttribute('aria-modal','true');const backdrop=document.createElement('div');backdrop.className='mt-dialog-backdrop';backdrop.style.zIndex=100+stack.length*2;this.style.zIndex=101+stack.length*2;this.parentNode.insertBefore(backdrop,this);this._mtBackdrop=backdrop;stack.push(this);document.documentElement.classList.add('mt-modal-open');const button=this.querySelector('button,input');if(button)button.focus();};
  proto.close=function(){this.removeAttribute('open');if(this._mtBackdrop)this._mtBackdrop.remove();const i=stack.indexOf(this);if(i>=0)stack.splice(i,1);if(!stack.length)document.documentElement.classList.remove('mt-modal-open');};
  document.addEventListener('keydown',e=>{const dialog=stack[stack.length-1];if(!dialog)return;if(e.key==='Escape'){e.preventDefault();dialog.dispatchEvent(new Event('cancel',{bubbles:true,cancelable:true}));}if(e.key==='Tab'){const items=Array.from(dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]'));if(!items.length){e.preventDefault();return;}const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}},true);
}
