import React,{createContext,useContext,useLayoutEffect,useState} from 'react';

const LandscapeContext=createContext(false);
export const useRotatedLandscape=()=>useContext(LandscapeContext);
export function LandscapeViewport({children}){
  function measure(){
    const width=window.innerWidth,height=window.visualViewport?.height||window.innerHeight;
    const mobile=matchMedia('(pointer: coarse)').matches&&Math.min(width,height)<=600;
    const rotated=mobile&&width<height;
    return {width:rotated?height:width,height:rotated?width:height,mobile,rotated};
  }
  const [view,setView]=useState(measure);
  useLayoutEffect(()=>{
    const update=()=>setView(measure());
    window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);
    // Some installed/fullscreen browser contexts permit an immediate orientation lock.
    if(matchMedia('(pointer: coarse)').matches&&screen.orientation?.lock){try{const result=screen.orientation.lock('landscape');result?.catch(()=>{});}catch{}}
    return()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);};
  },[]);
  return <LandscapeContext.Provider value={view.rotated}><div className={`game-viewport ${view.mobile?'mobile-landscape':''} ${view.rotated?'landscape-rotated':''}`} data-landscape-rotated={String(view.rotated)} style={{'--game-width':`${view.width}px`,'--game-height':`${view.height}px`}}>{children}</div></LandscapeContext.Provider>;
}

// Convert viewport pointer coordinates into the visually rotated game's local axes.
export function gamePoint(element,event){
  const rect=element.getBoundingClientRect();
  return element.closest('.landscape-rotated')
    ? {x:event.clientY-rect.top,y:rect.right-event.clientX,width:rect.height,height:rect.width}
    : {x:event.clientX-rect.left,y:event.clientY-rect.top,width:rect.width,height:rect.height};
}
