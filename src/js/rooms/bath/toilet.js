/* the installation and the toilet stand in the niche (bath axes, m): the tiled installation box along the left wall
   under the upper cabinet, its flush plate, the wall-hung toilet facing +x (buildToilet); returns the doors (the toilet's lid too) */
function buildSanitary(g,opts){
  const box=boxIn(g);
  const zf=current.zf*MM,di=P.Di*MM,hi=P.Hi*MM,lt=P.Lt*MM,cz=zf+lt/2;
  box(0,di,0,hi,zf,zf+lt,tileMat);
  box(di,di+.008,hi-.28,hi-.115,cz-.123,cz+.123,chromeMat);
  const lid=buildToilet(g,di,cz,opts);
  wash=new THREE.Group();wash.userData.wash=true;const doors=buildWash(wash,opts);g.add(wash);
  tray=new THREE.Group();tray.userData.tray=true;tray.userData.info=INFO.tray;buildTray(tray);g.add(tray);
  rack=buildRack(g);
  return doors.concat(buildCurtain(g,opts),[lid]);
}

/* ---------- the toilet: wall-hung AZARIO Allegro AZ-3105B, rimless, with a hygienic shower ----------
   As the maker's drawing: 490 out from the wall, 360 wide, 360 high with the seat and the lid. In plan its back is straight on the
   installation box, the sides run straight and close in a half circle in front; in profile the top is flat, the front falls nearly
   plumb and turns in under the bowl to its flat bottom, 365 from the wall. The ceramic 335 high, its top (the rim) 400 from the floor.
   In the top the bowl's opening (280 wide, 125 from the wall to 45 short of the front), the bowl down from it to its bottom 190 under
   the rim, the trap's water there, the bidet's chrome nozzle in the bowl's back wall under the rim.
   On the rim a slim seat 11 (a ring round the opening) and its lid 13, both to the bowl's front, on one soft-close hinge as such seats
   have: two chrome posts Ø32 in the ceramic's holes (155 apart, 50 off the wall) 3 out of the rim, on them a bar Ø28 across, 260 long,
   of the seat's own white — the damper's housing in the middle, a knuckle 25 at each end (the seat and the lid turn in them), on its
   front the quick release's button, a bar with round ends. The seat and the lid both from just in front of the bar, on its axis; the
   seat stays down, the lid turns up about it a little past plumb, till its far end comes 2 mm off the installation's face (the
   maker's photo has it leaning back); two buffers under it, where it rests on the seat. A click on the lid or the seat (not the bowl)
   opens and closes it; it is no cabinet front, so the panel's «Открыты» / «Закрыты» leave it as it is (loose).
   The hygienic shower's mixer on its right side (as one sits on it, toward the niche end): a chrome rosette and a round knob near the
   back, half way up the ceramic.
   Its own group at the box's face on the floor under the bowl's middle: x out of the wall, y up, z across; mm */
const WC={L:490,W:360,H:360,body:335,base:365,rim:400,seat:11,lid:13,bar:{x:50,r:14,len:260,knuckle:25,post:77.5,postR:16,postH:3},hole:{x0:125,x1:445,h:140,rc:45},bottom:{y:145,x0:190,x1:300,h:50,rc:25},mix:{x:60,rose:56,knob:38,out:32}};
const bufMat=new THREE.MeshStandardMaterial({color:0xdcdcd8,roughness:.6});   // the lid's buffers, a duller white
const trapMat=new THREE.MeshStandardMaterial({color:0x56646c,roughness:.08,metalness:.1});   // the trap's water, dark
const redMat=new THREE.MeshStandardMaterial({color:0xd0302a,roughness:.4}),blueMat=new THREE.MeshStandardMaterial({color:0x2a62c8,roughness:.4});
/* a plan outline at one height: the back straight at x0 (corners rounded rc), the sides at ±h up to x1 − h, the half circle round to x1;
   the same number of points every time, so the rings of a loft line up */
