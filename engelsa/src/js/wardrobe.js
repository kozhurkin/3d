/* ---------- the wardrobe: 1601 × 2600 × 506, against the left wall (as one comes in) at its door end, or against the door wall in its
   right corner; or a corner one in that same corner, 1364 along each wall (A.wardWall: 'right', 'door', 'corner'; set in the plan's panel) ----------
   The straight one: taupe outside, cream inside. Below a plinth; the main case on four hinged doors (the left door hinged on the left,
   the middle pair from the middle out, the right door on the right) and three black edge handles where they meet, one at each meeting:
   the middle one on the left door of the pair, the right one of it opens by a push; on top a cupboard on four doors without handles.
   Inside the main case three sections: shelves on the left and on the right (one door each), in the middle (two doors) a shelf with
   a rail under it, a shelf lower down and two drawers at the bottom; the top cupboard in three.
   Built in its own frame: u across from its left side, y up from the floor, d out from its back (mm); turned onto the wall.
   It stands against the skirting board. Its doors are cabinet doors (engine.js: furnDoors): they open on a click or a hold */
const WD={T:16,BACK:4,FRONT:18,PLINTH:60,TOP:380,GAP:3,HANDLE:[12,1120,100]};   // panels, back, doors; plinth; top cupboard; gaps; handle: width, top, bottom
const srgb=h=>new THREE.Color(h).convertSRGBToLinear();
const wardOut=new THREE.MeshStandardMaterial({color:srgb('#B8AEA6'),roughness:.6});   // taupe, matt
const wardIn=new THREE.MeshStandardMaterial({color:srgb('#E9E2DA'),roughness:.65});    // cream
const wardBlack=new THREE.MeshStandardMaterial({color:0x111111,roughness:.4,metalness:.4});
const wardRail=new THREE.MeshStandardMaterial({color:0x9a9a98,roughness:.3,metalness:.9});
const wardGroup=new THREE.Group();scene.add(wardGroup);
const wallById=id=>WALLS.find(w=>w.id===id);
// the straight one, W wide on wall w, its left side off from the wall's left end as one faces it
function wardCase(w,W,off){
  const {T,BACK,FRONT,PLINTH,TOP,GAP}=WD,D=A.wardD,Hh=A.wardH,dC=D-FRONT,yM=Hh-TOP;   // the case's front; the main case's top
  const g=new THREE.Group();wardGroup.add(g);g.userData.wardrobe=true;g.userData.info=wardInfo;
  const box=(par,x0,x1,y0,y1,z0,z1,mat,lines=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry((x1-x0)*MM,(y1-y0)*MM,(z1-z0)*MM),mat);
    m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;
    if(lines)m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edgeMat));par.add(m);return m;};
  // the plinth, set back 20 from the case's front
  box(g,T,W-T,0,PLINTH,BACK,dC-20,wardOut);
  // a case from y0 to y1: its sides, top and bottom outside in taupe, the back inside in cream; partitions at u
  const kase=(y0,y1,parts)=>{
    box(g,0,T,y0,y1,0,dC,wardOut);box(g,W-T,W,y0,y1,0,dC,wardOut);
    box(g,T,W-T,y1-T,y1,0,dC,wardOut);box(g,T,W-T,y0,y0+T,0,dC,wardIn);
    box(g,T,W-T,y0+T,y1-T,0,BACK,wardIn,false);
    parts.forEach(u=>box(g,u-T/2,u+T/2,y0+T,y1-T,BACK,dC,wardIn));
  };
  const shelf=(a,b,y)=>box(g,a,b,y,y+T,BACK,dC-2,wardIn);
  const rail=(a,b,y)=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(.0125,.0125,(b-a)*MM,16),wardRail);r.rotation.z=Math.PI/2;
    r.position.set((a+b)/2*MM,y*MM,(dC/2)*MM);g.add(r);};
  const five=(a,b)=>{for(let i=1;i<=5;i++)shelf(a,b,PLINTH+T+i*(yM-PLINTH-2*T)/6-T/2);};   // five shelves, evenly
  const q=(W-2*T)/4,u1=T+q,u3=T+3*q;   // a door's share of the inside; the partitions: a door in from either side
  kase(PLINTH,yM,[u1,u3]);kase(yM,Hh,[u1,u3]);
  [[T,u1-T/2],[u3+T/2,W-T]].forEach(([a,b])=>five(a,b));
  // the middle: a shelf with the rail under it, a shelf over the drawers, two drawers (their fronts behind the doors)
  const a=u1+T/2,b=u3-T/2;
  shelf(a,b,yM-420);shelf(a,b,PLINTH+T+420);rail(a,b,yM-420-70);
  [0,1].forEach(i=>{const y0=PLINTH+T+10+i*205;box(g,a+3,b-3,y0,y0+190,dC-30,dC-12,wardIn);});
  // the doors on the main case and the top cupboard alike; hinged at hinge (u) on the case's front, s the way they turn out
  const door=(x0,x1,y0,y1,hingeLeft,handle)=>{
    const hx=hingeLeft?x0:x1,p=new THREE.Group();p.position.set(hx*MM,0,D*MM);g.add(p);
    box(p,x0-hx,x1-hx,y0,y1,-FRONT,0,wardOut);
    // the handle: a black profile along the edge away from the hinge, standing 2 out of the face and 1 past the edge, its back 1 in from
    // the leaf's: no face of it in a plane with the leaf's (they would flicker)
    if(handle){const [hw,ht,hb]=WD.HANDLE,e=hingeLeft?x1-hx:x0-hx;box(p,hingeLeft?e-hw:e-1,hingeLeft?e+1:e+hw,hb,ht,1-FRONT,2,wardBlack,false);}
    furnDoors.push({g:p,h:(y1-y0)*MM,t:0,a:0,max:1.6,s:hingeLeft?-1:1,wardrobe:true});
  };
  const dw=(W-5*GAP)/4,dx=i=>GAP+i*(dw+GAP);
  // the left door's hinges on the left, the middle pair's at the partitions, the right door's on the right; a handle at each meeting,
  // the middle one on the pair's left door
  [[0,true,true],[1,true,true],[2,false,false],[3,false,true]].forEach(([i,l,hd])=>{
    door(dx(i),dx(i)+dw,PLINTH+GAP,yM-GAP/2,l,hd);door(dx(i),dx(i)+dw,yM+GAP/2,Hh-GAP,l,false);});
  standAgainst(g,w,off);g.userData.boxes=()=>[standBox(g,0,W,0,A.wardD,A.wardH)];
  return g;
}
/* the corner one, as the main project's (src/js/rooms/living/wardrobe.js, «Уютная логика»): the corner unit A.wardC × A.wardC and an add-on
   section A.wardAdd wide on each side of it — along the door wall and along the left wall (as one comes in) from their corner, each wall
   A.wardC + A.wardAdd; WC.d deep, A.wardH high, a mezzanine of the same build WC.mz high on top.
   The corner unit: two carcasses held together by an L-shaped stile at the inner corner — along the left wall the leg, A.wardC wide,
   its back at that wall, the corner's square behind the other one, for hangers: a shelf at the top, two rods one over the other from side
   to side; along the door wall the other one from the leg's front on, its back at that wall, four shelves evenly (the main project's
   mirrored). The add-on sections on from them along their walls, four shelves each.
   A carcass as the shop's: sides down to the floor at its ends, the top, the bottom and the plinths (in front, and at the back in front of
   the back) between them, all as deep; the HDF back over their rear edges, in from them. The stile: a strip WC.strip wide in each front's
   plane. The doors over the plinth: the corner unit's two hinged at their outer ends, up to the strips; each section's at its far end.
   A black edge handle on each at its free end (as the shop's picture). The mezzanine the same over it, no plinth, its doors without
   handles. World axes (mm), no turn */
