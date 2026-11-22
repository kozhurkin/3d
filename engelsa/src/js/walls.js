/* ---------- the room in 3D: walls, window, door, the floor and the room's name ----------
   Walls are built for the current view: only the walls flagged for it, hidden by its fade rules in the cut mode. */
/* wall finishes, matte paint. "white" is the wall colour of the room tabs (follows the theme);
   p: swatch colour when the scene colour does not show the paint itself (the lit white wall, not its base tone) */
const WALLC={
  linen:{n:'Обои',c:'#FFFFFF',r:.95,p:'#A59389',tex:true},   // the wallpaper: its colour and its linen weave are the photo's (wallTex); p: its mean colour
  white:{n:'Белый',c:'--scene-wall',r:.95,p:'#F7F6F2'},
  greige:{n:'Greige',c:'#C7BEB1',r:.9},
  french:{n:'French Grey',c:'#B8B9A6',r:.9}
};
const wallCol=w=>w.c.startsWith('--')?css(w.c):w.c;
const floorMat=new THREE.MeshStandardMaterial({roughness:.95});
/* the faces the outlines lie on (walls, the room floors, the walk's ceiling) are set a hair back in depth:
   a line along an inner corner lies on both faces exactly and would lose the depth test to them; on an outer corner it shows
   only because half of it is past the wall's edge */
const BEHIND={polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1};
const wallMat=new THREE.MeshStandardMaterial({roughness:.95,side:THREE.DoubleSide,...BEHIND});

/* the wallpaper (js/wallpaper-photo.js): a seamless tile of the shop's photo, WALL_TILE square on the wall. Its colours are the photo's:
   the shader takes them from sRGB to linear itself (the wall colour is white then) */
