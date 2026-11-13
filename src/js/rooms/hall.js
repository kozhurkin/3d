/* ---------- «Прихожая» view: the portal cabinet around the entrance door ----------
   Hall coordinates as in the hall tab, mm: x along the bearing wall from the left wall, y up, z from the bearing wall into the room;
   the hall's (0,0) is its origin on the plan. The walls make the entrance opening, the cabinet follows it: its width is the hall
   (A.hallW), the false panel and the shelf column reach the opening's sides, the mezzanine sits on its top (A.eD0, A.eD1, A.eDH),
   the reveal cladding is as deep as the door frame sits in the wall (A.eRv). How far the side walls show is the view's frame (VS.hall.Sd).
   Own scope: the room modules share names. */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W, Lw, Rw, Ht, Rv come from the plan's hall and entrance opening
const P={W:1200,H:2600,D:400,Ht:600,Lw:100,Rw:240,N:5,Pl:80,plinth:true,Rv:100,reveal:true,Ec:30,T:16,TF:16,Feet:false};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  const parts=[], W=p.W, Dc=p.D-TF, Hb=p.H-p.Ht, FL=p.Feet?10:0;   // FL: floor-standing parts sit on 10 mm feet
  const add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  // left column
  // left column is a false panel: inner side + fixed front, no outer side, no back
  add('Бок левой фальш-панели (со стороны проёма)','carcass',p.Lw-T,p.Lw,FL,Hb,0,Dc);
  add('Дно / крышка левой фальш-панели','carcass',0,p.Lw-T,FL,FL+T,0,Dc);
  add('Дно / крышка левой фальш-панели','carcass',0,p.Lw-T,Hb-T,Hb,0,Dc);
  add('Левая фальш-панель (лицевая, глухая)','front',0,p.Lw-G/2,FL,Hb-G/2,Dc,Dc+TF);
  // right column
  const rx=W-p.Rw;
  add('Бок правой колонны','carcass',W-T,W,FL,Hb,0,Dc);
  add('Задняя стенка правой колонны','carcass',rx,W-T,FL,Hb,0,T);
  const pl=p.plinth?p.Pl:0;
  add('Лицевая панель правой колонны','front',rx+G/2,W-G/2,FL,Hb-G/2,Dc,Dc+TF);
  if(pl){
    add('Цоколь правой колонны (со стороны проёма)','carcass',rx,rx+T,FL,FL+pl,T,Dc);
  }
  const step=(Hb-T-pl-FL)/(p.N+1);
  for(let i=0;i<=p.N+1;i++){
    const y=i===p.N+1?Hb-T:FL+pl+i*step;
    add(i===0?'Дно правой колонны':i===p.N+1?'Крышка правой колонны':'Полка правой колонны','carcass',rx,W-T,y,y+T,T,Dc);
  }
  // top: two separate carcasses for easier installation
  const ym=Hb+p.Ht/2-T/2;
  const topBox=(nm,x0,x1)=>{
    // no back panel: two 100 mm rails at the back (top and bottom) keep the box square and take the wall fixings
    const RB=100;
    add('Бок антресоли — '+nm,'carcass',x0,x0+T,Hb,p.H,0,Dc);
    add('Бок антресоли — '+nm,'carcass',x1-T,x1,Hb,p.H,0,Dc);
    add('Дно антресоли — '+nm,'carcass',x0+T,x1-T,Hb,Hb+T,0,Dc);
    add('Крышка антресоли — '+nm,'carcass',x0+T,x1-T,p.H-T,p.H,0,Dc);
    add('Ребро жёсткости антресоли — '+nm,'carcass',x0+T,x1-T,Hb+T,Hb+T+RB,0,T);
    add('Ребро жёсткости антресоли — '+nm,'carcass',x0+T,x1-T,p.H-T-RB,p.H-T,0,T);
    add('Полка антресоли — '+nm,'carcass',x0+T,x1-T,ym,ym+T,0,Dc-20);
  };
  topBox('центральный корпус',0,rx);
  topBox('правый корпус',rx,W);
  if(p.reveal){
    const z0=-p.Rv;
    add('Обрамление откоса левое','carcass',p.Lw-T,p.Lw,0,Hb,z0,0);
    add('Обрамление откоса правое','carcass',rx,rx+T,0,Hb,z0,0);
    add('Обрамление откоса верхнее','carcass',p.Lw-T,rx+T,Hb,Hb+T,z0,0);
  }
  const mid=(p.Lw+rx)/2;
  add('Фальш-панель антресоли (под петли, глухая)','front',0,p.Lw-G/2,Hb+G/2,p.H,Dc,Dc+TF);
  add('Фасад антресоли','front',p.Lw+G/2,mid-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'L'});
  add('Фасад антресоли','front',mid+G/2,rx-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'R'});
  add('Фасад антресоли правый','front',rx+G/2,W-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'R'});
  // every board that reaches the floor is lifted onto the feet
  if(FL)parts.forEach(q=>{if(q.y0<FL)q.y0=FL;});
  // feet at the corners of each floor-standing unit (8 mm in from the outer faces)
  const cnr=(x0,x1,z0,z1)=>[[x0+8,z0+8],[x1-8,z0+8],[x0+8,z1-8],[x1-8,z1-8]];
  const feet=[...cnr(0,p.Lw,0,Dc+TF),...cnr(rx,W,0,Dc+TF)];
  return {parts,Dc,Hb,FL,feet};
}

