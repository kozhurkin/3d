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
function clamp(w){
  P.Wc=Math.min(w.Wc,P.W-P.Rx);
  P.Gap=Math.min(w.Gap,Math.max(0,P.H-P.Hi-200));
}
// sizes that belong to the walls come from the plan; the tall cabinet and the gap over the installation have to fit
function fromModel(w){P.W=A.bNiche;P.L=A.bL;P.H=A.H;P.Rx=A.rX;P.Rz=A.rZ;clamp(w);T=P.T||16;TF=P.TF||16;return current=computeParts(P);}

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
function buildSanitary(g,opts){
  const box=boxIn(g);
  const zf=current.zf*MM,di=P.Di*MM,hi=P.Hi*MM,lt=P.Lt*MM,cz=zf+lt/2;
  box(0,di,0,hi,zf,zf+lt,tileMat);
  box(di,di+.008,hi-.28,hi-.115,cz-.123,cz+.123,chromeMat);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.18,.15,.36,32),whiteMat);
  bowl.scale.set(.7/.36,1,1);bowl.position.set(di+.15,.22,cz);bowl.castShadow=bowl.receiveShadow=true;g.add(bowl);   // 700 mm long: 200 mm sunk into the box, 500 mm out
  const seat=new THREE.Mesh(new THREE.CylinderGeometry(.185,.185,.02,32),whiteMat);
  seat.scale.set(.5/.37,1,1);seat.position.set(di+.25,.41,cz);g.add(seat);
  wash=new THREE.Group();wash.userData.wash=true;const doors=buildWash(wash,opts);g.add(wash);
  return doors;
}

/* ---------- the washing machine and the sink over it: in the niche right of the bathroom door ----------
   The niche runs from the partition next to the tall cabinet to the hall wall, from the back wall (sizes from the plan).
   The machine stands in it facing the room, a flat «water lily» sink with its mixer hangs over it, and over the sink a wall
   cabinet with two hinged mirror doors and shelves, a lamp on its top (the machine's door opens, see washerDoor): a product of its own, not in the bathroom's cut list, no sizes in the panel
   (its finishes are the bathroom's). Bath axes, mm.
   The bath tab's frame ends at the partition, so its own view hides them; the plan and the walk show them */
