/* ---------- the apartment in 3D: walls, window, doors, room floors and names ----------
   Walls are built for the current view: only the walls flagged for it, hidden by its fade rules in the cut mode. */
/* wall finishes, matte paint. "white" is the wall colour of the room tabs (follows the theme);
   p: swatch colour when the scene colour does not show the paint itself (the lit white wall, not its base tone) */
const WALLC={
  white:{n:'Белый',c:'--scene-wall',r:.95,p:'#F7F6F2'},
  greige:{n:'Greige',c:'#C7BEB1',r:.9},
  french:{n:'French Grey',c:'#B8B9A6',r:.9}
};
const wallCol=w=>w.c.startsWith('--')?css(w.c):w.c;
const floorMat=new THREE.MeshStandardMaterial({roughness:.95});
const wallMat=new THREE.MeshStandardMaterial({roughness:.95,side:THREE.DoubleSide});
const capMat=new THREE.MeshStandardMaterial({color:0x5b5f61,roughness:.9,side:THREE.DoubleSide});   // cut top of the walls, like the poché on a drawing
const edgeMat=new THREE.LineBasicMaterial({color:0x4a4d50,transparent:true,opacity:.35});
const winMat=new THREE.MeshStandardMaterial({color:0xf4f4f1,roughness:.5});
const glassMat=new THREE.MeshStandardMaterial({color:0x9fc3d4,roughness:.1,metalness:.1,transparent:true,opacity:.35,depthWrite:false});
const footMat=new THREE.MeshBasicMaterial({color:0x3b3d3f,polygonOffset:true,polygonOffsetFactor:-2});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.set(CX,-.002,CZ);floor.receiveShadow=true;scene.add(floor);   // outer walls and the entrance door cast their shadows outside the apartment


// take everything out of a group; its own materials and textures go too, shared ones stay (own=false)
function emptyGroup(g,own=true){
  g.children.slice().forEach(c=>{g.remove(c);c.traverse(o=>{if(o.geometry)o.geometry.dispose();
    if(own&&o.material)[].concat(o.material).forEach(m=>{if(m.map)m.map.dispose();m.dispose();});});});
}

/* room floors and the names on them: rebuilt when the sizes change */
const roomGroup=new THREE.Group();scene.add(roomGroup);
let roomMats=[];
function buildRooms(){
  emptyGroup(roomGroup);emptyGroup(namesGroup);nameTexts.length=0;
  roomMats=ROOMS.map(r=>{
    const m=new THREE.MeshStandardMaterial({roughness:.9});
    const p=new THREE.Mesh(new THREE.PlaneGeometry((r.r[1]-r.r[0])*MM,(r.r[3]-r.r[2])*MM),m);
    p.rotation.x=-Math.PI/2;p.position.set((r.r[0]+r.r[1])/2*MM,0,(r.r[2]+r.r[3])/2*MM);p.receiveShadow=true;roomGroup.add(p);return m;});
  ROOMS.forEach(r=>floorText(r.name,r.at[0],r.at[1],.2));
}

/* room names lying on the floor */
const namesGroup=new THREE.Group();scene.add(namesGroup);
const nameTexts=[];
function floorText(text,x,z,h){
  const c=document.createElement('canvas'),g=c.getContext('2d'),f=96;
  g.font=`400 ${f}px "Tenor Sans", Georgia, serif`;const w=Math.ceil(g.measureText(text).width)+24;
  c.width=w;c.height=f+30;
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(h*w/c.height,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x*MM,.004,z*MM);m.renderOrder=2;namesGroup.add(m);
  nameTexts.push({c,g,t,text,f});
}
function paintNames(){
  const col=css('--fg');
  nameTexts.forEach(n=>{n.g.clearRect(0,0,n.c.width,n.c.height);n.g.font=`400 ${n.f}px "Tenor Sans", Georgia, serif`;
    n.g.fillStyle=col;n.g.globalAlpha=.55;n.g.textBaseline='middle';n.g.fillText(n.text,12,n.c.height/2+4);n.t.needsUpdate=true;});
}
buildRooms();


/* ---------- walls ---------- */
let wallGroup=null, wallParts=[];   // {m: wall mesh, f: () => visible in "cut" mode}
let wallLines=[], linesTop=-1;      // {e: edge lines of a whole wall, w, f}; linesTop: cut height (mm) they are drawn for
const doors=[];                     // {g: hinge pivot, h: leaf height, t: target angle, a: angle, max}
let arcs=null;
/* edges of a whole wall cut at height top (mm): outer corners, opening reveals and the cut top only.
   The wall is built from boxes (pieces between openings, lintels, sills), but the joints between them are not drawn,
   so a wall with a door or a window reads as one piece */
