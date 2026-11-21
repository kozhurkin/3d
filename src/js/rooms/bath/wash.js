/* ---------- the washing machine and the sink over it: in the niche right of the bathroom door ----------
   The niche runs from the partition next to the tall cabinet to the hall wall, from the back wall (sizes from the plan).
   The machine stands in it facing the room, a flat «water lily» sink with its mixer hangs over it, and over the sink a wall
   cabinet with two hinged mirror doors and shelves, a lamp on its top (the machine's door opens, see washerDoor): a product of its own, not in the bathroom's cut list, no sizes in the panel
   (its finishes are the bathroom's). Bath axes, mm.
   The bathroom view's frame ends at the partition, so its own view hides them; the plan and the walk show them.
   The machine is the Haier HWD80-BP14959A washer-dryer, 595 × 850, its profile as the maker's photo from the side has it: the body 505
   from the lid's back edge to its front, 535 with the door; its front flush with the sink's, so how far it stands off the wall follows.
   On four feet 15 high. The control panel 115 high, its face leaning back 22 at the top, its housing 68 deep under the lid's front;
   the lid 28 thick overhangs the back panel by 27, the hoses lie in that room */
const WASH={W:595,H:850,D:505,feet:15,panel:115,slope:22,hood:68,lid:28,rear:27,sinkD:550,sinkY:880,sinkT:1000};
WASH.back=WASH.sinkD-WASH.D;   // off the back wall: the body's front is the sink's
const SINK_CAB={D:200,Gap:300,H:700,N:2};   // the cabinet over the sink: depth with its doors, from the sink's top up to its bottom, height, shelves
let wash=null;
const washNiche=()=>{const x0=A.bNiche+A.wt,x1=xB1-xL;return {x0,x1,cx:(x0+x1)/2,w:x1-x0};};
const washRect=()=>{const n=washNiche(),w=Math.min(WASH.W,n.w-4)/2;return [n.cx-w,n.cx+w,WASH.back,WASH.back+WASH.D];};
const portMat=new THREE.MeshStandardMaterial({color:0x4a9be0,roughness:.05,metalness:.1,transparent:true,opacity:.4,depthWrite:false});   // translucent blue glass
const blackMat=new THREE.MeshStandardMaterial({color:0x0f1011,roughness:.12,metalness:.3});   // glossy black: the control panel, the door's ring
const screenMat=new THREE.MeshStandardMaterial({color:0x0a0c10,emissive:0x5d7f99,emissiveIntensity:.35,roughness:.1});
const hoseMat=new THREE.MeshStandardMaterial({color:0x8d9093,roughness:.7});        // the grey hoses and the cord at the back
const valveMat=new THREE.MeshStandardMaterial({color:0x3f6fb5,roughness:.4});         // the inlet valve's blue fitting
const labelMat=new THREE.MeshStandardMaterial({color:0xdcdcd8,roughness:.8});         // the rating plate
const lampBodyMat=new THREE.MeshStandardMaterial({color:0x4a4c50,roughness:.3,metalness:.8});
const lampMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff3dc,emissiveIntensity:1,roughness:.4});
const mirrorMat=new THREE.MeshStandardMaterial({color:0xdfe7ec,roughness:.06,metalness:.55});
// the cabinet over the sink: the width of the niche, up to the ceiling at most, back rails at the wall, the doors overlay
function sinkCabParts(){
  const n=washNiche(),S=SINK_CAB,x0=n.x0,x1=n.x1,y0=WASH.sinkT+S.Gap,y1=Math.min(y0+S.H,A.H),dc=S.D-TF,xm=(x0+x1)/2,[parts,add]=partList();
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
  // the machine (its own group): a hollow white body on four feet, the drum in it behind the loading opening; over the front the
  // control panel's housing with its face leaning back, glossy black: the powder drawer on the left, the display in the middle, the dial
  // on the right; the lid behind the housing; the back panel with what is on it (washBack); the round door
  const mc=new THREE.Group();mc.userData.machine=true;mc.userData.info=INFO.washer;g.add(mc);
  const W=WASH,mb=boxIn(mc),t=.012,fz=z1-t,dy=WD.y*MM,hr=WD.hatch/2*MM,f=W.feet*MM,py=h-W.panel*MM,hl=h-W.lid*MM,zh=z1-W.hood*MM,zp=z0+W.rear*MM;
  mb(x0,x0+t,f,py,zp,fz,whiteMat);mb(x1-t,x1,f,py,zp,fz,whiteMat);               // sides: up to the panel the whole depth,
  mb(x0,x0+t,py,hl,zp,zh,whiteMat);mb(x1-t,x1,py,hl,zp,zh,whiteMat);              // above it up to the lid, behind the housing
  mb(x0,x1,hl,h,z0,zh,whiteMat).userData.lid=true;                                // the lid, out over the back
  mb(x0+t,x1-t,f,f+t,zp,fz,whiteMat);                                             // bottom
  mb(x0+t,x1-t,f+t,hl,zp,zp+t,whiteMat).userData.back=true;                       // back panel
  { const sh=new THREE.Shape();sh.moveTo(x0,f);sh.lineTo(x1,f);sh.lineTo(x1,py);sh.lineTo(x0,py);sh.lineTo(x0,f);   // front with the loading opening
    const hole=new THREE.Path();hole.absarc(cx,dy,hr,0,Math.PI*2,true);sh.holes.push(hole);
    const fr=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false,curveSegments:32}),whiteMat);
    fr.position.z=fz;fr.castShadow=fr.receiveShadow=true;mc.add(fr); }
  // the housing and its black face: their profile (z, y) run across the whole width (a shape's x is −z, turned a quarter about y)
  const sl=W.slope*MM,side=(pts,mat)=>{const sh=new THREE.Shape();pts.forEach(([z,y],i)=>sh[i?'lineTo':'moveTo'](-z,y));
    const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:x1-x0,bevelEnabled:false}),mat);m.rotation.y=Math.PI/2;m.position.x=x0;m.castShadow=m.receiveShadow=true;m.userData.profile=pts.map(q=>q.map(v=>Math.round(v*1000)));mc.add(m);return m;};
  side([[zh,py],[z1,py],[z1-sl,h],[zh,h]],whiteMat).userData.housing=true;
  side([[z1,py],[z1+.003,py],[z1+.003-sl,h],[z1-sl,h]],blackMat).userData.panel=true;
  // on the face (its own group, leaning with it: y up the face from its bottom, z out of it)
  { const L=Math.hypot(W.panel,W.slope)*MM,cp=new THREE.Group();cp.position.set(0,py,z1+.003);cp.rotation.x=-Math.atan2(W.slope,W.panel);mc.add(cp);
    const cb=boxIn(cp),disc=(r,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,40),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.castShadow=true;cp.add(m);return m;};
    cb(x0+.012,x0+.2,.012,L-.012,0,.006,darkMat);                                   // the drawer
    cb(x0+.26,x0+.43,.03,L-.03,0,.002,screenMat);                                   // the display
    disc(.032,.016,x1-.095,L/2,.008,chromeMat);                                     // the dial's chrome ring
    disc(.026,.004,x1-.095,L/2,.018,darkMat);                                       // its face
    cb(x1-.045,x1-.02,L/2-.008,L/2+.008,0,.002,screenMat); }                         // the start button
  buildDrum(mc,cx,dy,fz,hr);
  [[x0+.05,z0+.04],[x1-.05,z0+.04],[x0+.05,z1-.04],[x1-.05,z1-.04]].forEach(([x,z])=>{   // the feet
    const m=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,f,20),darkMat);m.position.set(x,f/2,z);m.userData.foot=true;mc.add(m);});
  washBack(mc,x1,zp);
  const wd=washerDoor(cx,z1,opts.prev.find(d=>d.key==='washer'),opts.open);g.add(wd.g);wd.g.userData.info=INFO.washer;
  // the sink: a shallow bowl (bottom, rims) with the mixer on its back deck, 30 mm over the machine
  const sw=Math.min(600,n.w)/2*MM,sx0=cx-sw,sx1=cx+sw,y0=WASH.sinkY*MM,y1=WASH.sinkT*MM,sd=WASH.sinkD*MM,r=.035,deck=.13;
  box(sx0,sx1,y0,y0+.02,0,sd,whiteMat);
  box(sx0,sx1,y0,y1,0,deck,whiteMat);
  box(sx0,sx1,y0,y1,sd-r,sd,whiteMat);
  box(sx0,sx0+r,y0,y1,deck,sd-r,whiteMat);
  box(sx1-r,sx1,y0,y1,deck,sd-r,whiteMat);
  const drain=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.004,24),chromeMat);drain.position.set(cx,y0+.022,(deck+sd)/2);g.add(drain);
  mixer(g,cx,y1,deck/2);
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
  cab.model.userData.sinkCab=true;cab.model.userData.info=INFO.sinkCab;g.add(cab.model);
  return [wd,...cab.doors];
}
/* the machine's door, as the Haier's: Ø520 mm, a glossy black ring 22 deep with a thin chrome rim, a Ø360 blue glass domed 8 more
   out front (535 from the lid's back edge) and as a bowl 100 deep into the drum, Ø280 at its bottom; no handle on it. The loading
   opening Ø360 (the maker's figure). Hinged on the left, the axis 12 mm past its edge in the plane of its face (as real hinges stand
   out in front of the body, so it never swings back behind the body's front); it opens to 135° (the maker's), unless the partition
   next to the tall cabinet stops it first (washerMax).
   One of the room's doors (key 'washer'): a click, «Открыты/Закрыты», the walk. Bath axes, m */