const O=()=>ROOMS.find(r=>r.id==='hall').origin;   // the hall's (0,0) on the plan, mm
/* sizes that belong to the walls come from the plan: the false panel and the column reach the opening's sides, the mezzanine
   starts at its top; with the reveal cladding on, each is one board bigger and the board lines the opening. The cabinet is no
   higher than the ceiling and leaves the mezzanine at least HT_MIN (its two back rails fit) */
const HT_MIN=300;
const hBottom=()=>A.eDH-(P.reveal?(P.T||16):0);   // where the mezzanine starts: the top of the opening, or of its cladding
const hRange=()=>{const hi=A.H;return [Math.min(hBottom()+HT_MIN,hi),hi];};
function fromModel(){
  T=P.T||16;TF=P.TF||16;const rv=P.reveal?T:0,[h0,h1]=hRange();
  P.W=A.hallW;P.Rv=A.eRv;P.H=Math.max(h0,Math.min(P.H,h1));
  P.Lw=A.eD0+rv;P.Rw=A.hallW-A.eD1+rv;P.Ht=P.H-hBottom();
  current=computeParts(P);
}
fromModel();

/* ---------- finishes and materials ---------- */
// finish per part group, as in the hall tab: wood decor or plain colour (no worktop here)
const FIN={carcass:{type:'wood',decor:'H1386'},front:{type:'wood',decor:'H1386'}};
const mats=makeMats();
applyMaterials(mats,FIN,P.Ec);

/* ---------- dimension lines of the hall (hall axes; they belong to the cabinet and move with it) ---------- */
const dim=(a,b,txt,tick)=>roomDim(dimsGroup,a,b,txt,tick);
function buildDims(){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),z=P.D+60,Hb=current.Hb;
  const ow=P.W-P.Lw-P.Rw;
  dim(V(0,P.H+140,z),V(P.W,P.H+140,z),`${P.W}`,Y);
  dim(V(P.W+160,0,z),V(P.W+160,P.H,z),`${P.H}`,X);
  dim(V(-160,Hb,z),V(-160,P.H,z),`${P.Ht}`,X);
  dim(V(P.Lw,260,z),V(P.W-P.Rw,260,z),`проём ${ow}`,Y);
  dim(V((P.Lw+P.W-P.Rw)/2,0,z),V((P.Lw+P.W-P.Rw)/2,Hb,z),`${Hb}`,X);
  dim(V(P.W+160,P.H+140,0),V(P.W+160,P.H+140,P.D),`${P.D}`,Y);
}

