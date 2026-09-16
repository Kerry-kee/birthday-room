import React,{useState} from 'react';
import { BookOpen, LockSimple, Plant, MusicNotes, Key, Drop, Gift } from '@phosphor-icons/react';
import { clueTexts } from './puzzles';
import './puzzles.css';

export function PuzzlePanel({id,state,onAttempt,onGift,onTone}){
  const [sequence,setSequence]=useState([]),[code,setCode]=useState(''),[feedback,setFeedback]=useState('');
  const solved=state.solved.includes(id);
  function attempt(value){const result=onAttempt(id,value);setFeedback(result.message);if(!result.success)setSequence([]);}
  function choose(value){const next=[...sequence,value];setSequence(next);if(next.length===3)attempt(next);}
  if(solved)return <><span className="dialog-icon"><Gift size={44}/></span><h2>小机关解开了。</h2><p className="puzzle-feedback" role="status">{feedback||'里面的心意，一直在等你来发现。'}</p>{id==='books'&&<p>也拿到了一张唱片，封套刻字已记进手记。</p>}{id==='plant'&&<p>还发现了一把黄铜钥匙，钥匙牌上有一片沙发布料。</p>}<button className="primary" onClick={onGift}>看看里面的礼物 <Gift size={18}/></button></>;
  return <>
    <span className="dialog-eyebrow">朋友们留的小机关</span>
    {id==='books'&&<><span className="puzzle-emblem"><BookOpen size={38}/></span><h2>把一天排成一列</h2><p>三本书的书脊上有按扣。<br/>按下正确的颜色顺序，打开藏在背后的暗格。</p><div className="book-puzzle">{[['pink','晚霞粉'],['green','叶子绿'],['gold','日光金']].map(([value,label])=><button key={value} style={{'--book':{pink:'#d7a294',green:'#93ab88',gold:'#d8b16b'}[value]}} aria-label={`按下${label}书脊`} onClick={()=>choose(value)}><span/>{label}<small>{sequence.indexOf(value)>=0?sequence.indexOf(value)+1:'·'}</small></button>)}</div><p className="puzzle-caption">{state.clues.includes('postcard')?'手记：清晨的绿叶 → 午后的日光 → 傍晚的云霞':'阅读桌上那张彩色明信片，也许知道答案。'}</p><button className="text-action" onClick={()=>setSequence([])}>重新排列</button></>}
    {id==='drawer'&&<><span className="puzzle-emblem"><LockSimple size={38}/></span><h2>约好的那个时间</h2><p>抽屉上是一把三位数字锁。<br/>纸条写着：“时针在前，分钟在后。”</p><form onSubmit={e=>{e.preventDefault();attempt(code);}}><label className="code-label" htmlFor="drawer-code">三位密码</label><input id="drawer-code" className="code-input" type="text" inputMode="numeric" autoComplete="off" pattern="[0-9]{3}" maxLength={3} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="···" required/><button className="primary" type="submit">试着打开 <Key size={18}/></button></form><p className="puzzle-caption">{state.clues.includes('clock')?'手记：挂钟停在 4 点 20 分。':'房间里那只停住的挂钟，也许留下了时间。'}</p></>}
    {id==='plant'&&<><span className="puzzle-emblem"><Plant size={40}/></span><h2>它在等一小口水。</h2><p>窗边的植物垂着叶子。<br/>花盆上写着：“请先照顾好我，再看叶子下面。”</p><div className="item-requirement"><Drop size={20}/>{state.items.includes('wateringCan')?'口袋里有水壶，可以浇水。':'需要一只水壶 · 到入口右侧的绿植角找找'}</div><button className="primary" onClick={()=>attempt()}>{state.items.includes('wateringCan')?'轻轻浇一点水':'试着照料它'} <Drop size={18}/></button></>}
    {id==='sofa'&&<><span className="puzzle-emblem"><Key size={38}/></span><h2>抱枕藏着一个小口袋</h2><p>口袋拉链上扣着一把小锁。<br/>锁旁绣着一片绿叶，像是在提醒你什么。</p><div className="item-requirement"><Key size={20}/>{state.items.includes('key')?'黄铜钥匙已经在口袋里。':'还没有钥匙 · 留意窗边的植物'}</div><button className="primary" onClick={()=>attempt()}>用钥匙打开 <Key size={18}/></button></>}
    {id==='music'&&<><span className="puzzle-emblem"><MusicNotes size={40}/></span><h2>把熟悉的旋律找回来</h2><p>{state.items.includes('record')?'你把书架里找到的唱片放了上去。':'唱片机里空空的，旁边的小盒子上有三个音符按键。'}<br/>按封套刻字的顺序，弹奏三个音。</p><div className="item-requirement">{state.items.includes('record')?'唱片已放入 · 按键同时显示音名，无需听音辨认':'需要唱片 · 藏在书架的暗格里'}</div><div className="music-puzzle">{['DO','MI','SOL'].map((note,i)=><button key={note} disabled={!state.items.includes('record')} onClick={()=>{onTone(note);choose(note);}}><span>{note}</span><small>{['哆','咪','嗦'][i]}</small></button>)}</div><p className="puzzle-caption">{state.items.includes('record')?'封套刻字：SOL → MI → DO':'先解开书架机关，拿到唱片。'}</p><div className="sequence-readout" aria-live="polite">{sequence.join(' → ')||'等待你的旋律'}</div><button className="text-action" onClick={()=>setSequence([])}>重新弹奏</button></>}
    {feedback&&<p className="puzzle-feedback" role="status">{feedback}</p>}
  </>;
}

export function CluePanel({id,onTake,taken}){
  if(id==='wateringCan')return <><span className="puzzle-emblem"><Drop size={42}/></span><h2>一只装好水的小水壶</h2><p>绿植架上留着一只水壶。<br/>吊牌上写着：“给窗边的朋友送一点水。”</p><button className="primary" onClick={onTake}>{taken?'水壶已在口袋里':'拿起水壶'} <Drop size={18}/></button></>;
  const clue=clueTexts[id];
  return <><span className="dialog-eyebrow">你发现了一条线索</span><h2>{clue.title}</h2>{id==='postcard'&&<div className="postcard-colors"><span>绿叶</span><span>日光</span><span>晚霞</span></div>}{id==='clock'&&<div className="clock-reading">4 : 20</div>}<p className="clue-copy">{clue.text}</p><p className="puzzle-caption">已记入探索手记，可以随时回看。</p></>;
}