function wcOutline(x0,x1,h,rc){
  const p=[],arc=(cx,cz,r,a0,a1,n)=>{for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/n;p.push([cx+r*Math.cos(a),cz+r*Math.sin(a)]);}},
    line=(ax,az,bx,bz,n)=>{for(let i=0;i<n;i++)p.push([ax+(bx-ax)*i/n,az+(bz-az)*i/n]);};
  line(x0,0,x0,h-rc,4);arc(x0+rc,h-rc,rc,Math.PI,Math.PI/2,5);line(x0+rc,h,x1-h,h,8);
  arc(x1-h,0,h,Math.PI/2,-Math.PI/2,32);line(x1-h,-h,x0+rc,-h,8);arc(x0+rc,-h+rc,rc,-Math.PI/2,-Math.PI,5);line(x0,-h+rc,x0,0,4);
  return p;
}
/* a loft through rings {y, x0, x1, h, rc} (mm) into one smooth side with a flat cap under the first and over the last; closed: the
   last ring joins the first, no caps (the seat, a ring). The sides face out while the rings go up, in toward the axis while they go down */
function wcLoft(rings,closed){
  const R=rings.map(r=>wcOutline(r.x0,r.x1,r.h,r.rc)),n=R[0].length,pos=[],idx=[];
  R.forEach((o,i)=>o.forEach(([x,z])=>pos.push(x*MM,rings[i].y*MM,z*MM)));
  const N=R.length;
  for(let i=0;i<(closed?N:N-1);i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n,c=(a+n)%(N*n),d=(b+n)%(N*n);idx.push(a,b,c,b,d,c);}
  if(!closed)[[0,-1],[N-1,1]].forEach(([i,s])=>{   // the caps: their own points, so the edge stays a crease in the light
    const o=R[i],y=rings[i].y*MM,c0=pos.length/3,cx=o.reduce((t,q)=>t+q[0],0)/n;pos.push(cx*MM,y,0);
    o.forEach(([x,z])=>pos.push(x*MM,y,z*MM));
    for(let j=0;j<n;j++){const a=c0+1+j,b=c0+1+(j+1)%n;if(s>0)idx.push(c0,a,b);else idx.push(c0,b,a);}});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
  const mm=k=>{const v=pos.filter((_,i)=>i%3===k);return [Math.min(...v),Math.max(...v)].map(q=>Math.round(q/MM*10)/10);};
  geo.userData.box=[...mm(0),...mm(1),...mm(2)];   // its extent, mm: x, y, z
  return geo;
}
/* rings for a slab from y0 to y1 with its edges rounded rb under and rt over it; len(y) its length out of the wall there */
function wcRings(y0,y1,rb,rt,x0,h,rc,len,mid){
  const r=[],at=(y,ins)=>r.push({y,x0:x0+ins,x1:len(y)-ins,h:h-ins,rc:Math.max(2,rc-ins)});
  for(let k=0;k<=4;k++){const f=k/4*Math.PI/2;at(y0+rb*(1-Math.cos(f)),rb*(1-Math.sin(f)));}
  for(let k=1;k<mid;k++)at(y0+rb+(y1-rt-y0-rb)*k/mid,0);
  for(let k=4;k>=0;k--){const f=k/4*Math.PI/2;at(y1-rt*(1-Math.cos(f)),rt*(1-Math.sin(f)));}
  return r;
}
/* rings down a hole's wall, its outline o, from its top at y1 (the edge rounded r) to y0 (rounded rb), or (a bowl) narrowing from
   under the edge to the outline b at b.y; wcGrow: an outline grown by d all round (mm) */