/* ---------- the hall cabinet in the scene: built when it is on screen and something changed ---------- */
let model=null,doors=[],dimsGroup=null,foot=null,dirty=true;
const clip=furnClip();   // the hall cabinet's floor and top planes
function build(){
  fromModel();
  const prev=doors,V=VS.hall;disposeGroup(model);
  ({model,doors}=buildParts(current,mats,{prev,open:V.fronts==='open',edges:V.edges!==false}));
  dimsGroup=new THREE.Group();buildDims();model.add(dimsGroup);
  clipToFloor(model,clip);
  // its footprint for «Контуры» on the plan: the false panel, the shelf column, the cladding of the reveals
  foot=furnFoot(current);if(foot){foot.material.clippingPlanes=[clip[0]];model.add(foot);}
  place();scene.add(model);dirty=false;applyVisibility();updatePanel();
}
// the cabinet where the hall lies on the plan
function place(){if(!model)return;const [ox,oz]=O();model.position.x=ox*MM;model.position.z=oz*MM;}
// what the cabinet shows wherever it is seen: fronts, joint lines (the dimensions, the walls and the entrance door: every frame, below)
function applyVisibility(){
  if(!model)return;const V=VS.hall;
  model.children.forEach(o=>{if(o.userData.front)o.visible=V.fronts!=='hidden';});
  model.traverse(o=>{if(o.userData.edge)o.visible=V.edges!==false;});
}
// every frame: built when in the scene (its view, or the plan with «Шкафы») and changed; in a flight it sinks into the floor
// or rises out of it; the doors swing wherever they are seen; in the hall's own view «Стена и дверь» off takes away the walls,
// the entrance door and its swing
frameHooks.push((dt,ease)=>{
  const on=view==='hall',s=presence('hall');
  if(dirty&&(on||s>.001))build();
  if(!model)return;
  model.visible=s>.001;model.position.y=-(1-s)*(P.H*MM+.1);
  // on the plan it is cut at the walls' height (its top plane goes down with it in a flight), in «Контуры» its footprint shows
  const fc=furnCut('hall');clip[1].constant=fc.c+model.position.y;
  if(foot){const o=fc.f*s;foot.visible=o>.01;foot.material.opacity=o;foot.position.y=.003-model.position.y;}   // the footprint stays on the floor, fading with the room
  dimsGroup.visible=on&&VS.hall.dims!==false&&!inTransition();   // its dimension lines only in its own view, once it is reached
  if(on&&VS.hall.walls===false){if(wallGroup)wallGroup.visible=false;doorGroup.visible=false;if(arcs)arcs.visible=false;}
  else if(on&&wallGroup)wallGroup.visible=true;
  if(model.visible)doors.forEach(d=>{
    if(held&&held.d===d){d.t=Math.min(DMAX,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}
    else d.a+=(d.t-d.a)*ease(.09);
    turnDoor(d);});
});

/* camera presets of the hall tab, moved to where the hall lies on the plan */
function setCam(v){
  const base=Math.max(P.H,P.W*1.6)*MM*2.15*Math.max(1,Math.pow(1/(camera.aspect||1),.95));   // pull back on tall, narrow screens
  const views={persp:[-.6,1.32,base*.9],front:[0,1.52,base],side:[-1.35,1.56,base*.75],back:[Math.PI+.35,1.12,base*.8],low:[-.85,1.47,base*.42],shelves:[-.75,1.42,base*.65],fake:[.75,1.38,base*.8],mezz:[.35,1.38,base*.55]};
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];
  const [ox,oz]=O().map(u=>u*MM),at=(x,y,z)=>goalT.set(ox+x,y,oz+z);
  if(v==='mezz')at(P.W/2*MM,(current.Hb+P.Ht/2)*MM,P.D*MM*.5);
  else if(v==='fake')at(P.Lw*MM,current.Hb*MM*.5,P.D*MM*.5);
  else if(v==='low')at(P.W*.45*MM,.3,P.D*MM*.5);   // bottom of the cabinet and its floor junction
  else if(v==='side')at(P.W/2*MM,P.H*MM*.32,P.D*MM*.4);   // low, so the floor junction is in view
  else if(v==='shelves')at((P.W-P.Rw)*MM,current.Hb*MM*.5,P.D*MM*.5);
  else at(P.W/2*MM,P.H/2*MM,P.D*MM*.4);
  shortWay();
}

