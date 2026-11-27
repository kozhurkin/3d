/* ---------- «Прихожая» view: the portal cabinet around the entrance door, the tool box in the far corner ----------
   Hall coordinates, mm: x along the bearing wall from the left wall, y up, z from the bearing wall into the room;
   the hall's (0,0) is its origin on the plan. The walls make the entrance opening, the cabinet follows it: its width is the hall
   (A.hallW), the false panel and the shelf column reach the opening's sides, the mezzanine sits on its top (A.eD0, A.eD1, A.eDH),
   the reveal cladding is as deep as the door frame sits in the wall (A.eRv). How far the side walls show is the view's frame (VS.hall.Sd).
   Own scope: the room modules share names. */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// the whole cabinet (carcasses and fronts) this far from the side walls and from the ceiling: walls and ceiling aren't true, the
// mezzanine goes in past the bathroom door's casing and slides over the columns, the doors open clear of the ceiling
const MG=5;
/* the right column's fittings (furniture.js: FITTINGS), mm in from the edges of a board's end: into the back and front panels (FIX_IN),
   the confirmats of the bottom and the top into the side by the wall (CONF_IN), the plinth's dowels from its top and bottom (PLINTH_IN,
   a quarter of its height at most), the side's into those panels from its top and bottom (SIDE_IN) */