const wcGrow=(o,d)=>({x0:o.x0-d,x1:o.x1+d,h:o.h+d,rc:o.rc+d});
function wcHole(o,y1,r,y0,rb,b){
  const R=[],at=(y,q)=>R.push(Object.assign({y},q));
  for(let k=0;k<=4;k++){const f=k/4*Math.PI/2;at(y1-r*(1-Math.cos(f)),wcGrow(o,r*(1-Math.sin(f))));}   // the edge, rounding over into the hole
  if(b){for(let k=1;k<=12;k++){const t=k/12,e=t*t;at(y1-r-(y1-r-b.y)*t,{x0:o.x0+(b.x0-o.x0)*e,x1:o.x1+(b.x1-o.x1)*e,h:o.h+(b.h-o.h)*e,rc:o.rc+(b.rc-o.rc)*e});}return R;}
  for(let k=4;k>=0;k--){const f=k/4*Math.PI/2;at(y0+rb*(1-Math.cos(f)),wcGrow(o,rb*(1-Math.sin(f))));}   // the lower edge, out to the underside
  return R;
}
function buildToilet(sani,x,z,opts){
  const W=WC,g=new THREE.Group();g.position.set(x,(W.rim-W.body)*MM,z);g.userData.toilet=true;g.userData.info=INFO.toilet;sani.add(g);
  // the front in profile: a quarter ellipse, plumb at the top, cut at 0.9 of its height so it meets the bottom at a slant
  const ea=(W.L-W.base)/(1-Math.sqrt(1-.81)),ec=W.L-ea,front=y=>{const s=Math.max(0,(W.body-10-y)/(W.body-10));return ec+ea*Math.sqrt(1-.81*s*s);};   // plumb under the top's rounding
  const put=(geo,mat,part)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;m.userData.wc=part;g.add(m);return m;};
  // the ceramic: up its outside, in over the rim to the opening, down the bowl to its bottom; the trap's water in the bottom
  put(wcLoft(wcRings(0,W.body,15,10,0,W.W/2,20,front,16).concat(wcHole(W.hole,W.body,6,0,0,W.bottom))),whiteMat,'bowl');
  const B=W.bottom,trap=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.001,32),trapMat);trap.position.set((B.x0+B.x1)/2*MM,(B.y+1)*MM,0);trap.userData.wc='trap';g.add(trap);
  const s0=W.body,s1=s0+W.seat,l0=W.H-W.lid;   // the seat on the rim, a ring round the opening; a hair over it the lid, up to 360
  const Hb=W.bar,ax=Hb.x,ay=W.body+Hb.postH+Hb.r,lx=ax+Hb.r+1;   // the hinge's axis, over its posts; the seat and the lid from 1 in front of the bar
  const seat=put(wcLoft(wcRings(s0,s1,4,4,lx,W.W/2-1,25,()=>W.L-1,2).concat(wcHole(W.hole,s1,4,s0,4)),true),whiteMat,'seat');
  // the bidet's nozzle on the bowl's back wall 30 under the rim, toward the front: the nozzle Ø10 4 out of the wall, round it a chrome
  // ring Ø18 (its hole Ø11) only 2 out, so the nozzle stands 2 out of it
  { const y=(W.body-30)*MM,x=(W.hole.x0+1)*MM,sh=new THREE.Shape();sh.absarc(0,0,9*MM,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absarc(0,0,5.5*MM,0,Math.PI*2,true);sh.holes.push(hole);
    const ring=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:2*MM,bevelEnabled:false,curveSegments:24}),chromeMat);
    ring.rotation.y=Math.PI/2;ring.position.set(x,y,0);ring.userData.wc='halo';g.add(ring);   // its depth (local z) out along x
    const m=new THREE.Mesh(new THREE.CylinderGeometry(5*MM,5*MM,3*MM,24),chromeMat);m.rotation.z=Math.PI/2;m.position.set(x+2.5*MM,y,0);m.userData.wc='nozzle';g.add(m); }
  // the hinge behind the seat and the lid, their axis its axis: the posts, the housing between the knuckles (a hair apart), the button
  const across=(r,len,z,mat,part)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,len*MM,32),mat);m.rotation.x=Math.PI/2;m.position.set(ax*MM,ay*MM,z*MM);
    m.castShadow=m.receiveShadow=true;m.userData.wc=part;g.add(m);return m;};   // shaded as the seat and the lid, so it reads as their white
  [-Hb.post,Hb.post].forEach(z=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(Hb.postR*MM,Hb.postR*MM,Hb.postH*MM,32),chromeMat);
    m.position.set(ax*MM,(W.body+Hb.postH/2)*MM,z*MM);m.userData.wc='post';g.add(m);});
  across(Hb.r,Hb.len-2*Hb.knuckle-2,0,whiteMat,'bar');
  [-1,1].forEach(k=>across(Hb.r+.5,Hb.knuckle,k*(Hb.len-Hb.knuckle)/2,whiteMat,'knuckle'));
  { const sh=new THREE.Shape(),r=5*MM,c=8*MM;   // 26 × 10, its ends fully round; 2 thick, 1 out of the bar's front
    sh.absarc(-c,0,r,Math.PI/2,Math.PI*3/2,false);sh.absarc(c,0,r,-Math.PI/2,Math.PI/2,false);
    const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:2*MM,bevelEnabled:false,curveSegments:16}),whiteMat);m.rotation.y=Math.PI/2;m.receiveShadow=true;
    m.position.set((ax+Hb.r-1)*MM,ay*MM,0);m.userData.wc='button';m.userData.size=[26,10];g.add(m); }
  // the lid on it: a holder on the axis turned so its x runs across the toilet, the door turning about that x (s −1: its front up),
  // the lid in it turned back, in the toilet's axes; its buffers on its underside over the seat's ring, 1 high in the hair between them
  const hold=new THREE.Group();hold.position.set(ax*MM,ay*MM,0);hold.rotation.y=Math.PI/2;g.add(hold);
  const lg=new THREE.Group();hold.add(lg);
  const lid=new THREE.Mesh(wcLoft(wcRings(l0,W.H,3,8,lx,W.W/2-1,25,()=>W.L-1,2)),whiteMat);lid.castShadow=lid.receiveShadow=true;lid.userData.wc='lid';
  lid.rotation.y=-Math.PI/2;lid.position.set(0,-ay*MM,-ax*MM);lg.add(lid);
  [-130,130].forEach(z=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.001,20),bufMat);m.position.set(395*MM,(l0-.5)*MM,z*MM);m.userData.wc='buffer';lid.add(m);});
  // how far it opens: its far end's upper edge (u along it from the axis, v over it) swings back to 2 mm off the installation's face
  const u=W.L-1-ax,v=W.H-ay,lidMax=Math.acos(-(ax-2)/Math.hypot(u,v))-Math.atan2(v,u);
  // the hygienic shower's mixer on the right side (+z): its rosette on the ceramic, the knob out of it, red and blue marks on its top
  const M=Object.assign({y:W.body/2},W.mix),zs=W.W/2*MM,   // half way up the ceramic
    cyl=(r,d,z0,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,d*MM,32),mat);m.rotation.x=Math.PI/2;
    m.position.set(M.x*MM,M.y*MM,zs+(z0+d/2)*MM);m.castShadow=true;g.add(m);return m;};
  cyl(M.rose/2,5,0,chromeMat).userData.wc='rose';
  cyl(M.knob/2,M.out,5,chromeMat).userData.wc='knob';
  cyl(M.knob/2-4,.6,5+M.out,darkMat);                                                   // the knob's face
  [[-6,redMat],[6,blueMat]].forEach(([dx,mat])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(4*MM,1*MM,5*MM),mat);
    m.position.set((M.x+dx)*MM,(M.y+M.knob/2+.3)*MM,zs+(5+M.out-5)*MM);g.add(m);});
  const prev=opts.prev.find(d=>d.key==='wc-lid'),d=Object.assign({g:lg,frame:seat,a:0,t:0,s:-1,axis:'x',max:lidMax,key:'wc-lid',loose:true},prev&&{a:prev.a,t:prev.t,last:prev.last});
  turnDoor(d);   // frame: a click on the seat works it too
  return d;
}