/* ---------- panel ---------- */
const panel=document.querySelector('[data-panel="hall"]'),hq=s=>panel.querySelector(s);
hq('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
// how far from the bearing wall the side walls show: the view's frame, up to the kitchen wall
const frameSd=hq('#hFrameSd');
const showSd=()=>Math.min(VS.hall.Sd,hLen);
frameSd.addEventListener('input',e=>{VS.hall.Sd=+e.target.value;saveView('hall');syncHall();
  if(view==='hall'){buildWalls(VIEWS.hall);aimView();}});
// what the cabinet has: the reveal cladding (the false panel and the column grow by a board), the plinth, feet; panel thickness
function syncThick(){
  hq('#h-tReveal').checked=!!P.reveal;hq('#h-tPlinth').checked=!!P.plinth;hq('#h-tFeet').checked=!!P.Feet;
  hq('#h-Pl').disabled=!P.plinth;hq('#h-fPl').style.opacity=P.plinth?1:.45;
  panel.querySelectorAll('[data-thick]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.thick===(P[x.dataset.for]||16)));
}
hq('#h-tReveal').addEventListener('change',e=>{P.reveal=e.target.checked;build();syncIds();});
hq('#h-tPlinth').addEventListener('change',e=>{P.plinth=e.target.checked;syncThick();build();});
hq('#h-tFeet').addEventListener('change',e=>{P.Feet=e.target.checked;build();});
panel.querySelectorAll('[data-thick]').forEach(b=>b.addEventListener('click',()=>{P[b.dataset.for]=+b.dataset.thick;syncThick();build();syncIds();}));
// cabinet sizes; the height stays between the mezzanine's least and the ceiling
const ids=['H','D','N','Pl'];
const syncIds=()=>{const [h0,h1]=hRange(),hs=hq('[data-p="H"]');hs.min=h0;hs.max=h1;ids.forEach(j=>{hq(`[data-p="${j}"]`).value=P[j];});};
ids.forEach(id=>hq(`[data-p="${id}"]`).addEventListener('input',e=>{P[id]=+e.target.value;build();syncIds();}));
// fronts: all open, all closed (or nothing pressed when they differ), or taken off; the entrance door's box follows the door
function syncDoorMode(){
  const V=VS.hall;let st=V.fronts;
  if(st!=='hidden'&&doors.length){const n=doors.filter(d=>d.t>=DMAX-.01).length,z=doors.filter(d=>d.t<=.01).length;
    st=n===doors.length?'open':z===doors.length?'closed':'mixed';if(st!=='mixed')V.fronts=st;}
  panel.querySelectorAll('[data-door]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.door===st));
  const e=entranceDoor();hq('#h-tEntry').checked=!!e&&e.t>0;
}
panel.querySelectorAll('[data-door]').forEach(b=>b.addEventListener('click',()=>{
  const V=VS.hall;V.fronts=b.dataset.door;if(V.fronts!=='hidden')doors.forEach(d=>d.t=V.fronts==='open'?DMAX:0);
  syncDoorMode();applyVisibility();saveView('hall');}));
// the entrance door of the model, opened or closed from here as by a click on it
hq('#h-tEntry').addEventListener('change',e=>{const d=entranceDoor();if(d)d.t=e.target.checked?d.max:0;});
// dimensions, the walls with the entrance door, joint lines of the parts
const toggles={dims:'#h-tDims',walls:'#h-tWall',edges:'#h-tEdges'};
Object.entries(toggles).forEach(([k,s])=>hq(s).addEventListener('change',e=>{VS.hall[k]=e.target.checked;applyVisibility();saveView('hall');}));

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
  hq('#h-uniColor').value=cf?cf.color:'#C2B8AA';
  hq('#h-ccCard').classList.toggle('on',!!cf);
  hq('#h-ccCode').textContent=cf?cf.color.toUpperCase():'палитра';
  hq('#h-ccTags').innerHTML=(custom(FIN.carcass)?'<b>К</b>':'')+(custom(FIN.front)?'<b>Ф</b>':'');
  hq('#h-finNow').innerHTML=`<span>Корпус</span><span>${finName(FIN.carcass)}</span><span>Фасады</span><span>${finName(FIN.front)}</span>`;
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
const ccInput=hq('#h-uniColor');
ccInput.addEventListener('click',()=>{if(!ccInput.dataset.keep)ccWhere='both';delete ccInput.dataset.keep;});
hq('#h-ccCard').addEventListener('contextmenu',e=>{e.preventDefault();openCtx(e.clientX,e.clientY,w=>{ccWhere=w;ccInput.dataset.keep='1';ccInput.click();},WHERE);});
ccInput.addEventListener('input',e=>setFinish({type:'uni',color:e.target.value,name:'Свой цвет '+e.target.value.toUpperCase()},ccWhere));
// contrast of the end faces and joint lines
const syncEc=()=>{hq('#h-Ec').value=P.Ec;hq('#h-oEc').textContent=P.Ec+'%';};
hq('#h-Ec').addEventListener('input',e=>{P.Ec=+e.target.value;applyContrast(mats,FIN,P.Ec);syncEc();});

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
  hq('#h-cut').innerHTML=rows.map(r=>{const mn=matName(r.mat);area[mn]=(area[mn]||0)+r.L*r.B*r.n/1e6;
    const head=mn!==last?`<tr><th colspan="3" class="mh">${mn}</th></tr>`:'';last=mn;
    return head+`<tr><td>${r.name}</td><td class="n">${r.L} × ${r.B}</td><td class="n">${r.n}</td></tr>`;}).join('');
  const total=rows.reduce((s,r)=>s+r.n,0);
  hq('#h-tot').innerHTML=`<span>${total} деталей</span>`+Object.entries(area).map(([k,v])=>`<span>${k}: ${v.toFixed(2)} м²</span>`).join('')+(current.FL>0?`<span>Опоры регулируемые М6, шайба Ø15×5: ${current.feet.length} шт</span>`:'');
  hq('#h-csv').value='Деталь;Материал;Длина;Ширина;Толщина;Кол-во\n'+rows.map(r=>[r.name,matName(r.mat),r.L,r.B,r.t,r.n].join(';')).join('\n');
}
hq('#h-copy').addEventListener('click',()=>{const ta=hq('#h-csv');copyText(ta,ta.value,hq('#h-copied'),'Скопировано');});

/* ---------- settings to start with: in this browser, or as a code for the chat ----------
   the cabinet and its finishes; the sizes that follow the walls and the opening belong to the plan, the view settings are remembered by themselves */
const KEY='apt-hall-v2';
const getState=()=>{const p=Object.assign({},P);['W','Lw','Rw','Ht','Rv'].forEach(k=>delete p[k]);return {P:p,FIN:JSON.parse(JSON.stringify(FIN))};};
const FACTORY=JSON.stringify(getState());
function applyState(s){
  if(s.P)Object.assign(P,s.P);
  const okF=f=>f&&(f.type==='uni'||(f.type==='wood'&&DECORS[f.decor]));
  if(s.FIN&&okF(s.FIN.carcass)&&okF(s.FIN.front)){FIN.carcass=s.FIN.carcass;FIN.front=s.FIN.front;}
  fromModel();applyMaterials(mats,FIN,P.Ec);dirty=true;
}
{ const s=readJSON(KEY);if(s)applyState(s); }
const defMsg=hq('#h-defMsg');
hq('#h-saveDef').addEventListener('click',()=>{try{localStorage.setItem(KEY,JSON.stringify(getState()));defMsg.textContent='Сохранено в этом браузере';}catch(e){defMsg.textContent='Браузер не дал сохранить. Скопируйте код и пришлите в чат';}});
hq('#h-resetDef').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch(e){}applyState(JSON.parse(FACTORY));syncHall();defMsg.textContent='Исходные настройки возвращены';});
hq('#h-copyDef').addEventListener('click',()=>copyText(hq('#h-defCode'),JSON.stringify(getState()),defMsg,'Код скопирован'));

