// Original instrumental arrangement of the traditional Happy Birthday melody.
// MIDI pitches in C major; pickup notes lead into four familiar phrases.
export const BIRTHDAY_MELODY = [
  [67,.5],[67,.5],[69,1],[67,1],[72,1],[71,2],
  [67,.5],[67,.5],[69,1],[67,1],[74,1],[72,2],
  [67,.5],[67,.5],[79,1],[76,1],[72,1],[71,1],[69,2],
  [77,.5],[77,.5],[76,1],[72,1],[74,1],[72,3],
];
export const BIRTHDAY_BEAT = 60 / 92;
export const BIRTHDAY_DURATION = BIRTHDAY_MELODY.reduce((sum,[,beats])=>sum+beats,0)*BIRTHDAY_BEAT+2.8;
export const midiFrequency = midi => 440*Math.pow(2,(midi-69)/12);

export function birthdayEvents(){
  const events=[];let beat=0;
  BIRTHDAY_MELODY.forEach(([midi,length])=>{events.push({midi,time:beat*BIRTHDAY_BEAT,duration:Math.max(.5,length*BIRTHDAY_BEAT+1),gain:.42});beat+=length;});
  // Gentle broken triads, quiet enough to keep the melody clear.
  const harmony=[[1,[48,55,60]],[4,[55,59,62]],[7,[55,59,62]],[10,[48,55,60]],[13,[48,55,60]],[16,[53,57,60]],[19,[53,57,60]],[22,[55,59,62]],[25,[48,55,60]]];
  for(const [at,chord] of harmony)chord.forEach((midi,i)=>events.push({midi,time:(at+i*.32)*BIRTHDAY_BEAT,duration:2.1,gain:.11}));
  return events.sort((a,b)=>a.time-b.time);
}
