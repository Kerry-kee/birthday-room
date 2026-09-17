import React,{useEffect,useRef,useState} from 'react';
import {gamePoint,useRotatedLandscape} from './landscape';

export function MovementJoystick({onMove,disabled=false}){
  const host=useRef(),pointer=useRef(null),move=useRef(onMove);
  const [thumb,setThumb]=useState({x:0,y:0}),[active,setActive]=useState(false);
  const rotated=useRotatedLandscape();move.current=onMove;
  function stop(){
    const id=pointer.current;pointer.current=null;
    if(id!==null&&host.current?.hasPointerCapture(id))host.current.releasePointerCapture(id);
    setThumb({x:0,y:0});setActive(false);move.current(0,0);
  }
  function steer(event){
    const el=host.current,p=gamePoint(el,event),radius=(el.clientWidth-44)/2-5;
    const dx=p.x-p.width/2,dy=p.y-p.height/2,distance=Math.hypot(dx,dy);
    const reach=Math.min(distance,radius),scale=distance?reach/distance:0;
    setThumb({x:dx*scale,y:dy*scale});
    const strength=Math.max(0,(reach/radius-.12)/.88);
    move.current(distance?dx/distance*strength:0,distance?-dy/distance*strength:0);
  }
  useEffect(()=>{stop();},[disabled,rotated]);
  useEffect(()=>{
    const hidden=()=>{if(document.hidden)stop();};
    window.addEventListener('blur',stop);window.addEventListener('resize',stop);document.addEventListener('visibilitychange',hidden);
    return()=>{window.removeEventListener('blur',stop);window.removeEventListener('resize',stop);document.removeEventListener('visibilitychange',hidden);move.current(0,0);};
  },[]);
  return <div ref={host} role="button" tabIndex={disabled?-1:0} aria-label="移动轮盘，拖动移动，松手停止" aria-disabled={disabled} className={`touch-controls movement-joystick ${active?'is-active':''}`}
    onPointerDown={e=>{if(disabled||pointer.current!==null||e.button!==0)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);setActive(true);steer(e);}}
    onPointerMove={e=>{if(e.pointerId===pointer.current&&!disabled){e.preventDefault();steer(e);}}}
    onPointerUp={e=>{if(e.pointerId===pointer.current)stop();}}
    onPointerCancel={e=>{if(e.pointerId===pointer.current)stop();}}
    onLostPointerCapture={e=>{if(e.pointerId===pointer.current)stop();}}
    onKeyDown={e=>{const vector={ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(vector&&!disabled){e.preventDefault();e.stopPropagation();setActive(true);setThumb({x:vector[0]*23,y:-vector[1]*23});move.current(...vector);}}}
    onKeyUp={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();e.stopPropagation();stop();}}} onBlur={()=>{if(pointer.current===null)stop();}}>
    <span className="joystick-ring" aria-hidden="true"/>
    {['up','right','down','left'].map(direction=><span key={direction} className={`joystick-tick ${direction}`} aria-hidden="true"/>)}
    <span className="joystick-thumb" aria-hidden="true" style={{transform:`translate(${thumb.x}px,${thumb.y}px)`}}><span/></span>
  </div>;
}