const FIX_IN=50,CONF_IN=100,PLINTH_IN=20,SIDE_IN=500;
// cabinet sizes; W, Lw, Rw, Ht, Rv come from the plan's hall and entrance opening, L (the hall's length: where the tool box stands) too
const P={W:1200,H:2600,D:400,Ht:600,Lw:70,Rw:270,N:5,Pl:80,plinth:true,Rv:100,reveal:true,mezzOne:false,Ec:30,T:16,TF:16,Feet:false,L:1900};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  const [parts,put]=partList(), W=p.W, Dc=p.D-TF, Hb=p.H-p.Ht, FL=p.Feet?10:0;   // FL: floor-standing parts sit on 10 mm feet
  const xa=MG, xb=W-MG;   // the cabinet's outer faces, MG in from the walls (x is from the left wall)
  // each board belongs to what is made and put up as one piece (u): the columns, the mezzanine boxes, the cladding (the hall's «Раскладка»)
  const unit=u=>(...a)=>{const o=put(...a);o.u=u;return o;};
  let add=unit('left');
  // left column is a false panel: inner side + fixed front, no outer side, no back
  add('Бок левой фальш-панели (со стороны проёма)','carcass',p.Lw-T,p.Lw,FL,Hb,0,Dc);
  add('Дно / крышка левой фальш-панели','carcass',xa,p.Lw-T,FL,FL+T,0,Dc);
  add('Дно / крышка левой фальш-панели','carcass',xa,p.Lw-T,Hb-T,Hb,0,Dc);
  // (the columns' fronts reach the opening's edge, flush with their carcasses)
  add('Левая фальш-панель (лицевая, глухая)','front',xa,p.Lw,FL,Hb-G/2,Dc,Dc+TF);
  // right column
  // (ends: where the boards between its back and front panels meet them, and the way into the board from there)
  add=unit('right');const rx=W-p.Rw,ends=[[T,1],[Dc,-1]];
  // the back panel and the front one lap over the side by the wall alike, the side stands between them
  const side=add('Бок правой колонны','carcass',xb-T,xb,FL,Hb,T,Dc,{holes:[]});
  const back=add('Задняя стенка правой колонны','carcass',rx,xb,FL,Hb,0,T,{holes:[]});
  const pl=p.plinth?p.Pl:0;
  const face=add('Лицевая панель правой колонны','front',rx,xb,FL,Hb-G/2,Dc,Dc+TF,{holes:[]});
  // a fitting of a board's end: its holes in the board (returned), its mates in the board «into» (the back or the front panel, the side)
  const join=(id,at,o,into=at[2]===T?back:face)=>{into.holes.push(...fittingMates(id,at,{...o,thick:T}));return fittingHoles(id,at,o);};
  // the side by the wall into them: a dowel and a cam fitting in each end, SIDE_IN from its bottom and top, the cams from the wall's side (unseen)
  side.holes.push(...ends.flatMap(([z,s])=>[[FL+SIDE_IN,1],[Hb-SIDE_IN,-1]].flatMap(([y,i])=>
    join('dowelCam',[xb-T/2,y,z],{n:['z',s],m:['y',i],f:['x',1],h:T/2}))));
  if(pl){
    // on dowels into the back and front panels: two in each end, PLINTH_IN from its top and bottom
    const u=Math.min(PLINTH_IN,pl/4),holes=ends.flatMap(([z,s])=>[FL+u,FL+pl-u].flatMap(y=>
      join('dowel',[rx+T/2,y,z],{n:['z',s],m:['y',1],f:['x',1],h:T/2})));
    add('Цоколь правой колонны (со стороны проёма)','carcass',rx,rx+T,FL,FL+pl,T,Dc,{holes});
  }
  const step=(Hb-T-pl-FL)/(p.N+1);
  /* the boards between the column's sides — the back panel and the front one — hold to them by their ends, two fittings an end,
     FIX_IN from its left and right edges: a shelf on dowels; the bottom and the top on a dowel and a cam fitting, the cams from
     outside the column (the bottom's from below, the top's from above), and with two confirmats into the side by the wall,
     CONF_IN from the ends */
  const fix=(y,id,up)=>ends.flatMap(([z,s])=>[[rx+FIX_IN,1],[xb-T-FIX_IN,-1]].flatMap(([x,i])=>
    join(id,[x,y+T/2,z],{n:['z',s],m:['x',i],f:['y',up],h:T/2})));
  const conf=y=>[[T+CONF_IN,1],[Dc-CONF_IN,-1]].flatMap(([z,i])=>join('confirmat',[xb-T,y+T/2,z],{n:['x',-1],m:['z',i],f:['y',1],h:T/2},side));
  for(let i=0;i<=p.N+1;i++){
    const y=i===p.N+1?Hb-T:FL+pl+i*step,shelf=i>0&&i<=p.N;
    add(i===0?'Дно правой колонны':shelf?'Полка правой колонны':'Крышка правой колонны','carcass',rx,xb-T,y,y+T,T,Dc,
      {holes:shelf?fix(y,'dowel'):[...fix(y,'dowelCam',i===0?-1:1),...conf(y)]});
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
    add=unit('mezz');
    // the one box as wide as the cabinet: W-2*MG goes past the bathroom door's casing (CT over the hall's left wall) with nothing to spare
    const x0=xa;
    topBox('единый корпус',x0,xb);
    add('Перегородка антресоли','carcass',rx-T/2,rx+T/2,Hb+T,p.H-T,T,Dc);   // in front of the rails
    shelf('левая секция',x0+T,rx-T/2);shelf('правая секция',rx+T/2,xb-T);
  }else{
    add=unit('mezz');topBox('центральный корпус',xa,rx);shelf('центральный корпус',xa+T,rx-T);
    add=unit('mezzR');topBox('правый корпус',rx,xb);shelf('правый корпус',rx+T,xb-T);
  }
  if(p.reveal){
    add=unit('reveal');const z0=-p.Rv;
    add('Обрамление откоса левое','carcass',p.Lw-T,p.Lw,0,Hb,z0,0);
    add('Обрамление откоса правое','carcass',rx,rx+T,0,Hb,z0,0);
    add('Обрамление откоса верхнее','carcass',p.Lw-T,rx+T,Hb,Hb+T,z0,0);
  }
  const mid=(p.Lw+rx)/2;
  add=unit('mezz');
  add('Фальш-панель антресоли (под петли, глухая)','front',xa,p.Lw-G/2,Hb+G/2,p.H,Dc,Dc+TF);
  add('Фасад антресоли','front',p.Lw+G/2,mid-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'L'});
  add('Фасад антресоли','front',mid+G/2,rx-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'R'});
  if(!p.mezzOne)add=unit('mezzR');
  add('Фасад антресоли правый','front',rx+G/2,xb,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'R'});
  // every board that reaches the floor is lifted onto the feet
  if(FL)parts.forEach(q=>{if(q.y0<FL)q.y0=FL;});
  // feet at the corners of each floor-standing unit (8 mm in from the outer faces)
  const cnr=(x0,x1,z0,z1)=>[[x0+8,z0+8],[x1-8,z0+8],[x0+8,z1-8],[x1-8,z1-8]];
  const feet=[...cnr(xa,p.Lw,0,Dc+TF),...cnr(rx,xb,0,Dc+TF)];
  return {parts,Dc,Hb,FL,feet};
}