const WD={R:260,glass:180,hatch:360,hinge:12,y:440,ring:22,dome:8,rim:6,bowl:100,bowlR:140,open:135};
/* a plain drum behind the loading opening (radius hr, centre at y, front panel's back at fz; m): the rubber cuff, the steel drum
   Ø470 × 340 with its front ring and back. Lit as if the body were open (no shadows inside) so it reads */
const drumMat=new THREE.MeshStandardMaterial({color:0xb9bdc1,roughness:.35,metalness:.6,side:THREE.DoubleSide});
const rubberMat=new THREE.MeshStandardMaterial({color:0x2b2c2e,roughness:.85,side:THREE.DoubleSide});
/* the basin mixer on the sink's back deck (x, z its axis, y the deck's top; m), chrome as the shower rack (mm): a tall round body Ø40
   up to 170 on a foot ring, a flat spout 36 × 16 straight out toward the room from 110 up, 160 from the axis, the aerator under its
   tip; on top a flat lever plate as wide, round over the body, out over the spout: one piece (a disc and a plate would share faces
   and flicker). Every piece one chrome, as the rack's: they cast shadows, none takes one, so none looks darker than the rest */
function mixer(g,x,y,z){
  const cyl=(r,h,py,pz)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),chromeMat);c.position.set(x,py,pz);c.castShadow=true;
    c.userData.mixer=true;g.add(c);return c;};
  const top=y+.17,sw=.018;
  cyl(.022,.004,y+.002,z);                                           // the foot ring
  cyl(.02,top-y-.004,(y+.004+top)/2,z);                              // the body
  const sp=new THREE.Mesh(new THREE.BoxGeometry(2*sw,.016,.16),chromeMat);sp.position.set(x,y+.118,z+.08);sp.castShadow=true;sp.userData.mixer=true;g.add(sp);   // the spout
  cyl(.011,.006,y+.107,z+.145);                                      // its aerator
  cyl(.014,.012,top+.006,z);                                         // the lever's hub
  // the lever: in plan round at the back over the body, straight out to 110; flat from the hub's top up 8
  const sh=new THREE.Shape();sh.moveTo(sw,0);sh.lineTo(sw,.11);sh.lineTo(-sw,.11);sh.lineTo(-sw,0);sh.absarc(0,0,sw,Math.PI,2*Math.PI,false);
  const lv=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.008,bevelEnabled:false,curveSegments:24}),chromeMat);
  lv.rotation.x=Math.PI/2;lv.position.set(x,top+.02,z);lv.castShadow=true;lv.userData.mixer=true;g.add(lv);   // its shape's y along z, down from top+20
}

