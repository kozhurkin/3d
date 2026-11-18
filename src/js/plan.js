/* ---------- «Планировка» view: the whole apartment, plan dimensions, camera presets, what the plan assumes ---------- */
/* ---------- dimension lines ---------- */
const labels=[];
const LABEL_H=.15;   // m: a plan label's height in the scene (engine.js: dimLabel, fitLabels)
function label(text){const s=dimLabel(text,LABEL_H);labels.push(s);return s;}
const dimMat=new THREE.LineBasicMaterial({color:0x2f5d50,depthTest:false,transparent:true});
const dimsGroup=new THREE.Group();scene.add(dimsGroup);
// a dimension line from a to b (m) with ticks ±t at its ends and its label in the middle
function dimLine(g,a,b,t,txt){
  const pts=[a,b,a.clone().add(t),a.clone().sub(t),b.clone().add(t),b.clone().sub(t)];
  const l=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),dimMat);l.renderOrder=19;g.add(l);
  const s=label(txt);s.position.copy(a).add(b).multiplyScalar(.5);g.add(s);
}
// a plan dimension: on the cut walls, ticks across it
function dim(x0,z0,x1,z1,txt){
  const a=new THREE.Vector3(x0*MM,0,z0*MM),b=new THREE.Vector3(x1*MM,0,z1*MM);
  const d=b.clone().sub(a).normalize();dimLine(dimsGroup,a,b,new THREE.Vector3(-d.z,0,d.x).multiplyScalar(.05),txt);
}
// the window's dimensions stand at the window itself, on the room face of its wall: width × height across its middle, the sill height from the floor beside it; they show with the window
const winDims=new THREE.Group();scene.add(winDims);
function buildWinDims(){
  const z=(zEnd-10)*MM,x0=(winX-A.winW/2)*MM,x1=(winX+A.winW/2)*MM,y=(A.winS+A.winH/2)*MM,xs=(winX-A.winW/2-150)*MM;
  dimLine(winDims,new THREE.Vector3(x0,y,z),new THREE.Vector3(x1,y,z),new THREE.Vector3(0,.05,0),`${A.winW} × ${A.winH}`);
  dimLine(winDims,new THREE.Vector3(xs,0,z),new THREE.Vector3(xs,A.winS*MM,z),new THREE.Vector3(.05,0,0),`${A.winS}`);
}
// the bathroom doorway's height stands at the doorway too: from the floor up on the hall face of its wall, 150 past its kitchen-side edge; it shows with the lintel over it, to a camera on the hall side (else it would show through the wall)
const doorDims=new THREE.Group();scene.add(doorDims);
function buildDoorDims(){
  const x=10*MM,z=(A.hL1+A.bDoor+150)*MM;
  dimLine(doorDims,new THREE.Vector3(x,0,z),new THREE.Vector3(x,A.bDoorH*MM,z),new THREE.Vector3(0,0,.05),`${A.bDoorH}`);
}
// dimension lines are computed from A; when the sizes change they are rebuilt the next time they are on screen
let dimsDirty=true;
function buildDims(){
  [dimsGroup,winDims,doorDims].forEach(g=>g.children.slice().forEach(o=>{g.remove(o);if(o.isSprite){o.material.map.dispose();o.material.dispose();}else o.geometry.dispose();}));   // sprites share one geometry
  labels.length=0;
  dim(0,250,A.hallW,250,`${A.hallW}`);
  dim(A.eD0,-330,A.eD1,-330,`вход ${A.eD1-A.eD0}`);
  dim(200,0,200,A.hL1,`${A.hL1}`);
  dim(200,A.hL1,200,A.hL1+A.bDoor,`${A.bDoor}`);
  dim(200,A.hL1+A.bDoor,200,hLen,`${hLen-A.hL1-A.bDoor}`);
  dim(A.hallW-200,0,A.hallW-200,hLen,`${hLen}`);
  dim(0,hLen-140,A.kOver,hLen-140,`${A.kOver}`);
  dim(A.kOver,hLen-140,A.hallW-A.kOverR,hLen-140,`${A.hallW-A.kOver-A.kOverR}`);
  dim(A.hallW-A.kOverR,hLen-140,A.hallW,hLen-140,`${A.kOverR}`);
  dim(xL,kZ1+160,A.kOver,kZ1+160,`${kW}`);
  dim(xL+200,kZ1,xL+200,zEnd,`${A.kL}`);
  dim(A.hallW-200,kZ1,A.hallW-200,zEnd,`${A.kL}`);
  dim(xL,zEnd-250,A.hallW,zEnd-250,`${A.hallW-xL}`);
  dim(xL,bz(A.bL)-400,xB1,bz(A.bL)-400,`${xB1-xL}`);
  dim(xL,bz(A.bL)+200,bx(A.bWs+A.bGap),bz(A.bL)+200,`${A.bWs+A.bGap}`);
  dim(bx(A.bWs+A.bGap+A.wt),bz(A.bL)+200,xB1,bz(A.bL)+200,`${xB1-bx(A.bWs+A.bGap+A.wt)}`);
  dim(-280,A.hL1+A.bDoor,-280,zV0,`${zV0-A.hL1-A.bDoor}`);
  dim(bx(A.bWs+A.bGap+A.wt)+80,zV0+A.wt,bx(A.bWs+A.bGap+A.wt)+80,kZ0,`${A.vD}`);
  dim(xL,zB0+420,bx(A.bNiche),zB0+420,`${A.bNiche}`);
  dim(bx(A.bNiche+A.wt),zB0+420,xB1,zB0+420,`${xB1-bx(A.bNiche+A.wt)}`);
  dim(-1350,zB0,-1350,kZ0,`${kZ0-zB0}`);
  dim(xL+420,zB0,xL+420,bz(A.bL),`${A.bL}`);
  dim(bx(A.bNiche+A.wt/2),zB0,bx(A.bNiche+A.wt/2),bz(A.bStub),`${A.bStub}`);   // the partition next to the tall cabinet, along its middle
  buildWinDims();buildDoorDims();
  dimsDirty=false;
}


