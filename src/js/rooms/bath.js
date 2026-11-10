/* ---------- «Санузел» view: the toilet niche — the tall cabinet against the back wall, the installation along the left wall ----------
   Bathroom coordinates as in the bath tab, mm: x along the back wall from the left wall, y up, z from the back wall into the room;
   the bathroom's (0,0) is its origin on the plan. The niche, the ceiling and the riser box come from the plan
   (A.bNiche, A.bL, A.H, A.rX, A.rZ), how far the left wall shows is the view's frame (VS.bath.L). Own scope: the room modules share names. */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W, L, H, Rx, Rz are the plan's niche, ceiling and riser box
const P={W:1200,H:2600,Rx:250,Rz:250,Hi:1200,Di:200,Gap:300,Du:200,Nu:2,Dt:300,L:1100,Lt:800,Wc:800,Dm:200,Pl:80,Sp:1500,Nb:2,Nh:3,Ec:30,T:16,TF:16,Mid:true,Feet:false};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  // axes: x along the back wall (left wall at x=0), y up, z from the back wall into the room
  const parts=[],W=p.W,H=p.H,RB=100,FL=p.Feet?10:0;   // FL: the tall cabinet sits on 10 mm feet
  const add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  const zf=Math.max(p.Dt,p.Rz+TF), zc=zf-TF;   // front plane of the back run (tall cabinet + riser cladding)
  const xb=W, xa=W-Math.min(p.Wc,W-p.Rx);     // carcass at the right; cladding covers riser + filler on the left
  const pl=p.Pl, sp=p.Hi;   // door split follows the installation height
  // tall cabinet, floor to ceiling, against the back wall, standing on a plinth
  add('Бок пенала','carcass',xa,xa+T,FL,H,0,zc);
  add('Бок пенала','carcass',xb-T,xb,FL,H,0,zc);
  add('Дно пенала','carcass',xa+T,xb-T,FL+pl,FL+pl+T,0,zc);
  add('Крышка пенала','carcass',xa+T,xb-T,H-T,H,0,zc);
  add('Полка-разделитель пенала','carcass',xa+T,xb-T,sp-T/2,sp+T/2,0,zc);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,FL+pl+T,FL+pl+T+RB,0,T);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,H-T-RB,H-T,0,T);
  const sb=(sp-T/2-FL-pl-T)/(p.Nb+1);
  for(let i=1;i<=p.Nb;i++){const y=FL+pl+T+i*sb-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  const sh=(H-T-sp-T/2)/(p.Nh+1);
  for(let i=1;i<=p.Nh;i++){const y=sp+T/2+i*sh-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  if(pl>0)add('Цоколь пенала и короба (заподлицо с фасадами)','front',G/2,W-G/2,FL,FL+pl-G/2,zc,zf);
  // fronts: riser cladding (fixed, two panels) + 4 doors, split at the same height
  const xm=(xa+xb)/2;
  [[FL+pl+G/2,sp-G/2,'нижняя'],[sp+G/2,H-G/2,'верхняя']].forEach(([y0,y1,nm])=>{
    add('Облицовка короба, '+nm+' (фасад, глухой)','front',0,xa-G/2,y0,y1,zc,zf);
    add('Фасад пенала','front',xa+G/2,xm-G/2,y0,y1,zc,zf,{hinge:'L'});
    add('Фасад пенала','front',xm+G/2,xb-G/2,y0,y1,zc,zf,{hinge:'R'});
  });
  // upper cabinet above the installation, along the left wall
  p.Lt=Math.max(200,p.L-zf);   // installation run fills the rest of the left wall
  const yb=p.Hi+p.Gap,dc=p.Du-TF,z0=zf,z1=zf+p.Lt;
  // separate product: open niche box in the gap between the installation and the upper cabinet, with its own LDSP back
  if(p.Mid!==false&&p.Gap>2*T+20){
    const dm=p.Dm||200;
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z0,z0+T);
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z1-T,z1);
    add('Дно ниши над инсталляцией','carcass',T,dm,p.Hi,p.Hi+T,z0+T,z1-T);
    add('Крышка ниши над инсталляцией','carcass',T,dm,yb-T,yb,z0+T,z1-T);
    add('Задняя стенка ниши над инсталляцией','carcass',0,T,p.Hi,yb,z0+T,z1-T);
  }
  if(H-yb>2*T+60){
    add('Бок верхнего шкафа','carcass',0,dc,yb,H,z0,z0+T);
    add('Бок верхнего шкафа','carcass',0,dc,yb,H,z1-T,z1);
    add('Дно верхнего шкафа','carcass',0,dc,yb,yb+T,z0+T,z1-T);
    add('Крышка верхнего шкафа','carcass',0,dc,H-T,H,z0+T,z1-T);
    const rb=Math.min(RB,(H-yb-2*T)/3);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,yb+T,yb+T+rb,z0+T,z1-T);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,H-T-rb,H-T,z0+T,z1-T);
    const su=(H-yb-T)/(p.Nu+1);
    for(let i=1;i<=p.Nu;i++){const y=yb+i*su;add('Полка верхнего шкафа','carcass',T,dc-10,y,y+T,z0+T,z1-T);}
    const zm=(z0+z1)/2;
    add('Фасад верхнего шкафа','front',dc,p.Du,yb,H-G/2,z0+G/2,zm-G/2,{pivot:{x:p.Du,z:z0+G/2,s:1}});
    add('Фасад верхнего шкафа','front',dc,p.Du,yb,H-G/2,zm+G/2,z1-G/2,{pivot:{x:p.Du,z:z1-G/2,s:-1}});
  }
  // every board that reaches the floor is lifted onto the feet
  if(FL)parts.forEach(q=>{if(q.y0<FL)q.y0=FL;});
  // feet at the corners of each floor-standing unit (8 mm in from the outer faces): tall cabinet, and the riser cladding front
  const cnr=(x0,x1,z0,z1)=>[[x0+8,z0+8],[x1-8,z0+8],[x0+8,z1-8],[x1-8,z1-8]];
  const feet=[...cnr(xa,xb,0,zf),[8,zf-8],[xa-8,zf-8]];
  return {parts,zf,yb,Hb:p.Hi,FL,feet};
}