const WALL_TILE=.35;   // m
function wallpaperTexture(){const t=new THREE.TextureLoader().load(WALLPAPER_JPG);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
/* the wallpaper on the walls by their place in the room, not by the pieces' own UVs: a wall is built of boxes of all sizes and cut
   in height by scale (a flight, «Высота стен»), so a texture on them would stretch. Each face takes the two axes along it */
// wallBandY: over it (m from the floor) the wall is painted white, the trims' white (wallBandC), up to the cornice: the rope trim and the band over it;
// revMin, revMax: the window's opening through its wall (m): its reveals are painted the same white, not papered
const wallTexU={wallTex:{value:wallpaperTexture()},wallTexOn:{value:1},wallBandY:{value:99},wallBandC:{value:new THREE.Color()},
  revMin:{value:new THREE.Vector3()},revMax:{value:new THREE.Vector3()}};
function wallShader(m){
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,wallTexU);
    sh.vertexShader='varying vec3 vWallPos;\nvarying vec3 vWallN;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvWallPos=(modelMatrix*vec4(transformed,1.0)).xyz;vWallN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader='uniform sampler2D wallTex;\nuniform float wallTexOn;\nuniform float wallBandY;\nuniform vec3 wallBandC;\nuniform vec3 revMin;\nuniform vec3 revMax;\nvarying vec3 vWallPos;\nvarying vec3 vWallN;\n'+sh.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
      if(wallTexOn>.5){vec3 n=abs(vWallN);vec2 uv=n.y>max(n.x,n.z)?vWallPos.xz:n.x>n.z?vWallPos.zy:vWallPos.xy;
        diffuseColor.rgb*=pow(texture2D(wallTex,uv/${WALL_TILE.toFixed(3)}).rgb,vec3(2.2));}
      bool reveal=abs(vWallN.z)<.5&&all(greaterThan(vWallPos,revMin))&&all(lessThan(vWallPos,revMax));   // a face inside the window's opening
      if(vWallPos.y>wallBandY||reveal)diffuseColor.rgb=wallBandC;`);
  };
  m.customProgramCacheKey=()=>'wallpaper';
  return m;
}
wallShader(wallMat);
/* the photo wallpaper (js/mural-photo.js: 5 strips 100 × 270 cm as one picture): one sheet on its wall's room face, 1 mm off it.
   The part of the picture on the wall: from its left edge (the left corner as one faces the wall) as long as the wall is; when the walls
   are cut lower, its top is cut off with them (the texture's share up shrinks with the sheet), not squashed */
const muralTex=new THREE.TextureLoader().load(MURAL_JPG);muralTex.encoding=THREE.sRGBEncoding;muralTex.anisotropy=8;
const muralMat=new THREE.MeshStandardMaterial({map:muralTex,roughness:.85,polygonOffset:true,polygonOffsetFactor:-1});
function muralMesh(w,y0){
  const [at,dir]=w.face,sg=dir[0]==='+'?1:-1,[r0,r1]=w.run,len=Math.min(A.muralW,r1-r0);
  if(dir[1]!=='x')return null;   // the side walls only: the long ones, no openings in them
  const m=new THREE.Mesh(new THREE.PlaneGeometry(len*MM,A.muralH*MM),muralMat);
  m.rotation.y=sg*Math.PI/2;m.receiveShadow=true;
  muralTex.repeat.x=len/A.muralW;muralTex.repeat.y=1;muralTex.offset.x=muralTex.offset.y=0;
  // facing +x (the left wall) its left is at the window end, facing -x at the door end
  const z0=sg>0?r1-len:r0,x=at+sg,box=[Math.min(at,x),Math.max(at,x),z0,z0+len];
  m.position.set(x*MM,(y0+A.muralH/2)*MM,(z0+len/2)*MM);
  return {m,box};
}
/* the cornice under the ceiling, the rope trim over the photo wallpaper and the skirting board: white, along the room face of every wall */
const trimMat=new THREE.MeshStandardMaterial({color:0xf3f1ec,roughness:.55});
const CORN_D=30,PL_T=16;   // mm: how far the cornice's relief stands out of the wall at most, the skirting board's thickness
/* the skirting board's profile (s: out from the wall into the room, v: up from its bottom; mm), run along a wall face: upright,
   its top rounded toward the wall */
function trimProfile(h){
  const S=new THREE.Shape(),k=MM;
  S.moveTo(0,0);S.lineTo(PL_T*k,0);S.lineTo(PL_T*k,(h-14)*k);S.quadraticCurveTo(PL_T*k,h*k,4*k,h*k);S.lineTo(0,h*k);
  return S;
}
/* the cornice: a frieze, a board on the wall under the ceiling. Along its top a plain band, under it a groove, then a row of the same
   acanthus leaf over and over, each symmetric about its own upright axis: at its top two curls rolled out to the sides and a knob
   between them, under them a second pair, then the leaf narrowing down with lobed edges, a rib down its middle and veins fanning
   out from it, to a rounded tip; the tips make a row of scallops over the board's plain bottom. A leaf to about each board height
   of the run, a whole number of them on a wall.
   friezeDepth(u, v): how far the face stands out of the wall (mm) at u along a leaf's period (0…1) and v down from the top (0…1) */
const FRIEZE_BASE=8,FRIEZE_BAND=18,FRIEZE_LEAF=20;
function friezeDepth(u,v){
  if(v<.13)return FRIEZE_BAND-Math.max(0,(v-.1)/.03)*3;   // the band, its lower edge rounded off
  if(v<.17)return FRIEZE_BASE+1;                          // the groove under it
  const t=(v-.17)/.79;if(t>=1)return FRIEZE_BASE;         // down the leaf 0…1; the board's plain bottom under the tips
  const x=Math.abs(u-.5);   // from the leaf's axis: both halves the same
  // the leaf: round at its top, widest a third of the way down, narrowing to a round tip; its edges lobed alike on both sides
  const w=.47*Math.sqrt(Math.max(0,1-((t-.34)/(t<.34?.37:.66))**2))*(1+.1*Math.sin(2*Math.PI*3.5*t+.8));
  let d=0;
  if(x<w){
    const r=x/w;d=Math.sqrt(1-r*r)*(.55+.45*Math.cos(Math.PI*Math.max(0,t-.25)/1.6));
    const fan=Math.atan2(x,t+.12);                          // the veins fanning out from the top of the rib
    d*=.84+.16*Math.cos(fan*16);
    d+=.2*Math.exp(-Math.pow(x/.028,2))*Math.sqrt(1-r*r);   // the rib down the middle
  }
  // the curls at the top: rolled out to the sides, a knob between them, a smaller pair under them; round knobs, each a dome
  [[.3,.1,.15],[0,.07,.13],[.17,.27,.11],[.36,.3,.09]].forEach(([cx,ct,cr])=>{
    const q=1-((x-cx)**2+((t-ct)*.6)**2)/(cr*cr);if(q>0)d=Math.max(d,.45+.62*Math.sqrt(q));});
  return FRIEZE_BASE+FRIEZE_LEAF*Math.min(1.1,d);
}
/* the rope trim: strands twisted, round across, the grooves between them running up at a slant; a groove to ROPE_P mm of the run.
   ropeDepth(u, v): how far it stands out of the wall (mm) at u along a twist (0…1) and v down from its top (0…1) */
const ROPE_D=6,ROPE_P=12;
function ropeDepth(u,v){
  const r=Math.sqrt(Math.max(0,1-(2*v-1)**2)),s=((u+v*.8)%1+1)%1;   // a groove a twist, slanting up across the rope
  return ROPE_D*r*(.62+.38*Math.pow(Math.sin(Math.PI*s),.5));
}
/* a relief board's face, len × h mm, as the skirting board's extrusion lies before it is turned: s (out of the wall) along +x, up +y,
   the run along +z; with under, its underside too (the frieze's plain bottom), seen from below. A whole number of periods about p mm
   long, seg columns to each, ny rows; depth(u, v): its face out of the wall at u along a period and v down from the top */
function reliefGeometry(len,h,{p,seg,ny,depth,under=0}){
  const n=Math.max(1,Math.round(len/p)),nz=n*seg,pos=[],idx=[],at=(i,j)=>i*(ny+1)+j;
  for(let i=0;i<=nz;i++)for(let j=0;j<=ny;j++){const u=(i/seg)%1,v=1-j/ny;pos.push(depth(i===nz?0:u,v)*MM,j/ny*h*MM,i/nz*len*MM);}
  for(let i=0;i<nz;i++)for(let j=0;j<ny;j++)idx.push(at(i,j),at(i,j+1),at(i+1,j),at(i,j+1),at(i+1,j+1),at(i+1,j));   // facing +x
  if(under){const o=pos.length/3;   // the underside: from the wall to the face along the bottom, facing down
    for(let i=0;i<=nz;i++)pos.push(0,0,i/nz*len*MM,under*MM,0,i/nz*len*MM);
    for(let i=0;i<nz;i++){const a=o+2*i;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  return g;
}
const TRIM={   // the trims along the walls: how far each stands out at most (mm), its geometry len × h mm
  cornice:{d:CORN_D,geo:(l,h)=>reliefGeometry(l,h,{p:h*.95,seg:24,ny:28,depth:friezeDepth,under:FRIEZE_BASE}),lines:70},
  rope:{d:ROPE_D,geo:(l,h)=>reliefGeometry(l,h,{p:ROPE_P,seg:8,ny:6,depth:ropeDepth}),lines:89},
  plinth:{d:PL_T,geo:(l,h)=>new THREE.ExtrudeGeometry(trimProfile(h),{depth:l*MM,bevelEnabled:false,curveSegments:8}),lines:30}
};
// … made a mesh of the room face of wall w (face: [where, the way into the room]) from a to b along it, y0 up from the floor;
// its geometry centred on its box, as the wall pieces are (the wall-height cut and a flight scale it about its middle)
function trimMesh(kind,w,a,b,y0,h){
  const T=TRIM[kind],g=T.geo(b-a,h);
  const [at,dir]=w.face,alongX=dir[1]==='z',sg=dir[0]==='+'?1:-1,depth=T.d;
  // the profile's s goes into the room: +x as built; turned so it goes the face's way, the run along the wall
  g.rotateY(alongX?-sg*Math.PI/2:(sg>0?0:Math.PI));
  if(g.center)g.center();
  const m=new THREE.Mesh(g,trimMat);m.castShadow=m.receiveShadow=true;
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(g,T.lines),edgeMat);e.raycast=()=>{};m.add(e);   // a relief: its outline, not every leaf and twist
  const box=alongX?[a,b,...[at,at+sg*depth].sort((p,q)=>p-q)]:[...[at,at+sg*depth].sort((p,q)=>p-q),a,b];
  m.position.set((box[0]+box[1])/2*MM,(y0+h/2)*MM,(box[2]+box[3])/2*MM);
  return {m,box};
}
// the ceiling's colour (the walk's ceiling): white whatever the walls' paint is — the palette's «Белый», as the theme has it
const ceilColor=new THREE.Color();
const edgeMat=new THREE.LineBasicMaterial({color:0x4a4d50,transparent:true,opacity:.35});
// how dark the walls' and doors' outlines are in a view: in «Контуры» (only the outlines of the walls) dark, else as «Контур стен» (one setting for every view)
const edgeOp=V=>V.Wm==='edges'?.9:S.edge?.5:0;
const winMat=new THREE.MeshStandardMaterial({color:0xf4f4f1,roughness:.5});
const glassMat=new THREE.MeshStandardMaterial({color:0x9fc3d4,roughness:.1,metalness:.1,transparent:true,opacity:.35,depthWrite:false});
const footMat=new THREE.MeshBasicMaterial({color:0x3b3d3f,polygonOffset:true,polygonOffsetFactor:-2});
const lowFootMat=new THREE.MeshBasicMaterial({color:0x5a5d60,polygonOffset:true,polygonOffsetFactor:-2});   // a low wall's footprint: a shade lighter, not quite a wall
const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.set(CX,-.002,CZ);floor.receiveShadow=true;scene.add(floor);   // the walls cast their shadows outside the room


// take everything out of a group; its own materials and textures go too, shared ones stay (own=false)
function emptyGroup(g,own=true){
  g.children.slice().forEach(c=>{g.remove(c);c.traverse(o=>{if(o.geometry)o.geometry.dispose();
    if(own&&o.material)[].concat(o.material).forEach(m=>{if(m.map)m.map.dispose();m.dispose();});});});
}

/* room floors and the names on them: rebuilt when the sizes change */
const roomGroup=new THREE.Group();scene.add(roomGroup);
let roomMats=[];
const roomPoly=r=>r.poly||[[r.r[0],r.r[2]],[r.r[1],r.r[2]],[r.r[1],r.r[3]],[r.r[0],r.r[3]]];   // the floor's outline [x,z]…
const polySigned=q=>q.reduce((s,a,i)=>{const b=q[(i+1)%q.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;   // mm², > 0 counter-clockwise in x,z
const polyArea=q=>Math.abs(polySigned(q));
// a flat floor on an outline, lying at y 0
const polyFloorGeometry=q=>new THREE.ShapeGeometry(new THREE.Shape(q.map(p=>new THREE.Vector2(p[0]*MM,-p[1]*MM)))).rotateX(-Math.PI/2);
const roomArea=r=>`${(polyArea(roomPoly(r))/1e6).toFixed(2).replace('.',',')} м²`;
const roomCaption=r=>`${r.name} · ${roomArea(r)}`;
function buildRooms(){
  emptyGroup(roomGroup);emptyGroup(namesGroup);nameTexts.length=0;
  roomMats=ROOMS.map(r=>{
    const m=new THREE.MeshStandardMaterial({roughness:.9,...BEHIND});
    const p=new THREE.Mesh(polyFloorGeometry(roomPoly(r)),m);p.receiveShadow=true;roomGroup.add(p);return m;});
  ROOMS.forEach(r=>{const t=roomCaption(r);floorText(t,r.at[0],r.at[1],.153,t.length-roomArea(r).length);});   // the name and the floor area of the room (153 mm a line)
}

/* room names lying on the floor */
const namesGroup=new THREE.Group();scene.add(namesGroup);
const nameTexts=[];
const nameFont=f=>`400 ${f}px "Tenor Sans", Georgia, serif`;
// the canvas is as wide as the text in the font as it is now: built before the web font has come, a name is measured in
// the fallback, narrower one, and paintNames widens it (canvas and plane) once the font is there
const nameW=n=>{n.g.font=nameFont(n.f);return Math.ceil(n.g.measureText(n.text).width)+24;};
// where the area part of a name lies across the texture (0..1), in the font as it is now
const areaSpan=n=>{n.g.font=nameFont(n.f);const w=n.c.width;return [(12+n.g.measureText(n.text.slice(0,n.cut)).width)/w,(12+n.g.measureText(n.text).width)/w];};
function floorText(text,x,z,h,cut=0){   // cut: where the area starts in the text
  const c=document.createElement('canvas'),g=c.getContext('2d'),f=96;
  c.height=f+30;
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x*MM,.004,z*MM);m.renderOrder=2;namesGroup.add(m);
  nameTexts.push({c,g,t,m,h,text,f,cut});
}
function paintNames(){
  const col=css('--fg');
  nameTexts.forEach(n=>{
    const w=nameW(n);
    if(w!==n.c.width){n.c.width=w;n.t.dispose();n.m.scale.x=n.h*w/n.c.height;}   // a new size: the texture is made anew
    n.g.clearRect(0,0,n.c.width,n.c.height);n.g.font=nameFont(n.f);
    n.g.fillStyle=col;n.g.globalAlpha=.55;n.g.textBaseline='middle';n.g.fillText(n.text,12,n.c.height/2+4);n.t.needsUpdate=true;});
}
buildRooms();


/* ---------- walls ---------- */
let wallGroup=null, wallParts=[];   // {m: wall mesh, f: () => visible in "cut" mode}
let wallLines=[], linesTop=-1;      // {e: edge lines of a whole wall, w, f}; linesTop: cut height (mm) they are drawn for
const doors=[];                     // {g: hinge pivot, h: leaf height, t: target angle, a: angle, max, s: the way it turns (±1)}
let arcs=null;
/* edges of a whole wall cut at height top (mm): outer corners, opening reveals and the cut top only.
   The wall is built from boxes (pieces between openings, lintels, sills), but the joints between them are not drawn,
   so a wall with a door or a window reads as one piece */
function wallOutline(w,top){
  const [x0,x1,z0,z1]=w.r,alongX=w.along;top=Math.min(top,w.h||H);   // a low wall ends at its own height
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
/* the part of a wall inside the view's frame (walls and frames are rectangles along the axes); null when nothing is left.
   along: the wall's direction, taken from the whole wall (a short cut piece must not turn across);
   holes are cut with it, kept: the holes that are still whole (their doors and windows can show) */
function clipWall(w,fr){
  const along=(w.r[1]-w.r[0])>=(w.r[3]-w.r[2]),holes0=w.holes||[];
  if(!fr)return {...w,along,holes:holes0,kept:holes0.map((h,i)=>i)};
  const r=[Math.max(w.r[0],fr[0]),Math.min(w.r[1],fr[1]),Math.max(w.r[2],fr[2]),Math.min(w.r[3],fr[3])];
  if(r[1]-r[0]<1||r[3]-r[2]<1)return null;
  const [u0,u1]=along?[r[0],r[1]]:[r[2],r[3]],holes=[],kept=[];
  holes0.forEach(([a,b,...rest],i)=>{const a1=Math.max(a,u0),b1=Math.min(b,u1);if(b1-a1<1)return;
    holes.push([a1,b1,...rest]);if(a1===a&&b1===b)kept.push(i);});
  return {...w,r,along,holes,kept};
}
let holesShown=new Set();   // 'wallId:holeIndex' of the openings on screen whole: their doors show
let wallFeet=[];            // {m, id, box}: dark footprints of the wall pieces on the floor
// the walls a view shows, cut by its frame: wall id → clipped wall
function viewWalls(vw){
  const fr=vw.frame?vw.frame():null,m=new Map();
  WALLS.filter(w=>showsWall(vw,w)).forEach(w=>{const c=clipWall(w,fr);if(c)m.set(w.id,c);});
  return m;
}
/* builds the given (clipped) walls: full-height pieces between openings, a lintel over each opening, a sill under a window,
   their footprints, and the window when its opening is whole. Every piece keeps its wall id and its box on the plan (mm),
   so a flight between views can cut it shorter and lower without new geometry. ruleOf: the cut-mode rule of a wall;
   lines: the outline of every whole wall */
function buildWallSet(list,ruleOf,lines){
  if(wallGroup){scene.remove(wallGroup);wallGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  wallGroup=new THREE.Group();wallParts=[];wallLines=[];wallFeet=[];linesTop=-1;holesShown=new Set();
  const solid=(id,x0,x1,y0,y1,z0,z1,f)=>{
    const g=new THREE.BoxGeometry((x1-x0)*MM,(y1-y0)*MM,(z1-z0)*MM);
    const m=new THREE.Mesh(g,wallMat);
    m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;
    wallGroup.add(m);wallParts.push({m,f,id,box:[x0,x1,z0,z1],b:y0*MM,t:y1*MM,h:(y1-y0)*MM});
  };
  const foot=(id,x0,x1,z0,z1,mat)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry((x1-x0)*MM,(z1-z0)*MM),mat);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2*MM,.002,(z0+z1)/2*MM);m.renderOrder=1;wallGroup.add(m);wallFeet.push({m,id,box:[x0,x1,z0,z1]});};
  list.forEach(w=>{
    w.kept.forEach(i=>holesShown.add(w.id+':'+i));
    const [x0,x1,z0,z1]=w.r,alongX=w.along,f=ruleOf(w),id=w.id,fm=w.h?lowFootMat:footMat;   // a low wall's footprint lighter
    if(lines){const e=new THREE.LineSegments(new THREE.BufferGeometry(),edgeMat);e.raycast=()=>{};wallGroup.add(e);wallLines.push({e,w,f});}
    // split the wall along its long side: full-height pieces between openings, a lintel over each opening
    let cur=alongX?x0:z0;const end=alongX?x1:z1;
    const piece=(a,b,y0,y1=w.h||H)=>{if(b-a<1)return;
      if(alongX)solid(id,a,b,y0,y1,z0,z1,f);else solid(id,x0,x1,y0,y1,a,b,f);
      if(y0===0){if(alongX)foot(id,a,b,z0,z1,fm);else foot(id,x0,x1,a,b,fm);}};
    (w.holes||[]).forEach(([a,b,h,sill=0])=>{piece(cur,a,0);piece(a,b,h);if(sill>0)piece(a,b,0,sill);cur=b;});
    piece(cur,end,0);
    // the cornice under the ceiling and the skirting board along its room face, the part of them in the wall's clipped rect
    if(w.face){const [r0,r1]=alongX?[x0,x1]:[z0,z1],add=(kind,a,b,y0,h)=>{a=Math.max(a,r0);b=Math.min(b,r1);if(b-a<1||h<1)return;
        const t=trimMesh(kind,w,a,b,y0,h);wallGroup.add(t.m);wallParts.push({m:t.m,f,id,box:t.box,b:y0*MM,t:(y0+h)*MM,h:h*MM,trim:true,kind});};
      add('cornice',w.run[0],w.run[1],H-A.cornH,A.cornH);w.plinth.forEach(([a,b])=>add('plinth',a,b,0,A.plH));
      w.rope.forEach(([a,b])=>add('rope',a,b,A.plH+A.muralH,A.ropeH));
      const mu=A.muralWall===id&&muralMesh(w,A.plH);
      if(mu){wallGroup.add(mu.m);wallParts.push({m:mu.m,f,id,box:mu.box,b:A.plH*MM,t:(A.plH+A.muralH)*MM,h:A.muralH*MM,photo:true,fit:k=>{muralTex.repeat.y=k;}});}}
  });
  // the window: white frame in the middle of the wall's thickness, a mullion when it is wide, glass and an inner sill board; hides with its wall
  if(holesShown.has('window:0')){ const w=WALLS.find(v=>v.id==='window'),f=ruleOf(w),FW=60,FD=70,zc=A.L+A.tW/2;
    const x0=winX-A.winW/2,x1=winX+A.winW/2,y0=A.winS,y1=A.winT;
    const part=(a,b,c,d,e,g,mat,shadow=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry((b-a)*MM,(d-c)*MM,(g-e)*MM),mat);
      m.position.set((a+b)/2*MM,(c+d)/2*MM,(e+g)/2*MM);m.castShadow=shadow;m.receiveShadow=true;wallGroup.add(m);
      wallParts.push({m,f,id:'window',box:[a,b,e,g],b:c*MM,t:d*MM,h:(d-c)*MM,glass:!shadow});};
    const bar=(a,b,c,d)=>part(a,b,c,d,zc-FD/2,zc+FD/2,winMat);
    bar(x0,x1,y0,y0+FW);bar(x0,x1,y1-FW,y1);bar(x0,x0+FW,y0+FW,y1-FW);bar(x1-FW,x1,y0+FW,y1-FW);
    if(A.winW>=1200)bar(winX-FW/2,winX+FW/2,y0+FW,y1-FW);
    part(x0+FW,x1-FW,y0+FW,y1-FW,zc-4,zc+4,glassMat,false);
    part(x0-50,x1+50,y0-10,y0+20,A.L-50,zc-FD/2-1,winMat); }   // sill board top sits above the wall opening, so the two faces never coincide (no z-fighting)
  scene.add(wallGroup);
  // doors and their swings show with their whole openings
  doors.forEach(d=>{const on=holesShown.has(d.hole);d.g.visible=on;if(d.frame)d.frame.visible=on;});
  if(arcs)arcs.children.forEach(l=>{l.visible=holesShown.has(l.userData.hole);});
}
// the walls of a view at rest: exact pieces, outlines, its cut-mode rules
function buildWalls(vw){dropMorph();buildWallSet([...viewWalls(vw).values()],w=>fadeRule(w,vw),true);}

/* ---------- a flight between views ----------
   The walls of both views at once. How each wall looks is taken twice: at the start, as it is on screen (the old view's
   wall mode and cut-mode rules, the camera where it is), and at the end, as the new view will show it (the camera where
   the flight ends). In between nothing is decided per frame: a wall only goes from its rect and height to the new ones —
   up from the floor, down into it, shorter or longer — so nothing pops or blinks on the way. A wall hidden at both ends
   stays hidden. Pieces are built for the span of both rects and cut to the current one by scale, like the cut height;
   at the end the new view's walls are built exactly */
let morph=null;   // {w: id → {rF,rT,cF,cT,hF,hT,exT,kept}, e, opF,opT, lnF,lnT, doors, mats: id → own materials}
// is a wall seen by the camera at c (m) under its cut-mode rule: the camera must be on the room's side of its face
const sideVisible=(side,r,c)=>!side||({'-x':c.x>r[1],'+x':c.x<r[0],'-z':c.z>r[3],'+z':c.z<r[2]})[side];
// a view's walls at rest with the camera at pos: id → {r, cut: the height it shows (0: hidden), h: its height for the doors, kept}.
// A door whose opening is whole stands at the view's height even when its wall is hidden by the cut mode; one that is not
// there goes with its wall (up from the floor or down into it)
function wallsAtRest(id,pos){
  const vw=VIEWS[id],V=VS[id],m=new Map();
  const h=V.Wm==='feet'?0:V.Wm==='row'?H*.1:H*V.Wh/100;
  viewWalls(vw).forEach((c,k)=>{
    const seen=V.Wm!=='auto'||sideVisible(fadeSide(c,vw),fadeWall(c,vw).r.map(v=>v*MM),pos),cut=seen?h:0;
    m.set(k,{r:c.r,cut,h:c.kept.length?h:cut,kept:c.kept});});
  return m;
}
// a wall of the flight at progress e: its rect (mm), the height it shows and the height its doors are cut at (mm)
function morphWall(s,e){return {r:s.rF&&s.rT?s.rF.map((v,i)=>v+(s.rT[i]-v)*e):(s.rF||s.rT),cut:s.cF+(s.cT-s.cF)*e,h:s.hF+(s.hT-s.hF)*e};}
// the walls on screen now: a new flight starts from here, even in the middle of another one
function wallsNow(){
  if(!morph)return wallsAtRest(view,camera.position);
  const m=new Map();
  morph.w.forEach((s,id)=>{const n=morphWall(s,morph.e);m.set(id,{r:n.r,cut:n.cut,h:n.h,kept:s.kept});});
  return m;
}
// the walls of a flight have their own materials (they fade by themselves); they go with the flight
function dropMorph(){
  if(!morph)return;
  morph.mats.forEach(m=>Object.values(m).forEach(x=>x.dispose()));
  morph=null;
}
/* a door in a flight shows as at rest: while its opening is whole in its wall's rect on the way (and whole at one end
   of the flight at least); its height goes with the wall (wallsAtRest: h) */
function doorInFlight(d,at){
  const [id,i]=d.hole.split(':'),s=morph.w.get(id);
  if(!s||!s.kept.includes(+i))return false;
  const c=clipWall(WALLS.find(v=>v.id===id),at(id).r);
  return !!c&&c.kept.includes(+i);
}
// pos: where the camera ends the flight (m)
function startWallMorph(from,toId,pos){
  const to=wallsAtRest(toId,pos),w=new Map(),list=[],V=VS[toId];
  new Set([...from.keys(),...to.keys()]).forEach(id=>{
    const F=from.get(id),T=to.get(id),a=(F||T).r,b=(T||F).r;
    const c=clipWall(WALLS.find(v=>v.id===id),[Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.min(a[2],b[2]),Math.max(a[3],b[3])]);
    if(!c)return;
    // an opening whole in either view keeps its door or window while its wall is there
    const kept=new Set([...(F?F.kept:[]),...(T?T.kept:[])]);c.kept=c.kept.filter(i=>kept.has(i));
    list.push(c);
    w.set(id,{rF:F?F.r:null,rT:T?T.r:null,cF:F?F.cut:0,cT:T?T.cut:0,hF:F?F.h:0,hT:T?T.h:0,exT:!!T,kept:c.kept});
  });
  const doorsF=doorGroup.visible;   // as on screen now
  dropMorph();buildWallSet(list,()=>()=>true,true);
  // every wall of the flight gets its own materials: near the floor it fades away instead of leaving a dark slab,
  // its footprint fades out or in, its outline fades with its height
  const mats=new Map();
  list.forEach(c=>mats.set(c.id,{body:wallShader(wallMat.clone()),line:edgeMat.clone(),foot:(c.h?lowFootMat:footMat).clone()}));
  wallParts.forEach(p=>{const m=mats.get(p.id);if(m&&p.m.material===wallMat)p.m.material=m.body;});
  wallLines.forEach(l=>{l.e.material=mats.get(l.w.id).line;});
  wallFeet.forEach(p=>{p.m.material=mats.get(p.id).foot;});
  // the walls' see-through and their outlines go from how they look now to the new view's mode (in «Контуры» they are see-through)
  const edgesOnly=V.Wm==='edges';
  morph={w,e:0,opF:wallMat.opacity,opT:edgesOnly?0:1,lnF:edgeMat.opacity,lnT:edgeOp(V),
    doors:doorsF&&V.dm!=='none'&&V.Wm!=='feet',mats};   // doors show only if both ends show them
}
// a piece cut to the rect r (mm) along x and z by scale; false when nothing of it is left. flat: a footprint (its z is its local y)
// Works while walls are plain colour: a textured wall (tiles) would stretch, its pieces would have to be rebuilt instead.
function fitBox(m,box,r,flat){
  const x0=Math.max(box[0],r[0]),x1=Math.min(box[1],r[1]),z0=Math.max(box[2],r[2]),z1=Math.min(box[3],r[3]);
  if(x1-x0<.5||z1-z0<.5)return false;
  m.scale.x=(x1-x0)/(box[1]-box[0]);m.scale[flat?'y':'z']=(z1-z0)/(box[3]-box[2]);
  m.position.x=(x0+x1)/2*MM;m.position.z=(z0+z1)/2*MM;return true;
}
/* "cut" mode: a wall hides while the camera is on its side named by the view's fade ('-x': past its -x face, …).
   A room view hides, besides, every wall while the camera is on its side away from the room's floor;
   the plan hides only the walls it names. A wall named with another wall's id has no rule of its own: it hides with that one */
const fadeWall=(w,vw)=>{const n=(vw.fade||{})[w.id];return n&&!/^[+-][xz]$/.test(n)?WALLS.find(v=>v.id===n):w;};
function fadeSide(w,vw){
  const o=fadeWall(w,vw);if(o!==w)return fadeSide(o,vw);
  const named=(vw.fade||{})[w.id];
  if(named||!Array.isArray(vw.rooms))return named;
  const rm=ROOMS.find(r=>r.id===vw.rooms[0]).r,r=w.r;
  return r[3]<=rm[2]?'-z':r[2]>=rm[3]?'+z':r[1]<=rm[0]?'-x':r[0]>=rm[1]?'+x':null;
}
function fadeRule(w,vw){const r=fadeWall(w,vw).r.map(v=>v*MM),side=fadeSide(w,vw);return side?()=>sideVisible(side,r,camera.position):()=>true;}


/* the door: a 10 mm lining through the wall round the opening (two jambs, the head between them), the leaf in it, its room face
   flush with the wall's; hinged at the right jamb (seen from the room), it opens into the room. Casings CW on both faces of the wall
   over the lining's ends (flush with its inner faces), jambs to the head, the head over them (white, as the leaf);
   a white square lever handle on each face. CW, CT, LT: apartment.js */
const leafMat=new THREE.MeshStandardMaterial({color:0xf1efea,roughness:.6});
const doorHandleMat=new THREE.MeshStandardMaterial({color:0xf7f7f5,roughness:.3});   // the door's handles: white
const doorGroup=new THREE.Group();scene.add(doorGroup);
function door(px,pz,size,pos,mat,max){
  const g=new THREE.Group();g.position.set(px*MM,0,pz*MM);
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size.map(v=>v*MM)),mat);m.position.set(...pos.map(v=>v*MM));m.castShadow=m.receiveShadow=true;
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edgeMat));
  g.add(m);doorGroup.add(g);const d={g,h:size[1]*MM,t:0,a:0,max,s:1};doors.push(d);return d;
}
const doorParts=[];          // every door box (leaves, handles, casings) is cut at the wall height like the walls, never squashed;
                             // a part marked whole (userData.whole: its top, m) shows only while the wall reaches it
/* a square lever handle on one face of a leaf, in its holder g (mm, y up from the floor): at(o0,o1,u0,u1) turns a span o out from
   the face and u along the leaf from the handle's axis toward the hinge into the holder's [x0,x1,z0,z1]. A rose 50 × 50 × 10,
   a neck 14 × 14 out to 44, the lever 16 × 16 × 130 toward the hinge, at hy. Every part whole or hidden: top (mm) is the top of
   the whole handle, a wall cut under it hides it */
function leverHandle(g,mat,hy,top,at){
  const blk=(o0,o1,u0,u1,y0,y1)=>{const [x0,x1,z0,z1]=at(o0,o1,u0,u1),m=new THREE.Mesh(new THREE.BoxGeometry((x1-x0)*MM,(y1-y0)*MM,(z1-z0)*MM),mat);
    m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(z0+z1)/2*MM);m.castShadow=true;m.userData.whole=top*MM;g.add(m);return m;};
  blk(0,10,-25,25,hy-25,hy+25);blk(10,44,-7,7,hy-7,hy+7);blk(44,60,-8,122,hy-8,hy+8);
}
const LEAF_T=40;   // the leaf's thickness
// the door is rebuilt when the sizes change; it stays as open as it was
function buildDoors(){
  const keep=doors.map(d=>({t:d.t,a:d.a,last:d.last}));
  emptyGroup(doorGroup,false);doors.length=0;held=null;
  if(arcs){scene.remove(arcs);emptyGroup(arcs);}
  const bw=dB-dA-2*LT-6,bh=A.dH-LT-10,hx=dB-LT-3;   // the leaf in the lining: 3 to either jamb, 5 under the head and over the floor; its hinge
  // the leaf runs from the hinge toward -x; turning it (s = 1) takes its free edge into the room (+z)
  const d=door(hx,0,[bw,bh,LEAF_T],[-bw/2,bh/2+5,-LEAF_T/2],leafMat,1.5);d.hole='door:0';
  // the handles, square: 1000 up, 60 in from the leaf's free edge, one out of each face
  { const ux=60-bw,hy=1000;
    [[0,1],[-LEAF_T,-1]].forEach(([fz,s])=>leverHandle(d.g,doorHandleMat,hy,hy+25,(o0,o1,u0,u1)=>[ux+u0,ux+u1,...(s>0?[fz+o0,fz+o1]:[fz-o1,fz-o0])])); }
  const cs=new THREE.Group();doorGroup.add(cs);d.frame=cs;   // the casings and the lining: a click on them works the door, they hide with it
  const yt=A.dH;
  const plank=(x0,x1,za,zb,ya,yb,role)=>{const m=new THREE.Mesh(new THREE.BoxGeometry((x1-x0)*MM,(yb-ya)*MM,(zb-za)*MM),leafMat);
    m.position.set((x0+x1)/2*MM,(ya+yb)/2*MM,(za+zb)/2*MM);m.castShadow=m.receiveShadow=true;
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edgeMat));m.userData[role]=true;cs.add(m);};
  // the casings: the room face, the other face; their inner edges flush with the lining's faces, so they cover its ends
  const c0=dA+LT,c1=dB-LT,ct=yt-LT;
  [[0,CT],[-A.tD-CT,-A.tD]].forEach(([z0,z1])=>{
    plank(c0-CW,c0,z0,z1,0,ct,'casing');plank(c1,c1+CW,z0,z1,0,ct,'casing');plank(c0-CW,c1+CW,z0,z1,ct,ct+CW,'casing');});
  // the lining: face to face of the wall, its ends under the casings
  plank(dA,dA+LT,-A.tD,0,0,yt-LT,'lining');plank(dB-LT,dB,-A.tD,0,0,yt-LT,'lining');plank(dA,dB,-A.tD,0,yt-LT,yt,'lining');
  // door swing on the floor, drawn the way plans show it: from the leaf shut (toward -x) to it open (into the room)
  { arcs=new THREE.Group();const am=new THREE.LineDashedMaterial({color:0x6b7069,dashSize:.04,gapSize:.03});
    const arc=(cx,cz,r,a0,a1,leaf,hole)=>{const pts=[];for(let i=0;i<=32;i++){const a=a0+(a1-a0)*i/32;pts.push(new THREE.Vector3((cx+r*Math.cos(a))*MM,.006,(cz+r*Math.sin(a))*MM));}
      const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),am);l.computeLineDistances();l.userData.hole=hole;arcs.add(l);
      const e=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(cx*MM,.006,cz*MM),new THREE.Vector3((cx+r*Math.cos(leaf))*MM,.006,(cz+r*Math.sin(leaf))*MM)]),new THREE.LineBasicMaterial({color:0x6b7069}));e.userData.hole=hole;arcs.add(e);};
    arc(hx,0,bw,Math.PI,Math.PI/2,Math.PI/2,'door:0');
    scene.add(arcs); }
  doors.forEach((d,i)=>{if(keep[i])Object.assign(d,keep[i]);});
  doorParts.length=0;
  doors.forEach(d=>{const id=d.hole.split(':')[0];[d.g,d.frame].forEach(g=>{if(g)g.traverse(o=>{o.userData.wall=id;});});});   // a door goes down with its wall
  doorGroup.traverse(m=>{if(!m.isMesh)return;if(typeof m.userData.whole==="number"){doorParts.push({m,whole:m.userData.whole,wall:m.userData.wall});return;}const h=m.geometry.parameters.height,y=m.position.y;doorParts.push({m,h,b:y-h/2,t:y+h/2,wall:m.userData.wall});});
}
buildDoors();

// the sizes changed: everything of the room is built again for the view on screen
modelHooks.push(()=>{
  floor.position.set(CX,-.002,CZ);
  buildRooms();buildDoors();buildWalls(VIEWS[view]);applyTheme();
});


/* theme colours; the wall colour is shared by all views, floor colours by room are a setting of the view */
function applyTheme(){
  scene.background=new THREE.Color(css('--scene-bg'));
  floorMat.color.set(css('--scene-floor'));
  const wc=WALLC[S.wc]||WALLC.linen;wallMat.color.set(wallCol(wc));wallTexU.wallTexOn.value=wc.tex?1:0;
  // the white from the rope's bottom: the wallpaper ends under it, as the photo one does
  wallTexU.wallBandY.value=(A.plH+A.muralH)*MM;wallTexU.wallBandC.value.copy(trimMat.color);
  const e=.002;wallTexU.revMin.value.set((winX-A.winW/2)*MM-e,A.winS*MM-e,A.L*MM-e);wallTexU.revMax.value.set((winX+A.winW/2)*MM+e,A.winT*MM+e,(A.L+A.tW)*MM+e);
  ceilColor.set(wallCol(WALLC.white));
  wallMat.roughness=wc.r;
  const fl=(vs()||{}).floors!==false;
  roomMats.forEach((m,i)=>m.color.set(fl?css(ROOMS[i].col):css('--scene-floor')));
  paintNames();
}

/* every frame: walls are cut at the view's share of the ceiling height (bottom stays on the floor), doors swing;
   in a flight between views every wall follows the flight instead (see morph) */
let wallCut=H*MM, wallFeetMode=false;   // where the walls end now (m) and whether only their footprints show («Следы») — for the dimension lines
const lineGeo=pts=>new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
function wallsSeeThrough(op){const see=op<.999;const m=wallMat;m.opacity=op;if(m.transparent!==see){m.transparent=see;m.depthWrite=!see;m.needsUpdate=true;}}
frameHooks.push((dt,ease)=>{
  const V=vs();
  const row=V.Wm==='row',edgesOnly=V.Wm==='edges',feet=V.Wm==='feet';
  const cutMm=H*(row?10:V.Wh)/100,cut=cutMm*MM;
  let doorCut=()=>cut;   // the height a door is cut at: its wall's
  if(morph){
    const e=morph.e,at=id=>morphWall(morph.w.get(id),e),op=morph.opF+(morph.opT-morph.opF)*e;
    const ln=morph.lnF+(morph.lnT-morph.lnF)*e;
    wallsSeeThrough(op);edgeMat.opacity=ln;
    // the last 150 mm of a wall fade away, its outline from 200 mm; its footprint fades between the views
    const fade=(m,o)=>{m.opacity=o;const see=o<.999;if(m.transparent!==see){m.transparent=see;m.depthWrite=!see;m.needsUpdate=true;}};
    const low=id=>Math.min(1,at(id).cut/150);
    morph.mats.forEach((m,id)=>{const s=morph.w.get(id),n=at(id),fF=s.rF?1:0;
      fade(m.body,op*low(id));m.line.opacity=ln*Math.min(1,n.cut/200);fade(m.foot,fF+((s.exT?1:0)-fF)*e);});
    wallParts.forEach(w=>{
      const n=at(w.id),top=Math.min(w.t,n.cut*MM),fits=fitBox(w.m,w.box,n.r,false)&&top>w.b+.001;
      w.m.visible=fits;w.m.castShadow=op*low(w.id)>.5&&!w.glass&&!w.photo;
      if(fits){w.m.scale.y=(top-w.b)/w.h;w.m.position.y=w.b+(top-w.b)/2;if(w.fit)w.fit(w.m.scale.y);}
    });
    // outlines go with their walls
    wallLines.forEach(l=>{const n=at(l.w.id),c=n.cut>=1&&clipWall(l.w,n.r);l.e.visible=!!c;
      if(c){l.e.geometry.dispose();l.e.geometry=lineGeo(wallOutline(c,Math.min(H,n.cut)));}});
    wallFeet.forEach(f=>{f.m.visible=fitBox(f.m,f.box,at(f.id).r,true);});
    doorCut=id=>morph.w.has(id)?at(id).h*MM:0;
    // a door and its swing show while its opening is whole in its wall on the way
    doors.forEach(d=>{const on=doorInFlight(d,at);d.g.visible=on;if(d.frame)d.frame.visible=on;});
    arcs.children.forEach(l=>{const d=doors.find(x=>x.hole===l.userData.hole);l.visible=!!d&&d.g.visible;});
    doorGroup.visible=arcs.visible=morph.doors;
  }else{
    wallsSeeThrough(edgesOnly?0:1);edgeMat.opacity=edgeOp(V);
    wallParts.forEach(w=>{
      const top=Math.min(w.t,cut),fits=top>w.b+.001;
      w.m.visible=fits&&!feet&&!(edgesOnly&&(w.trim||w.photo))&&(V.Wm==='auto'?w.f():true);
      w.m.castShadow=!edgesOnly&&!w.glass&&!w.photo;
      if(fits){w.m.scale.y=(top-w.b)/w.h;w.m.position.y=w.b+(top-w.b)/2;if(w.fit)w.fit(w.m.scale.y);}
    });
    // wall edges are redrawn only when the cut height changes
    if(cutMm!==linesTop){linesTop=cutMm;wallLines.forEach(l=>{l.e.geometry.dispose();l.e.geometry=lineGeo(wallOutline(l.w,Math.min(H,cutMm)));});}
    wallLines.forEach(l=>l.e.visible=!feet&&(V.Wm==='auto'?l.f():true));
    doorGroup.visible=V.dm!=='none'&&!feet;arcs.visible=V.dm!=='none'&&V.arcs!==false;   // the walk has doors without swings
  }
  doors.forEach(d=>{
    if(held&&held.d===d){d.t=Math.min(d.max,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}
    else d.a+=(d.t-d.a)*ease(.07);
    d.g.rotation.y=d.s*d.a;});
  doorParts.forEach(p=>{if(p.whole){p.m.visible=doorCut(p.wall)>=p.whole-.001;return;}const top=Math.min(p.t,doorCut(p.wall)),fits=top>p.b+.001;p.m.visible=fits;
    if(fits){p.m.scale.y=(top-p.b)/p.h;p.m.position.y=p.b+(top-p.b)/2;}});
  wallCut=Math.min(cut,H*MM);wallFeetMode=feet;
});