// distance at which the whole apartment fits the frame from straight above
function fitR(wmm=BOX.x1-BOX.x0,dmm=BOX.z1-BOX.z0){
  const t=Math.tan(camera.fov*Math.PI/360),w=wmm*MM,d=dmm*MM;
  return Math.max(d/2/t,w/2/(t*(camera.aspect||1)))*1.12+H*MM;   // + wall height: the wall tops are that much closer to the camera
}
// camera presets of the plan (buttons «Камера»)
function setCam(v){
  const f=fitR(),fr=fitR(3600,3550);   // fr: room views keep the scale of the hall + bathroom block
  const views={
    plan:[-.96,.57,f*.94,CX+.55,0,CZ-.3],   // whole plan at an angle from the kitchen's window corner by the bathroom side, the hall at the top left
    top:[0,.0005,f,CX,0,CZ],
    entry:[Math.PI-.4,.7,f*1.05,CX,0,CZ],
    hall:[1.2,.85,fr*.7,A.hallW/2*MM,.6,hLen/2*MM],   // through the outer right wall, facing the bathroom door
    bath:[.4,.34,fr*.62,bx(450)*MM,.9,bz(300)*MM],   // the corner with the installation (left wall) and the tall cabinet (back wall)
    kitchen:[.55,.5,fr*.78,(xL+A.kOver)/2*MM-.1,.6,(kZ1+300)*MM]   // the worktop wall and the left wall, from the passage side
  };
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];goalT.set(s[3],s[4],s[5]);
  shortWay();
}

