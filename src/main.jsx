import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { House, Gift, SpeakerHigh, SpeakerSlash, Question, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowCounterClockwise, X, Heart, BookOpen, Plant, Camera, MusicNotes, Sparkle, Check, Plus, Mouse, Hand, Cake, Sun, Footprints } from '@phosphor-icons/react';
import { createRoom } from './room';
import { createAudio } from './audio';
import { birthday, gifts } from './content';
import { PUZZLE_STORAGE, extraObjects, clueTexts, normalizePuzzles, emptyPuzzles, attemptPuzzle, nextPuzzleHint } from './puzzles';
import { PuzzlePanel, CluePanel } from './PuzzlePanel';
import './style.css';
import './first-person.css';
import './doodle.css';
import './handwriting.css';
import './mobile-landscape.css';

const icons={heart:Heart,book:BookOpen,plant:Plant,camera:Camera,music:MusicNotes};
const STORAGE=PUZZLE_STORAGE;
function readProgress(){try {const p=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{},puzzles=normalizePuzzles(p.puzzles),found=Array.isArray(p.found)?[...new Set(p.found.filter(id=>gifts.some(g=>g.id===id)&&puzzles.solved.includes(id)))]:[];return {found,wished:found.length===5&&!!p.wished,cakeOpened:found.length===5&&!!(p.cakeOpened||p.wished),puzzles};}catch{return {found:[],wished:false,puzzles:emptyPuzzles()};}}

function Dialog({children,onClose,label,className=''}) {
  const ref=useRef();
  useEffect(()=>{const previous=document.activeElement;ref.current.showModal();return ()=>{previous?.focus?.();};},[]);
  return <dialog ref={ref} className={`dialog ${className}`} aria-label={label} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}>
    <button className="close-button icon-button" aria-label="关闭" onClick={onClose}><X size={20}/></button>{children}
  </dialog>;
}

function OrientationGuide(){
  const ref=useRef();
  useEffect(()=>{const dialog=ref.current;dialog.showModal();return()=>dialog.close();},[]);
  return <dialog ref={ref} className="orientation-guide" aria-label="请横屏体验" onCancel={e=>e.preventDefault()}><div className="rotate-phone" aria-hidden="true"><span/></div><h2>把手机横过来，<br/>小屋就展开啦。</h2><p>横屏探索 · 左手移动 · 右手转头</p><small>旋转手机后，自动继续当前进度</small></dialog>;
}