const O=()=>ROOMS.find(r=>r.id==='bath').origin;   // the bathroom's (0,0) on the plan, mm
function clamp(){
  P.Wc=Math.min(P.Wc,P.W-P.Rx);
  P.Gap=Math.min(P.Gap,Math.max(0,P.H-P.Hi-200));
}
// sizes that belong to the walls come from the plan; the tall cabinet and the gap over the installation have to fit
function fromModel(){P.W=A.bNiche;P.L=A.bL;P.H=A.H;P.Rx=A.rX;P.Rz=A.rZ;clamp();T=P.T||16;TF=P.TF||16;current=computeParts(P);}
fromModel();

/* ---------- finishes and materials ---------- */
// finish per part group, as in the bath tab: wood decor or plain colour (no worktop here)
const FIN={carcass:{type:'uni',color:'#6E7173',name:'Диамант серый U963 ST9'},front:{type:'wood',decor:'H1386'}};
const mats=makeMats();
applyMaterials(mats,FIN,P.Ec);
const tileMat=new THREE.MeshStandardMaterial({color:0x6b6e70,roughness:.6});
const whiteMat=new THREE.MeshStandardMaterial({color:0xf4f4f2,roughness:.25,metalness:.05});
const chromeMat=new THREE.MeshStandardMaterial({color:0xc9c9c6,roughness:.2,metalness:.9});

/* the installation and the toilet stand in the niche (bath axes, m): the tiled installation box along the left wall
   under the upper cabinet, its flush plate, the wall-hung bowl facing +x with its seat */