function wallOutline(w,top){
  const [x0,x1,z0,z1]=w.r,alongX=(x1-x0)>=(z1-z0);
  const [u0,u1,v0,v1]=alongX?[x0,x1,z0,z1]:[z0,z1,x0,x1];   // u along the wall, v across it
  const s=[],P=(u,y,v)=>alongX?s.push(u*MM,y*MM,v*MM):s.push(v*MM,y*MM,u*MM);
  const seg=(ua,ya,va,ub,yb,vb)=>{P(ua,ya,va);P(ub,yb,vb);};
  const holes=w.holes||[];
  // section of the wall at height y: its length minus the openings cut through at that height
  const ring=(y,open)=>{let cur=u0;const iv=[];
    holes.filter(open).sort((p,q)=>p[0]-q[0]).forEach(([a,b])=>{iv.push([cur,a]);cur=b;});iv.push([cur,u1]);
    iv.forEach(([a,b])=>{if(b-a<1)return;seg(a,y,v0,b,y,v0);seg(a,y,v1,b,y,v1);seg(a,y,v0,a,y,v1);seg(b,y,v0,b,y,v1);});};
  ring(0,([,,,sill=0])=>sill===0);
  ring(top,([,,h,sill=0])=>sill<top&&top<=h);
  [u0,u1].forEach(u=>[v0,v1].forEach(v=>seg(u,0,v,u,top,v)));
  holes.forEach(([a,b,h,sill=0])=>{if(sill>=top)return;
    const y1=Math.min(h,top),across=y=>{[v0,v1].forEach(v=>seg(a,y,v,b,y,v));seg(a,y,v0,a,y,v1);seg(b,y,v0,b,y,v1);};
    [v0,v1].forEach(v=>{seg(a,sill,v,a,y1,v);seg(b,sill,v,b,y1,v);});   // jambs
    if(h<top)across(h);if(sill>0)across(sill);});                        // head and sill of the opening
  return s;
}
// the walls a view shows: its flagged walls, or all of them
const showsWall=(vw,w)=>vw.rooms==='all'||w.rooms.some(r=>vw.rooms.includes(r));
function buildWalls(vw){
  if(wallGroup){scene.remove(wallGroup);wallGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  wallGroup=new THREE.Group();wallParts=[];wallLines=[];linesTop=-1;
  const wallRule=w=>fadeRule(w,vw);
  const solid=(x0,x1,y0,y1,z0,z1,f)=>{
    const g=new THREE.BoxGeometry((x1-x0)*MM,(y1-y0)*MM,(z1-z0)*MM);
    const m=new THREE.Mesh(g,[wallMat,wallMat,capMat,wallMat,wallMat,wallMat]);
    m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;
    wallGroup.add(m);wallParts.push({m,f,b:y0*MM,t:y1*MM,h:(y1-y0)*MM});
  };
  const foot=(x0,x1,z0,z1)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry((x1-x0)*MM,(z1-z0)*MM),footMat);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2*MM,.002,(z0+z1)/2*MM);m.renderOrder=1;wallGroup.add(m);};
  WALLS.filter(w=>showsWall(vw,w)).forEach(w=>{
    const [x0,x1,z0,z1]=w.r,alongX=(x1-x0)>=(z1-z0),f=wallRule(w);
    const e=new THREE.LineSegments(new THREE.BufferGeometry(),edgeMat);e.raycast=()=>{};wallGroup.add(e);wallLines.push({e,w,f});
    // split the wall along its long side: full-height pieces between openings, a lintel over each opening
    let cur=alongX?x0:z0;const end=alongX?x1:z1;
    const piece=(a,b,y0,y1=H)=>{if(b-a<1)return;
      if(alongX)solid(a,b,y0,y1,z0,z1,f);else solid(x0,x1,y0,y1,a,b,f);
      if(y0===0){if(alongX)foot(a,b,z0,z1);else foot(x0,x1,a,b);}};
    (w.holes||[]).forEach(([a,b,h,sill=0])=>{piece(cur,a,0);piece(a,b,h);if(sill>0)piece(a,b,0,sill);cur=b;});
    piece(cur,end,0);
  });
  // kitchen window: white frame in the middle of the wall, a mullion, glass and an inner sill board; hides with its wall
  const ww=WALLS.find(v=>v.id==='window');
  if(showsWall(vw,ww)){ const w=ww,f=wallRule(w),FW=60,FD=70,zc=zEnd+A.bear/2;
    const x0=winX-A.winW/2,x1=winX+A.winW/2,y0=A.winS,y1=A.winS+A.winH;
    const part=(a,b,c,d,e,g,mat,shadow=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry((b-a)*MM,(d-c)*MM,(g-e)*MM),mat);
      m.position.set((a+b)/2*MM,(c+d)/2*MM,(e+g)/2*MM);m.castShadow=shadow;m.receiveShadow=true;wallGroup.add(m);
      wallParts.push({m,f,b:c*MM,t:d*MM,h:(d-c)*MM,glass:!shadow});};
    const bar=(a,b,c,d)=>part(a,b,c,d,zc-FD/2,zc+FD/2,winMat);
    bar(x0,x1,y0,y0+FW);bar(x0,x1,y1-FW,y1);bar(x0,x0+FW,y0+FW,y1-FW);bar(x1-FW,x1,y0+FW,y1-FW);bar(winX-FW/2,winX+FW/2,y0+FW,y1-FW);
    part(x0+FW,x1-FW,y0+FW,y1-FW,zc-4,zc+4,glassMat,false);
    part(x0-50,x1+50,y0-10,y0+20,zEnd-50,zc-FD/2-1,winMat); }   // sill board top sits above the wall opening, so the two faces never coincide (no z-fighting)
  scene.add(wallGroup);
}
/* "cut" mode: a wall hides while the camera is on the side the view names for it in fade
   ('-x': the camera is past its -x face, …); walls the view does not name always stay */
