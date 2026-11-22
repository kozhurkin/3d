/* ---------- «Комната» view: the whole room, plan dimensions, camera presets, the sizes, what the plan assumes ---------- */
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
  const z=(A.L-10)*MM,x0=(winX-A.winW/2)*MM,x1=(winX+A.winW/2)*MM,y=(A.winS+A.winT)/2*MM,xs=(winX-A.winW/2-150)*MM;
  dimLine(winDims,new THREE.Vector3(x0,y,z),new THREE.Vector3(x1,y,z),new THREE.Vector3(0,.05,0),`${A.winW} × ${A.winT-A.winS}`);
  dimLine(winDims,new THREE.Vector3(xs,0,z),new THREE.Vector3(xs,A.winS*MM,z),new THREE.Vector3(.05,0,0),`${A.winS}`);
  dimLine(winDims,new THREE.Vector3(xs,A.winT*MM,z),new THREE.Vector3(xs,H*MM,z),new THREE.Vector3(.05,0,0),`${H-A.winT}`);
}
// the doorway's height stands at the doorway too: from the floor up on the room face of its wall, 150 left of its left casing; it shows with the lintel over it, to a camera in the room (else it would show through the wall)
const doorDims=new THREE.Group();scene.add(doorDims);
function buildDoorDims(){
  const x=(dL-150)*MM,z=10*MM;
  dimLine(doorDims,new THREE.Vector3(x,0,z),new THREE.Vector3(x,A.dH*MM,z),new THREE.Vector3(.05,0,0),`${A.dH}`);
}
// dimension lines are computed from A; when the sizes change they are rebuilt the next time they are on screen
let dimsDirty=true;
function buildDims(){
  [dimsGroup,winDims,doorDims].forEach(g=>g.children.slice().forEach(o=>{g.remove(o);if(o.isSprite){o.material.map.dispose();o.material.dispose();}else o.geometry.dispose();}));   // sprites share one geometry
  labels.length=0;
  const zd=-A.tD/2,zw=A.L+A.tW/2,xr=dL+2*CW+A.dW;   // on the door wall, on the window wall; the right casing's outer edge
  dim(0,zd,dL,zd,`${dL}`);dim(dL,zd,xr,zd,`${xr-dL}`);dim(xr,zd,A.W,zd,`${A.dR}`);   // the door wall: left of the door, the door with its casings, right of it
  dim(dL+CW,250,xr-CW,250,`дверь ${A.dW}`);
  dim(0,A.L-400,A.W,A.L-400,`${A.W}`);
  dim(250,0,250,A.L,`${A.L}`);dim(A.W-250,0,A.W-250,A.L,`${A.L}`);
  const w0=winX-A.winW/2,w1=winX+A.winW/2;
  dim(0,zw,w0,zw,`${w0}`);dim(w0,zw,w1,zw,`окно ${A.winW}`);dim(w1,zw,A.W,zw,`${A.W-w1}`);
  buildWinDims();buildDoorDims();
  dimsDirty=false;
}