function buildSanitary(g){
  const box=(x0,x1,y0,y1,z0,z1,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
  const zf=current.zf*MM,di=P.Di*MM,hi=P.Hi*MM,lt=P.Lt*MM,cz=zf+lt/2;
  box(0,di,0,hi,zf,zf+lt,tileMat);
  box(di,di+.008,hi-.28,hi-.115,cz-.123,cz+.123,chromeMat);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.18,.15,.36,32),whiteMat);
  bowl.scale.set(.7/.36,1,1);bowl.position.set(di+.15,.22,cz);bowl.castShadow=bowl.receiveShadow=true;g.add(bowl);   // 700 mm long: 200 mm sunk into the box, 500 mm out
  const seat=new THREE.Mesh(new THREE.CylinderGeometry(.185,.185,.02,32),whiteMat);
  seat.scale.set(.5/.37,1,1);seat.position.set(di+.25,.41,cz);g.add(seat);
}

/* ---------- dimension lines of the bathroom (bath axes; they belong to the bathroom and move with it) ---------- */
const dim=(a,b,txt,tick)=>roomDim(dimsGroup,a,b,txt,tick);
function buildDims(){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
  const zf=current.zf,yb=current.yb,z1=zf+P.Lt,xe=Math.max(P.Du,P.Di)+80;
  { const wc=Math.min(P.Wc,P.W-P.Rx),xa=P.W-wc,yd=P.H+120;
    dim(V(0,yd,0),V(P.Rx,yd,0),`${P.Rx}`,Y);
    if(xa>P.Rx)dim(V(P.Rx,yd,0),V(xa,yd,0),`${xa-P.Rx}`,Y);
    dim(V(xa,yd,0),V(P.W,yd,0),`${wc}`,Y);
    dim(V(0,yd+160,0),V(P.W,yd+160,0),`${P.W}`,Y); }
  dim(V(P.W,P.H+120,0),V(P.W,P.H+120,zf),`${zf}`,Y);
  dim(V(0,P.H+120,0),V(0,P.H+120,P.Rz),`${P.Rz}`,Y);
  if(zf>P.Rz)dim(V(0,P.H+120,P.Rz),V(0,P.H+120,zf),`${zf-P.Rz}`,Y);
  dim(V(0,P.H+120,zf),V(0,P.H+120,z1),`${P.Lt}`,Y);
  dim(V(0,P.H+280,0),V(0,P.H+280,P.L),`${P.L}`,Y);
  dim(V(P.W-60,0,zf+60),V(P.W-60,P.H,zf+60),`${P.H}`,X);
  dim(V(xe,0,z1-60),V(xe,P.Hi,z1-60),`${P.Hi}`,X);
  if(P.Gap>0)dim(V(xe,P.Hi,z1-60),V(xe,yb,z1-60),`${P.Gap}`,X);
  dim(V(0,yb-80,z1+40),V(P.Du,yb-80,z1+40),`${P.Du}`,Y);
}