const WC={d:500,mz:400,pl:70,t:16,ft:16,gap:2,strip:50,shelves:4,top:1650,rods:[1590,860],rod:25,hdf:4,hdfIn:2};
function wardCorner(){
  const {d,mz,pl,t,ft,gap,strip:sw,hdf,hdfIn}=WC,C=A.wardC,Ad=A.wardAdd,Hh=A.wardH,Hl=Hh-mz,cd=d-ft;   // Hl: the lower part's top; cd: a carcass's depth behind its doors
  const X=A.W-PL_T,Z=PL_T;   // the left wall's face and the door wall's, the skirting boards kept
  const g=new THREE.Group();wardGroup.add(g);g.userData.wardrobe=true;g.userData.info=wardInfo;
  const box=(x0,x1,y0,y1,z0,z1,mat,lines=true,par=g)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1-x0)*MM,(y1-y0)*MM,Math.abs(z1-z0)*MM),mat);
    m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;
    if(lines)m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edgeMat));par.add(m);return m;};
  /* a carcass u0…u1 wide, y0…y1 high, its back at the wall: along the door wall (dw) along x with its back there, or along the left wall
     along z with its back there; o: out from its back's outer face (0) to its front (cd). plinth: the lower part's (sides to the floor, plinths) */
  const carcass=(u0,u1,y0,y1,dw,ys,plinth)=>{
    const a=(ua,ub,ya,yb,oa,ob,mat,lines)=>dw?box(ua,ub,ya,yb,Z+oa,Z+ob,mat,lines):box(X-oa,X-ob,ya,yb,ua,ub,mat,lines);
    const b0=plinth?y0+pl:y0;   // the bottom
    [u0,u1-t].forEach(u=>a(u,u+t,y0,y1,hdf,cd,wardOut));
    a(u0+t,u1-t,y1-t,y1,hdf,cd,wardOut);a(u0+t,u1-t,b0,b0+t,hdf,cd,wardIn);
    if(plinth){a(u0+t,u1-t,y0,b0,cd-t,cd,wardOut);a(u0+t,u1-t,y0,b0,hdf,hdf+t,wardOut);}
    a(u0+hdfIn,u1-hdfIn,b0,y1-hdfIn,0,hdf,wardIn,false);
    ys.forEach(y=>a(u0+t,u1-t,y,y+t,hdf,cd-20,wardIn));
  };
  const xF=X-d,zF=Z+d;   // the doors' faces: along the door wall (z), along the left wall (x)
  // one part, y0…y1: the carcasses, the stile, the doors; the lower part with its plinth, its shelves and the handles
  const part=(y0,y1,lower)=>{
    const n=WC.shelves,st=(y1-pl-2*t-n*t)/(n+1),shelfY=lower?[...Array(n)].map((_,i)=>Math.round(pl+t+(i+1)*st+i*t)):[];
    carcass(Z,Z+C,y0,y1,false,lower?[WC.top]:[],lower);carcass(X-C,X-cd,y0,y1,true,shelfY,lower);   // the corner unit: the leg, the other one
    carcass(X-C-Ad,X-C,y0,y1,true,shelfY,lower);carcass(Z+C,Z+C+Ad,y0,y1,false,shelfY,lower);      // the add-on sections
    const fy0=(lower?pl:y0)+gap,fy1=y1-gap,[hw,ht,hb]=WD.HANDLE;
    box(xF,xF+ft,fy0,fy1,zF,zF+sw,wardOut);box(xF-sw,xF+ft,fy0,fy1,zF-ft,zF,wardOut);   // the stile: the leg's strip, the other's over the corner
    // a door a0…a1 along the door wall (dw) or the left wall, hinged at h (one of its ends); its handle at the other
    const door=(a0,a1,dw,h)=>{
      const L=a1-a0,hx=h===a0,p=new THREE.Group();g.add(p);
      if(dw){p.position.set(h*MM,0,zF*MM);const e=hx?L:-L;box(hx?0:-L,hx?L:0,fy0,fy1,-ft,0,wardOut,true,p);
        if(lower)box(hx?e-hw:e-1,hx?e+1:e+hw,hb,ht,1-ft,2,wardBlack,false,p);}
      else{p.position.set(xF*MM,0,h*MM);const e=hx?L:-L;box(0,ft,fy0,fy1,hx?0:-L,hx?L:0,wardOut,true,p);
        if(lower)box(-2,ft-1,hb,ht,hx?e-hw:e-1,hx?e+1:e+hw,wardBlack,false,p);}
      // the way it turns out: its free end into the room
      furnDoors.push({g:p,h:(fy1-fy0)*MM,t:0,a:0,max:1.6,s:hx?-1:1,wardrobe:true});
    };
    door(X-C+gap/2,xF-sw-gap,true,X-C+gap/2);door(zF+sw+gap,Z+C-gap/2,false,Z+C-gap/2);   // the corner unit's
    door(X-C-Ad+gap/2,X-C-gap/2,true,X-C-Ad+gap/2);door(Z+C+gap/2,Z+C+Ad-gap/2,false,Z+C+Ad-gap/2);   // the sections'
  };
  part(0,Hl,true);part(Hl,Hh,false);
  // the rods in the leg: from side to side (along z), in the middle of its depth behind the door
  const x=X-(hdf+cd)/2;
  WC.rods.forEach(y=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(WC.rod/2*MM,WC.rod/2*MM,(C-2*t)*MM,20),wardRail);
    r.rotation.x=Math.PI/2;r.position.set(x*MM,y*MM,(Z+C/2)*MM);r.castShadow=true;r.userData.rod=true;g.add(r);});
  // where it stands: along the door wall and along the left wall, [x0,x1,z0,z1,y0,y1] (m)
  g.userData.boxes=()=>[[X-C-Ad,X,Z,zF,0,Hh],[xF,X,zF,Z+C+Ad,0,Hh]].map(b=>b.map(v=>v*MM));
}
/* its card («i»): the straight one is «Сеул» (Wildberries), the corner one «Уютная логика» (Ozon): the corner unit and two add-on sections.
   Its variants are the plan panel's (WARD_WALLS, in the buttons' order): the card's link puts the next one that fits and turns to its card */