// sizes, what comes from the plan, the space between the shelves, the opening left between the columns, the finishes, the cut list
function updatePanel(){
  ids.forEach(id=>{hq(`[data-p-out="${id}"]`).textContent=id==='N'?P[id]:P[id]+' мм';});
  [['W',P.W],['Hc',A.H],['Rv',P.Rv],['Ht',P.Ht],['Lw',P.Lw],['Rw',P.Rw]].forEach(([k,v])=>{hq('#h-'+k).textContent=v+' мм';});
  const fc=finName(FIN.carcass),ff=finName(FIN.front);
  hq('#hSub').textContent=`${P.W} × ${P.H} × ${P.D} мм · `+(fc===ff?fc:`корпус — ${fc}; фасады — ${ff}`);
  const pl=P.plinth?P.Pl:0,t=P.T||16,step=(P.H-P.Ht-t-pl-(P.Feet?10:0))/(P.N+1),f=v=>v.toFixed(1).replace('.',',').replace(',0','');
  hq('#h-shelfGap').textContent=`Между полками ${f(step-t)} мм · секций ${P.N+1}`;
  // the opening as it is left between the claddings
  const ow=P.W-P.Lw-P.Rw,oh=P.H-P.Ht;
  hq('#h-chips').innerHTML=[[`ширина ${ow} мм`,ow<800],[`высота ${oh} мм`,oh<2000]].map(([t,w])=>`<span class="chip${w?' warn':''}">${t}${w?' · мало для двери 800×2000':''}</span>`).join('');
  updateCut();
}
// the sizes block stays open or closed as it was left
const sizesBox=hq('#h-sizesBox');
sizesBox.addEventListener('toggle',()=>{if(VS.hall.sizes!==sizesBox.open){VS.hall.sizes=sizesBox.open;saveView('hall');}});
function syncHall(){
  frameSd.max=hLen;frameSd.value=showSd();hq('#hFrameSdOut').textContent=showSd();
  sizesBox.open=VS.hall.sizes!==false;
  Object.entries(toggles).forEach(([k,s])=>{hq(s).checked=VS.hall[k]!==false;});
  syncIds();syncThick();syncDoorMode();syncFinish();syncEc();updatePanel();applyVisibility();
}