const O=()=>ROOMS.find(r=>r.id==='hall').origin;   // the hall's (0,0) on the plan, mm
/* sizes that belong to the walls come from the plan: the false panel and the column reach the opening's sides, the mezzanine
   starts at its top; with the reveal cladding on, each is one board bigger and the board lines the opening. The cabinet is no
   higher than MG under the ceiling and leaves the mezzanine at least HT_MIN (its two back rails fit) */
const HT_MIN=300;
const hBottom=()=>A.eDH-(P.reveal?(P.T||16):0);   // where the mezzanine starts: the top of the opening, or of its cladding
const hRange=()=>{const hi=A.H-MG;return [Math.min(hBottom()+HT_MIN,hi),hi];};
function fromModel(w){
  T=P.T||16;TF=P.TF||16;const rv=P.reveal?T:0,[h0,h1]=hRange();
  P.W=A.hallW;P.L=hLen;P.Rv=A.eRv;P.H=Math.max(h0,Math.min(w.H,h1));
  P.Lw=A.eD0+rv;P.Rw=A.hallW-A.eD1+rv;P.Ht=P.H-hBottom();
  return current=computeParts(P);
}

/* ---------- finishes and materials ---------- */
// finish per part group: wood decor or plain colour (no worktop here)
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
  return [];
}

/* ---------- dimension lines of the hall (hall axes; they belong to the cabinet and move with it) ----------
   The cabinet goes from wall to wall: what stands at its sides is inside the hall, 60 in from them (as the kitchen's and the bathroom's) */
function buildDims(dim,gaps){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),z=P.D+60,Hb=current.Hb;
  const ow=P.W-P.Lw-P.Rw,xr=P.W-60;
  dim(V(MG,P.H+140,z),V(P.W-MG,P.H+140,z),`${P.W-2*MG}`,Y);   // the cabinet, MG off each wall
  dim(V(xr,0,z),V(xr,P.H,z),`${P.H}`,X);
  dim(V(60,Hb,z),V(60,P.H,z),`${P.Ht}`,X);
  // across the opening at 260: the left column (the false panel), the opening, the right column
  dim(V(MG,260,z),V(P.Lw,260,z),`${P.Lw-MG}`,Y);
  dim(V(P.Lw,260,z),V(P.W-P.Rw,260,z),`проём ${ow}`,Y);
  dim(V(P.W-P.Rw,260,z),V(P.W-MG,260,z),`${P.Rw-MG}`,Y);
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

/* ---------- «Раскладка»: the cabinet's boards on the floor, as if laid out to be put together — each piece made and put up on
   its own (the columns, the mezzanine boxes, the cladding) a heap of its own, a little apart. Everything else goes away;
   the boards fly down from where they stand and back. In hall axes, in front of the bearing wall, the hall's middle between the ends ---------- */
