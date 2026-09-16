import { birthdayEvents, BIRTHDAY_DURATION, midiFrequency } from './birthday-score.js';

// Locally synthesized music. No recording, vocals, or external audio requests.
export function createAudio({ onState = () => {} } = {}) {
  let ctx, master, timer, finishTimer, step=0, generation=0, disposed=false;
  let track='ambient',playing=false;
  const voices=new Set();
  const notes=[261.63,329.63,392,523.25,440,392,329.63,293.66,261.63,329.63,392,587.33,523.25,392,349.23,329.63];
  const publish=()=>onState({playing,track});
  async function ready(){
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if(!master){master=ctx.createGain();master.gain.value=.16;master.connect(ctx.destination);}
    await ctx.resume();
  }
  function note(f,length=1.6,delay=0,volume=.35){
    const time=ctx.currentTime+delay;
    // A soft fundamental and a faint bell harmonic make a music-box timbre.
    for(const [multiple,level] of [[1,1],[2,.16]]){
      const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=f*multiple;
      gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume*level,time+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,time+length);
      osc.connect(gain);gain.connect(master);voices.add(osc);osc.start(time);osc.stop(time+length+.02);
      osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
    }
  }
  function clear(){
    clearInterval(timer);clearTimeout(finishTimer);timer=finishTimer=null;
    for(const osc of voices){try{osc.stop();}catch{}osc.disconnect();}voices.clear();
  }
  async function play(nextTrack){
    if(disposed)return;
    if(playing&&track===nextTrack)return;
    const operation=++generation;clear();track=nextTrack;playing=false;publish();
    try{await ready();}catch(error){if(operation===generation){playing=false;publish();}throw error;}
    if(disposed||operation!==generation)return;
    playing=true;publish();
    if(track==='birthday'){
      for(const event of birthdayEvents())note(midiFrequency(event.midi),event.duration,event.time,event.gain);
      finishTimer=setTimeout(()=>{if(operation!==generation)return;clear();playing=false;publish();},BIRTHDAY_DURATION*1000);
    }else{
      note(notes[step++%notes.length]);
      timer=setInterval(()=>{note(notes[step++%notes.length]);if(step%4===0)note(130.81,2,0,.18);},580);
    }
  }
  function stop(){generation++;clear();playing=false;publish();}
  return {
    start:()=>play(track),
    playBirthday:()=>play('birthday'),
    stop,
    reset(){stop();track='ambient';publish();},
    chime(){if(playing&&track!=='birthday')[523.25,659.25,783.99].forEach((n,i)=>note(n,1.2,i*.12));},
    tone(name){if(playing&&track!=='birthday')note(({DO:523.25,MI:659.25,SOL:783.99})[name]||523.25,.8);},
    getState:()=>({playing,track,voiceCount:voices.size}),
    dispose(){disposed=true;generation++;clear();if(ctx)ctx.close().catch(()=>{});},
  };
}