addView('hall',{
  rooms:['hall'],
  // the bearing wall from the outer face of the left wall to the outer face of the right one, the side walls up to Sd from it
  frame:()=>{const [ox,oz]=O();return [ox-A.wt,ox+A.hallW+A.bear,oz-A.bear,oz+showSd()];},
  // as in the hall tab: the sun aims at the middle of the cabinet, shadows cover 6 × 6 m
  sun:()=>{const [ox,oz]=O();return {x:(ox+A.hallW/2)*MM,y:P.H/2*MM,z:oz*MM,half:3};},
  anchor:O,   // the remembered camera moves with the hall
  furniture:()=>({model,doors,P,current,dims:dimsGroup,clip,foot}),   // the built cabinet: for clicks on its fronts and the checks
  defaults:{Wm:'auto',Wh:100,Sd:650,sizes:true,fronts:'closed',dims:true,walls:true,edges:true},
  panel,
  home:()=>setCam('persp'),
  sync:syncHall,
  onDoors:syncDoorMode   // a cabinet door or the entrance door was clicked
});
// the plan changed the sizes: the hall, the entrance opening and the ceiling come along. The cabinet is rebuilt (when next
// in the scene) only if its own sizes changed; otherwise it only moves
modelHooks.push(()=>{const was=JSON.stringify(P);fromModel();if(JSON.stringify(P)!==was)dirty=true;else place();syncHall();});
})();