/* ---------- panel ---------- */
const planPanel=document.querySelector('[data-panel="plan"]');
const pq=s=>planPanel.querySelector(s);
pq('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
const row=(k,v,q)=>`<dt>${k}</dt><dd${q?' class="q"':''}>${v}</dd>`;
// what the plan assumes, in numbers: redrawn when the sizes change
function renderFacts(){
  pq('#pFacts').innerHTML=
    `<div class="room">Прихожая</div><dl class="facts">${
      row('Ширина',A.hallW)+row('Левая стена',`${A.hL1} + проём ${A.bDoor} (h ${A.bDoorH}) + ${hLen-A.hL1-A.bDoor}`)+row('Правая стена',`${hLen} до кухонной стены`)+row('Входной проём',`${A.eD1-A.eD0} × ${A.eDH}, откос до двери ${A.eRv}, несущая стена ${A.bear}`)}</dl>`+
    `<div class="room">Санузел</div><dl class="facts">${
      row('Вдоль задней стены',`${xB1-xL} = ${A.bNiche} + ${A.wt} + ${xB1-bx(A.bNiche+A.wt)}`)+row('Глубина',`${kZ0-zB0}`)+row('Ниша с инсталляцией',`${A.bNiche} × ${A.bL}`)+row('Вентшахта',`${xB1-bx(A.bWs+A.bGap+A.wt)} × ${A.vD}, стенка в ${zV0-A.hL1-A.bDoor} от проёма`)}</dl>`+
    `<div class="room">Кухня</div><dl class="facts">${
      row('Стена',`${kW}, выступает за стену прихожей на ${A.kOver}`)+row('Левая и правая стены',A.kL)+row('Ширина',A.hallW-xL)+row('Окно',`${A.winW} × ${A.winH}, от пола ${A.winS}, по центру внешней стены`)+row('Проход из прихожей',`${A.hallW-A.kOver-A.kOverR}, стенки ${A.kOver} слева и ${A.kOverR} справа`)}</dl>`+
    `<p class="note" style="margin:10px 0 0">Внешние стены ${A.bear} мм (со входом, левая стена санузла и кухни, правая стена прихожей и кухни, стена с окном), остальные ${A.wt} мм, потолок ${H}. Исходные размеры внутренних стенок санузла взяты из вкладки «Санузел», входного проёма — из «Прихожей».</p>`;
  pq('#pSub').textContent=`${(BOX.x1-BOX.x0)} × ${(BOX.z1-BOX.z0)} мм по внешним стенам · потолок ${H}`;
}
renderFacts();

/* the plan's own settings: the rooms' cabinets, dimensions, room names, floor colours */
function syncPlan(){
  const V=VS.plan;
  pq('#pFurn').checked=V.furn!==false;pq('#pFurnCut').checked=V.fcut===true;
  pq('#pFurnCut').disabled=V.furn===false;pq('#pFurnCutRow').style.opacity=V.furn===false?.45:1;   // nothing to cut without the cabinets
  pq('#pDims').checked=V.dims;pq('#pNames').checked=V.names;pq('#pFloors').checked=V.floors;
}
// the cabinets of every room, as their tabs set them up (each room module shows its own: presence)
pq('#pFurn').addEventListener('change',e=>{VS.plan.furn=e.target.checked;syncPlan();saveView('plan');});
// … cut at the walls' height, or whole whatever the walls are (views.js: furnCut)
pq('#pFurnCut').addEventListener('change',e=>{VS.plan.fcut=e.target.checked;saveView('plan');});
pq('#pDims').addEventListener('change',e=>{VS.plan.dims=e.target.checked;saveView('plan');});
pq('#pNames').addEventListener('change',e=>{VS.plan.names=e.target.checked;saveView('plan');});
pq('#pFloors').addEventListener('change',e=>{VS.plan.floors=e.target.checked;applyTheme();saveView('plan');});

/* ---------- wall sizes: edited only here, the room tabs take them as they are ----------
   A slider stops at the last value where every wall still fits and says what is in the way */
const SIZES=[
  ['Квартира',[
    {k:'H',n:'Высота потолка',min:2200,max:3200,step:10},
    {k:'bear',n:'Внешние стены',min:150,max:400,step:10},
    {k:'wt',n:'Внутренние стены',min:50,max:200,step:10}]],
  ['Прихожая',[
    {k:'hallW',n:'Ширина',min:900,max:2000,step:10},
    {k:'hL',n:'Длина до кухонной стены',min:1000,max:4000,step:10},
    {k:'hL1',n:'Дверь санузла: от стены со входом',min:100,max:2000,step:10},   // the doorway moves, the wall stays
    {k:'bDoor',n:'Дверь санузла: ширина',min:500,max:1000,step:10},
    {k:'bDoorH',n:'Дверь санузла: высота',min:1800,max:2500,step:10},
    {k:'eD0',n:'Вход: от левой стены',min:0,max:600,step:1,set:(a,v)=>({...a,eD0:v,eD1:v+a.eD1-a.eD0})},   // the opening moves, its width stays
    {k:'eW',n:'Вход: ширина',min:600,max:1200,step:1,get:a=>a.eD1-a.eD0,set:(a,v)=>({...a,eD1:a.eD0+v})},
    {k:'eDH',n:'Вход: высота',min:1800,max:2500,step:1},
    {k:'eRv',n:'Вход: глубина откоса до двери',min:40,max:300,step:5}]],
  ['Санузел',[
    {k:'bW',n:'Ширина',min:1000,max:4000,step:10},
    {k:'bNiche',n:'Ниша с инсталляцией: ширина',min:600,max:2000,step:10},
    {k:'bL',n:'Ниша с инсталляцией: глубина',min:600,max:2500,step:10},
    {k:'rX',n:'Короб: вдоль задней стены',min:100,max:600,step:10},
    {k:'rZ',n:'Короб: вдоль левой стены',min:100,max:600,step:10},
    {k:'bStub',n:'Перегородка у пенала',min:0,max:1500,step:10},
    {k:'bWs',n:'Стенка в конце ниши',min:0,max:1500,step:10},
    {k:'bGap',n:'Проход к душу',min:300,max:1000,step:10},
    {k:'vD',n:'Вентшахта: глубина',min:100,max:1500,step:10}]],
  ['Кухня',[
    {k:'kOver',n:'Выступ кухонной стены в прихожую',min:0,max:500,step:10},
    {k:'kOverR',n:'Стенка справа от прохода',min:0,max:500,step:10},
    {k:'kL',n:'Длина до стены с окном',min:2000,max:8000,step:10},
    {k:'winW',n:'Окно: ширина',min:600,max:3000,step:10},
    {k:'winH',n:'Окно: высота',min:600,max:2000,step:10},
    {k:'winS',n:'Окно: от пола',min:0,max:1500,step:10}]]
];
const sizeFields=SIZES.flatMap(([,fs])=>fs);
sizeFields.forEach(f=>{f.get=f.get||(a=>a[f.k]);f.set=f.set||((a,v)=>({...a,[f.k]:v}));});
pq('#pSizes').innerHTML=SIZES.map(([g,fs])=>`<div><h3>${g}, мм</h3>${fs.map(f=>
  `<div class="field"><label for="pS-${f.k}">${f.n}</label><output data-size-out="${f.k}"></output><input type="range" id="pS-${f.k}" data-size="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}"></div>`).join('')}</div>`).join('');
const sizeMsg=pq('#pSizeMsg');
function syncSizes(){sizeFields.forEach(f=>{const v=f.get(A);pq(`[data-size="${f.k}"]`).value=v;pq(`[data-size-out="${f.k}"]`).textContent=v;});}
// the value v if everything fits with it; otherwise the last one toward v that fits (on the slider's step from the current value)
function fitSize(f,v){
  const cur=f.get(A),bad=aptProblems(f.set(A,v));
  if(!bad.length||aptProblems(A).length)return {v,why:''};
  let lo=cur,hi=v;
  while(Math.abs(hi-lo)>1){const mid=Math.round((lo+hi)/2);if(aptProblems(f.set(A,mid)).length)hi=mid;else lo=mid;}
  return {v:cur+Math.trunc((lo-cur)/f.step)*f.step,why:bad[0]};
}
sizeFields.forEach(f=>pq(`[data-size="${f.k}"]`).addEventListener('input',e=>{
  const {v,why}=fitSize(f,+e.target.value);
  if(v!==f.get(A))setModel(f.set(A,v));
  syncSizes();sizeMsg.textContent=why?`Дальше нельзя: ${why}`:'';
}));
syncSizes();
const sizesBox=pq('#pSizesBox');
{ const s=readJSON('apt-plan-sizes');sizesBox.open=s!==false; }
sizesBox.addEventListener('toggle',()=>writeJSON('apt-plan-sizes',sizesBox.open));

// sizes as the starting ones: in this browser, or as a code to send to the chat so they become the defaults for everyone
const aMsg=pq('#pAMsg');
pq('#pSaveA').addEventListener('click',()=>{try{localStorage.setItem(MKEY,JSON.stringify(modelDiff()));aMsg.textContent='Сохранено в этом браузере';}catch(e){aMsg.textContent='Браузер не дал сохранить. Скопируйте код и пришлите в чат';}});
pq('#pResetA').addEventListener('click',()=>{try{localStorage.removeItem(MKEY);}catch(e){}setModel({});aMsg.textContent='Исходные размеры возвращены';sizeMsg.textContent='';});
pq('#pCopyA').addEventListener('click',()=>{
  const ta=pq('#pACode');ta.value=JSON.stringify(modelDiff());
  (navigator.clipboard?navigator.clipboard.writeText(ta.value):Promise.reject()).then(()=>{aMsg.textContent='Код скопирован';}).catch(()=>{ta.hidden=false;ta.focus();ta.select();aMsg.textContent='Выделено — нажмите Ctrl+C';});
});

// the sizes changed: the plan's dimensions, numbers and sliders follow
modelHooks.push(()=>{dimsDirty=true;renderFacts();syncSizes();});

/* every frame: dimensions and room names belong to the plan; dimension lines lie on the cut walls, the window's and the doorway height stand at them */
insetHide.push(dimsGroup,winDims,doorDims);
frameHooks.push(()=>{
  // dimensions come when the plan is reached; room floors and names change halfway (room views have the plain floor, as before)
  const on=view==='plan'&&!inTransition(),half=presence('plan')>=.5;
  dimsGroup.visible=on&&VS.plan.dims;namesGroup.visible=half&&VS.plan.names;roomGroup.visible=half;
  if(dimsGroup.visible&&dimsDirty)buildDims();
  dimsGroup.position.y=(wallFeetMode?0:wallCut)+.02;
  winDims.visible=dimsGroup.visible&&wallParts.some(w=>w.glass&&w.m.visible);   // the window's glass is on screen
  doorDims.visible=dimsGroup.visible&&camera.position.x>0&&wallParts.some(w=>w.id==='hallBath'&&Math.abs(w.b-A.bDoorH*MM)<1e-6&&w.m.visible);   // the lintel over the doorway is on screen, seen from the hall
  // dimension labels: readable near, shrinking with the plan far (engine.js: fitLabels)
  if(dimsGroup.visible)fitLabels(labels);
});

/* the area of a room's name under the cursor: its floor is tinted and framed by a band along the walls, drawn over them */
const HOVER_BAND=40;   // mm, inward from the outline
const hoverFillMat=new THREE.MeshBasicMaterial({color:0x2f5d50,depthTest:false,transparent:true,opacity:.14,side:THREE.DoubleSide});
const hoverBandMat=new THREE.MeshBasicMaterial({color:0x2f5d50,depthTest:false,transparent:true,opacity:.9,side:THREE.DoubleSide});
const hoverFrame=new THREE.Group();hoverFrame.visible=false;scene.add(hoverFrame);
// the outline moved inward by d: each corner along the bisector of its two edges (mitred), mm
function insetPoly(q,d){
  const n=q.length,ccw=polySigned(q)>0;
  const nrm=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return ccw?[-dz/l,dx/l]:[dz/l,-dx/l];};   // the edge's inward normal
  return q.map((p,i)=>{const a=nrm(q[(i+n-1)%n],p),b=nrm(p,q[(i+1)%n]),k=d/(1+a[0]*b[0]+a[1]*b[1]);return [p[0]+(a[0]+b[0])*k,p[1]+(a[1]+b[1])*k];});
}
function bandGeometry(q,d){
  const r=insetPoly(q,d),n=q.length,pos=[],idx=[];
  q.forEach((p,i)=>{pos.push(p[0]*MM,0,p[1]*MM,r[i][0]*MM,0,r[i][1]*MM);const j=(i+1)%n;idx.push(2*i,2*j,2*j+1,2*i,2*j+1,2*i+1);});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);return g;
}
let hoverRoom=-1;
function setHoverRoom(i){
  if(i===hoverRoom)return;hoverRoom=i;
  emptyGroup(hoverFrame,false);
  if(i<0){hoverFrame.visible=false;return;}
  const q=roomPoly(ROOMS[i]);
  const fill=new THREE.Mesh(polyFloorGeometry(q),hoverFillMat);fill.renderOrder=17;
  const band=new THREE.Mesh(bandGeometry(q,HOVER_BAND),hoverBandMat);band.renderOrder=18;
  hoverFrame.add(fill,band);hoverFrame.visible=true;
}
// which room's area is under the cursor (-1: none): labelHits — the ray through the names, sceneHits — through the whole scene.
// Only over the area («2,28 м²»), not the whole inscription, and only where it is seen: anything in front of it (a cabinet, a wall,
// an item) hides it. The names themselves and the frame don't count, nor a part of a surface clipped away (furniture cut at the walls' height)
const inGroup=(o,g)=>{while(o){if(o===g)return true;o=o.parent;}return false;};
const clippedAt=h=>[].concat(h.object.material||[]).some(m=>m&&m.clippingPlanes&&m.clippingPlanes.some(p=>p.distanceToPoint(h.point)<0));
function roomUnderCursor(labelHits,sceneHits){
  const h=labelHits[0],i=h?nameTexts.findIndex(n=>n.m===h.object):-1;
  if(i<0)return -1;
  const [u0,u1]=areaSpan(nameTexts[i]);if(!h.uv||h.uv.x<u0||h.uv.x>u1)return -1;
  const front=sceneHits.find(x=>hittable(x)&&!inGroup(x.object,namesGroup)&&!inGroup(x.object,hoverFrame)&&!clippedAt(x));
  return front&&front.distance<h.distance-1e-4?-1:i;
}
canvas.addEventListener('pointermove',e=>{
  if(view!=='plan'||inTransition()||!namesGroup.visible||e.buttons){setHoverRoom(-1);return;}
  aimRay(e);
  const lh=ray.intersectObjects(nameTexts.map(n=>n.m));
  setHoverRoom(lh.length?roomUnderCursor(lh,ray.intersectObjects(scene.children,true)):-1);
});
canvas.addEventListener('pointerleave',()=>setHoverRoom(-1));
modelHooks.push(()=>setHoverRoom(-1));   // the sizes changed: the frame is gone until the cursor moves
frameHooks.push(()=>{if(hoverRoom>=0){if(!namesGroup.visible)setHoverRoom(-1);else hoverFrame.position.y=(wallFeetMode?0:wallCut)+.02;}});

addView('plan',{
  rooms:'all',
  // the cut mode hides only the outer walls of the apartment, each while the camera looks at it from outside; inner walls always stay
  fade:Object.fromEntries(WALLS.filter(w=>w.ext).map(w=>[w.id,w.ext])),
  defaults:{Wm:'auto',Wh:100,dm:'closed',furn:true,fcut:false,dims:false,names:true,floors:true},
  sun:()=>({x:CX,y:0,z:CZ,half:4.6}),   // shadows cover the whole apartment from any direction
  panel:planPanel,
  home:()=>setCam('plan'),
  sync:syncPlan
});
if(VS.plan.dm!=='none')doors.forEach(d=>d.t=VS.plan.dm==='open'?d.max:0);
