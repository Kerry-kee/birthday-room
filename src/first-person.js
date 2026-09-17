import { SPAWN, movePlayer } from './walking';
import { gamePoint } from './landscape';

export function createFirstPerson(camera, canvas, { onInteract, onMode }) {
  const offline=import.meta.env.MODE==='minitool';
  let yaw=SPAWN.yaw, pitch=SPAWN.pitch, active=false, paused=false, drag=null;
  const keys=new Set(), virtual={x:0,z:0};
  const locked=()=>offline?false:document.pointerLockElement===canvas;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','第一人称生日小屋。WASD 行走，拖动转头，E 互动；左右方向键转头，上下方向键前后行走。');
  function orient(){camera.rotation.set(pitch,yaw,0,'YXZ');camera.updateMatrixWorld();}
  function clear(){keys.clear();virtual.x=0;virtual.z=0;drag=null;}
  function reset(){clear();camera.position.set(SPAWN.x,SPAWN.y,SPAWN.z);yaw=SPAWN.yaw;pitch=SPAWN.pitch;orient();}
  function look(dx,dy){yaw-=dx*.0025;pitch=Math.max(-1.1,Math.min(1.05,pitch-dy*.0025));orient();}
  function release(){if(!offline&&locked())document.exitPointerLock();}
  async function enter(capture=true){
    active=true;paused=false;canvas.focus({preventScroll:true});onMode({active:true,locked:false});
    if(!offline && capture && matchMedia('(pointer:fine)').matches && canvas.requestPointerLock){
      try{await canvas.requestPointerLock();}catch{onMode({active:true,locked:false});}
    }
  }
  const isUI=e=>/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName);
  const down=e=>{
    if(!active||paused||isUI(e))return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','ShiftLeft'].includes(e.code)){
      e.preventDefault();keys.add(e.code);
      if(e.code==='KeyE'&&!e.repeat)onInteract();
    }
  };
  const up=e=>keys.delete(e.code);
  const pointerDown=e=>{
    if(paused||e.button!==0)return;
    if(!active){enter(false);}
    canvas.focus({preventScroll:true});
    if(!locked()){drag={id:e.pointerId,...gamePoint(canvas,e),total:0};canvas.setPointerCapture(e.pointerId);}
  };
  const pointerMove=e=>{
    if(!active||paused)return;
    if(locked()){look(e.movementX,e.movementY);return;}
    if(drag&&e.pointerId===drag.id){const point=gamePoint(canvas,e),dx=point.x-drag.x,dy=point.y-drag.y;drag.total+=Math.hypot(dx,dy);drag.x=point.x;drag.y=point.y;look(dx,dy);}
  };
  const pointerUp=e=>{
    if(!active||paused)return;
    if(locked()){onInteract();return;}
    if(drag&&drag.id===e.pointerId){const click=drag.total<6;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(click)onInteract(e);}
  };
  const pointerCancel=()=>{drag=null;};
  const lockChange=()=>{clear();onMode({active,locked:locked()});};
  const hidden=()=>{if(document.hidden){clear();release();}};
  const blur=()=>{clear();release();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  if(!offline)document.addEventListener('pointerlockchange',lockChange);document.addEventListener('visibilitychange',hidden);
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);
  reset();
  return {
    enter, reset, release,
    focusOn(point,amount=1){const dx=camera.position.x-point.x,dz=camera.position.z-point.z;const desired=Math.atan2(dx,dz);yaw+=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*amount;pitch+=(Math.atan2(point.y-camera.position.y,Math.hypot(dx,dz))-pitch)*amount;orient();},
    setPaused(value){paused=value;if(value){clear();release();}},
    setMove(x,z){if(!paused){active=true;virtual.x=x;virtual.z=z;}},
    interact(){if(active&&!paused)onInteract();},
    update(dt){
      if(active&&!paused){
        if(keys.has('ArrowLeft'))yaw+=dt*1.45;
        if(keys.has('ArrowRight'))yaw-=dt*1.45;
        let x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+virtual.x;
        let z=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))+virtual.z;
        const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
        const speed=(keys.has('ShiftLeft')?2.35:1.65)*Math.min(dt,.05);
        movePlayer(camera.position,(-Math.sin(yaw)*z+Math.cos(yaw)*x)*speed,(-Math.cos(yaw)*z-Math.sin(yaw)*x)*speed);
      }
      orient();
    },
    getState:()=>({x:camera.position.x,z:camera.position.z,yaw,pitch,active,paused,locked:locked()}),
    dispose(){clear();release();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);if(!offline)document.removeEventListener('pointerlockchange',lockChange);document.removeEventListener('visibilitychange',hidden);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);},
  };
}