/* ---------- the bathroom in the scene: built when it is on screen and something changed ---------- */
let model=null,doors=[],sani=null,dimsGroup=null,dirty=true;
function build(){
  T=P.T||16;TF=P.TF||16;current=computeParts(P);
  const prev=doors,V=VS.bath;disposeGroup(model);
  ({model,doors}=buildParts(current,mats,{prev,open:V.fronts==='open',edges:V.edges!==false}));
  sani=new THREE.Group();buildSanitary(sani);model.add(sani);
  dimsGroup=new THREE.Group();buildDims();model.add(dimsGroup);
  clipToFloor(model);
  const [ox,oz]=O();model.position.set(ox*MM,0,oz*MM);
  scene.add(model);dirty=false;applyVisibility();updatePanel();
}
// what the view shows: fronts, joint lines, the installation and the toilet (with the walls, as in the bath tab), dimensions
function applyVisibility(){
  if(!model)return;const V=VS.bath;
  model.children.forEach(o=>{if(o.userData.front)o.visible=V.fronts!=='hidden';});
  model.traverse(o=>{if(o.userData.edge)o.visible=V.edges!==false;});
  sani.visible=V.walls!==false;dimsGroup.visible=V.dims!==false;
}
// every frame: built when on screen and changed; in a flight it sinks into the floor or rises out of it; the doors swing
frameHooks.push((dt,ease)=>{
  const on=view==='bath',s=presence('bath');
  if(on&&dirty)build();
  if(!model)return;
  model.visible=s>.001;model.position.y=-(1-s)*(P.H*MM+.1);
  dimsGroup.visible=VS.bath.dims!==false&&!inTransition();   // dimension lines come when the bathroom is reached
  if(!on)return;
  doors.forEach(d=>{
    if(held&&held.d===d){d.t=Math.min(DMAX,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}
    else d.a+=(d.t-d.a)*ease(.09);
    turnDoor(d);});
  if(wallGroup)wallGroup.visible=VS.bath.walls!==false;
});

/* camera presets of the bath tab, moved to where the bathroom lies on the plan */
function setCam(v){
  const base=Math.max(P.H,P.W*1.6)*MM*1.9*Math.max(1,Math.pow(1/(camera.aspect||1),.95));   // pull back on tall, narrow screens
  const views={persp:[.75,1.25,base],front:[Math.PI/2,1.5,base*.9],top:[.6,.42,base*1.2],tall:[.25,1.4,base*.95],upper:[1.35,1.3,base*.8],riser:[.45,1.2,base*.85]};
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];
  const zf=current.zf*MM,[ox,oz]=O().map(u=>u*MM),at=(x,y,z)=>goalT.set(ox+x,y,oz+z);
  if(v==='tall')at((P.Rx+P.W)/2*MM,P.H*MM*.5,zf*.5);
  else if(v==='upper')at(P.Du*MM*.5,(current.yb+(P.H-current.yb)/2)*MM,zf+P.Lt*MM/2);
  else if(v==='riser')at(P.Rx*MM*.5,P.H*MM*.55,zf);
  else if(v==='front')at(P.W/2*MM,P.H*MM*.45,zf+P.Lt*MM/2);
  else at(P.W/2*MM,P.H/2*MM,.55);
  shortWay();
}