function fadeRule(w,vw){
  const r=w.r.map(v=>v*MM),c=camera.position,side=(vw.fade||{})[w.id];
  if(!side)return ()=>true;
  return {'-x':()=>c.x>r[1],'+x':()=>c.x<r[0],'-z':()=>c.z>r[3],'+z':()=>c.z<r[2]}[side];
}


/* doors. Entrance: as in the hall tab — dark metal frame set 100 mm into the bearing wall from the hall side,
   leaf hinged on the left, opening outward to the stairs, a handle on each side.
   Bathroom: hinged at the entrance end, opens into the hall left to right. */
const frameMat=new THREE.MeshStandardMaterial({color:0x34383b,roughness:.5,metalness:.3});
const entMat=new THREE.MeshStandardMaterial({color:0x4a4f52,roughness:.45,metalness:.35});
const handleMat=new THREE.MeshStandardMaterial({color:0xb9b9b5,metalness:.9,roughness:.25});
const leafMat=new THREE.MeshStandardMaterial({color:0xf1efea,roughness:.6});
const doorGroup=new THREE.Group();scene.add(doorGroup);
function door(px,pz,size,pos,mat,max){
  const g=new THREE.Group();g.position.set(px*MM,0,pz*MM);
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size.map(v=>v*MM)),mat);m.position.set(...pos.map(v=>v*MM));m.castShadow=m.receiveShadow=true;
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edgeMat));
  g.add(m);doorGroup.add(g);const d={g,h:size[1]*MM,t:0,a:0,max};doors.push(d);return d;
}
const EF=50,ED=70,EZ=-100;   // entrance frame: bar width, bar depth, hall-side face of the frame (100 mm into the wall)
const doorParts=[];          // every door box (leaves, handles, frame bars) is cut at the wall height like the walls, never squashed
// doors are rebuilt when the sizes change; each stays as open as it was
function buildDoors(){
  const keep=doors.map(d=>({t:d.t,a:d.a,last:d.last}));
  emptyGroup(doorGroup,false);doors.length=0;held=null;
  if(arcs){scene.remove(arcs);emptyGroup(arcs);}
  const eLw=A.eD1-A.eD0-2*EF-6, eLh=A.eDH-EF-10;   // entrance leaf inside the frame
  { const ent=door(A.eD0+EF+3,EZ-ED,[eLw,eLh,ED],[eLw/2,eLh/2+5,ED/2],entMat,1.75);
    [ED+20,-20].forEach(z=>{const hd=new THREE.Mesh(new THREE.BoxGeometry(.14,.025,.03),handleMat);hd.position.set((eLw-120)*MM,1.0,z*MM);hd.castShadow=true;ent.g.add(hd);});
    const fr=new THREE.Group();doorGroup.add(fr);ent.frame=fr;
    const bar=(x0,x1,y0,y1)=>{const m=new THREE.Mesh(new THREE.BoxGeometry((x1-x0)*MM,(y1-y0)*MM,ED*MM),frameMat);
      m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(EZ-ED/2)*MM);m.castShadow=m.receiveShadow=true;fr.add(m);};
    bar(A.eD0,A.eD0+EF,0,A.eDH);bar(A.eD1-EF,A.eD1,0,A.eDH);bar(A.eD0+EF,A.eD1-EF,A.eDH-EF,A.eDH);
    const bw=A.bDoor-6,bh=A.bDoorH-10;
    door(0,A.hL1+3,[40,bh,bw],[-20,bh/2+5,bw/2],leafMat,1.5); }
  // door swing on the floor, drawn the way plans show it
  { arcs=new THREE.Group();const am=new THREE.LineDashedMaterial({color:0x6b7069,dashSize:.04,gapSize:.03});
    const arc=(cx,cz,r,a0,a1,leaf)=>{const pts=[];for(let i=0;i<=32;i++){const a=a0+(a1-a0)*i/32;pts.push(new THREE.Vector3((cx+r*Math.cos(a))*MM,.006,(cz+r*Math.sin(a))*MM));}
      const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),am);l.computeLineDistances();arcs.add(l);
      const e=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(cx*MM,.006,cz*MM),new THREE.Vector3((cx+r*Math.cos(leaf))*MM,.006,(cz+r*Math.sin(leaf))*MM)]),new THREE.LineBasicMaterial({color:0x6b7069}));arcs.add(e);};
    arc(A.eD0+EF+3,EZ-ED,eLw,0,-Math.PI/2,-Math.PI/2);
    arc(0,A.hL1+3,A.bDoor-6,Math.PI/2,0,0);
    scene.add(arcs); }
  doors.forEach((d,i)=>{if(keep[i])Object.assign(d,keep[i]);});
  doorParts.length=0;
  doorGroup.traverse(m=>{if(!m.isMesh)return;const h=m.geometry.parameters.height,y=m.position.y;doorParts.push({m,h,b:y-h/2,t:y+h/2});});
}
buildDoors();

