import * as THREE from 'three';
import { createFirstPerson } from './first-person';
import { gamePoint } from './landscape';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { batchSurfaces } from './minitool-gpu';

export function createRoom(container, { onSelect, onReady, onError, onMode, onFocus, onLights, markerElements, reducedMotion }) {
  const scene = new THREE.Scene();
  const offline=import.meta.env.MODE==='minitool';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, offline?1.5:2));
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const inkEffect=offline?null:new OutlineEffect(renderer,{defaultThickness:.0033,defaultColor:[.04,.05,.03],defaultAlpha:1});
  const shadeRamp=new THREE.DataTexture(new Uint8Array([185,230,255]),3,1,THREE.RedFormat);
  shadeRamp.minFilter=shadeRamp.magFilter=THREE.NearestFilter;shadeRamp.needsUpdate=true;
  container.prepend(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(70,1,.055,60);
  scene.background = new THREE.Color('#eee5d1');
  const hemi = new THREE.HemisphereLight('#ffffff', '#e0e4d7', 1.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff5dc', 1.1); sun.position.set(-3,9,5); sun.castShadow = false;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-9; sun.shadow.camera.right=9;
  sun.shadow.camera.top=9; sun.shadow.camera.bottom=-9; sun.shadow.normalBias=.035;
  sun.shadow.bias=-.0002; sun.shadow.radius=4; scene.add(sun);
  const fill = new THREE.DirectionalLight('#ecf1e8',.35); fill.position.set(6,5,-2); scene.add(fill);
  // Cool moonlight enters through the window; reflected sky light keeps the room readable.
  const moonFill=new THREE.HemisphereLight('#b8cdf2','#727f9f',0);scene.add(moonFill);
  const moonLight=new THREE.DirectionalLight('#b9d2ff',0);moonLight.position.set(-1.7,3.43,-4.85);moonLight.target.position.set(.2,.35,.5);scene.add(moonLight,moonLight.target);
  const materials = new Map();
  const mat = color => { if(!materials.has(color)) materials.set(color,new THREE.MeshToonMaterial({color,gradientMap:shadeRamp})); return materials.get(color); };
  const root = new THREE.Group(); scene.add(root);
  function mesh(geo,color,x,y,z,parent=root) { const m=new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m; }
  function box(w,h,d,color,x,y,z,r=.05,parent=root) { return mesh(r && (!offline||r>.015) ? new RoundedBoxGeometry(w,h,d,offline?1:2,r) : new THREE.BoxGeometry(w,h,d),color,x,y,z,parent); }
  function ball(r,color,x,y,z,parent=root) { return mesh(new THREE.SphereGeometry(r,offline?12:24,offline?8:16),color,x,y,z,parent); }
  function cyl(rt,rb,h,color,x,y,z,parent=root) { return mesh(new THREE.CylinderGeometry(rt,rb,h,offline?16:40),color,x,y,z,parent); }
  function group(x,y,z,rotation=0) { const g = new THREE.Group(); g.position.set(x,y,z);g.rotation.y=rotation;root.add(g); return g; }
  function line(points,color,r=.018,parent=root) { return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,6,false),color,0,0,0,parent); }
  const targets = {}, anchors = {}, animations = [];
  function target(id,g,anchor) { targets[id]=g; anchors[id]=new THREE.Vector3(...anchor); g.traverse(o => {o.userData.target=id;}); }
  // A thick wooden dollhouse foundation and individually laid floorboards.
  box(12.5,.35,10.8,'#bb926d',0,-.2,0,.12);
  box(12.35,.14,10.65,'#e6c49c',0,.03,0,.04);
  for(let row=0;row<22;row++) for(let col=0;col<6;col++) {
    const x=-5.2+col*2.08, z=-4.94+row*.47;
    box(2.063,.055,.45,['#d6b28a','#dfbd96','#e4c49f','#dbb88e'][(row+col*3)%4],x,.12,z,.012);
  }
  // Enclosed interior: every direction has a wall, skirting, and ceiling.
  box(12.5,4.45,.17,'#ece4cf',0,2.24,-5.3,.03);
  box(.18,4.45,10.75,'#e9dcc4',-6.18,2.24,0,.03);
  box(12.3,.18,.13,'#c1ac86',0,.27,-5.16,.02);
  box(.13,.18,10.5,'#c1ac86',-6.04,.27,0,.02);
  box(12.58,.14,.28,'#d9c8a6',0,4.48,-5.3,.04);
  box(.28,.14,10.85,'#d9c8a6',-6.18,4.48,0,.04);
  box(.18,4.45,10.75,'#e8ddc6',6.18,2.24,0,.03);
  box(12.5,4.45,.17,'#e9dfc9',0,2.24,5.34,.03);
  const ceiling=box(12.55,.15,10.9,'#f4ecda',0,4.53,0,.02);
  ceiling.castShadow=false;
  for(const x of [-6.04,6.04]){
    box(.13,.18,10.5,'#bca782',x,.27,0,.02);
    box(.15,.14,10.58,'#d6c49e',x,4.35,0,.02);
  }
  box(12.3,.18,.13,'#c1ac86',0,.27,5.2,.02);
  box(12.3,.14,.15,'#d6c49e',0,4.35,5.2,.02);
  // Entry door, coat hooks, and a bench make the previously open side a real room.
  box(1.52,2.9,.13,'#ae9671',.75,1.62,5.2,.04);
  box(1.34,2.72,.09,'#a9b196',.75,1.6,5.1,.04);
  for(const y of [.98,2.15])box(1.06,.91,.035,'#b9c0a6',.75,y,5.04,.04);
  ball(.06,'#ba985c',1.23,1.52,4.98);
  const lightSwitch=group(-.43,1.58,5.12);
  box(.28,.38,.07,'#f7edda',0,0,0,.035,lightSwitch);
  const rocker=box(.16,.25,.06,'#a8b395',0,0,-.055,.025,lightSwitch);rocker.rotation.x=-.18;
  const switchDot=ball(.015,new THREE.MeshBasicMaterial({color:'#d2e59b'}),0,-.14,-.055,lightSwitch);
  target('lightSwitch',lightSwitch,[-.43,1.83,5.01]);
  const entry=group(-3.75,.17,5.04);
  box(2.17,.14,.43,'#c8a579',0,.54,0,.05,entry);
  for(const x of [-.85,.85])box(.09,.5,.3,'#ac8c62',x,.25,0,.025,entry);
  box(1.8,.13,.12,'#ae8d64',-3.65,2.5,5.16,.035);
  for(const x of [-4.25,-3.65,-3.05]){cyl(.025,.025,.13,'#9c8058',x,2.43,5.07);ball(.05,'#b39262',x,2.43,5.01);}
  // Right-wall framed landscape and a shallow ledge.
  box(.12,1.37,1.88,'#b49770',6.01,2.57,-.37,.04);
  box(.035,1.2,1.72,'#f1ecd8',5.93,2.57,-.37,.015);
  const artSun=ball(.25,'#d6b475',5.9,2.81,-.68);artSun.scale.x=.035;
  const artHill=ball(.6,'#9daa88',5.88,2.3,-.14);artHill.scale.set(.012,.55,1.15);
  box(.31,.1,2.04,'#c5a379',5.92,1.79,-.37,.025);
  // Warm pendant adds interior light without casting a ceiling-sized shadow.
  cyl(.018,.018,.43,'#b69e75',.4,4.18,-.4);
  const pendant=cyl(.26,.49,.35,'#ecdab1',.4,3.83,-.4);pendant.castShadow=false;
  const innerLight=new THREE.PointLight('#ffe5bb',2,10,2);innerLight.position.set(.4,3.51,-.4);scene.add(innerLight);
  const backDecorStart=root.children.length;
  // Window, warm landscape, moulding, and gathered linen curtains.
  box(3.12,2.34,.14,'#f9f0d8',-1.7,2.87,-3.13,.06);
  const skyMaterial=new THREE.MeshBasicMaterial({color:'#b8d6cc'});
  box(2.82,2.02,.08,skyMaterial,-1.7,2.87,-3.02,.015);
  const moonMaterial=new THREE.MeshBasicMaterial({color:'#fff0b6'});
  const sunDisc = cyl(.28,.28,.02,moonMaterial,-1,3.43,-2.96); sunDisc.rotation.x=Math.PI/2;
  const moonCutMaterial=new THREE.MeshBasicMaterial({color:'#303e61',transparent:true,opacity:0});
  const moonCut=cyl(.245,.245,.025,moonCutMaterial,-.87,3.51,-2.935);moonCut.rotation.x=Math.PI/2;
  const starMaterial=new THREE.MeshBasicMaterial({color:'#dbe6ff',transparent:true,opacity:0});
  for(const [x,y] of [[-2.7,3.6],[-2.1,3.35],[-1.95,3.68],[-.65,2.97],[-2.55,2.97]])ball(.018,starMaterial,x,y,-2.95);
  const landscape = ball(1,'#a1b69b',-2.3,2.25,-2.98); landscape.scale.set(.8,.34,.018);
  const landscape2 = ball(1,'#c0c8a7',-.95,2.16,-2.95); landscape2.scale.set(.6,.23,.018);
  box(.075,2.12,.12,'#fcf5dd',-1.7,2.87,-2.88,.01);
  box(2.88,.075,.12,'#fcf5dd',-1.7,2.83,-2.88,.01);
  box(3.5,.13,.48,'#faf0d7',-1.7,1.73,-2.94,.04);
  box(3.65,.07,.07,'#8d7351',-1.7,4.14,-2.7,.025);
  for(const x of [-3.25,-.2]) for(let i=0;i<5;i++) {
    const curtain = cyl(.105,.14,2.22,'#f4ebd4',x+(i-2)*.12,2.9,-2.7);
    curtain.castShadow=false;
  }
  // Birthday bunting, hanging from the back wall.
  line([[-3.8,4.07,-2.83],[-1,3.82,-2.83],[1.2,3.93,-2.83],[3.8,4.18,-2.83]],'#a28b65',.012);
  const flagColors=['#c7957c','#b4bb8e','#e6c076','#f1d9b4','#a8bcb0'];
  for(let i=0;i<11;i++) {
    const x=-3.6+i*.7,y=3.84+Math.pow((x+.5)/5,2)*.42;
    const shape=new THREE.Shape();shape.moveTo(-.17,0);shape.lineTo(.17,0);shape.lineTo(0,-.3);shape.closePath();
    const flag=mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:flagColors[i%5],side:THREE.DoubleSide}),x,y,-2.81); flag.castShadow=false;
  }
  root.children.slice(backDecorStart).forEach(o=>{o.position.z-=2;});
  const moonPoolMaterial=new THREE.MeshBasicMaterial({color:'#aacbff',transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(const x of [-2.35,-1.17])for(const z of [-3.75,-2.12]){const pool=mesh(new THREE.PlaneGeometry(1.05,1.46),moonPoolMaterial,x,.159,z);pool.rotation.x=-Math.PI/2;pool.userData.moonPool=true;}
  const daySky=new THREE.Color('#b8d6cc'),nightSky=new THREE.Color('#303e61'),dayDisc=new THREE.Color('#fff0b6'),nightDisc=new THREE.Color('#e1eaff');
  // Framed art on the left wall.
  function art(z,y,color) {
    box(.13,1.04,.82,'#a88761',-6.01,y,z,.04);
    box(.025,.89,.67,'#fff6de',-5.93,y,z,.01);
    const a = ball(.2,color,-5.91,y+.05,z); a.scale.set(.045,1,1);
    box(.025,.06,.4,'#a9ad86',-5.90,y-.26,z,.01);
  }
  art(-.55,2.92,'#d9aa69'); art(1.03,3.18,'#a8b6a1');
  // Plush sage sofa, angled inward.
  const sofa=group(-4.65,.17,-1.25,Math.PI/2);
  for(const x of [-1.22,1.22]) for(const z of [-.45,.45]) cyl(.065,.06,.27,'#8e7152',x,.12,z,sofa);
  box(3,.52,1.4,'#93a384',0,.46,0,.15,sofa);
  box(2.94,1.1,.34,'#a5b394',0,1.13,-.54,.15,sofa);
  for(const x of [-1.4,1.4]) box(.32,.75,1.45,'#aab89a',x,.87,0,.14,sofa);
  for(const x of [-.65,.65]) box(1.29,.26,1.13,'#bcc5a7',x,.82,.09,.11,sofa);
  const pillow=box(.68,.65,.23,'#eeddbb',-.81,1.19,-.16,.15,sofa);pillow.rotation.z=.17;pillow.rotation.x=-.2;
  const pillow2=box(.62,.63,.23,'#c69376',.81,1.18,-.16,.14,sofa);pillow2.rotation.z=-.16;
  box(.7,.065,1.1,'#e8dbc0',.68,.99,.25,.04,sofa);
  for(let i=0;i<6;i++) box(.025,.012,.99,'#cbbd9d',.41+i*.105,1.03,.27,.002,sofa);
  target('sofa',sofa,[-4.35,1.48,-.42]);
  // Round woven rug, offset under the coffee table.
  const rug=cyl(2.05,2.05,.026,'#ddd1ac',.25,.177,.75);rug.scale.z=.82;
  for(let r=.7;r<2.04;r+=.35) { const ring=mesh(new THREE.TorusGeometry(r,.012,5,64),'#c9bd99',.25,.194,.75);ring.rotation.x=Math.PI/2;ring.scale.y=.82; }
  const table=group(.25,.2,.48);
  for(const [x,z] of [[-.65,-.4],[.65,-.4],[0,.55]]) { const leg=cyl(.07,.055,.6,'#a87f52',x,.3,z,table);leg.rotation.z=-x*.18; }
  const tableTop=cyl(1.05,1.03,.16,'#cda878',0,.7,0,table);tableTop.scale.z=.8;
  // Cake, berries and a tiny birthday candle.
  const cake=group(.24,.99,.48);
  cyl(.5,.5,.045,'#faf0d9',0,0,0,cake);
  cyl(.4,.41,.3,'#f2d9b7',0,.16,0,cake);
  cyl(.41,.41,.095,'#fff2d7',0,.325,0,cake);
  for(let i=0;i<9;i++) { const a=i/9*Math.PI*2;ball(.058,'#fff3dd',Math.cos(a)*.35,.373,Math.sin(a)*.35,cake); }
  for(const [x,z] of [[-.2,-.12],[.17,-.13],[.18,.16],[-.18,.17]]) {const berry=ball(.075,'#c86c57',x,.414,z,cake);berry.scale.y=1.2;}
  cyl(.033,.033,.3,'#a0b79f',0,.54,0,cake);
  const flame=ball(.06,new THREE.MeshBasicMaterial({color:'#fff1c5'}),0,.745,0,cake);flame.scale.set(.75,1.5,.75);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const glowCtx=glowCanvas.getContext('2d'),glowGradient=glowCtx.createRadialGradient(32,32,0,32,32,32);glowGradient.addColorStop(0,'rgba(255,219,140,.6)');glowGradient.addColorStop(.25,'rgba(255,165,68,.25)');glowGradient.addColorStop(1,'rgba(255,145,40,0)');glowCtx.fillStyle=glowGradient;glowCtx.fillRect(0,0,64,64);
  const candleGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));candleGlow.position.set(0,.745,0);candleGlow.scale.set(.38,.48,1);cake.add(candleGlow);
  target('cake',cake,[.24,2.05,.48]);
  const candleLight=new THREE.PointLight('#ffce91',0,13,1.7);candleLight.position.set(.24,1.78,.48);scene.add(candleLight);
  // A closed, opaque present surrounds the cake until the final interaction.
  const cakeCover=group(.24,.99,.48),coverPanels=[];
  const coverPaper=new THREE.MeshToonMaterial({color:'#b9c6a4',gradientMap:shadeRamp,transparent:true});
  const coverRibbon=new THREE.MeshToonMaterial({color:'#efd5a4',gradientMap:shadeRamp,transparent:true});
  for(const [x,z,axis,sign] of [[0,-.55,'x',-1],[0,.55,'x',1],[-.55,0,'z',1],[.55,0,'z',-1]]){
    const hinge=new THREE.Group();hinge.position.set(x,0,z);cakeCover.add(hinge);
    box(axis==='x'?1.16:.055,.91,axis==='x'?.055:1.16,coverPaper,0,.455,0,.015,hinge);
    box(axis==='x'?.13:.064,.91,axis==='x'?.064:.13,coverRibbon,0,.455,0,.006,hinge);
    coverPanels.push({hinge,axis,sign});
  }
  const cakeLid=new THREE.Group();cakeLid.position.y=.94;cakeCover.add(cakeLid);
  box(1.23,.13,1.23,coverPaper,0,0,0,.035,cakeLid);
  box(.14,.015,1.24,coverRibbon,0,.074,0,.005,cakeLid);box(1.24,.015,.14,coverRibbon,0,.074,0,.005,cakeLid);
  for(const sign of [-1,1]){const bow=mesh(new THREE.TorusGeometry(.15,.026,8,24),coverRibbon,sign*.13,.17,0,cakeLid);bow.rotation.y=sign*.3;bow.rotation.z=sign*.45;}
  cakeCover.traverse(o=>{o.userData.target='cake';});
  cake.visible=false;
  // A mug on the coffee table.
  cyl(.12,.1,.19,'#e6b982',-.61,1.03,.85);cyl(.095,.095,.007,'#6c4c32',-.61,1.13,.85);
  const handle=mesh(new THREE.TorusGeometry(.09,.022,8,18),'#e6b982',-.46,1.04,.85);handle.rotation.y=Math.PI/2;
  // Tall bookcase with irregularly arranged books and keepsakes.
  const shelf=group(4.87,.15,-4.76);
  box(1.83,3.34,.21,'#b28c64',0,1.67,-.24,.03,shelf);
  for(const x of [-.88,.88]) box(.12,3.36,.68,'#bd976e',x,1.67,0,.03,shelf);
  for(const y of [.1,1.09,2.13,3.3]) box(1.86,.12,.72,'#c7a47a',0,y,0,.025,shelf);
  const bookColors=['#a4b39c','#e6c495','#bd8871','#8d9a91','#e8d8b6'];
  for(let level=0;level<3;level++) for(let i=0;i<(level===1?0:6);i++) {
    const h=.43+(i%3)*.115,x=-.65+i*.21;
    const b=box(.16,h,.4,bookColors[(i+level)%5],x,.2+level*1.025+h/2,.07,.015,shelf);
    if(i===5)b.rotation.z=-.13;
    box(.1,.021,.006,'#f2e2c6',x,.3+level*1.025,.276,.001,shelf);
  }
  const clock=cyl(.245,.245,.09,'#f0dcb3',.45,1.47,.13,shelf);clock.rotation.x=Math.PI/2;
  box(.015,.16,.02,'#7a6953',.45,1.51,.19,.002,shelf);box(.13,.015,.02,'#7a6953',.505,1.44,.19,.002,shelf);
  const puzzleBooks=[];
  for(const [i,color] of ['#d7a294','#93ab88','#d8b16b'].entries())puzzleBooks.push(box(.23,.7,.43,color,-.58+i*.28,1.53,.1,.025,shelf));
  target('books',shelf,[4.6,1.88,-4.24]);
  // Low cabinet by the window, with one inviting drawer.
  const cabinet=group(1.1,.16,-4.47);
  for(const x of [-.6,.6]) for(const z of [-.28,.28]) box(.09,.23,.1,'#a6825a',x,.11,z,.025,cabinet);
  box(1.65,.86,.84,'#c3a077',0,.62,0,.06,cabinet);
  box(1.75,.12,.93,'#dfc298',0,1.09,0,.04,cabinet);
  const drawerParts=[];
  for(const y of [.42,.8]) { const front=box(1.47,.32,.08,'#d2b18a',0,y,.44,.025,cabinet),knob=cyl(.047,.047,.06,'#907347',0,y,.51,cabinet);knob.rotation.x=Math.PI/2;if(y>.5)drawerParts.push(front,knob); }
  target('drawer',cabinet,[1.1,1.24,-3.92]);
  function plant(x,y,z,scale=1) {
    const g=group(x,y,z);g.scale.setScalar(scale);
    cyl(.27,.2,.45,'#c89070',0,.23,0,g);cyl(.28,.28,.07,'#d3a382',0,.43,0,g);cyl(.23,.23,.025,'#665640',0,.462,0,g);
    for(let i=0;i<7;i++) {
      const a=i*2.4,h=.78+(i%3)*.19,dx=Math.cos(a)*.32,dz=Math.sin(a)*.32;
      line([[0,.46,0],[dx*.4,h-.2,dz*.4],[dx,h,dz]],'#738564',.016,g);
      const leaf=ball(.2,['#8f9f75','#a5b187','#6f8c6e'][i%3],dx,h,dz,g);leaf.scale.set(.7,1.65,.36);leaf.rotation.set(.3,a,dx>0?-.6:.6);
    }
    return g;
  }
  const windowPlant=plant(-2.64,1.8,-4.85,.67);target('plant',windowPlant,[-2.64,2.65,-4.64]);
  plant(5.1,.17,2.4,1.4);
  // Side table and record player.
  const music=group(-1.85,.17,.65);
  for(const x of [-.42,.42]) for(const z of [-.3,.3]) box(.075,.65,.075,'#9a7754',x,.32,z,.02,music);
  box(1.19,.12,.97,'#c8a375',0,.67,0,.045,music);
  box(.96,.2,.73,'#b27e5b',0,.84,0,.055,music);
  const lid=box(.96,.66,.06,'#c89773',0,1.23,-.34,.035,music);lid.rotation.x=-.13;
  const record=cyl(.28,.28,.03,'#49463b',-.08,.958,.02,music),recordLabel=cyl(.077,.077,.035,'#d9aa79',-.08,.963,.02,music);
  box(.095,.003,.027,'#ecd8ad',.145,.017,0,.002,record);
  record.visible=false;recordLabel.visible=false;
  line([[.34,.975,-.23],[.35,.985,.17],[.15,.985,.25]],'#d8c9a7',.022,music);
  target('music',music,[-1.84,1.5,.68]);
  // Floor lamp casts a warm pool beside the couch.
  cyl(.28,.31,.065,'#bda57e',-5.03,.21,-2.98);
  cyl(.028,.028,2.2,'#a68b61',-5.03,1.3,-2.98);
  cyl(.3,.49,.55,'#f5ddb0',-5.03,2.57,-2.98);
  const lamp=new THREE.PointLight('#ffcd85',2,3);lamp.position.set(-5.03,2.33,-2.98);scene.add(lamp);
  // Sleeping cat on a little cushion.
  const cat=group(-3.1,.24,1.15,.28);
  const cushion=cyl(.59,.59,.13,'#c4a48b',0,0,0,cat);cushion.scale.z=.76;
  const body=ball(.36,'#d6a56f',0,.23,0,cat);body.scale.set(1.23,.74,.85);
  const head=ball(.235,'#e5bb86',.29,.38,.13,cat);head.scale.set(1,.91,.85);
  for(const x of [.15,.4]) { const ear=mesh(new THREE.ConeGeometry(.105,.22,3),'#d6a56f',x,.6,.11,cat);ear.rotation.z=x<.2?.24:-.24; }
  for(const x of [.2,.37]) line([[x-.035,.397,.312],[x,.383,.321],[x+.028,.394,.315]],'#735d46',.009,cat);
  ball(.023,'#b77565',.29,.348,.334,cat);
  line([[-.31,.26,.05],[-.39,.28,.26],[-.21,.28,.32],[.02,.27,.26]],'#bd8959',.066,cat);
  target('cat',cat,[-3.1,1.1,1.15]);
  // A few birthday parcels and softly bobbing balloons.
  function parcel(x,z,size,color) {const g=group(x,.17,z);box(size,size*.8,size,color,0,size*.4,0,.06,g);box(size*1.06,.12,size*1.06,color,0,size*.84,0,.025,g);box(.1,size*.84,size*1.02,'#f3e2bc',0,size*.43,0,.006,g);box(size*1.02,.015,.1,'#f3e2bc',0,size*.91,0,.004,g);for(const k of [-1,1]) { const bow=mesh(new THREE.TorusGeometry(.12,.025,8,20),'#f3e2bc',k*.1,size*.99,0,g);bow.rotation.y=.5;bow.rotation.z=k*.4; }return g; }
  parcel(4.74,3.8,.57,'#bbbd98');parcel(5.3,4.1,.42,'#d7a186');
  for(let i=0;i<3;i++) {
    const x=4.88+(i-1)*.45,y=2.25+(i%2)*.55,z=3.65;
    const g=group(x,y,z);const b=ball(.31,['#dfb993','#adbba3','#e6d4ae'][i],0,0,0,g);b.scale.y=1.22;
    mesh(new THREE.ConeGeometry(.045,.09,10),'#c8ac84',0,-.39,0,g).rotation.x=Math.PI;
    line([[0,-.38,0],[.08,-1,0],[4.9-x,-y+.37,0]],'#b7a386',.009,g);
    animations.push({g,y,phase:i*1.7});
  }
  // A reading corner and a potting station occupy the newly expanded space.
  const desk=group(4.65,.17,-1,Math.PI/2);
  box(2.3,.13,1.08,'#c4a176',0,.99,0,.06,desk);
  for(const x of [-.93,.93])for(const z of [-.36,.36])box(.09,.93,.09,'#a98b63',x,.48,z,.02,desk);
  box(.64,.045,.43,'#c7977f',-.7,1.09,.1,.015,desk);
  box(.56,.07,.37,'#a9b397',-.68,1.145,.1,.015,desk);
  const deskChair=group(3.35,.17,-1,-Math.PI/2);
  box(.78,.13,.73,'#a1b28e',0,.55,0,.07,deskChair);box(.79,.8,.12,'#a8b996',0,1.01,-.32,.07,deskChair);
  for(const x of [-.3,.3])for(const z of [-.26,.26])cyl(.035,.045,.53,'#ac8e66',x,.28,z,deskChair);
  const readingRug=cyl(1.5,1.5,.027,'#bcc5a2',4.1,.178,-1);readingRug.scale.z=1.2;
  function textTile(textValue,w,h,x,y,z,rotation=0){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const draw=()=>{if(disposed)return;ctx.fillStyle='#f7f0db';ctx.fillRect(0,0,768,256);ctx.fillStyle='#737d5d';ctx.font='62px "Birthday Hand", KaiTi, cursive';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(textValue,384,128,720);texture.needsUpdate=true;};
    if(document.fonts&&document.fonts.load)document.fonts.load('62px "Birthday Hand"',textValue).then(draw).catch(draw);else Promise.resolve().then(draw);
    const tile=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide}),x,y,z);tile.rotation.y=rotation;return tile;
  }
  textTile('阅读角 · 把一天排成一列',2.3,.7,5.98,3.62,-1,-Math.PI/2);
  const postcard=group(4.36,1.24,-.95);
  box(.06,.55,.89,'#f5e9ca',0,0,0,.025,postcard);
  for(const [i,color] of ['#93ab88','#d8b16b','#d7a294'].entries())box(.016,.4,.24,color,-.04,0,-.27+i*.27,.008,postcard);
  target('postcard',postcard,[4.28,1.61,-.95]);
  // Readable analog clock: 04:20, with a slow hour hand at 4 + 20/60.
  const wallClock=group(5.96,2.72,-3.05,-Math.PI/2);
  const clockBody=cyl(.44,.44,.08,'#ac9165',0,0,0,wallClock);clockBody.rotation.x=Math.PI/2;
  const clockFace=cyl(.385,.385,.015,'#f6efd9',0,0,.05,wallClock);clockFace.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const tick=box(.018,.045,.015,'#9c946f',Math.sin(a)*.32,Math.cos(a)*.32,.07,.002,wallClock);tick.rotation.z=-a;}
  for(const [angle,length,width] of [[(4+20/60)/12*Math.PI*2,.2,.032],[20/60*Math.PI*2,.28,.023]]){const hand=box(width,length,.021,'#6f7b5c',Math.sin(angle)*length/2,Math.cos(angle)*length/2,.084,.004,wallClock);hand.rotation.z=-angle;}
  ball(.035,'#b49b66',0,0,.094,wallClock);target('clock',wallClock,[5.84,2.72,-3.05]);
  const potting=group(3.35,.17,4.65);
  for(const x of [-.73,.73])for(const z of [-.3,.3])box(.09,.97,.09,'#ad8b62',x,.48,z,.025,potting);
  box(1.78,.11,.82,'#d2b58b',0,1,0,.045,potting);box(1.64,.07,.7,'#b7956b',0,.29,0,.025,potting);
  plant(3.85,1.24,4.7,.52);plant(2.7,.53,4.65,.55);
  const can=group(2.92,1.25,4.53);
  const canBody=cyl(.18,.21,.35,'#95ac8a',0,.19,0,can);canBody.scale.z=.85;
  const canHandle=mesh(new THREE.TorusGeometry(.18,.029,8,26),'#899e7c',-.2,.27,0,can);canHandle.rotation.y=Math.PI/2;
  line([[.1,.22,0],[.3,.26,0],[.44,.43,0]],'#9bb18e',.047,can);cyl(.09,.035,.07,'#91a581',.45,.44,0,can).rotation.z=-.7;
  target('wateringCan',can,[2.94,1.96,4.53]);
  textTile('绿植角 · 请给窗边的朋友一点水',2.7,.7,3.1,2.57,5.21,Math.PI);
  // Small physical changes acknowledge each solved puzzle in the room.
  const sofaLock=ball(.06,'#b69759',-.78,1.24,.06,sofa);sofaLock.userData.target='sofa';
  let puzzleVisual={solved:[],items:[]};
  // Floating dust catches the afternoon light.
  const dustGeo=new THREE.BufferGeometry(),dustCoords=new Float32Array(60*3);
  for(let i=0;i<60;i++){dustCoords[i*3]=(Math.random()-.5)*11;dustCoords[i*3+1]=.5+Math.random()*3.5;dustCoords[i*3+2]=(Math.random()-.5)*9;}
  dustGeo.setAttribute('position',new THREE.BufferAttribute(dustCoords,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#fff3c5',size:.025,transparent:true,opacity:.65}));root.add(dust);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),reach=3.15;
  let disposed=false,frame,paused=false,focus='',lastPose=0,recordPlaying=false;
  let quality=0,slowTime=0,sampleTime=0,sampleFrames=0,contextLost=false,hiddenAt=0;
  if(offline){
    root.traverse(o=>{if(o.isMesh)o.layers.enable(1);});raycaster.layers.set(1);
    const movers=[cake,cakeCover,can,windowPlant,record,recordLabel,sofaLock,cat,rocker,...puzzleBooks,...drawerParts,...animations.map(a=>a.g)];
    for(const g of [cake,can,windowPlant,cat,...animations.map(a=>a.g)])batchSurfaces(g,new Set(),shadeRamp);
    batchSurfaces(root,new Set(movers),shadeRamp);
  }
  let lightsOn=true,lightBlend=1,cakeOpened=false,candleBlown=false,reveal=null;
  const smooth=value=>{const n=THREE.MathUtils.clamp(value,0,1);return n*n*(3-2*n);};
  function setLights(value){lightsOn=value;rocker.rotation.x=value?-.18:.18;switchDot.material.color.set(value?'#d2e59b':'#b8a585');renderer.domElement.dataset.lightsOn=String(value);onLights?.(value);}
  function setCakeOpened(value){cakeOpened=value;cake.visible=value;cakeCover.visible=!value;renderer.domElement.dataset.cakeOpened=String(value);}
  function visibleHit(hit){let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;}
  setLights(true);setCakeOpened(false);
  const visibleMarkers=new Set();
  // Dust is visual only; solid meshes block interactions through walls and furniture.
  const solids=[];root.traverse(o=>{if(o.isMesh&&!o.userData.moonPool&&!o.userData.minitoolBatch)solids.push(o);});
  function hitAt(e) {
    pointer.set(0,0);
    if(e){const p=gamePoint(renderer.domElement,e);pointer.set(p.x/p.width*2-1,-p.y/p.height*2+1);}
    raycaster.setFromCamera(pointer,camera);
    return raycaster.intersectObjects(solids,false).find(visibleHit);
  }
  function selectionAt(e){
    const hit=hitAt(e);
    if(hit?.distance<=reach&&hit.object.userData.target)return hit.object.userData.target;
    // Aiming at an object's visible marker works too, including markers above the mesh.
    for(const id of visibleMarkers){const p=anchors[id].clone().project(camera);if(Math.hypot((p.x-pointer.x)*container.clientWidth,(p.y-pointer.y)*container.clientHeight)<42)return id;}
    return '';
  }
  function interact(e){if(paused)return;const id=selectionAt(e);if(id)onSelect(id);}
  const controls=createFirstPerson(camera,renderer.domElement,{onInteract:interact,onMode});
  const lost=e=>{e.preventDefault();contextLost=true;cancelAnimationFrame(frame);onError('3D 画面暂时中断了。已找到的礼物会保留，可继续轻量探索。');};renderer.domElement.addEventListener('webglcontextlost',lost);
  const restored=()=>{contextLost=false;onError('图形环境已恢复，可以重新加载，或继续轻量探索。');};renderer.domElement.addEventListener('webglcontextrestored',restored);
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(offline)renderer.setPixelRatio(Math.min(devicePixelRatio,quality?1:1.5,Math.sqrt((quality?1000000:2000000)/Math.max(w*h,1))));renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.fov=w<600?78:70;camera.updateProjectionMatrix();}
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):{observe(){window.addEventListener('resize',resize);},disconnect(){window.removeEventListener('resize',resize);}};observer.observe(container);resize();
  const start=performance.now();let previous=start;
  const visibility=()=>{if(document.hidden){hiddenAt=performance.now();cancelAnimationFrame(frame);}else if(!disposed&&!contextLost){previous=performance.now();if(reveal&&hiddenAt)reveal.start+=previous-hiddenAt;hiddenAt=0;sampleTime=sampleFrames=slowTime=0;frame=requestAnimationFrame(render);}};document.addEventListener('visibilitychange',visibility);
  function render(now) {
    if(disposed||contextLost||document.hidden)return;frame=requestAnimationFrame(render);const elapsed=(now-previous)/1000,t=(now-start)/1000,dt=Math.min(elapsed,.05);
    if(offline){sampleTime+=elapsed;sampleFrames++;if(sampleTime>=3){const fps=sampleFrames/sampleTime;slowTime=fps<24?slowTime+sampleTime:0;sampleTime=sampleFrames=0;if(slowTime>=3&&quality===0){quality=1;slowTime=0;dust.visible=false;animations.forEach(a=>a.g.visible=false);resize();}else if(slowTime>=6&&quality===1){cancelAnimationFrame(frame);onError('当前图形性能较低，已切换到轻量探索。');return;}}}
    controls.update(dt);previous=now;
    if(reveal){
      const progress=Math.min(1,(now-reveal.start)/reveal.duration),lift=smooth(progress/.48),unfold=smooth((progress-.2)/.55),fade=smooth((progress-.58)/.35);
      controls.focusOn(new THREE.Vector3(.24,1.48,.48),reducedMotion?1:1-Math.exp(-dt*5));
      cakeLid.position.y=.94+lift*1.15;cakeLid.rotation.set(lift*-.22,lift*.45,lift*.12);
      coverPanels.forEach(({hinge,axis,sign})=>{hinge.rotation[axis]=sign*unfold*Math.PI*.48;});
      coverPaper.opacity=coverRibbon.opacity=1-fade;cake.visible=progress>.18;cake.scale.setScalar(.86+.14*smooth((progress-.18)/.65));
      renderer.domElement.dataset.revealProgress=progress.toFixed(3);
      if(progress===1){const done=reveal.resolve;reveal=null;cake.scale.setScalar(1);setCakeOpened(true);renderer.domElement.dataset.revealing='false';done(true);}
    }
    lightBlend+=(Number(lightsOn)-lightBlend)*(reducedMotion?1:1-Math.exp(-dt*2.8));
    hemi.intensity=1.6*lightBlend;sun.intensity=1.1*lightBlend;fill.intensity=.35*lightBlend;innerLight.intensity=2*lightBlend;lamp.intensity=2*lightBlend;
    const nightBlend=1-lightBlend;moonFill.intensity=.28*nightBlend;moonLight.intensity=.48*nightBlend;moonPoolMaterial.opacity=.12*nightBlend;
    skyMaterial.color.copy(daySky).lerp(nightSky,nightBlend);moonMaterial.color.copy(dayDisc).lerp(nightDisc,nightBlend);moonCutMaterial.color.copy(skyMaterial.color);moonCutMaterial.opacity=starMaterial.opacity=nightBlend;
    const candleActive=cake.visible&&!candleBlown;
    const nightShade=45;shadeRamp.image.data[0]=Math.round(nightShade+(185-nightShade)*lightBlend);shadeRamp.image.data[1]=Math.round(125+105*lightBlend);shadeRamp.needsUpdate=true;
    candleLight.intensity=candleActive?5.5*(reducedMotion?1:1+Math.sin(t*8)*.035+Math.sin(t*13)*.025):0;
    candleGlow.visible=flame.visible=candleActive;dust.material.opacity=.65*lightBlend;
    renderer.domElement.dataset.candleLit=String(candleActive);renderer.domElement.dataset.lightLevel=lightBlend.toFixed(3);
    if(recordPlaying&&!reducedMotion&&!quality){record.rotation.y+=dt*1.65;recordLabel.rotation.y=record.rotation.y;}
    const blend=reducedMotion?1:.13;
    for(const [i,part] of drawerParts.entries()){const destination=(i===0?.44:.51)+(puzzleVisual.solved.includes('drawer')?.34:0);part.position.z+=(destination-part.position.z)*blend;}
    for(const [i,book] of puzzleBooks.entries()){book.rotation.z+=((puzzleVisual.solved.includes('books')?-.14-i*.05:0)-book.rotation.z)*blend;}
    if(!reducedMotion&&!quality) {animations.forEach(({g,y,phase})=>{g.position.y=y+Math.sin(t*1.3+phase)*.055;g.rotation.z=Math.sin(t*.8+phase)*.025;});cat.scale.y=1+Math.sin(t*1.6)*.018;flame.scale.y=1.4+Math.sin(t*9)*.18;dust.rotation.y=t*.006;}
    scene.updateMatrixWorld();
    visibleMarkers.clear();
    Object.entries(anchors).forEach(([id,pos])=>{
      const el=markerElements[id];if(!el)return;const p=pos.clone().project(camera),distance=pos.distanceTo(camera.position);
      let visible=!paused&&(id==='cake'||targets[id]?.visible!==false)&&distance<reach&&p.z>-1&&p.z<1&&Math.abs(p.x)<.92&&Math.abs(p.y)<.83;
      if(visible){raycaster.set(camera.position,pos.clone().sub(camera.position).normalize());const block=raycaster.intersectObjects(solids,false).find(visibleHit);visible=!block||block.distance>=distance-.12||block.object.userData.target===id;}
      el.style.transform=`translate(-50%, -50%) translate(${(p.x*.5+.5)*container.clientWidth}px, ${(-p.y*.5+.5)*container.clientHeight}px)`;
      el.style.visibility=visible?'visible':'hidden';
      el.tabIndex=visible?0:-1;if(visible)visibleMarkers.add(id);
    });
    const id=paused?'':selectionAt();
    if(focus!==id){focus=id;onFocus(id);}
    if(import.meta.env.DEV && now-lastPose>100){renderer.domElement.dataset.pose=JSON.stringify(controls.getState());lastPose=now;}
    if(inkEffect)inkEffect.render(scene,camera);else renderer.render(scene,camera);
    if(offline&&now-lastPose>500){renderer.domElement.dataset.gpu=JSON.stringify({quality,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixels:renderer.domElement.width*renderer.domElement.height,textures:renderer.info.memory.textures});lastPose=now;}
  }
  if(offline){renderer.debug.onShaderError=()=>{contextLost=true;cancelAnimationFrame(frame);onError('画面暂时无法显示，正在切换轻量探索。');};renderer.compile(scene,camera);}frame=requestAnimationFrame(render);onReady();
  return {
    enter:()=>{if(!reveal)controls.enter();},
    resetView:()=>{if(!reveal)controls.reset();},
    setPaused(value){paused=value;controls.setPaused(value);},
    setMove:controls.setMove,
    interact:controls.interact,
    selectMarker(id){if(!paused&&visibleMarkers.has(id))onSelect(id);},
    setPuzzleState(state){puzzleVisual=state;can.visible=!state.items.includes('wateringCan');record.visible=recordLabel.visible=state.items.includes('record');sofaLock.visible=!state.solved.includes('sofa');windowPlant.scale.y=state.solved.includes('plant')?.77:.59;},
    setRecordPlaying(value){recordPlaying=value;renderer.domElement.dataset.recordPlaying=String(value);},
    toggleLights:()=>setLights(!lightsOn),
    restoreCake(value,blown){if(!reveal){setCakeOpened(value);candleBlown=blown;}},
    revealCake(){if(reveal)return reveal.promise;setLights(false);candleBlown=false;if(cakeOpened)return Promise.resolve(true);let resolve;const promise=new Promise(done=>resolve=done);reveal={start:performance.now(),duration:reducedMotion?150:3600,resolve,promise};renderer.domElement.dataset.revealing='true';return promise;},
    celebrate:()=>{candleBlown=true;setLights(true);},
    reset:()=>{if(reveal){reveal.resolve(false);reveal=null;}renderer.domElement.dataset.revealing='false';setCakeOpened(false);candleBlown=false;cake.scale.setScalar(1);cakeLid.position.y=.94;cakeLid.rotation.set(0,0,0);coverPanels.forEach(({hinge})=>hinge.rotation.set(0,0,0));coverPaper.opacity=coverRibbon.opacity=1;setLights(true);recordPlaying=false;record.rotation.y=0;recordLabel.rotation.y=0;controls.reset();},
    dispose:()=>{if(disposed)return;disposed=true;if(reveal){reveal.resolve(false);reveal=null;}cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);document.removeEventListener('visibilitychange',visibility);shadeRamp.dispose();const geos=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();},
  };
}
