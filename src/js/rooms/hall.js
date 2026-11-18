/* ---------- «Прихожая» view: the portal cabinet around the entrance door, the tool box in the far corner ----------
   Hall coordinates as in the hall tab, mm: x along the bearing wall from the left wall, y up, z from the bearing wall into the room;
   the hall's (0,0) is its origin on the plan. The walls make the entrance opening, the cabinet follows it: its width is the hall
   (A.hallW), the false panel and the shelf column reach the opening's sides, the mezzanine sits on its top (A.eD0, A.eD1, A.eDH),
   the reveal cladding is as deep as the door frame sits in the wall (A.eRv). How far the side walls show is the view's frame (VS.hall.Sd).
   Own scope: the room modules share names. */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W, Lw, Rw, Ht, Rv come from the plan's hall and entrance opening, L (the hall's length: where the tool box stands) too
const P={W:1200,H:2600,D:400,Ht:600,Lw:100,Rw:240,N:5,Pl:80,plinth:true,Rv:100,reveal:true,mezzOne:false,Ec:30,T:16,TF:16,Feet:false,L:1900};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  const [parts,add]=partList(), W=p.W, Dc=p.D-TF, Hb=p.H-p.Ht, FL=p.Feet?10:0;   // FL: floor-standing parts sit on 10 mm feet
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
  /* top: two separate carcasses for easier installation, or one (mezzOne) — its bottom, top and rails across the whole width,
     a partition centred on the joint of the fronts (each section half a board wider than its box was), the fronts the same.
     No back panel: two 100 mm rails at the back (top and bottom) keep the box square and take the wall fixings */
  const ym=Hb+p.Ht/2-T/2,RB=100;
  const topBox=(nm,x0,x1)=>{
    add('Бок антресоли — '+nm,'carcass',x0,x0+T,Hb,p.H,0,Dc);
    add('Бок антресоли — '+nm,'carcass',x1-T,x1,Hb,p.H,0,Dc);
    add('Дно антресоли — '+nm,'carcass',x0+T,x1-T,Hb,Hb+T,0,Dc);
    add('Крышка антресоли — '+nm,'carcass',x0+T,x1-T,p.H-T,p.H,0,Dc);
    add('Ребро жёсткости антресоли — '+nm,'carcass',x0+T,x1-T,Hb+T,Hb+T+RB,0,T);
    add('Ребро жёсткости антресоли — '+nm,'carcass',x0+T,x1-T,p.H-T-RB,p.H-T,0,T);
  };
  const shelf=(nm,x0,x1)=>add('Полка антресоли — '+nm,'carcass',x0,x1,ym,ym+T,0,Dc-20);
  if(p.mezzOne){
    topBox('единый корпус',0,W);
    add('Перегородка антресоли','carcass',rx-T/2,rx+T/2,Hb+T,p.H-T,T,Dc);   // in front of the rails
    shelf('левая секция',T,rx-T/2);shelf('правая секция',rx+T/2,W-T);
  }else{
    topBox('центральный корпус',0,rx);shelf('центральный корпус',T,rx-T);
    topBox('правый корпус',rx,W);shelf('правый корпус',rx+T,W-T);
  }
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
function fromModel(w){
  T=P.T||16;TF=P.TF||16;const rv=P.reveal?T:0,[h0,h1]=hRange();
  P.W=A.hallW;P.L=hLen;P.Rv=A.eRv;P.H=Math.max(h0,Math.min(w.H,h1));
  P.Lw=A.eD0+rv;P.Rw=A.hallW-A.eD1+rv;P.Ht=P.H-hBottom();
  return current=computeParts(P);
}

/* ---------- finishes and materials ---------- */
// finish per part group, as in the hall tab: wood decor or plain colour (no worktop here)
const FIN={carcass:{type:'wood',decor:'H1386'},front:{type:'wood',decor:'H1386'}};
const mats=makeMats();
applyMaterials(mats,FIN,P.Ec);

/* ---------- the tool box on the floor in the far right corner, by the way into the kitchen (next to the kitchen's racks
   behind the wall): STANLEY FatMax, 662 × 293 × 295 ----------
   Its long side along the right wall, its end toward the wall right of the way in, CS.gap from both; the latches face the hall.
   A black base, the grey body over it (CS.in in from its faces), the black lid (its top CS.chamf in), the handle folded on the
   lid along it (its top the box's height); on the front two metal latches on black pads, CS.latch in from the ends, and
   the yellow badge in the middle of the lid. Hall axes (mm), a group with its «i» */