/* ---------- panel ---------- */
const panel=document.querySelector('[data-panel="bath"]'),bq=s=>panel.querySelector(s);
bq('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
// how far from the back wall the left wall shows: the view's frame, up to the kitchen wall
const frameL=bq('#bFrameL');
const showL=()=>Math.min(VS.bath.L,hLen);
frameL.addEventListener('input',e=>{VS.bath.L=+e.target.value;saveView('bath');syncBath();
  if(view==='bath'){buildWalls(VIEWS.bath);aimView();}});
// what the bathroom has: the niche over the installation, feet under the tall cabinet; panel thickness
function syncThick(){bq('#b-tMid').checked=P.Mid!==false;bq('#b-tFeet').checked=!!P.Feet;panel.querySelectorAll('[data-thick]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.thick===(P[x.dataset.for]||16)));}
bq('#b-tMid').addEventListener('change',e=>{P.Mid=e.target.checked;build();});
bq('#b-tFeet').addEventListener('change',e=>{P.Feet=e.target.checked;build();});
panel.querySelectorAll('[data-thick]').forEach(b=>b.addEventListener('click',()=>{P[b.dataset.for]=+b.dataset.thick;syncThick();build();}));
// cabinet sizes
const ids=['Hi','Di','Gap','Du','Nu','Dm','Dt','Wc','Pl','Nh','Nb'];
const syncIds=()=>ids.forEach(j=>{bq(`[data-p="${j}"]`).value=P[j];});
ids.forEach(id=>bq(`[data-p="${id}"]`).addEventListener('input',e=>{P[id]=+e.target.value;clamp();syncIds();build();}));
// fronts: all open, all closed (or nothing pressed when they differ), or taken off
function syncDoorMode(){
  const V=VS.bath;let st=V.fronts;
  if(st!=='hidden'&&doors.length){const n=doors.filter(d=>d.t>=DMAX-.01).length,z=doors.filter(d=>d.t<=.01).length;
    st=n===doors.length?'open':z===doors.length?'closed':'mixed';if(st!=='mixed')V.fronts=st;}
  panel.querySelectorAll('[data-door]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.door===st));
}
panel.querySelectorAll('[data-door]').forEach(b=>b.addEventListener('click',()=>{
  const V=VS.bath;V.fronts=b.dataset.door;if(V.fronts!=='hidden')doors.forEach(d=>d.t=V.fronts==='open'?DMAX:0);
  syncDoorMode();applyVisibility();saveView('bath');}));
// dimensions, walls with the installation and the toilet, joint lines of the parts
const toggles={dims:'#b-tDims',walls:'#b-tWall',edges:'#b-tEdges'};
Object.entries(toggles).forEach(([k,s])=>bq(s).addEventListener('change',e=>{VS.bath[k]=e.target.checked;applyVisibility();saveView('bath');}));

/* ---------- finishes: a swatch paints the carcass and the fronts; its menu paints one of them ---------- */
fillPalette(panel);
const palette=[...panel.querySelectorAll('[data-decor],[data-uc]')];
palette.forEach(b=>{const t=document.createElement('span');t.className='tags';b.appendChild(t);});
const sameFin=(b,f)=>f.type==='wood'?b.dataset.decor===f.decor:(b.dataset.uc||'').toLowerCase()===(f.color||'').toLowerCase();
const WHERE=['carcass','front'];
function syncFinish(){
  palette.forEach(b=>{
    const c=sameFin(b,FIN.carcass),f=sameFin(b,FIN.front);
    b.setAttribute('aria-pressed',c||f);
    b.querySelector('.tags').innerHTML=(c?'<b>К</b>':'')+(f?'<b>Ф</b>':'');
  });
  const custom=f=>f.type==='uni'&&!palette.some(b=>sameFin(b,f));
  const cf=custom(FIN.front)?FIN.front:custom(FIN.carcass)?FIN.carcass:null;
  bq('#b-uniColor').value=cf?cf.color:'#C2B8AA';
  bq('#b-ccCard').classList.toggle('on',!!cf);
  bq('#b-ccCode').textContent=cf?cf.color.toUpperCase():'палитра';
  bq('#b-ccTags').innerHTML=(custom(FIN.carcass)?'<b>К</b>':'')+(custom(FIN.front)?'<b>Ф</b>':'');
  bq('#b-finNow').innerHTML=`<span>Корпус</span><span>${finName(FIN.carcass)}</span><span>Фасады</span><span>${finName(FIN.front)}</span>`;
}
function setFinish(f,where){
  if(where!=='front')FIN.carcass=Object.assign({},f);
  if(where!=='carcass')FIN.front=Object.assign({},f);
  applyMaterials(mats,FIN,P.Ec);syncFinish();updatePanel();
}
const pickFor=b=>b.dataset.decor?{type:'wood',decor:b.dataset.decor}:{type:'uni',color:b.dataset.uc,name:b.dataset.un};
palette.forEach(b=>{
  b.addEventListener('click',()=>setFinish(pickFor(b),'both'));
  b.title='Клик — весь шкаф. Правая кнопка или долгое нажатие — только корпус или фасады';
  b.addEventListener('contextmenu',e=>{e.preventDefault();openCtx(e.clientX,e.clientY,w=>setFinish(pickFor(b),w),WHERE);});
  longPress(b,(x,y)=>openCtx(x,y,w=>setFinish(pickFor(b),w),WHERE));
});
// own colour: the picker paints the whole cabinet, or the group chosen in its menu
let ccWhere='both';
const ccInput=bq('#b-uniColor');
ccInput.addEventListener('click',()=>{if(!ccInput.dataset.keep)ccWhere='both';delete ccInput.dataset.keep;});
bq('#b-ccCard').addEventListener('contextmenu',e=>{e.preventDefault();openCtx(e.clientX,e.clientY,w=>{ccWhere=w;ccInput.dataset.keep='1';ccInput.click();},WHERE);});
ccInput.addEventListener('input',e=>setFinish({type:'uni',color:e.target.value,name:'Свой цвет '+e.target.value.toUpperCase()},ccWhere));
// contrast of the end faces and joint lines
const syncEc=()=>{bq('#b-Ec').value=P.Ec;bq('#b-oEc').textContent=P.Ec+'%';};
bq('#b-Ec').addEventListener('input',e=>{P.Ec=+e.target.value;applyContrast(mats,FIN,P.Ec);syncEc();});

/* ---------- cut list ---------- */
const matName=m=>m==='back'?'ХДФ 4':`ЛДСП ${m==='front'?TF:T} · `+finName(finOf(FIN,m));
function cutList(){
  const map=new Map();
  current.parts.forEach(p=>{
    const d=[p.x1-p.x0,p.y1-p.y0,p.z1-p.z0].map(v=>Math.round(v)).sort((a,b)=>b-a);
    const key=p.name+'|'+d[0]+'|'+d[1];
    if(!map.has(key))map.set(key,{name:p.name,mat:p.mat,L:d[0],B:d[1],t:d[2],n:0});map.get(key).n++;
  });
  return [...map.values()];
}
function updateCut(){
  // group by material so each sheet decor can be ordered separately
  const rows=cutList().sort((a,b)=>matName(a.mat).localeCompare(matName(b.mat)));const area={};
  let last='';
  bq('#b-cut').innerHTML=rows.map(r=>{const mn=matName(r.mat);area[mn]=(area[mn]||0)+r.L*r.B*r.n/1e6;
    const head=mn!==last?`<tr><th colspan="3" class="mh">${mn}</th></tr>`:'';last=mn;
    return head+`<tr><td>${r.name}</td><td class="n">${r.L} × ${r.B}</td><td class="n">${r.n}</td></tr>`;}).join('');
  const total=rows.reduce((s,r)=>s+r.n,0);
  bq('#b-tot').innerHTML=`<span>${total} деталей</span>`+Object.entries(area).map(([k,v])=>`<span>${k}: ${v.toFixed(2)} м²</span>`).join('')+(current.FL>0?`<span>Опоры регулируемые М6, шайба Ø15×5: ${current.feet.length} шт</span>`:'');
  bq('#b-csv').value='Деталь;Материал;Длина;Ширина;Толщина;Кол-во\n'+rows.map(r=>[r.name,matName(r.mat),r.L,r.B,r.t,r.n].join(';')).join('\n');
}
bq('#b-copy').addEventListener('click',()=>{const ta=bq('#b-csv');copyText(ta,ta.value,bq('#b-copied'),'Скопировано');});

/* ---------- settings to start with: in this browser, or as a code for the chat ----------
   the cabinets and their finishes; the niche, the ceiling and the riser box belong to the plan, the view settings are remembered by themselves */
const KEY='apt-bath-v2';
const getState=()=>{const p=Object.assign({},P);['W','L','H','Rx','Rz','Lt'].forEach(k=>delete p[k]);return {P:p,FIN:JSON.parse(JSON.stringify(FIN))};};
const FACTORY=JSON.stringify(getState());
function applyState(s){
  if(s.P)Object.assign(P,s.P);
  const okF=f=>f&&(f.type==='uni'||(f.type==='wood'&&DECORS[f.decor]));
  if(s.FIN&&okF(s.FIN.carcass)&&okF(s.FIN.front)){FIN.carcass=s.FIN.carcass;FIN.front=s.FIN.front;}
  fromModel();applyMaterials(mats,FIN,P.Ec);dirty=true;
}
{ const s=readJSON(KEY);if(s)applyState(s); }
const defMsg=bq('#b-defMsg');
bq('#b-saveDef').addEventListener('click',()=>{try{localStorage.setItem(KEY,JSON.stringify(getState()));defMsg.textContent='Сохранено в этом браузере';}catch(e){defMsg.textContent='Браузер не дал сохранить. Скопируйте код и пришлите в чат';}});
bq('#b-resetDef').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch(e){}applyState(JSON.parse(FACTORY));syncBath();defMsg.textContent='Исходные настройки возвращены';});
bq('#b-copyDef').addEventListener('click',()=>copyText(bq('#b-defCode'),JSON.stringify(getState()),defMsg,'Код скопирован'));

// sizes, the niche and the ceiling (from the plan), the space between the shelves, the finishes, the cut list
function updatePanel(){
  ids.forEach(id=>{bq(`[data-p-out="${id}"]`).textContent=/^N/.test(id)?P[id]:P[id]+' мм';});
  bq('#b-W').textContent=P.W+' мм';bq('#b-L').textContent=P.L+' мм';bq('#b-H').textContent=P.H+' мм';bq('#b-R').textContent=`${P.Rx} × ${P.Rz} мм`;
  const fc=finName(FIN.carcass),ff=finName(FIN.front);
  bq('#bSub').textContent=`ниша ${P.W} × ${P.L} мм · потолок ${P.H} мм · `+(fc===ff?fc:`корпус — ${fc}; фасады — ${ff}`);
  updateCut();
  const t=P.T||16,f=v=>v.toFixed(1).replace('.',',').replace(',0',''),fl=P.Feet?10:0;
  // free height between neighbouring shelves (from the top of one shelf to the underside of the next)
  const sb=(P.Hi-t/2-P.Pl-fl-t)/(P.Nb+1),sh=(P.H-t-P.Hi-t/2)/(P.Nh+1);
  const yb=P.Hi+P.Gap,su=(P.H-yb-t)/(P.Nu+1);
  const gap=(n,v)=>(n?`между полками ${f(v-t)} мм`:`без полок: высота отделения ${f(v-t)} мм`);
  bq('#b-gapB').textContent=`Высота дверей ${P.Hi-P.Pl-fl} мм · `+gap(P.Nb,sb);
  bq('#b-gapH').textContent=`Высота дверей ${P.H-P.Hi} мм · `+gap(P.Nh,sh);
  const on=P.Mid!==false;
  bq('#b-Dm').disabled=!on;bq('#b-fDm').style.opacity=on?1:.45;
  bq('#b-gapM').textContent=on?`Высота ниши ${P.Gap} мм · внутри ${Math.max(0,P.Gap-2*t)} мм`:'Ниша выключена в блоке «Состав»';
  bq('#b-gapM').style.opacity=on?1:.45;
  bq('#b-gapU').textContent=`Высота шкафа ${P.H-yb} мм · `+gap(P.Nu,su);
}
// the sizes block stays open or closed as it was left
const sizesBox=bq('#b-sizesBox');
sizesBox.addEventListener('toggle',()=>{if(VS.bath.sizes!==sizesBox.open){VS.bath.sizes=sizesBox.open;saveView('bath');}});
function syncBath(){
  frameL.max=hLen;frameL.value=showL();bq('#bFrameLOut').textContent=showL();
  sizesBox.open=VS.bath.sizes!==false;
  Object.entries(toggles).forEach(([k,s])=>{bq(s).checked=VS.bath[k]!==false;});
  syncIds();syncThick();syncDoorMode();syncFinish();syncEc();updatePanel();applyVisibility();
}

addView('bath',{
  rooms:['bath'],
  // the niche: the back wall up to the outer face of the partition next to the tall cabinet, the left wall up to L from the back wall
  frame:()=>{const [ox,oz]=O();return [ox-A.bear,ox+A.bNiche+A.wt,oz-A.bear,oz+showL()];},
  // the walls at the open side of the niche hide as in the bath tab: the partition while the camera is right of its inner face,
  // the wall at the niche end and the shower partition while the camera is past the niche end
  fade:{bathStub:'+x',nicheEnd:'+z',shower:'+z'},
  // as in the bath tab: the sun aims at the middle of the back wall, shadows cover 6 × 6 m
  sun:()=>{const [ox,oz]=O();return {x:(ox+A.bNiche/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
  anchor:O,   // the remembered camera moves with the bathroom
  furniture:()=>({model,doors,P,current,sani,dims:dimsGroup}),   // the built bathroom: for the plan (stage 7) and the checks
  defaults:{Wm:'auto',Wh:100,L:1400,sizes:true,fronts:'closed',dims:true,walls:true,edges:true},
  panel,
  home:()=>setCam('persp'),
  sync:syncBath,
  onDoors:syncDoorMode
});
// the plan changed the sizes: the niche, the ceiling, the riser box and the bathroom's place come along;
// the bathroom is rebuilt when next on screen
modelHooks.push(()=>{fromModel();dirty=true;syncBath();});
})();