const WASH={W:595,H:850,D:540,back:40,sinkD:600,sinkY:880,sinkT:1000};
const SINK_CAB={D:200,Gap:300,H:700,N:2};   // the cabinet over the sink: depth with its doors, from the sink's top up to its bottom, height, shelves
let wash=null;
const washNiche=()=>{const x0=A.bNiche+A.wt,x1=xB1-xL;return {x0,x1,cx:(x0+x1)/2,w:x1-x0};};
const washRect=()=>{const n=washNiche(),w=Math.min(WASH.W,n.w-4)/2;return [n.cx-w,n.cx+w,WASH.back,WASH.back+WASH.D];};
const darkMat=new THREE.MeshStandardMaterial({color:0x2b2d2f,roughness:.35,metalness:.2});
const portMat=new THREE.MeshStandardMaterial({color:0x4a9be0,roughness:.05,metalness:.1,transparent:true,opacity:.4,depthWrite:false});
const lampBodyMat=new THREE.MeshStandardMaterial({color:0x4a4c50,roughness:.3,metalness:.8});
const lampMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff3dc,emissiveIntensity:1,roughness:.4});
const mirrorMat=new THREE.MeshStandardMaterial({color:0xdfe7ec,roughness:.06,metalness:.55});
// the cabinet over the sink: the width of the niche, up to the ceiling at most, back rails at the wall, the doors overlay
function sinkCabParts(){
  const n=washNiche(),S=SINK_CAB,x0=n.x0,x1=n.x1,y0=WASH.sinkT+S.Gap,y1=Math.min(y0+S.H,A.H),dc=S.D-TF,xm=(x0+x1)/2,parts=[];
  const add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>parts.push(Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{}));
  add('Бок шкафчика над раковиной','carcass',x0,x0+T,y0,y1,0,dc);
  add('Бок шкафчика над раковиной','carcass',x1-T,x1,y0,y1,0,dc);
  add('Дно шкафчика над раковиной','carcass',x0+T,x1-T,y0,y0+T,0,dc);
  add('Крышка шкафчика над раковиной','carcass',x0+T,x1-T,y1-T,y1,0,dc);
  const rb=Math.min(100,(y1-y0-2*T)/3);
  add('Ребро жёсткости шкафчика над раковиной','carcass',x0+T,x1-T,y0+T,y0+T+rb,0,T);
  add('Ребро жёсткости шкафчика над раковиной','carcass',x0+T,x1-T,y1-T-rb,y1-T,0,T);
  const su=(y1-y0-T)/(S.N+1);
  for(let i=1;i<=S.N;i++){const y=y0+i*su;add('Полка шкафчика над раковиной','carcass',x0+T,x1-T,y,y+T,T,dc-10);}
  add('Фасад шкафчика над раковиной','front',x0+G/2,xm-G/2,y0+G/2,y1-G/2,dc,S.D,{hinge:'L'});
  add('Фасад шкафчика над раковиной','front',xm+G/2,x1-G/2,y0+G/2,y1-G/2,dc,S.D,{hinge:'R'});
  return parts;
}
function buildWash(g,opts){
  const box=boxIn(g),n=washNiche(),[x0,x1,z0,z1]=washRect().map(v=>v*MM),cx=n.cx*MM,h=WASH.H*MM;
  // the machine (its own group): a hollow body, the drum in it behind the loading opening, the drawer and the display; the round door
  const mc=new THREE.Group();mc.userData.machine=true;g.add(mc);
  const mb=boxIn(mc),t=.012,fz=z1-t,dy=WD.y*MM,hr=WD.glass*MM;
  mb(x0,x0+t,0,h,z0,fz,whiteMat);mb(x1-t,x1,0,h,z0,fz,whiteMat);                 // sides
  mb(x0+t,x1-t,h-t,h,z0,fz,whiteMat);mb(x0+t,x1-t,0,t,z0,fz,whiteMat);            // top, bottom
  mb(x0+t,x1-t,t,h-t,z0,z0+t,whiteMat);                                           // back
  { const sh=new THREE.Shape();sh.moveTo(x0,0);sh.lineTo(x1,0);sh.lineTo(x1,h);sh.lineTo(x0,h);sh.lineTo(x0,0);   // front with the loading opening
    const hole=new THREE.Path();hole.absarc(cx,dy,hr,0,Math.PI*2,true);sh.holes.push(hole);
    const fr=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false,curveSegments:32}),whiteMat);
    fr.position.z=fz;fr.castShadow=fr.receiveShadow=true;mc.add(fr); }
  buildDrum(mc,cx,dy,fz,hr);
  mb(x0+.01,x0+.17,h-.1,h-.03,z1,z1+.006,whiteMat);   // drawer
  mb(cx+.03,cx+.17,h-.085,h-.045,z1,z1+.004,darkMat);   // display
  const wd=washerDoor(cx,z1,opts.prev.find(d=>d.key==='washer'),opts.open);g.add(wd.g);
  // the sink: a shallow bowl (bottom, rims) with the mixer on its back deck, 30 mm over the machine
  const sw=Math.min(600,n.w)/2*MM,sx0=cx-sw,sx1=cx+sw,y0=WASH.sinkY*MM,y1=WASH.sinkT*MM,sd=WASH.sinkD*MM,r=.035,deck=.13;
  box(sx0,sx1,y0,y0+.02,0,sd,whiteMat);
  box(sx0,sx1,y0,y1,0,deck,whiteMat);
  box(sx0,sx1,y0,y1,sd-r,sd,whiteMat);
  box(sx0,sx0+r,y0,y1,deck,sd-r,whiteMat);
  box(sx1-r,sx1,y0,y1,deck,sd-r,whiteMat);
  const drain=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.004,24),chromeMat);drain.position.set(cx,y0+.022,(deck+sd)/2);g.add(drain);
  const tap=new THREE.Mesh(new THREE.CylinderGeometry(.016,.02,.2,16),chromeMat);tap.position.set(cx,y1+.1,deck/2);g.add(tap);
  box(cx-.012,cx+.012,y1+.17,y1+.2,deck/2,deck/2+.15,chromeMat);
  // the cabinet over the sink; a 4 mm mirror glued on each door edge to edge, swings with it
  const cab=buildParts({parts:sinkCabParts()},mats,opts);
  cab.doors.forEach(d=>{const p=d.g.children[0].userData.part,hp=d.g.position;
    const mr=new THREE.Mesh(new THREE.BoxGeometry((p.x1-p.x0)*MM,(p.y1-p.y0)*MM,.004),mirrorMat);
    mr.position.set((p.x0+p.x1)/2*MM-hp.x,(p.y0+p.y1)/2*MM-hp.y,p.z1*MM+.002-hp.z);mr.userData.mirror=true;d.g.add(mr);});
  // a lamp on the cabinet's top: a bracket holding a bar 450 mm long out in front of the mirrors, its underside glowing
  { const top=Math.max(...cab.doors.map(d=>d.g.children[0].userData.part.y1))*MM+G/2*MM,zd=SINK_CAB.D*MM,y0=top+.03,y1=y0+.025,z0=zd+.045,z1=z0+.025;
    const lamp=(mat,...a)=>{box(...a,mat).userData.lamp=mat===lampMat?'glow':'body';};
    lamp(lampBodyMat,cx-.02,cx+.02,top,y1,zd-.06,z0);              // bracket
    lamp(lampBodyMat,cx-.225,cx+.225,y0,y1,z0,z1);                 // bar
    lamp(lampMat,cx-.222,cx+.222,y0-.002,y0,z0+.002,z1-.002); }    // diffuser
  g.add(cab.model);
  return [wd,...cab.doors];
}
/* the machine's door, as real ones: Ø480 mm with a Ø330 mm glass, on a hinge 12 mm past its edge; a free door opens to 180°,
   here the niche's walls stop it (the partition next to the tall cabinet on the left, the hall wall on the right).
   It opens toward the half that was clicked: as it starts to open from closed it hinges on that side (the click's point is
   d.hit, engine.js: pickDoor); opened otherwise («Открыты») it keeps the side it had, the left one at first.
   One of the room's doors (key 'washer'): a click, «Открыты/Закрыты», the walk. Bath axes, m */
