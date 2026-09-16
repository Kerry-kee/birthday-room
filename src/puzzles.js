export const PUZZLE_STORAGE = 'birthday-little-room-v2';
export const extraObjects = [
  {id:'postcard',place:'阅读桌上的明信片'},
  {id:'clock',place:'停住的挂钟'},
  {id:'wateringCan',place:'绿植角的水壶'},
];
export const clueTexts = {
  postcard: {title:'把一天排成一列',text:'明信片上依次画着：清晨的绿叶、午后的金色阳光、傍晚的粉色云霞。背面写着：书架上的三本书，也想按这个顺序站好。'},
  clock: {title:'留住的下午',text:'挂钟停在 4 点 20 分。钟框后的小字写着：先记下时针，再写下两位分钟。这是我们约好见面的时间。'},
  record: {title:'唱片背面的刻字',text:'从书架暗格里拿到了一张小唱片。封套背面刻着：SOL → MI → DO。把唱片带到唱片机，再按这个顺序弹三个音。'},
  key: {title:'叶子下的小钥匙',text:'浇水后，叶子舒展开来，露出一把黄铜钥匙。钥匙牌上缝着一小片沙发布料。'},
};
export const emptyPuzzles=()=>({solved:[],items:[],clues:[]});
export function normalizePuzzles(value={}){
  const list=(key,allow)=>Array.isArray(value?.[key])?[...new Set(value[key].filter(v=>allow.includes(v)))]:[];
  return {solved:list('solved',['books','drawer','plant','sofa','music']),items:list('items',['wateringCan','key','record']),clues:list('clues',Object.keys(clueTexts))};
}
export function attemptPuzzle(state,id,input){
  const next={solved:[...state.solved],items:[...state.items],clues:[...state.clues]};
  const add=(key,value)=>{if(!next[key].includes(value))next[key].push(value);};
  const done=message=>({state:next,success:true,message});
  const fail=message=>({state,success:false,message});
  if(id==='postcard'||id==='clock'){add('clues',id);return done('线索已经记进手记。');}
  if(id==='wateringCan'){add('items','wateringCan');return done('拿到水壶了。去窗边看看那盆垂着叶子的植物吧。');}
  if(state.solved.includes(id))return done('这个小机关已经解开了。');
  if(id==='books'){
    if(JSON.stringify(input)!==JSON.stringify(['green','gold','pink']))return fail('书架轻轻响了一声，但暗格没有打开。再想想一天中颜色出现的先后。');
    add('solved',id);add('items','record');add('clues','record');return done('三本书对齐了！暗格里有一份礼物，还有一张写着音符的唱片。');
  }
  if(id==='drawer'){
    if(input!=='420')return fail('锁扣没有弹开。密码是一个小时数字，加上两位分钟。');
    add('solved',id);return done('咔哒。锁扣弹开，抽屉里藏着一份礼物。');
  }
  if(id==='plant'){
    if(!state.items.includes('wateringCan'))return fail('手边还没有水壶。入口右侧的绿植角有一个。');
    add('solved',id);add('items','key');add('clues','key');return done('叶子慢慢舒展开。花盆里有一份礼物，还有一把缝着布片的小钥匙。');
  }
  if(id==='sofa'){
    if(!state.items.includes('key'))return fail('抱枕的小口袋有一把锁。先照料窗边的植物，或许能找到钥匙。');
    add('solved',id);return done('钥匙正好合适。小口袋打开了，里面的礼物还带着暖意。');
  }
  if(id==='music'){
    if(!state.items.includes('record'))return fail('唱片机还空着。书架的暗格里，似乎放着一张唱片。');
    if(JSON.stringify(input)!==JSON.stringify(['SOL','MI','DO']))return fail('旋律还差一点。翻翻手记，看看唱片封套背面的刻字。');
    add('solved',id);return done('熟悉的旋律响起，唱片机旁的小盒子打开了。');
  }
  return fail('这里暂时没有可以操作的机关。');
}
export function nextPuzzleHint(state,found){
  if(!state.clues.includes('postcard')&&!state.solved.includes('books'))return '去右侧的阅读桌，看看桌上那张彩色明信片。';
  if(!state.solved.includes('books'))return '按明信片上清晨、午后、傍晚的颜色顺序，按下书架的三本书。';
  if(!found.includes('books'))return '书架暗格已经打开，回去收下那份礼物吧。';
  if(!state.items.includes('wateringCan'))return '入口右侧的绿植角，木架上放着一只绿色水壶。';
  if(!state.solved.includes('plant'))return '带水壶去后窗边，给垂着叶子的植物浇一点水。';
  if(!state.solved.includes('sofa'))return '植物给了你一把钥匙。把它带到左侧沙发的抱枕旁。';
  if(!state.clues.includes('clock')&&!state.solved.includes('drawer'))return '阅读桌旁的挂钟停住了，走近读一读钟框上的字。';
  if(!state.solved.includes('drawer'))return '后窗右侧有一个密码抽屉。时针的数字，后面跟着两位分钟。';
  if(!state.solved.includes('music'))return '去左侧唱片机，按唱片封套的刻字弹奏。音符也记在了手记里。';
  if(found.length<5)return '机关都解开了，打开口袋查看还有哪份礼物没有收下。';
  return '心意都收齐了，走到中间的蛋糕旁许个愿吧。';
}