/* the back panel's things, as the maker's photo from behind has them (seen from the wall: u from the machine's right side x1 toward
   its left, v up from the floor, mm; the panel's face at zp, they stand out of it toward the wall, inside the lid's overhang but the
   plug; a hose's point may give how far its axis is off the panel, else it lies on it): the drain hose Ø22 up the right, across under
   the lid and down the left to its hook; the inlet valve's blue fitting at the top left with its hose down to the floor; the power
   cord in a loose loop with its plug (washPlug); four transit bolts; the rating plate */
function washBack(g,x1,zp){
  const X=u=>x1-u*MM,Y=v=>v*MM,o=new THREE.Group();o.userData.washBack=true;g.add(o);
  const tube=(pts,r,mat)=>{const p=pts.map(([u,v,z=r])=>new THREE.Vector3(X(u),Y(v),zp-z*MM)),m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p),pts.length*6,r*MM,10,false),mat);
    m.userData.end=p[p.length-1];   // where it ends (the cord's plug goes there)
    m.castShadow=true;o.add(m);return m;};
  const blk=(u0,u1,v0,v1,d,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry((u1-u0)*MM,(v1-v0)*MM,d*MM),mat);m.position.set(X((u0+u1)/2),Y((v0+v1)/2),zp-d/2*MM);o.add(m);return m;};
  const disc=(r,d,u,v,z,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,d*MM,24),mat);m.rotation.x=Math.PI/2;m.position.set(X(u),Y(v),zp-z*MM);o.add(m);return m;};
  tube([[29,385],[23,539],[25,675],[39,743],[73,779],[126,788],[458,788],[512,777],[535,743],[537,675],[537,448],[537,254]],11,hoseMat).userData.hose='drain';
  blk(528,546,215,256,20,hoseMat);                                                  // its hook
  disc(13,20,500,698,10,valveMat).userData.valve=true;                              // the inlet valve
  tube([[500,684],[503,620],[503,539],[503,313],[500,131],[495,40]],6,hoseMat).userData.hose='inlet';
  tube([[143,772],[73,707],[44,602],[48,494],[73,353],[122,335],[143,426],[140,500],[128,535,11],[100,542,17]],4,hoseMat).userData.hose='cord';
  washPlug(o,X(100),Y(542),zp-17*MM);                                               // its plug: inside the loop, clear of the drain hose
  [[216,630],[483,467],[483,294],[56,285]].forEach(([u,v])=>{disc(12,6,u,v,3,chromeMat).userData.bolt=true;disc(6,4,u,v,7,darkMat);});
  blk(162,379,380,523,1,labelMat);                                                  // the rating plate
}
/* the cord's plug, plain: a thick short cylinder Ø34 × 20 lying on the back panel (7 past the lid's overhang, still 38 off the wall),
   the cord going into the middle of its back, two pins Ø4.8 × 19, 19 apart, out of its face. Its own group at the middle of its back:
   x along the pins, y across the panel, z out of it; mm */