const WD={R:240,glass:165,hinge:12,y:440};
/* a plain drum behind the loading opening (radius hr, centre at y, front panel's back at fz; m): the rubber cuff, the steel drum
   Ø470 × 340 with its front ring and back. Lit as if the body were open (no shadows inside) so it reads */
const drumMat=new THREE.MeshStandardMaterial({color:0xb9bdc1,roughness:.35,metalness:.6,side:THREE.DoubleSide});
const rubberMat=new THREE.MeshStandardMaterial({color:0x2b2c2e,roughness:.85,side:THREE.DoubleSide});
function buildDrum(g,cx,y,fz,hr){
  const R=.235,cuff=.04,z1=fz-cuff,z0=z1-.34;
  const put=(m,z)=>{m.position.set(cx,y,z);m.userData.drum=true;g.add(m);return m;};
  const tube=(r,d,z,mat)=>{const m=put(new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,48,1,true),mat),z);m.rotation.x=Math.PI/2;return m;};
  tube(hr,cuff,fz-cuff/2,rubberMat);                                       // cuff
  tube(R,z1-z0,(z0+z1)/2,drumMat);                                         // drum
  put(new THREE.Mesh(new THREE.RingGeometry(hr,R,48),drumMat),z1);         // its front ring
  put(new THREE.Mesh(new THREE.CircleGeometry(R,48),drumMat),z0);          // its back
}
function washerMax(side){
  const n=washNiche(),hx=WD.R+WD.hinge,reach=hx+WD.R,front=WASH.back+WASH.D;
  const room=side<0?n.cx-hx-n.x0:n.x1-n.cx-hx,wall=side<0?A.bStub:A.hL1;   // hinge to the side wall; how far that wall comes out
  return wall>front?Math.PI/2+Math.asin(Math.min(1,Math.max(0,(room-50)/reach))):Math.PI;   // past 90° its 50 mm bulge meets the wall
}
function washerDoor(cx,zf,prev,open){
  const R=WD.R*MM,hx=(WD.R+WD.hinge)*MM,g=new THREE.Group(),door=new THREE.Group();g.position.set(cx,WD.y*MM,zf);g.add(door);
  const cyl=(r,d,z,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,48),mat);m.rotation.x=Math.PI/2;m.position.z=z;m.castShadow=true;door.add(m);return m;};
  // the dark ring with the glass in its middle: a translucent blue bowl, the drum seen through it
  { const sh=new THREE.Shape();sh.absarc(0,0,R,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,WD.glass*MM,0,Math.PI*2,true);sh.holes.push(hole);
    const ring=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.04,bevelEnabled:false,curveSegments:48}),chromeMat);ring.castShadow=true;ring.userData.ring=true;door.add(ring); }
  cyl(WD.glass*MM,.06,.03,portMat).castShadow=false;
  const part=(w,h,d,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.z=z;door.add(m);return m;};
  const handle=part(.025,.11,.03,.045,darkMat),hinge=part(.03,.12,.03,.015,darkMat);
  const d=Object.assign({g,a:0,t:0,key:'washer',closed:true},prev&&{a:prev.a,t:prev.t,last:prev.last,closed:prev.closed,side:prev.side});
  d.turn=side=>{d.side=side;d.s=side;d.max=washerMax(side);
    g.position.x=cx+side*hx;door.position.x=-side*hx;handle.position.x=-side*(R-.04);hinge.position.x=side*(R+.006);};
  d.turn(d.side||-1);if(!prev&&open)d.t=d.max;turnDoor(d);
  return d;
}
// every frame (before the room turns its doors): the bath view hides the niche; the door takes the clicked side as it starts to open
frameHooks.push(()=>{
  if(wash)wash.visible=view!=='bath';
  const d=VIEWS.bath&&VIEWS.bath.furniture().doors.find(x=>x.key==='washer');if(!d)return;
  if(d.t>0&&d.closed&&d.a<.002){const full=d.t>=d.max-.01,mid=(O()[0]+washNiche().cx)*MM;d.turn(d.hit?(d.hit.x>mid?1:-1):d.side);d.hit=null;d.t=full?d.max:Math.min(d.t,d.max);d.closed=false;}
  else if(d.t===0&&d.a<.002)d.closed=true;
  if(!(held&&held.d===d))d.hit=null;   // a click that did not open it from closed (or a hover) leaves no side behind; a long press keeps it
  if(d.t>d.max)d.t=d.max;
});