function App(){
  const [saved]=useState(readProgress),[found,setFound]=useState(saved.found),[wished,setWished]=useState(saved.wished);
  const [puzzles,setPuzzles]=useState(saved.puzzles),[clueId,setClueId]=useState('postcard');
  const [modal,setModal]=useState(null),[activeGift,setActiveGift]=useState(null),[opened,setOpened]=useState(false);
  const [mode,setMode]=useState({active:false,locked:false}),[focus,setFocus]=useState('');
  const [sound,setSound]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[hint,setHint]=useState(''),[toast,setToast]=useState('');
  const [musicTrack,setMusicTrack]=useState('ambient');
  const [lightsOn,setLightsOn]=useState(true),[cakeOpened,setCakeOpened]=useState(!!saved.cakeOpened),[revealing,setRevealing]=useState(false);
  const [portrait,setPortrait]=useState(()=>matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 700px)').matches);
  useEffect(()=>{const query=matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 700px)'),update=()=>setPortrait(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  const revealingRef=useRef(false);
  const roomHost=useRef(),room=useRef(),markers=useRef({}),audio=useRef(),selectRef=useRef(),toastTimer=useRef();
  const reduced=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const allFound=found.length===gifts.length;
  function notify(message){setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4300);}
  function select(id){
    if(id==='cat'){notify('小猫翻了个身：喵，生日快乐。今天也要好好休息。');audio.current?.chime();return;}
    if(revealingRef.current)return;
    if(id==='lightSwitch'){room.current?.toggleLights();return;}
    if(id==='cake'){
      if(!allFound){notify(`礼盒上写着：等所有心意到齐，再打开我。还差 ${5-found.length} 份礼物。`);return;}
      revealingRef.current=true;setRevealing(true);room.current?.setPaused(true);
      audio.current?.playBirthday().catch(()=>notify('唱片暂时没有播放成功，点击弹窗里的播放按钮可以重试。'));
      room.current?.revealCake().then(done=>{revealingRef.current=false;setRevealing(false);if(done){setCakeOpened(true);setModal(wished?'final':'wish');}});
      return;
    }
    if(extraObjects.some(o=>o.id===id)){setClueId(id);if(id!=='wateringCan'){setPuzzles(attemptPuzzle(puzzles,id).state);}setModal('clue');return;}
    const gift=gifts.find(g=>g.id===id);if(!gift)return;
    setActiveGift(gift);setOpened(found.includes(id));setModal(puzzles.solved.includes(id)?'gift':'puzzle');
  }
  selectRef.current=select;
  useEffect(()=>{
    audio.current=createAudio({onState:state=>{setSound(state.playing);setMusicTrack(state.track);room.current?.setRecordPlaying(state.playing&&state.track==='birthday');}});
    try{room.current=createRoom(roomHost.current,{onSelect:id=>selectRef.current(id),onReady:()=>setReady(true),onError:setError,onMode:setMode,onFocus:setFocus,onLights:setLightsOn,markerElements:markers.current,reducedMotion:reduced.current});}
    catch(e){console.error(e);setError('这台设备暂时无法显示 3D 小屋。请使用支持 WebGL 的新版浏览器，并开启硬件加速。');}
    return ()=>{room.current?.dispose();audio.current?.dispose();clearTimeout(toastTimer.current);};
  },[]);
  useEffect(()=>{try{localStorage.setItem(STORAGE,JSON.stringify({found,wished,cakeOpened,puzzles}));}catch{}room.current?.setPuzzleState(puzzles);},[found,wished,cakeOpened,puzzles]);
  useEffect(()=>{room.current?.restoreCake(cakeOpened,wished);},[cakeOpened,wished]);
  useEffect(()=>{room.current?.setPaused(!!modal||revealing||portrait);},[modal,revealing,portrait]);
  async function toggleSound(){try{if(sound){audio.current.stop();}else{await audio.current.start();}}catch{notify('声音暂时无法播放，可以继续探索小屋。');}}
  function unwrap(){if(!activeGift||!puzzles.solved.includes(activeGift.id))return;setOpened(true);setFound(prev=>prev.includes(activeGift.id)?prev:[...prev,activeGift.id]);setHint('');audio.current?.chime();}
  function getHint(){notify(nextPuzzleHint(puzzles,found));}
  function handleAttempt(id,input){const result=attemptPuzzle(puzzles,id,input);if(result.success){setPuzzles(result.state);audio.current?.chime();}return result;}
  function restart(){audio.current?.reset();setFound([]);setWished(false);setCakeOpened(false);setRevealing(false);revealingRef.current=false;setPuzzles(emptyPuzzles());setHint('');setModal(null);room.current?.reset();notify('已经回到门口，礼物和小机关也准备好啦。');}
  function holdMove(e,x,z){e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);room.current?.setMove(x,z);}
  function stopMove(){room.current?.setMove(0,0);}
  const focusName=gifts.find(g=>g.id===focus)?.place || extraObjects.find(o=>o.id===focus)?.place || ({cake:cakeOpened?'生日蛋糕':'生日惊喜礼盒',lightSwitch:lightsOn?'关灯开关':'开灯开关',cat:'熟睡的小猫'}[focus]);
  const GiftIcon=activeGift?icons[activeGift.icon]:Gift;
  const birthdayPlayer=<div className="birthday-player" role="group" aria-label="生日唱片播放控制"><MusicNotes size={25}/><span>祝你生日快乐<small>八音盒纯音乐 · 来自身旁的唱片机</small></span><button onClick={toggleSound} aria-label={sound?'暂停生日音乐':'播放生日音乐'}>{sound?'暂停':'播放'}</button></div>;
  return <main data-lights-on={String(lightsOn)} data-revealing={String(revealing)} data-cake-opened={String(cakeOpened)} data-music-track={musicTrack} data-music-playing={String(sound)} className={`app-shell immersive ${mode.active?'is-exploring':''} ${mode.locked?'mouse-locked':''} ${revealing?'is-revealing':''} ${!lightsOn?'candle-night':''}`}>
    <section className="first-person-world" aria-label="第一人称房间探索">
      <div className="room-stage" ref={roomHost}>
        {gifts.map(g=><button key={g.id} ref={el=>{if(el)markers.current[g.id]=el;}} className={`hotspot ${found.includes(g.id)?'discovered':''} ${hint===g.id?'hinted':''}`} aria-label={`探索${g.place}`} data-gift={g.id} disabled={!ready || !!error} onClick={()=>room.current?.selectMarker(g.id)} style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}}><span className="hotspot-core">{found.includes(g.id)?<Check size={12} weight="bold"/>:<Plus size={13} weight="bold"/>}</span><span className="hotspot-label">{g.place}</span></button>)}
        {extraObjects.map(o=><button key={o.id} ref={el=>{if(el)markers.current[o.id]=el;}} className="hotspot" data-object={o.id} aria-label={`探索${o.place}`} disabled={!ready||!!error} onClick={()=>room.current?.selectMarker(o.id)} style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}}><span className="hotspot-core"><Sparkle size={14}/></span><span className="hotspot-label">{o.place}</span></button>)}
        <button ref={el=>{if(el)markers.current.cake=el;}} className={`hotspot cake-hotspot ${allFound?'cake-ready':''}`} style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}} aria-label={cakeOpened?'生日蛋糕':'生日惊喜礼盒'} disabled={!ready || !!error} onClick={()=>room.current?.selectMarker('cake')}><span className="hotspot-core"><Cake size={15}/></span><span className="hotspot-label">{cakeOpened?'生日蛋糕':'生日惊喜礼盒'}</span></button>
        <button ref={el=>{if(el)markers.current.lightSwitch=el;}} className="hotspot" data-object="lightSwitch" aria-label={lightsOn?'关闭室内灯光':'打开室内灯光'} aria-pressed={lightsOn} style={{visibility:'hidden',opacity:mode.active&&ready&&!error?1:0}} onClick={()=>room.current?.selectMarker('lightSwitch')}><span className="hotspot-core"><Sun size={15}/></span><span className="hotspot-label">{lightsOn?'关灯':'开灯'}</span></button>
        {!ready&&!error&&<div className="loading"><House size={34} weight="duotone"/><span>正在把阳光装进小屋…</span></div>}
        {error&&<div className="scene-error"><House size={36}/><h2>小屋还没能打开</h2><p>{error}</p><button className="primary" onClick={()=>location.reload()}>重新加载</button></div>}
      </div>
      <div className="view-shade" aria-hidden="true"/>
      {mode.active&&!modal&&!revealing&&<><div className={`crosshair ${focus?'has-target':''}`} aria-hidden="true"/><div className="interaction-prompt" aria-live="polite">{focusName?<span>探索{focusName}</span>:<span>走近看看，也许藏着一份心意</span>}</div></>}
    </section>

    <header className="header fps-header" inert={revealing?true:undefined}>
      <a className="brand" href="#" onClick={e=>{e.preventDefault();room.current?.resetView();}} aria-label="回到房间门口"><span className="brand-mark"><House weight="duotone" size={25}/><Heart weight="fill" size={10}/></span><span>生日小屋<small>A LITTLE ROOM FOR YOU</small></span></a>
      <div className="header-note"><Sun size={17}/>{lightsOn?'午后 · 客厅 / 阅读角 / 绿植角':'月光入窗 · 小屋依然温柔'}</div>
      <nav aria-label="小屋工具"><button className="top-button sound-toggle" onClick={toggleSound} aria-pressed={sound}>{sound?<SpeakerHigh size={19}/>:<SpeakerSlash size={19}/>}<span>{sound?'音乐已开启':'开启音乐'}</span></button><button className="icon-button help-button" aria-label="玩法说明" onClick={()=>setModal('help')}><Question size={23}/></button></nav>
    </header>

    {!mode.active&&<section className="entry-card" aria-label="进入小屋">
      <span className="entry-eyebrow"><Footprints size={17}/> 第一人称 · 自由探索</span>
      <h1>门开着，<br/>就等你了。</h1>
      <p>房间大了一点，秘密也多了一点。<br/>沿着线索，解开朋友们的小机关。</p>
      <button className="primary" disabled={!ready||!!error} onClick={()=>room.current?.enter()}>走进小屋 <ArrowRight size={19}/></button>
      <div className="entry-help"><span>W A S D 行走 · 鼠标转头</span><span>手机：方向按钮行走 · 滑动转头</span></div>
    </section>}

    {mode.active&&<>
      <aside className="explore-status"><span className="room-pill"><span/> 生日寻宝进行中</span><p>已解开 {puzzles.solved.length} / 5 个小机关</p></aside>
      <div className="walk-guide"><span><kbd>W A S D</kbd> 行走</span><span><Mouse size={16}/> {mode.locked?'移动鼠标转头':'按住画面拖动转头'}</span><span><kbd>E</kbd> 互动</span><span><kbd>Esc</kbd> 释放鼠标</span></div>
      <div className="touch-controls" inert={revealing?true:undefined} aria-label="触屏行走控制">
        {[['前进',0,1,ArrowUp],['左移',-1,0,ArrowLeft],['后退',0,-1,ArrowDown],['右移',1,0,ArrowRight]].map(([name,x,z,Icon])=><button key={name} aria-label={name} onPointerDown={e=>holdMove(e,x,z)} onPointerUp={stopMove} onPointerCancel={stopMove} onLostPointerCapture={stopMove}><Icon size={23}/></button>)}
      </div>
      <button className="touch-interact" disabled={!focus} aria-label="与面前的物品互动" onClick={()=>room.current?.interact()}><Hand size={22}/><span>互动</span></button>
    </>}
    <div className="fps-toolbar" inert={revealing?true:undefined}>
      <button className="top-button" onClick={getHint}><Sparkle size={18}/><span>一点提示</span></button>
      <button className="top-button journal-toggle" onClick={()=>setModal('journal')}><BookOpen size={18}/><span>手记</span></button>
      <button className="top-button collection-toggle" onClick={()=>setModal('collection')}><Gift size={19}/><span>口袋里的心意</span><b>{found.length} / 5</b></button>
      <button className="icon-button" aria-label="回到门口" onClick={()=>room.current?.resetView()}><ArrowCounterClockwise size={19}/></button>
      {mode.active&&!mode.locked&&<button className="top-button capture-button" onClick={()=>room.current?.enter()}><Mouse size={18}/><span>鼠标跟随</span></button>}
    </div>
    <div className={`toast ${toast?'visible':''}`} role="status" aria-live="polite"><Sparkle size={19}/><span>{toast}</span></div>
    {musicTrack==='birthday'&&sound&&!modal&&<div className="now-playing" role="status"><MusicNotes size={20}/> 唱片正在播放：祝你生日快乐</div>}

    {revealing&&<div className="cake-reveal-caption" role="status"><span>最后一份惊喜，正在打开</span><p>把灯光留给烛火，把今天留给你。</p></div>}
    {modal==='puzzle' &&activeGift&&<Dialog label={`${activeGift.place}的机关`} className="puzzle-dialog" onClose={()=>setModal(null)}><PuzzlePanel key={activeGift.id} id={activeGift.id} state={puzzles} onAttempt={handleAttempt} onTone={note=>audio.current?.tone(note)} onGift={()=>{setOpened(found.includes(activeGift.id));setModal('gift');}}/></Dialog>}
    {modal==='clue'&&<Dialog label="发现线索" className="puzzle-dialog" onClose={()=>setModal(null)}><CluePanel id={clueId} taken={puzzles.items.includes('wateringCan')} onTake={()=>{const result=handleAttempt('wateringCan');setModal(null);notify(result.message);}}/></Dialog>}
    {modal==='journal'&&<Dialog label="探索手记" className="journal-dialog" onClose={()=>setModal(null)}><h2>探索手记</h2><p className="puzzle-progress">小机关 {puzzles.solved.length} / 5 · 礼物 {found.length} / 5</p><div className="journal-items">{puzzles.items.length?puzzles.items.map(item=><span key={item}>{({wateringCan:'水壶',key:'黄铜钥匙',record:'小唱片'})[item]}</span>):<span>口袋里的小道具，会记在这里。</span>}</div>{puzzles.clues.length?puzzles.clues.map(id=><section className="journal-note" key={id}><h3>{clueTexts[id].title}</h3><p>{clueTexts[id].text}</p></section>):<p className="clue-copy">还没有发现线索。先去右侧的阅读桌，看看那张彩色明信片。</p>}<button className="primary" onClick={()=>setModal(null)}>合上手记，继续探索</button></Dialog>}

    {modal==='collection'&&<Dialog label="口袋里的心意" onClose={()=>setModal(null)} className="pocket-dialog"><span className="dialog-icon"><Gift size={36}/></span><h2>口袋里的心意</h2><p className="progress-number"><b>{found.length}</b> / 5</p><div className="pocket-list">{gifts.map((g,i)=>{const Icon=icons[g.icon],has=found.includes(g.id);return <button key={g.id} onClick={()=>{if(has)select(g.id);else{setModal(null);setHint(g.id);notify(g.hint);}}} aria-label={has?`查看${g.name}`:`礼物 ${i+1} 的线索`}><span className="pocket-icon">{has?<Icon size={24}/>:<Gift size={24}/>}</span><span><b>{has?g.name:'还没有找到的心意'}</b><small>{has?`来自 ${g.from}`:'查看一条小线索'}</small></span>{has?<Check size={17}/>:<ArrowRight size={17}/>}</button>;})}</div><button className="secondary" onClick={()=>setModal('reset')}>重新探索</button></Dialog>}
    {modal==='gift'&&activeGift&&<Dialog label={opened?activeGift.name:'发现一份生日礼物'} onClose={()=>setModal(null)} className="gift-dialog">
      <span className="dialog-eyebrow">{opened?'一份被你找到的心意':'你找到了一份生日礼物'}</span>
      <div className={`gift-art ${opened?'is-open':''}`} style={{'--gift-color':activeGift.color}}>{opened?<GiftIcon size={65} weight="duotone"/>:<><div className="present-lid"/><div className="present-body"/><span className="present-bow">∞</span></>}</div>
      <h2>{opened?activeGift.name:'有一份心意，写着你的名字。'}</h2>
      {opened?<><p className="gift-message">{activeGift.message}</p><div className="gift-from">来自 {activeGift.from} 的生日祝福 <Heart size={14} weight="fill"/></div><p className="gift-detail">{activeGift.detail}</p><button className="primary" onClick={()=>{setModal(null);if(found.length===5)notify('所有心意都到齐了。再打开茶几上的礼盒，最后一个惊喜在等你。');}}>收好这份心意 <Check size={17}/></button></>:<><p>来自 {activeGift.from} · 藏在{activeGift.place}里</p><button className="primary" onClick={unwrap}>拆开礼物 <Gift size={18}/></button></>}
    </Dialog>}
    {modal==='help'&&<Dialog label="怎么玩" onClose={()=>setModal(null)}><span className="dialog-icon"><House size={34} weight="duotone"/></span><h2>在小屋里，慢慢逛。</h2><div className="help-list"><p><Hand size={24}/><span><b>换个角度看看</b>WASD 行走，鼠标转头；Esc 释放鼠标。也可拖动画面转头，用方向键前后行走、左右转头。</span></p><p><Gift size={24}/><span><b>发现朋友的礼物</b>走近家具，用准星对准后按 E，或点击出现的小圆点。手机用方向按钮走动、滑动转头，点「互动」探索面前物品。</span></p><p><Sparkle size={24}/><span><b>找不到也没关系</b>点「一点提示」，或打开「口袋里的心意」查看线索。点回转箭头可以回到门口，礼物进度会保留。</span></p><p><Cake size={24}/><span><b>最后，许个愿吧</b>门旁的小开关可以开关室内灯光。找齐礼物后，再打开茶几上的礼盒，欣赏蛋糕出场、在月光与烛光中许愿。吹灭蜡烛后，室内灯会重新亮起。打开祝福时行走会暂停；关闭后点击画面继续。进度自动保存在当前浏览器。</span></p></div><button className="primary" onClick={()=>setModal(null)}>知道啦，去逛逛 <ArrowRight size={18}/></button></Dialog>}
    {modal==='wish'&&<Dialog className="candle-wish" label="许一个生日愿望" onClose={()=>setModal(null)}><span className="dialog-icon cake-icon"><Cake size={64} weight="duotone"/></span><span className="dialog-eyebrow">五份礼物，和好多好多的喜欢</span><h2>现在，把时间留给你。</h2><p className="wish-copy">闭上眼睛，悄悄许一个愿望。<br/>不用说出来，我们也会陪它慢慢实现。</p>{birthdayPlayer}<button className="primary" onClick={()=>{setWished(true);room.current?.celebrate();setModal('final');}}>许好啦，吹灭蜡烛 <Sparkle size={19}/></button></Dialog>}
    {modal==='final'&&<Dialog label="生日快乐" onClose={()=>setModal(null)} className="final-dialog"><div className="confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--i':i,'--x':`${(i*43)%100}%`,'--c':['#b3c29d','#d6a485','#e6c277','#b3b9cf'][i%4]}}/>)}</div><span className="dialog-icon"><Heart size={50} weight="duotone"/></span><span className="dialog-eyebrow">HAPPY BIRTHDAY TO YOU</span><h2>{birthday.recipient}，生日快乐。</h2><p className="gift-message">{birthday.final}</p><p className="final-signature">我们一直都在。<br/><span>爱你的朋友们</span></p>{birthdayPlayer}<button className="primary" onClick={()=>setModal(null)}>再在小屋待一会儿 <House size={18}/></button></Dialog>}
    {modal==='reset'&&<Dialog label="重新探索" onClose={()=>setModal(null)}><span className="dialog-icon"><ArrowCounterClockwise size={32}/></span><h2>再收一次生日惊喜？</h2><p>这会清空当前浏览器的礼物进度。<br/>朋友们的祝福，会回到原来的地方等你。</p><div className="dialog-actions"><button className="secondary" onClick={()=>setModal(null)}>保留进度</button><button className="primary" onClick={restart}>重新开始</button></div></Dialog>}
    {portrait&&<OrientationGuide/>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App/>);