// the sizes changed: everything of the apartment is built again for the view on screen
modelHooks.push(()=>{
  floor.position.set(CX,-.002,CZ);
  buildRooms();buildDoors();buildWalls(VIEWS[view]);applyTheme();
});


/* theme colours; the wall colour is shared by all views, floor colours by room are a setting of the view */
function applyTheme(){
  scene.background=new THREE.Color(css('--scene-bg'));
  floorMat.color.set(css('--scene-floor'));
  const wc=WALLC[S.wc]||WALLC.white;wallMat.color.set(wallCol(wc));
  wallMat.roughness=wc.r;
  const fl=(vs()||{}).floors!==false;
  roomMats.forEach((m,i)=>m.color.set(fl?css(ROOMS[i].col):css('--scene-floor')));
  paintNames();
}

/* every frame: walls are cut at the view's share of the ceiling height (bottom stays on the floor), doors swing */
let wallCut=H*MM, wallOutlineMode=false;   // where the walls end now (m) and whether only their outlines show — for the dimension lines
frameHooks.push((dt,ease)=>{
  const V=vs();
  { const row=V.Wm==='row',skel=V.Wm==='skeleton',outline=V.Wm==='outline';
    const cutMm=H*(row?10:V.Wh)/100,cut=cutMm*MM;
    const op=skel?0:1,tr=op<.999;
    [wallMat,capMat].forEach(m=>{m.opacity=op;if(m.transparent!==tr){m.transparent=tr;m.depthWrite=!tr;m.needsUpdate=true;}});
    edgeMat.opacity=skel?.9:.35;
    wallParts.forEach(w=>{
      const top=Math.min(w.t,cut),fits=top>w.b+.001;
      w.m.visible=fits&&!outline&&(V.Wm==='auto'?w.f():true);
      w.m.castShadow=!skel&&!w.glass;
      if(fits){w.m.scale.y=(top-w.b)/w.h;w.m.position.y=w.b+(top-w.b)/2;}
    });
    // wall edges are redrawn only when the cut height changes
    if(cutMm!==linesTop){linesTop=cutMm;wallLines.forEach(l=>{l.e.geometry.dispose();
      l.e.geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(wallOutline(l.w,Math.min(H,cutMm)),3));});}
    wallLines.forEach(l=>l.e.visible=!outline&&(V.Wm==='auto'?l.f():true));
    doors.forEach(d=>{
      if(held&&held.d===d){d.t=Math.min(d.max,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}
      else d.a+=(d.t-d.a)*ease(.07);
      d.g.rotation.y=d.a;});
    doorParts.forEach(p=>{const top=Math.min(p.t,cut),fits=top>p.b+.001;p.m.visible=fits;
      if(fits){p.m.scale.y=(top-p.b)/p.h;p.m.position.y=p.b+(top-p.b)/2;}});
    doorGroup.visible=V.dm!=='none'&&!outline;arcs.visible=V.dm!=='none';
    wallCut=Math.min(cut,H*MM);wallOutlineMode=outline;
  }
});