/* ---------- dimension lines of the bathroom (bath axes; they belong to the bathroom and move with it) ---------- */
function buildDims(dim,gaps){
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
  // between the shelves: each section of the tall cabinet that has them (the divider closes both), the upper cabinet
  const by=nms=>current.parts.filter(q=>q.mat==='carcass'&&nms.includes(q.name));
  const tall=by(['Дно пенала','Полка-разделитель пенала','Полка пенала','Крышка пенала']);
  if(P.Nb)gaps(tall.filter(q=>q.y0<=P.Hi));
  if(P.Nh)gaps(tall.filter(q=>q.y1>=P.Hi));
  if(P.Nu)gaps(by(['Дно верхнего шкафа','Полка верхнего шкафа','Крышка верхнего шкафа']));
}

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

/* ---------- panel: what the bathroom has (the niche over the installation, feet under the tall cabinet) and its texts ---------- */
const panel=document.querySelector('[data-panel="bath"]'),bq=s=>panel.querySelector(s);
bq('#b-tMid').addEventListener('change',e=>{P.Mid=e.target.checked;k.build();});
bq('#b-tFeet').addEventListener('change',e=>{P.Feet=e.target.checked;k.build();});
// the niche, the ceiling and the riser box (from the plan), the space between the shelves
function panelText(){
  bq('#b-W').textContent=P.W+' мм';bq('#b-L').textContent=P.L+' мм';bq('#b-H').textContent=P.H+' мм';bq('#b-R').textContent=`${P.Rx} × ${P.Rz} мм`;
  bq('#bSub').textContent=`ниша ${P.W} × ${P.L} мм · потолок ${P.H} мм · `+k.finDesc();
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

const k=roomKit('bath',{
  P,FIN,mats,px:'b',panel,origin:O,fromModel,setCam,panelText,
  fromPlan:['W','L','H','Rx','Rz','Lt'],
  ids:['Hi','Di','Gap','Du','Nu','Dm','Dt','Wc','Pl','Nh','Nb'],
  wish:['Wc','Gap'],
  slider:{sel:'#bFrameL',key:'L',max:()=>hLen},   // how far from the back wall the left wall shows, up to the kitchen wall
  dims:buildDims,
  extra:{name:'sani',build:buildSanitary},   // the installation, the toilet, the washing machine and the sink go with the walls in the bathroom's view
  // its footprint: the installation box, the toilet (as buildSanitary has them) and the washing machine besides the tall cabinet
  foot:()=>{const zf=current.zf,cz=zf+P.Lt/2;return [[0,P.Di,zf,zf+P.Lt],[P.Di-200,P.Di+500,cz-180,cz+180,true],washRect()];},
  syncFlags:()=>{bq('#b-tMid').checked=P.Mid!==false;bq('#b-tFeet').checked=!!P.Feet;},
  view:{
    // the niche: the back wall up to the outer face of the partition next to the tall cabinet, the left wall up to L from the back wall
    frame:L=>{const [ox,oz]=O();return [ox-A.bear,ox+A.bNiche+A.wt,oz-A.bear,oz+L];},
    // the walls at the open side of the niche hide as in the bath tab: the partition while the camera is right of its inner face,
    // the wall at the niche end and the shower partition while the camera is past the niche end
    fade:{bathStub:'+x',nicheEnd:'+z',shower:'+z'},
    // as in the bath tab: the sun aims at the middle of the back wall, shadows cover 6 × 6 m
    sun:()=>{const [ox,oz]=O();return {x:(ox+A.bNiche/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
    defaults:{Wm:'auto',Wh:100,L:1400,sizes:true,fronts:'closed',dims:true,walls:true}
  }
});
})();
