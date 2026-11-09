/* ---------- «Планировка» view: the whole apartment, plan dimensions, camera presets, what the plan assumes ---------- */
/* ---------- dimension lines ---------- */
const labels=[];
function label(text){
  const c=document.createElement('canvas'),g=c.getContext('2d'),f=44;
  g.font=`500 ${f}px "JetBrains Mono", monospace`;const w=Math.ceil(g.measureText(text).width)+36;
  c.width=w;c.height=f+26;g.font=`500 ${f}px "JetBrains Mono", monospace`;
  g.fillStyle='rgba(255,255,255,.94)';const r=12;g.beginPath();g.moveTo(r,0);g.arcTo(w,0,w,c.height,r);g.arcTo(w,c.height,0,c.height,r);g.arcTo(0,c.height,0,0,r);g.arcTo(0,0,w,0,r);g.fill();
  g.fillStyle=text.includes('?')?'#9a4d16':'#1f4a3f';g.textBaseline='middle';g.fillText(text,18,c.height/2+2);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));
  s.renderOrder=20;s.userData.ar=w/c.height;labels.push(s);return s;
}
const dimMat=new THREE.LineBasicMaterial({color:0x2f5d50,depthTest:false,transparent:true});
const dimsGroup=new THREE.Group();scene.add(dimsGroup);
function dim(x0,z0,x1,z1,txt){
  const a=new THREE.Vector3(x0*MM,0,z0*MM),b=new THREE.Vector3(x1*MM,0,z1*MM);
  const d=b.clone().sub(a).normalize(),t=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(.05);
  const pts=[a,b,a.clone().add(t),a.clone().sub(t),b.clone().add(t),b.clone().sub(t)];
  const l=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),dimMat);l.renderOrder=19;dimsGroup.add(l);
  const s=label(txt);s.position.copy(a).add(b).multiplyScalar(.5);dimsGroup.add(s);
}
// labels are computed from A, so changing a size above updates the drawing
dim(0,250,A.hallW,250,`${A.hallW}`);
dim(A.eD0,-330,A.eD1,-330,`вход ${A.eD1-A.eD0}`);
dim(200,0,200,A.hL1,`${A.hL1}`);
dim(200,A.hL1,200,A.hL1+A.bDoor,`проём ${A.bDoor} · h${A.bDoorH}`);
dim(200,A.hL1+A.bDoor,200,hLen,`${A.hL2}`);
dim(A.hallW-200,0,A.hallW-200,hLen,`${hLen}`);
dim(0,hLen-140,A.kOver,hLen-140,`${A.kOver}`);
dim(A.kOver,hLen-140,A.hallW-A.kOver,hLen-140,`проход ${A.hallW-2*A.kOver}`);
dim(A.hallW-A.kOver,hLen-140,A.hallW,hLen-140,`${A.kOver}`);
dim(A.kOver,kZ1+350,A.hallW,kZ1+350,`${A.hallW-A.kOver}`);
dim(xL,kZ1+160,A.kOver,kZ1+160,`${A.kW}`);
dim(xL+200,kZ1,xL+200,zEnd,`${A.kL}`);
dim(A.hallW-200,kZ1,A.hallW-200,zEnd,`${A.kL}`);
dim(xL,zEnd-250,A.hallW,zEnd-250,`${A.hallW-xL}`);
dim(winX-A.winW/2,zEnd+A.bear+130,winX+A.winW/2,zEnd+A.bear+130,`окно ${A.winW} × ${A.winH}, от пола ${A.winS}`);
dim(xL,bz(A.bL)-400,xB1,bz(A.bL)-400,`${xB1-xL}`);
dim(xL,bz(A.bL)+200,bx(A.bWs+A.bGap),bz(A.bL)+200,`${A.bWs+A.bGap}`);
dim(bx(A.bWs+A.bGap+A.wt),bz(A.bL)+200,xB1,bz(A.bL)+200,`${xB1-bx(A.bWs+A.bGap+A.wt)}`);
dim(-280,A.hL1+A.bDoor,-280,zV0,`${A.vOff}`);
dim(bx(A.bWs+A.bGap+A.wt)+80,zV0+A.wt,bx(A.bWs+A.bGap+A.wt)+80,kZ0,`${kZ0-zV0-A.wt}`);
dim(xL,zB0+420,bx(A.bNiche),zB0+420,`${A.bNiche}`);
dim(bx(A.bNiche+A.wt),zB0+420,xB1,zB0+420,`${xB1-bx(A.bNiche+A.wt)}`);
dim(-1350,zB0,-1350,kZ0,`${kZ0-zB0}`);
dim(xL+420,zB0,xL+420,bz(A.bL),`${A.bL}`);