// distance at which the whole room fits the frame from straight above
function fitR(wmm=BOX.x1-BOX.x0,dmm=BOX.z1-BOX.z0){
  const t=Math.tan(camera.fov*Math.PI/360),w=wmm*MM,d=dmm*MM;
  return Math.max(d/2/t,w/2/(t*(camera.aspect||1)))*1.12+H*MM;   // + wall height: the wall tops are that much closer to the camera
}
// camera presets of the plan (buttons «Камера»)
function setCam(v){
  const f=fitR();
  const views={
    plan:[-.6,.62,f*1.05,CX,.3,CZ],                     // from the corner of the window and the left walls: the door wall and the right wall
    top:[0,.0005,f,CX,0,CZ],
    door:[-.25,1.0,f*.95,CX,.6,CZ],                     // over the window wall, looking at the door
    window:[Math.PI-.35,.95,f*.95,CX,.6,CZ]             // over the door wall, looking at the window
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
const area=()=>(A.W*A.L/1e6).toFixed(2).replace('.',',');
function renderFacts(){
  pq('#pFacts').innerHTML=
    `<dl class="facts">${
      row('Стены',`${A.W} × ${A.L}, площадь ${area()} м²`)+row('Потолок',H)+
      row('Дверь',`${A.dW} между наличниками ${CW}, проём ${dB-dA} × ${A.dH}`)+
      row('Стена с дверью',`${dL} + ${CW} + ${A.dW} + ${CW} + ${A.dR}`)+
      row('Окно',`${A.winW}, от пола ${A.winS} до ${A.winT}, по центру стены`)+
      row('Стена с окном',`${winX-A.winW/2} + ${A.winW} + ${A.W-winX-A.winW/2}`)+
      row('Стены',`обои под лён (по образцу), откосы окна окрашены; лепнина ${A.cornH}, плинтус ${A.plH}`)+
      row('Над фотообоями',`плетёнка ${A.ropeH} × 6 по периметру (у окна прервана) на ${A.plH+A.muralH}; обои до её низа, выше до лепнины стена белая`)+
      row('Фотообои',A.muralWall?`${A.muralW} × ${A.muralH} от плинтуса, ${A.muralWall==='right'?'слева':'справа'} от входа; на стене ${Math.min(A.muralW,A.L)}`:'нет')+
      row('Толщина стен',`с дверью ${A.tD}, боковые ${A.tS}, с окном ${A.tW}`,true)}</dl>`;
  pq('#pSub').textContent=`${A.W} × ${A.L} мм · ${area()} м² · потолок ${H}`;
}
renderFacts();

/* the plan's own settings: dimensions, the room's name, the floor colour */
function syncPlan(){
  const V=VS.plan;
  pq('#pDims').checked=V.dims;pq('#pNames').checked=V.names;pq('#pFloors').checked=V.floors;
}
pq('#pDims').addEventListener('change',e=>{VS.plan.dims=e.target.checked;saveView('plan');});
pq('#pNames').addEventListener('change',e=>{VS.plan.names=e.target.checked;saveView('plan');});
pq('#pFloors').addEventListener('change',e=>{VS.plan.floors=e.target.checked;applyTheme();saveView('plan');});

/* ---------- wall sizes: edited only here, the walk takes them as they are ----------
   A slider stops at the last value where everything still fits and says what is in the way */
const SIZES=[
  ['Комната',[
    {k:'H',n:'Высота потолка',min:2400,max:3600,step:10},
    {k:'W',n:'Стена с дверью и стена с окном',min:2000,max:6000,step:10},
    {k:'L',n:'Боковые стены',min:2000,max:6000,step:1},
    {k:'tD',n:'Толщина стены с дверью',min:50,max:600,step:10},
    {k:'tS',n:'Толщина боковых стен',min:50,max:600,step:10},
    {k:'tW',n:'Толщина стены с окном',min:100,max:800,step:10}]],
  ['Дверь',[
    {k:'dR',n:'От правого угла до наличника',min:0,max:5000,step:10},
    {k:'dW',n:'Ширина между наличниками',min:500,max:1200,step:10},
    {k:'dH',n:'Высота проёма',min:1800,max:2600,step:10}]],
  ['Отделка',[
    {k:'cornH',n:'Лепнина под потолком: высота',min:0,max:300,step:5},
    {k:'plH',n:'Плинтус: высота',min:0,max:200,step:5},
    {k:'muralW',n:'Фотообои: ширина',min:1000,max:8000,step:10},
    {k:'muralH',n:'Фотообои: высота',min:1000,max:3000,step:10},
    {k:'ropeH',n:'Плетёнка над ними: высота',min:5,max:40,step:1}]],
  ['Окно',[
    {k:'winW',n:'Ширина',min:400,max:3000,step:10},
    {k:'winS',n:'Низ от пола',min:0,max:1500,step:10},
    {k:'winT',n:'Верх от пола',min:1200,max:3500,step:10}]]
];
const sizeFields=SIZES.flatMap(([,fs])=>fs);
sizeFields.forEach(f=>{f.get=f.get||(a=>a[f.k]);f.set=f.set||((a,v)=>({...a,[f.k]:v}));});
pq('#pSizes').innerHTML=SIZES.map(([g,fs])=>`<div><h3>${g}, мм</h3>${fs.map(f=>
  `<div class="field"><label for="pS-${f.k}">${f.n}</label><output data-size-out="${f.k}"></output><input type="range" id="pS-${f.k}" data-size="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}"></div>`).join('')}</div>`).join('');
const sizeMsg=pq('#pSizeMsg');
function syncSizes(){sizeFields.forEach(f=>{const v=f.get(A);pq(`[data-size="${f.k}"]`).value=v;pq(`[data-size-out="${f.k}"]`).textContent=v;});
  planPanel.querySelectorAll('[data-mural]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mural===A.muralWall));}
// the photo wallpaper's wall: kept with the sizes (A.muralWall)
planPanel.querySelectorAll('[data-mural]').forEach(b=>b.addEventListener('click',()=>{
  const a={...A,muralWall:b.dataset.mural},why=aptProblems(a)[0];if(why){sizeMsg.textContent=`Нельзя: ${why}`;return;}setModel(a);}));
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
{ const s=readJSON('eng-plan-sizes');sizesBox.open=s!==false; }
sizesBox.addEventListener('toggle',()=>writeJSON('eng-plan-sizes',sizesBox.open));

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

/* every frame: dimensions and the room's name belong to the plan; dimension lines lie on the cut walls, the window's and the doorway height stand at them */
insetHide.push(dimsGroup,winDims,doorDims);
frameHooks.push(()=>{
  // dimensions come when the plan is reached; room floors and names change halfway (room views have the plain floor, as before)
  const on=view==='plan'&&!inTransition(),half=presence('plan')>=.5;
  dimsGroup.visible=on&&VS.plan.dims;namesGroup.visible=half&&VS.plan.names;roomGroup.visible=half;
  if(dimsGroup.visible&&dimsDirty)buildDims();
  dimsGroup.position.y=(wallFeetMode?0:wallCut)+.02;
  winDims.visible=dimsGroup.visible&&wallParts.some(w=>w.glass&&w.m.visible);   // the window's glass is on screen
  doorDims.visible=dimsGroup.visible&&camera.position.z>0&&wallParts.some(w=>w.id==='door'&&Math.abs(w.b-A.dH*MM)<1e-6&&w.m.visible);   // the lintel over the doorway is on screen, seen from the room
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
// Only over the area («13,00 м²»), not the whole inscription, and only where it is seen: anything in front of it (a wall, a door)
// hides it. The names themselves and the frame don't count, nor a part of a surface clipped away
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
  // the cut mode hides a wall while the camera looks at it from outside the room
  fade:Object.fromEntries(WALLS.filter(w=>w.ext).map(w=>[w.id,w.ext])),
  defaults:{Wm:'auto',Wh:100,dm:'closed',dims:true,names:true,floors:true},
  sun:()=>({x:CX,y:0,z:CZ,half:4.6}),   // shadows cover the whole room from any direction
  panel:planPanel,
  home:()=>setCam('plan'),
  sync:syncPlan
});
if(VS.plan.dm!=='none')doors.forEach(d=>d.t=VS.plan.dm==='open'?d.max:0);