// mm: between the boards, between the heaps, from the bearing wall; s: the flight, seconds; late: the last board starts this far into it
const LAY={gap:40,apart:300,z0:100,s:1.4,late:.35};
const lUnits=()=>[['left','Левая стойка'],['right','Правая стойка'],['mezz',P.mezzOne?'Антресоль':'Антресоль большая'],['mezzR','Антресоль малая'],
  ['reveal','Обрамление откосов']];
/* where each board lies: its biggest face down; a standing one as if the cabinet were tipped back — its bottom toward the viewer, its top
   away, its face up; a flat one with its long side away. In a heap, columns of boards one behind another, the deepest first, none
   deeper than the deepest board of the cabinet. → boards {p, o: its sides [away, across, up], L, B, t (their sizes), x, z — the
   middle, mm}, heaps {name, x0, x1, z1}, box [x0, x1, z0, z1] */
function layoutPlan(parts){
  const bs=parts.map(p=>{const d=[p.x1-p.x0,p.y1-p.y0,p.z1-p.z0],t=d.indexOf(Math.min(...d));
    const o=t!==1?[1,t===0?2:0,t]:d[0]>=d[2]?[0,2,1]:[2,0,1];return {p,o,L:d[o[0]],B:d[o[1]],t:d[o[2]]};});
  const deep=Math.max(...bs.map(b=>b.L)),boards=[],heaps=[];let x=0;
  lUnits().forEach(([u,name])=>{
    const mine=bs.filter(b=>b.p.u===u).sort((a,b)=>b.L-a.L||b.B-a.B);if(!mine.length)return;
    const cols=[];let x1=x,z1=0;
    mine.forEach(b=>{
      let c=cols.find(c=>c.w>=b.B&&c.d+LAY.gap+b.L<=deep);
      if(!c){c={x:cols.length?x1+LAY.gap:x,w:b.B,d:-LAY.gap};cols.push(c);x1=c.x+c.w;}
      b.x=c.x+b.B/2;b.z=LAY.z0+c.d+LAY.gap+b.L/2;c.d+=LAY.gap+b.L;z1=Math.max(z1,b.z+b.L/2);boards.push(b);
    });
    heaps.push({name,x0:x,x1,z1});x=x1+LAY.apart;
  });
  // the whole of it in the hall's middle
  const dx=P.W/2-(x-LAY.apart)/2;boards.forEach(b=>{b.x+=dx;});heaps.forEach(h=>{h.x0+=dx;h.x1+=dx;});
  return {boards,heaps,box:[dx,x-LAY.apart+dx,LAY.z0,LAY.z0+deep]};
}
// the laid-out boards (a group in the cabinet's, made when the layout starts): each knows where it stands and where it lies
function buildLayout(model){
  const g=new THREE.Group(),seed=partSeeder(),seeds=new Map(current.parts.map(p=>[p,seed(p)])),{boards,heaps}=layoutPlan(current.parts);
  g.userData.layout=true;g.userData.labels=[];
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),n=boards.length;
  boards.forEach((b,i)=>{
    const p=b.p,m=partMesh(p,mats,seeds.get(p));
    // its sides turned: o[0] along z (a standing board's up away from the viewer: −z), o[1] across (x), o[2] up (y); a turn, not a mirror:
    // the way across goes with the sides' order and the way along z
    const o=b.o,sz=o[0]===1?-1:1,ax=[];ax[o[0]]=[0,0,sz];ax[o[2]]=[0,1,0];ax[o[1]]=[(((o[0]>o[1])+(o[0]>o[2])+(o[1]>o[2]))%2?-1:1)*sz,0,0];
    const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(...ax.map(a=>new THREE.Vector3(...a))));
    m.userData.size={L:b.L,B:b.B,t:b.t};
    m.userData.lay={from:V((p.x0+p.x1)/2,(p.y0+p.y1)/2,(p.z0+p.z1)/2),to:V(b.x,b.t/2,b.z),q,ax,k:i/n*LAY.late};   // k: when it starts
    g.add(m);
  });
  // the heaps' names on the floor in front of them
  heaps.forEach(h=>{const s=dimLabel(h.name,.12);s.userData.name=h.name;s.position.copy(V((h.x0+h.x1)/2,20,h.z1+170));s.visible=false;g.add(s);g.userData.labels.push(s);});
  model.add(g);return g;
}
let layOn=false,lay=0,layCam0=null;   // asked for, how far laid out (0…1), the camera before it
const smooth=e=>e*e*(3-2*e);
// the camera over the whole layout, a little from the front
function layCam(){
  const {box:[x0,x1,z0,z1]}=layoutPlan(current.parts),[ox,oz]=O().map(u=>u*MM),tv=Math.tan(camera.fov*Math.PI/360),a=camera.aspect||1;
  goal.theta=0;goal.phi=.62;goal.r=Math.max((x1-x0)*MM/2/(tv*a),(z1-z0)*MM*.7/tv)*1.2;
  goalT.set(ox+(x0+x1)/2*MM,0,oz+(z0+z1)/2*MM);shortWay();
}
function setLayout(on){
  if(on===layOn)return;layOn=on;hq('#h-layout').setAttribute('aria-pressed',on);
  if(on){layCam0={theta:goal.theta,phi:goal.phi,r:goal.r,t:goalT.clone()};layCam();}
  else if(layCam0){goal.theta=layCam0.theta;goal.phi=layCam0.phi;goal.r=layCam0.r;goalT.copy(layCam0.t);shortWay();layCam0=null;}
}
// the cabinet itself in its group (not the tool box, the dimensions, the footprint, the layout); back as «Фасады» has it
const ownParts=(m,f)=>m.children.filter(o=>o!==f.extra&&o!==f.dims&&o!==f.foot&&!o.userData.layout);
const putBack=(m,f)=>ownParts(m,f).forEach(o=>{o.visible=!o.userData.front||VS.hall.fronts!=='hidden';});
// every frame, after the kit's: the boards on their way; while any is off its place, the cabinet, the walls and the rest are away
function layFrame(dt){
  const f=VIEWS.hall.furniture(),m=f.model;if(!m)return;
  let g=m.children.find(o=>o.userData.layout===true);
  if(view!=='hall'){   // away from the hall: put together at once
    if(layOn){layOn=false;layCam0=null;hq('#h-layout').setAttribute('aria-pressed',false);}
    lay=0;if(g){disposeGroup(g);putBack(m,f);if(wallGroup)wallGroup.visible=true;}
    return;
  }
  lay=reduce?(layOn?1:0):Math.max(0,Math.min(1,lay+(layOn?1:-1)*dt/LAY.s));
  if(!lay){if(g){disposeGroup(g);putBack(m,f);}return;}
  if(!g){g=buildLayout(m);ownParts(m,f).forEach(o=>{o.visible=false;});}   // (a rebuilt cabinet: its new group)
  g.children.forEach(o=>{const L=o.userData.lay;if(!L)return;const e=smooth(Math.max(0,Math.min(1,(lay-L.k)/(1-LAY.late))));
    o.position.copy(L.from).lerp(L.to,e);o.position.y+=Math.sin(Math.PI*e)*.3;o.quaternion.identity().slerp(L.q,e);});
  const ls=g.userData.labels;ls.forEach(s=>{s.visible=lay>.95;});
  if(g.userData.hover&&lay<1)layHover(null);
  fitLabels(g.userData.hover?ls.concat(g.userData.hover.children):ls);
  [f.extra,f.dims,f.foot,wallGroup,doorGroup,arcs].forEach(o=>{if(o)o.visible=false;});
}