// distance at which the whole apartment fits the frame from straight above
function fitR(wmm=BOX.x1-BOX.x0,dmm=BOX.z1-BOX.z0){
  const t=Math.tan(camera.fov*Math.PI/360),w=wmm*MM,d=dmm*MM;
  return Math.max(d/2/t,w/2/(t*(camera.aspect||1)))*1.12+H*MM;   // + wall height: the wall tops are that much closer to the camera
}
// camera presets of the plan (buttons «Камера»)
function setCam(v){
  const f=fitR(),fr=fitR(3600,3550);   // fr: room views keep the scale of the hall + bathroom block
  const views={
    plan:[0,.4,f*1.2,CX,0,CZ-.3],   // whole plan from above, tilted from the kitchen side
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
pq('#pFacts').innerHTML=
  `<div class="room">Прихожая</div><dl class="facts">${
    row('Ширина',A.hallW)+row('Левая стена',`${A.hL1} + проём ${A.bDoor} (h ${A.bDoorH}) + ${A.hL2}`)+row('Правая стена',`${hLen} до кухонной стены`)+row('Входной проём',`${A.eD1-A.eD0} × ${A.eDH}, несущая стена ${A.bear}`)}</dl>`+
  `<div class="room">Санузел</div><dl class="facts">${
    row('Вдоль задней стены',`${xB1-xL} = ${A.bNiche} + ${A.wt} + ${xB1-bx(A.bNiche+A.wt)}`)+row('Глубина',`${kZ0-zB0}`)+row('Ниша с инсталляцией',`${A.bNiche} × ${A.bL}`)+row('Вентшахта',`${xB1-bx(A.bWs+A.bGap+A.wt)} × ${kZ0-zV0-A.wt}, стенка в ${A.vOff} от проёма`)}</dl>`+
  `<div class="room">Кухня</div><dl class="facts">${
    row('Стена',`${A.kW}, выступает за стену прихожей на ${A.kOver}`)+row('Левая и правая стены',A.kL)+row('Ширина',A.hallW-xL)+row('Окно',`${A.winW} × ${A.winH}, от пола ${A.winS}, по центру внешней стены`)+row('Проход из прихожей',`${A.hallW-2*A.kOver}, стенки по ${A.kOver} с обеих сторон`)}</dl>`+
  `<p class="note" style="margin:10px 0 0">Внешние стены ${A.bear} мм (со входом, левая стена санузла и кухни, правая стена прихожей и кухни, стена с окном), остальные ${A.wt} мм, потолок ${H}. Внутренние стенки санузла взяты из вкладки «Санузел», входной проём — из «Прихожей».</p>`;
pq('#pSub').textContent=`${(BOX.x1-BOX.x0)} × ${(BOX.z1-BOX.z0)} мм по внешним стенам · потолок ${H}`;

/* the plan's own settings: doors, dimensions, room names, floor colours */
function syncPlan(){
  const V=VS.plan;
  planPanel.querySelectorAll('[data-dm]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.dm===V.dm));
  pq('#pDims').checked=V.dims;pq('#pNames').checked=V.names;pq('#pFloors').checked=V.floors;
}
// doors segment: all open, all closed, or nothing pressed when the doors differ
function syncDoorSeg(){
  const V=VS.plan;
  if(V.dm==='none')return;
  const open=doors.filter(d=>d.t!==0).length,st=open===doors.length?'open':open===0?'closed':'mixed';
  if(st!=='mixed')V.dm=st;
  planPanel.querySelectorAll('[data-dm]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.dm===st));
}
planPanel.querySelectorAll('[data-dm]').forEach(b=>b.addEventListener('click',()=>{const V=VS.plan;V.dm=b.dataset.dm;if(V.dm!=='none')doors.forEach(d=>d.t=V.dm==='open'?d.max:0);syncPlan();saveView('plan');}));
pq('#pDims').addEventListener('change',e=>{VS.plan.dims=e.target.checked;saveView('plan');});
pq('#pNames').addEventListener('change',e=>{VS.plan.names=e.target.checked;saveView('plan');});
pq('#pFloors').addEventListener('change',e=>{VS.plan.floors=e.target.checked;applyTheme();saveView('plan');});

/* every frame: dimensions and room names belong to the plan; dimension lines lie on the cut walls */
const _v=new THREE.Vector3();
insetHide.push(dimsGroup);
frameHooks.push(()=>{
  const on=view==='plan';
  dimsGroup.visible=on&&VS.plan.dims;namesGroup.visible=on&&VS.plan.names;
  dimsGroup.position.y=(wallOutlineMode?0:wallCut)+.02;
  // dimension labels keep the same size on screen at any zoom
  { const k=2*Math.tan(camera.fov*Math.PI/360)/(viewer.clientHeight||1);
    labels.forEach(s=>{s.getWorldPosition(_v);const u=_v.distanceTo(camera.position)*k;s.scale.set(19*u*s.userData.ar,19*u,1);}); }
});

addView('plan',{
  rooms:'all',
  // the cut mode hides only the outer walls of the apartment, each while the camera looks at it from outside; inner walls always stay
  fade:Object.fromEntries(WALLS.filter(w=>w.ext).map(w=>[w.id,w.ext])),
  defaults:{Wm:'auto',Wh:100,dm:'closed',dims:false,names:true,floors:true},
  panel:planPanel,
  home:()=>setCam('plan'),
  sync:syncPlan,
  onDoors:syncDoorSeg
});
if(VS.plan.dm!=='none')doors.forEach(d=>d.t=VS.plan.dm==='open'?d.max:0);