const CS={W:662,D:293,H:295,base:40,lid:200,top:280,in:4,chamf:8,gap:10,grip:170,gripW:36,pivot:24,latch:80,pad:70,plate:46};
const caseMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#a9a79e').convertSRGBToLinear(),roughness:.45,metalness:.45});   // the grey body
const caseBlackMat=new THREE.MeshStandardMaterial({color:0x18191a,roughness:.6});   // the base, the lid, the handle, the latches' pads
const latchMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#bfcbd2').convertSRGBToLinear(),roughness:.3,metalness:.85});   // zinc-plated
const badgeMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#f2c218').convertSRGBToLinear(),roughness:.5});
const INFO={
  toolCase:{title:'Ящик для инструмента STANLEY FatMax',lines:[`${CS.W} × ${CS.D} мм, высота ${CS.H} мм; 57 л.`,'Пластик, замки металлические.','На полу в углу у прохода на кухню.']}
};
// where it stands: [x0, x1, z0, z1]
const caseAt=()=>{const x1=P.W-CS.gap,z1=P.L-CS.gap;return [x1-CS.D,x1,z1-CS.W,z1];};
function buildCase(g){
  const {H,base,lid,top,in:i,chamf:c,grip,gripW,pivot,latch,pad,plate}=CS,[x0,x1,z0,z1]=caseAt(),mm=v=>v*MM,xc=(x0+x1)/2,zc=(z0+z1)/2;
  const q=new THREE.Group();q.userData.toolCase=true;q.userData.info=INFO.toolCase;g.add(q);
  const bx=boxIn(q),b=(xa,xb,ya,yb,za,zb,mat,k)=>{const m=bx(mm(xa),mm(xb),mm(ya),mm(yb),mm(za),mm(zb),mat||caseBlackMat);if(k)m.userData[k]=true;};
  b(x0,x1,0,base,z0,z1,null,'base');
  b(x0+i,x1-i,base,lid,z0+i,z1-i,caseMat,'body');
  b(x0,x1,lid,top-c,z0,z1,null,'lid');b(x0+c,x1-c,top-c,top,z0+c,z1-c);
  // the handle folded on the lid: a pivot at each end, the grip between them
  [zc-grip/2,zc+grip/2-pivot].forEach(z=>b(xc-gripW/2,xc+gripW/2,top,H,z,z+pivot));
  b(xc-gripW/2,xc+gripW/2,top,H,zc-grip/2+pivot,zc+grip/2-pivot,null,'grip');
  // the latches across the joint: a black pad, the metal plate on it
  [z0+latch,z1-latch].forEach(z=>{b(x0-10,x0,lid-40,lid+55,z-pad/2,z+pad/2);b(x0-14,x0-10,lid-30,lid+45,z-plate/2,z+plate/2,latchMat,'latch');});
  b(x0-3,x0,lid+30,lid+58,zc-45,zc+45,badgeMat,'badge');
}

/* ---------- dimension lines of the hall (hall axes; they belong to the cabinet and move with it) ----------
   The cabinet goes from wall to wall: what stands at its sides is inside the hall, 60 in from them (as the kitchen's and the bathroom's) */
function buildDims(dim,gaps){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),z=P.D+60,Hb=current.Hb;
  const ow=P.W-P.Lw-P.Rw,xr=P.W-60;
  dim(V(0,P.H+140,z),V(P.W,P.H+140,z),`${P.W}`,Y);
  dim(V(xr,0,z),V(xr,P.H,z),`${P.H}`,X);
  dim(V(60,Hb,z),V(60,P.H,z),`${P.Ht}`,X);
  // across the opening at 260: the left column (the false panel), the opening, the right column
  dim(V(0,260,z),V(P.Lw,260,z),`${P.Lw}`,Y);
  dim(V(P.Lw,260,z),V(P.W-P.Rw,260,z),`проём ${ow}`,Y);
  dim(V(P.W-P.Rw,260,z),V(P.W,260,z),`${P.Rw}`,Y);
  dim(V((P.Lw+P.W-P.Rw)/2,0,z),V((P.Lw+P.W-P.Rw)/2,Hb,z),`${Hb}`,X);
  dim(V(xr,P.H+140,0),V(xr,P.H+140,P.D),`${P.D}`,Y);
  // between the shelves of the right column; in the mezzanine, each shelf with the bottom and the top over it (two boxes,
  // or the sections of one)
  if(P.N)gaps(current.parts.filter(q=>/^(Дно|Полка|Крышка) правой колонны$/.test(q.name)));
  const mz=current.parts.filter(q=>/^(Дно|Полка|Крышка) антресоли — /.test(q.name)),sh=q=>q.name.startsWith('Полка');
  mz.filter(sh).forEach(s=>gaps(mz.filter(q=>q===s||!sh(q)&&q.x0<s.x1&&q.x1>s.x0)));
}

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