function washPlug(g,x,y,z){
  const o=new THREE.Group();o.userData.plug=true;o.position.set(x,y,z);g.add(o);
  const along=(a,b,r,v,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,(b-a)*MM,24),mat);
    m.rotation.z=-Math.PI/2;m.position.set((a+b)/2*MM,v*MM,0);m.castShadow=true;o.add(m);return m;};
  along(0,20,17,0,hoseMat).userData.body=true;
  [-9.5,9.5].forEach(v=>{along(20,39,2.4,v,chromeMat).userData.pin=true;});
}
function buildDrum(g,cx,y,fz,hr){
  const R=.235,cuff=.04,z1=fz-cuff,z0=z1-.34;
  const put=(m,z)=>{m.position.set(cx,y,z);m.userData.drum=true;g.add(m);return m;};
  const tube=(r,d,z,mat)=>{const m=put(new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,48,1,true),mat),z);m.rotation.x=Math.PI/2;return m;};
  tube(hr,cuff,fz-cuff/2,rubberMat);                                       // cuff
  tube(R,z1-z0,(z0+z1)/2,drumMat);                                         // drum
  put(new THREE.Mesh(new THREE.RingGeometry(hr,R,48),drumMat),z1);         // its front ring
  put(new THREE.Mesh(new THREE.CircleGeometry(R,48),drumMat),z0);          // its back
}
// how far it opens (rad): the maker's 135°, or less where its slice at mid-height (from the axis: 12…532 along it, 30 deep behind its
// face) turned that far would reach into the partition on the left (left of its face, short of its end; mm from the axis)
function washerMax(){
  const n=washNiche(),d=WD.ring+WD.dome,left=n.cx-WD.R-WD.hinge-n.x0,ahead=A.bStub-(WASH.back+WASH.D+d),top=WD.open*Math.PI/180;
  const hits=a=>{for(let i=0;i<=40;i++)for(const z of [-d,0]){const x=WD.hinge+i/40*2*WD.R;
    if(x*Math.cos(a)-z*Math.sin(a)<=-left&&x*Math.sin(a)+z*Math.cos(a)<=ahead)return true;}return false;};
  let a=0;while(a<top&&!hits(Math.min(a+.01,top)))a=Math.min(a+.01,top);
  return a;
}
function washerDoor(cx,zf,prev,open){
  const R=WD.R*MM,hx=(WD.R+WD.hinge)*MM,g=new THREE.Group(),door=new THREE.Group();g.position.set(cx,WD.y*MM,zf);g.add(door);
  // the black ring with the glass in its middle (a translucent blue bowl into the drum, the drum seen through it), the chrome rim round it, the glass's dome out front
  const ring=(r0,r1,mat)=>{const sh=new THREE.Shape();sh.absarc(0,0,r1,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,r0,0,Math.PI*2,true);sh.holes.push(hole);
    const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:WD.ring*MM,bevelEnabled:false,curveSegments:64}),mat);m.castShadow=true;door.add(m);return m;};
  ring(WD.glass*MM,R-WD.rim*MM,blackMat).userData.ring=true;
  { const m=new THREE.Mesh(new THREE.CylinderGeometry(WD.glass*MM,WD.bowlR*MM,(WD.ring+WD.bowl)*MM,48),portMat);   // its top (the wide end) out front
    m.rotation.x=Math.PI/2;m.position.z=(WD.ring-WD.bowl)/2*MM;m.userData.bowl=true;door.add(m); }
  ring(R-WD.rim*MM,R,chromeMat);
  { const a=WD.glass*MM,hd=WD.dome*MM,rs=(a*a+hd*hd)/(2*hd),th=Math.asin(a/rs);   // a spherical cap: base Ø of the glass, hd high
    const m=new THREE.Mesh(new THREE.SphereGeometry(rs,48,8,0,Math.PI*2,0,th),portMat);m.rotation.x=Math.PI/2;m.position.z=WD.ring*MM-rs*Math.cos(th);m.userData.dome=true;door.add(m); }
  g.position.x=cx-hx;g.position.z=zf+(WD.ring+WD.dome)*MM;door.position.set(hx,0,-(WD.ring+WD.dome)*MM);   // the group turns about the axis: on the left, in the door's face
  const d=Object.assign({g,a:0,t:0,s:-1,max:washerMax(),key:'washer'},prev&&{a:prev.a,t:prev.t,last:prev.last});
  if(!prev&&open)d.t=d.max;turnDoor(d);
  return d;
}