/* ---------- panel: what the cabinet has and its texts ---------- */
const panel=document.querySelector('[data-panel="hall"]'),hq=s=>panel.querySelector(s);
// the reveal cladding (the false panel and the column grow by a board), the plinth, feet, the mezzanine in one box
hq('#h-tReveal').addEventListener('change',e=>{P.reveal=e.target.checked;k.build();k.syncIds();});
hq('#h-tPlinth').addEventListener('change',e=>{P.plinth=e.target.checked;k.syncThick();k.build();});
hq('#h-tFeet').addEventListener('change',e=>{P.Feet=e.target.checked;k.build();});
hq('#h-tMezzOne').addEventListener('change',e=>{P.mezzOne=e.target.checked;k.build();});
/* the board under the cursor in the layout (once every board lies): its dimension lines on it — the length along its left edge,
   the width along its near one (each in from the edge, a quarter of the width at most); whole mm. A finger: the board tapped. Off it, or the layout going, they go */
const layGroup=()=>{const m=VIEWS.hall.furniture().model;return m&&m.children.find(o=>o.userData.layout===true);};
function boardDims(m){
  const L=m.userData.lay,b=m.userData.size,d=new THREE.Group(),V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
  const x=L.to.x/MM,z=L.to.z/MM,x0=x-b.B/2,x1=x+b.B/2,z0=z-b.L/2,z1=z+b.L/2,y=b.t+2,i=Math.min(50,b.B/4);
  const t=[b.L,b.B].map(v=>String(Math.round(v)));
  roomDim(d,V(x0+i,y,z0),V(x0+i,y,z1),t[0],X);
  roomDim(d,V(x0,y,z1-i),V(x1,y,z1-i),t[1],Z);
  d.userData.of=m;d.userData.texts=t;return d;
}
function layHover(e){
  const g=layGroup();if(!g)return;
  const h=e&&lay>=1&&!ownMouse()?hitAt(e):null,m=h&&h.object.userData.lay?h.object:null,was=g.userData.hover;
  if(was&&was.userData.of===m)return;
  if(was){disposeGroup(was);g.userData.hover=null;}
  if(m)g.add(g.userData.hover=boardDims(m));
}
canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'&&!ptrs.size)layHover(e);});
canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch')layHover(e);});
canvas.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')layHover(null);});
hq('#h-layout').addEventListener('click',()=>setLayout(!layOn));
// the entrance door of the model, opened or closed from here as by a click on it
hq('#h-tEntry').addEventListener('change',e=>{const d=entranceDoor();if(d)d.t=e.target.checked?d.max:0;});
// what comes from the plan, the space between the shelves, the opening left between the columns
function panelText(){
  // the hall from the plan; the false panel and the column as they are, MG off the walls
  [['W',P.W],['Hc',A.H],['Rv',P.Rv],['Ht',P.Ht],['Lw',P.Lw-MG],['Rw',P.Rw-MG]].forEach(([n,v])=>{hq('#h-'+n).textContent=v+' мм';});
  hq('#hSub').textContent=`${P.W-2*MG} × ${P.H} × ${P.D} мм · `+k.finDesc();
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
  keepFin:true,   // the finish stays through a reload
  onSyncIds:()=>{const [h0,h1]=hRange(),hs=hq('[data-p="H"]');hs.min=h0;hs.max=h1;},   // the height stays between the mezzanine's least and MG under the ceiling
  slider:{sel:'#hFrameSd',key:'Sd',max:()=>hLen},   // how far from the bearing wall the side walls show, up to the kitchen wall
  dims:buildDims,
  // the tool box: in the hall's own view once the frame shows the right wall past it; its footprint on the plan
  extra:{name:'things',items:[buildCase]},
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
    // the sun aims at the middle of the cabinet, shadows cover 6 × 6 m
    sun:()=>{const [ox,oz]=O();return {x:(ox+A.hallW/2)*MM,y:P.H/2*MM,z:oz*MM,half:3};},
    defaults:{Wm:'auto',Wh:100,Sd:650,sizes:true,fronts:'closed',dims:true,walls:true}
  }
});
frameHooks.push(layFrame);   // after the kit's: it hides what the kit shows
})();