/* ---------- panel: what the cabinet has and its texts ---------- */
const panel=document.querySelector('[data-panel="hall"]'),hq=s=>panel.querySelector(s);
// the reveal cladding (the false panel and the column grow by a board), the plinth, feet, the mezzanine in one box
hq('#h-tReveal').addEventListener('change',e=>{P.reveal=e.target.checked;k.build();k.syncIds();});
hq('#h-tPlinth').addEventListener('change',e=>{P.plinth=e.target.checked;k.syncThick();k.build();});
hq('#h-tFeet').addEventListener('change',e=>{P.Feet=e.target.checked;k.build();});
hq('#h-tMezzOne').addEventListener('change',e=>{P.mezzOne=e.target.checked;k.build();});
// the entrance door of the model, opened or closed from here as by a click on it
hq('#h-tEntry').addEventListener('change',e=>{const d=entranceDoor();if(d)d.t=e.target.checked?d.max:0;});
// what comes from the plan, the space between the shelves, the opening left between the columns
function panelText(){
  [['W',P.W],['Hc',A.H],['Rv',P.Rv],['Ht',P.Ht],['Lw',P.Lw],['Rw',P.Rw]].forEach(([n,v])=>{hq('#h-'+n).textContent=v+' мм';});
  hq('#hSub').textContent=`${P.W} × ${P.H} × ${P.D} мм · `+k.finDesc();
  const pl=P.plinth?P.Pl:0,t=P.T||16,step=(P.H-P.Ht-t-pl-(P.Feet?10:0))/(P.N+1),f=v=>v.toFixed(1).replace('.',',').replace(',0','');
  hq('#h-shelfGap').textContent=`Между полками ${f(step-t)} мм · секций ${P.N+1}`;
  // the opening as it is left between the claddings
  const ow=P.W-P.Lw-P.Rw,oh=P.H-P.Ht;
  hq('#h-chips').innerHTML=[[`ширина ${ow} мм`,ow<800],[`высота ${oh} мм`,oh<2000]].map(([t,w])=>`<span class="chip${w?' warn':''}">${t}${w?' · мало для двери 800×2000':''}</span>`).join('');
}

const k=roomKit('hall',{
  P,FIN,mats,px:'h',panel,origin:O,fromModel,setCam,panelText,
  fromPlan:['W','L','Lw','Rw','Ht','Rv'],
  ids:['H','D','N','Pl'],
  wish:['H'],
  onSyncIds:()=>{const [h0,h1]=hRange(),hs=hq('[data-p="H"]');hs.min=h0;hs.max=h1;},   // the height stays between the mezzanine's least and the ceiling
  slider:{sel:'#hFrameSd',key:'Sd',max:()=>hLen},   // how far from the bearing wall the side walls show, up to the kitchen wall
  dims:buildDims,
  // the tool box: in the hall's own view once the frame shows the right wall past it; its footprint on the plan
  extra:{name:'things',build:g=>{buildCase(g);return [];}},
  frame:(on,{extra,show})=>{if(extra)extra.children.forEach(o=>{if(o.userData.toolCase===true)o.visible=!on||show>=caseAt()[3];});},
  foot:()=>[caseAt()],
  // in the hall's own view «Стена и дверь» off takes away the walls, the entrance door and its swing
  walls:on=>{if(on&&VS.hall.walls===false){if(wallGroup)wallGroup.visible=false;doorGroup.visible=false;if(arcs)arcs.visible=false;}
    else if(on&&wallGroup)wallGroup.visible=true;},
  syncFlags:()=>{
    hq('#h-tReveal').checked=!!P.reveal;hq('#h-tPlinth').checked=!!P.plinth;hq('#h-tFeet').checked=!!P.Feet;hq('#h-tMezzOne').checked=!!P.mezzOne;
    hq('#h-Pl').disabled=!P.plinth;hq('#h-fPl').style.opacity=P.plinth?1:.45;
  },
  onDoorMode:()=>{const e=entranceDoor();hq('#h-tEntry').checked=!!e&&e.t>0;},   // a cabinet door or the entrance door was clicked
  view:{
    // the bearing wall from the outer face of the left wall to the outer face of the right one, the side walls up to Sd from it
    frame:Sd=>{const [ox,oz]=O();return [ox-A.wt,ox+A.hallW+A.bear,oz-A.bear,oz+Sd];},
    // as in the hall tab: the sun aims at the middle of the cabinet, shadows cover 6 × 6 m
    sun:()=>{const [ox,oz]=O();return {x:(ox+A.hallW/2)*MM,y:P.H/2*MM,z:oz*MM,half:3};},
    defaults:{Wm:'auto',Wh:100,Sd:650,sizes:true,fronts:'closed',dims:true,walls:true}
  }
});
})();