const wardCm=v=>String(v/10).replace('.',',');
const WARD_WALLS=['right','door','corner'];
function nextWard(){
  const i=WARD_WALLS.indexOf(A.wardWall);
  for(let k=1;k<WARD_WALLS.length;k++){const a={...A,wardWall:WARD_WALLS[(i+k)%WARD_WALLS.length]};if(!aptProblems(a).length){setModel(a);break;}}
  return wardInfo();
}
/* its volume (l): outside its footprint by its height; inside its carcasses' insides (no sides, partitions, plinth, doors, back), shelves kept in */
function wardVolume(){
  const H=A.wardH,l=v=>Math.round(v/1e6);
  if(A.wardWall==='corner'){const {d,mz,pl,t,ft,hdf}=WC,C=A.wardC,Ad=A.wardAdd,cd=d-ft,Hl=H-mz;
    return {out:l(((C+Ad)*d+(C+Ad-d)*d)*H),in:l(((C-2*t)+(C-cd-2*t)+2*(Ad-2*t))*(cd-hdf)*((Hl-pl-2*t)+(mz-2*t)))};}
  const {T,BACK,FRONT,PLINTH,TOP}=WD,W=A.wardW,D=A.wardD;
  return {out:l(W*D*H),in:l((W-4*T)*(D-FRONT-BACK)*((H-TOP-PLINTH-2*T)+(TOP-2*T)))};
}
function wardInfo(){
  const v=wardVolume(),vol=`Объём внутри ≈ ${v.in} л (снаружи ${v.out} л).`;
  const H=wardCm(A.wardH),push='Двери открываются нажатием.',page={next:nextWard,variant:[WARD_WALLS.indexOf(A.wardWall)+1,WARD_WALLS.length]};
  if(A.wardWall==='corner')return {...page,title:'Угловой шкаф «Уютная логика» (Ozon)',shop:'Ozon',lines:['ЛДСП 16 мм, задние стенки — ХДФ.',
    `Угловой ${wardCm(A.wardC)} × ${wardCm(A.wardC)} см и доп. секция ${wardCm(A.wardAdd)} × ${wardCm(WC.d)} см с каждой стороны; высота ${H} см, антресоль ${wardCm(WC.mz)} см.`,
    'В углу у двери, вдоль двух стен.','В угловом — две штанги для вешалок с полкой над ними и четыре полки; в доп. секциях по четыре полки.',vol,push],
    buy:[{name:`Угловой 96,4 × 96,4 × ${H}`,price:24845,url:'https://ozon.ru/t/8LDmimL'},
      {name:`Доп. секция 40 × 50 × ${H}`,n:2,price:9577,url:'https://ozon.ru/t/N0IGKwe'}]};
  return {...page,title:'Шкаф для одежды «Сеул» с антресолью (Wildberries)',price:27655,shop:'Wildberries',
    url:'https://www.wildberries.ru/catalog/530234305/detail.aspx',lines:['ЛДСП 16 мм, цвет «Меланж».',
      `${wardCm(A.wardW)} × ${wardCm(A.wardD)} см, высота ${H} см; антресоль ${wardCm(WD.TOP)} см.`,
      A.wardWall==='door'?'У стены с дверью, в правом углу.':'У стены слева от входа, от угла у двери.',
      'Внутри: по краям по пять полок, посередине штанга, полки и два ящика.',vol,push]};
}
// where on a wall the straight one stands: from the left end as one faces the wall, or in the right corner
const WARD_AT={right:'left',left:'left',door:'right',window:'left'};
function buildWardrobe(){
  emptyGroup(wardGroup,false);furnDoors.length=0;
  if(A.wardWall==='corner')return wardCorner();
  const w=wallById(A.wardWall);if(!w)return;
  const [r0,r1]=w.run;wardCase(w,A.wardW,WARD_AT[w.id]==='right'?r1-r0-PL_T-A.wardW:PL_T);   // the skirting board at the corner kept
}
buildWardrobe();modelHooks.push(buildWardrobe);
// where it stands in the room (m): what the walk can't go through, [x0,x1,z0,z1,y0,y1]
function wardrobeBoxes(){return wardGroup.children.flatMap(g=>g.userData.boxes());}
// the doors swing toward where they are sent, a held one follows the hold
frameHooks.push((dt,ease)=>{furnDoors.forEach(d=>{
  if(held&&held.d===d){d.t=Math.min(d.max,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}else d.a+=(d.t-d.a)*ease(.07);
  d.g.rotation.y=d.s*d.a;});});
