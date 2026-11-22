/* ---------- furniture: what every cabinet set shares ----------
   Decor textures (decors.js), panel geometry with the grain along the panel, materials and their finishes,
   cabinet parts → meshes with fronts on holders that open. Rooms (js/rooms/<room>/, js/rooms/hall.js) call these with their own parts and finishes. */

/* ---------- wood texture: generic procedural oak (straight grain) or photo decor ---------- */
function rng(seed){return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const TW=512,TH=1024,RU=0.6,RV=1.2; // texture covers 600 × 1200 mm, grain runs along V
function woodTexture(d){
  if(d.gen==='linen'){
    // textile look: fine warp and weft threads with slubs over a dark anthracite base
    const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),r=rng(3);
    g.fillStyle=`hsl(${d.h},${d.s}%,${d.l}%)`;g.fillRect(0,0,S,S);
    for(let pass=0;pass<2;pass++)for(let i=0;i<S;i+=2){
      const a=.015+r()*.045,lite=r()<.5;g.fillStyle=lite?`rgba(220,222,225,${a})`:`rgba(0,0,0,${a})`;
      if(pass)g.fillRect(i,0,1+(r()<.15?1:0),S);else g.fillRect(0,i,S,1+(r()<.15?1:0));
    }
    for(let k=0;k<160;k++){g.fillStyle=`rgba(230,230,232,${.02+r()*.04})`;const v=r()<.5;g.fillRect(r()*S,r()*S,v?1:20+r()*60,v?20+r()*60:1);}
    const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
    tex.repeat.set(RU/0.25,RV/0.25);
    try{const sw=document.getElementById('swLinen');if(sw)sw.style.background=`url(${c.toDataURL()}) center/120px`;}catch(e){}
    return tex;
  }
  if(d.img){
    // real decor photo; mirrored tiling hides seams of a non-seamless sample
    const tex=new THREE.Texture();const im=new Image();
    im.onload=()=>{tex.image=im;tex.needsUpdate=true;};im.src=d.img;
    tex.wrapS=tex.wrapT=d.wrap==='repeat'?THREE.RepeatWrapping:THREE.MirroredRepeatWrapping;tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
    tex.repeat.set(RU*1000/d.imgW,RV*1000/d.imgH);
    return tex;
  }
  const c=document.createElement('canvas');c.width=TW;c.height=TH;const g=c.getContext('2d');
  const r=rng(11);
  let x=0;const strips=[];while(x<TW){let w=110+r()*90;if(TW-x-w<80)w=TW-x;strips.push([x,w]);x+=w;}
  strips.forEach(([x0,w],si)=>{
    const dl=(r()-.5)*9,dh=(r()-.5)*3;
    g.fillStyle=`hsl(${d.h+dh},${d.s}%,${d.l+dl}%)`;g.fillRect(x0,0,w,TH);
    // soft colour bands along the board
    for(let b=0;b<6;b++){const bx=x0+r()*w,bw=6+r()*28;
      g.fillStyle=`hsla(${d.h},${d.s}%,${d.l+(r()<.5?-10:8)}%,${.15+r()*.2})`;g.fillRect(bx,0,bw,TH);}
    // grain lines; wobble period divides TH so the tile repeats seamlessly
    const n=Math.floor(w/2.2);
    for(let i=0;i<n;i++){
      const gx=x0+r()*w,amp=1+r()*5,k=1+Math.floor(r()*3),ph=r()*6.28,dark=r()<.72;
      g.strokeStyle=dark?`rgba(45,26,12,${(.05+r()*.16)*(d.gc||1)})`:`rgba(255,235,200,${.04+r()*.1})`;
      g.lineWidth=.4+r()*1.3;g.beginPath();
      for(let y=0;y<=TH;y+=16){const xx=gx+amp*Math.sin(y/TH*6.2832*k+ph);y?g.lineTo(xx,y):g.moveTo(xx,y);}
      g.stroke();
    }
    // a couple of small pins/knots, kept away from tile edges
    const kn=r()<(d.kn||.3)?1:0;
    for(let q=0;q<kn;q++){const kx=x0+20+r()*(w-40),ky=120+r()*(TH-240),rx=1.5+r()*2.5,ry=rx*(2+r()*2);
      for(let ring=3;ring>=0;ring--){g.fillStyle=`rgba(50,28,12,${.08+(3-ring)*.06})`;g.beginPath();g.ellipse(kx,ky,rx+ring*2.2,ry+ring*4,0,0,6.2832);g.fill();}}
    // board joint
    if(si>0){g.fillStyle='rgba(40,24,12,.18)';g.fillRect(x0,0,1,TH);}
  });
  // fine brushed pores (ST40)
  const img=g.getImageData(0,0,TW,TH),px=img.data,rn=rng(5);
  for(let i=0;i<px.length;i+=4){const v=(rn()-.5)*10;px[i]+=v;px[i+1]+=v;px[i+2]+=v;}
  g.putImageData(img,0,0);
  const tex=new THREE.CanvasTexture(c);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
  return tex;
}
const texCache={};
function getTex(k){return texCache[k]||(texCache[k]=woodTexture(DECORS[k]));}
// a picture drawn by draw(g) on a canvas n × n, repeated rx × ry times over a unit of the geometry's uv; srgb: a colour picture, not bumps
function drawnTex(n,draw,rx,ry=rx,srgb=false){
  const c=document.createElement('canvas');c.width=c.height=n;draw(c.getContext('2d'));
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(t.repeat)t.repeat.set(rx,ry);t.anisotropy=8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;
}

/* texture offset depends on the part itself, not on its index, so adding or removing parts never reshuffles the grain;
   seed = part name + its order among parts with that name: sizes, heights and feet never change the grain pattern.
   One seeder per build */
function partSeeder(){
  const seedCount={};
  return function partSeed(p){let h=2166136261;const n=seedCount[p.name]=(seedCount[p.name]||0)+1;const k=p.name+'|'+n;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h%100000+13;}
}
/* a box sx × sy × sz (m) with its edges and corners rounded by r (m): a box grid of 2k+1 segments a side, k of them in each
   rounding, every vertex pushed out from the inner box (r in from the faces) to r from it — its normal the way it was pushed.
   A picture on a face lies over it evenly, as on a plain box (its roundings at the picture's edges), not squeezed into its one
   flat segment (boxUV) */
function roundBoxGeo(sx,sy,sz,r,k=4){
  const n=2*k+1,g=new THREE.BoxGeometry(sx,sy,sz,n,n,n),pos=g.attributes.position,nor=g.attributes.normal,uv=g.attributes.uv,h=[sx/2,sy/2,sz/2];
  r=Math.min(r,...h)*.999;
  const map=(c,hh)=>{const i=Math.round((c/(2*hh)+.5)*n);return i<=k?-hh+r*i/k:hh-r*(n-i)/k;};   // k steps over each rounding, one over the flat
  const p=new THREE.Vector3(),q=new THREE.Vector3(),d=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){
    p.set(map(pos.getX(i),h[0]),map(pos.getY(i),h[1]),map(pos.getZ(i),h[2]));
    const [u,v]=boxUV(Math.floor(i/((n+1)*(n+1))),[p.x,p.y,p.z],[sx,sy,sz]);uv.setXY(i,u,v);   // n × n segments a face, in BoxGeometry's order
    q.set(Math.max(-h[0]+r,Math.min(h[0]-r,p.x)),Math.max(-h[1]+r,Math.min(h[1]-r,p.y)),Math.max(-h[2]+r,Math.min(h[2]-r,p.z)));
    d.subVectors(p,q);if(d.lengthSq()<1e-12)d.set(nor.getX(i),nor.getY(i),nor.getZ(i));d.normalize();
    p.copy(q).addScaledVector(d,r);pos.setXYZ(i,p.x,p.y,p.z);nor.setXYZ(i,d.x,d.y,d.z);
  }
  pos.needsUpdate=nor.needsUpdate=uv.needsUpdate=true;
  return g;
}
/* hole: [x0, x1, z0, z1] (m, from the box's middle) cut through its top face (a worktop's cut-out for a sink): the box on a 3 × 3
   grid across, its middle lines on the hole's edges, the top's middle cell left out. What fills the hole closes it (the sink's bowl
   in the worktop, the tabletop hob's glass in its body) */
/* u, v (0…1) of the point c on face f (px, nx, py, ny, pz, nz) of a box of sizes s, by where it is on the face, as BoxGeometry has them
   on a plain box; and the axes u and v run along */
const BOX_UV=[[2,-1,1,-1],[2,1,1,-1],[0,1,2,1],[0,1,2,-1],[0,1,1,-1],[0,-1,1,-1]];   // per face: u's axis and way, v's axis and way
function boxUV(f,c,s){const [au,us,av,vs]=BOX_UV[f];return [.5+us*c[au]/s[au],.5-vs*c[av]/s[av],au,av];}
function boxGeo(sx,sy,sz,seed,axis,hole){
  // grain follows the longest side of each panel, like a real cut from a board
  const g=hole?new THREE.BoxGeometry(sx,sy,sz,3,1,3):new THREE.BoxGeometry(sx,sy,sz),pos=g.attributes.position,uv=g.attributes.uv,r=rng(seed),ox=r(),oy=r();
  const dims=[sx,sy,sz],ax=axis??dims.indexOf(Math.max(sx,sy,sz));   // axis forces the grain direction
  const idx=g.index,face=[];g.groups.forEach(q=>{for(let k=q.start;k<q.start+q.count;k++)face[idx.getX(k)]=q.materialIndex;});
  if(hole){
    const at=(c,s,a,b)=>[-s/2,a,b,s/2][Math.round((c/s+.5)*3)];
    for(let i=0;i<pos.count;i++)pos.setXYZ(i,at(pos.getX(i),sx,hole[0],hole[1]),pos.getY(i),at(pos.getZ(i),sz,hole[2],hole[3]));
    const keep=[],groups=g.groups.map(q=>Object.assign({},q)),mid=(t,c)=>(c(t[0])+c(t[1])+c(t[2]))/3;g.clearGroups();
    groups.forEach(q=>{const s=keep.length;
      for(let k=q.start;k<q.start+q.count;k+=3){const t=[idx.getX(k),idx.getX(k+1),idx.getX(k+2)];
        if(q.materialIndex===2){const x=mid(t,i=>pos.getX(i)),z=mid(t,i=>pos.getZ(i));if(x>hole[0]&&x<hole[1]&&z>hole[2]&&z<hole[3])continue;}
        keep.push(...t);}
      g.addGroup(s,keep.length-s,q.materialIndex);});
    g.setIndex(keep);
  }
  // u, v by where the vertex is on its face (boxUV), in decor repeats
  for(let j=0;j<pos.count;j++){
    const [u,v,au,av]=boxUV(face[j],[pos.getX(j),pos.getY(j),pos.getZ(j)],dims),du=dims[au],dv=dims[av];
    const swap=(au===ax)||(av!==ax&&du>dv);
    if(swap)uv.setXY(j,v*dv/RU+ox,u*du/RV+oy);else uv.setXY(j,u*du/RU+ox,v*dv/RV+oy);
  }
  return g;
}

/* materials of one cabinet set: panels by group, their end faces (торцы, set off to read the construction) and joint lines: applyContrast */
function makeMats(){
  const mats={
    carcass:new THREE.MeshStandardMaterial({roughness:.72,metalness:0}),
    front:new THREE.MeshStandardMaterial({roughness:.66,metalness:0}),
    top:new THREE.MeshStandardMaterial({roughness:.55,metalness:0}),
    apron:new THREE.MeshStandardMaterial({roughness:.5,metalness:0}),
    back:new THREE.MeshStandardMaterial({color:0xd9d2c4,roughness:.9})
  };
  EC_GROUPS.forEach(k=>mats[k+'Line']=new THREE.LineBasicMaterial({color:0x22180f,transparent:true,opacity:.55}));
  mats.carcassEnd=new THREE.MeshStandardMaterial({roughness:.72});
  mats.frontEnd=new THREE.MeshStandardMaterial({roughness:.66});
  mats.topEnd=new THREE.MeshStandardMaterial({roughness:.55});
  mats.apronEnd=new THREE.MeshStandardMaterial({roughness:.5});
  mats.backEnd=mats.back;
  // the room's own steel and plastic too: every material of a room is cut by the room's own planes (furnClip)
  mats.dishDoor=new THREE.MeshStandardMaterial({color:0xb4b7ba,roughness:.35,metalness:.65});
  mats.dishPanel=new THREE.MeshStandardMaterial({color:0x6d7276,roughness:.5,metalness:.5});
  mats.feet=new THREE.MeshStandardMaterial({color:0x1e1e1e,roughness:.6});
  mats.pin=new THREE.MeshStandardMaterial({color:0xc8c8c4,metalness:.9,roughness:.3});
  return mats;
}
// finish of a part group: wood decor or plain colour; the apron follows the worktop unless set separately
const finOf=(FIN,k)=>k==='apron'&&!FIN.apron?FIN.top:FIN[k];
const finName=f=>f.type==='wood'?DECORS[f.decor].name+(DECORS[f.decor].code?' '+DECORS[f.decor].code:''):f.name;
// a room without a worktop (the bathroom) has only carcass and front finishes: the other groups are left alone
function applyMaterials(mats,FIN,ec){
  ['carcass','front','top','apron'].forEach(k=>{
    const m=mats[k],f=finOf(FIN,k);if(!f)return;
    if(f.type==='uni'){m.map=null;m.color.copy(new THREE.Color(f.color).convertSRGBToLinear());m.roughness=.6;}
    else{const d=DECORS[f.decor];m.map=getTex(f.decor);m.color.setScalar(d.img?(d.gain||PHOTO_GAIN):1);m.roughness=k==='front'?.66:.72;}
    m.needsUpdate=true;
  });
  applyContrast(mats,FIN,ec);
}
/* ec: contrast of end faces and joint lines, %: a step in lightness (CIE L*) on the screen, so it reads alike on any finish: the finish lit
   by EC_LIT (the light as made: the sky's .75 on an upright face ≈ .56, the sun's at a slant) through the renderer's tone curve, which
   squeezes the light finishes and the darkest. Darker than the finish, lighter on a dark one (L* < EC_DARK). End faces EC_END·c;
   joint lines EC_LINE0 + EC_LINE·c (at 0 too the outlines show), unlit, EC_OP see-through */
const EC_END=20,EC_LINE0=5,EC_LINE=17,EC_LIT=1,EC_OP=.5,EC_DARK=44,EC_GROUPS=['carcass','front','top','apron','back'];
const lstar=y=>y>.008856?116*Math.cbrt(y)-16:903.3*y, lumOf=l=>l>8?Math.pow((l+16)/116,3):l/903.3;   // L* ↔ relative luminance
const colorLum=s=>.2126*s.r+.7152*s.g+.0722*s.b;   // of a linear colour
// the renderer's tone curve (three.js's ACES fit; its colour matrices keep a grey, so on the luminance) and its inverse (a quadratic's root)
const aces=x=>(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081);
const acesInv=v=>{const a=1-.983729*v,b=.0245786-.432951*v,c=-(.000090537+.238081*v);return (-b+Math.sqrt(b*b-4*a*c))/(2*a);};
// luminance y lit by lit ↔ its luminance on the screen; linear ↔ sRGB (the screen blends see-through colours in sRGB)
const toScreen=(y,lit)=>aces(y*lit*renderer.toneMappingExposure/.6), fromScreen=(v,lit)=>acesInv(Math.min(.999,v))/(lit*renderer.toneMappingExposure/.6);
const enc=v=>v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055, dec=v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
// luminance y's on the screen (lit by EC_LIT) and the one d (L*) off it
const screenPair=(y,d)=>{const v=toScreen(y,EC_LIT),l=lstar(v);return [v,lumOf(l<EC_DARK?l+d:Math.max(0,l-d))];};
// an end face's luminance: lit, d off the finish's on the screen
const endStep=(y,d)=>fromScreen(screenPair(y,d)[1],EC_LIT);
// a line's luminance: unlit, over the finish (EC_OP see-through), d off it on the screen
const lineStep=(y,d)=>{const [v,t]=screenPair(y,d);return fromScreen(dec(Math.min(1,Math.max(0,(enc(t)-(1-EC_OP)*enc(v))/EC_OP))),1);};
// a plain colour of luminance y brought to yt: lighter by adding grey (so black too), darker by scaling
const toLum=(col,y,yt)=>yt>y?col.addScalar(yt-y):col.multiplyScalar(y>0?yt/y:0);
/* each group's end faces and joint lines from its own finish: carcass from the carcass, front from the front, top from the top;
   the back (HDF) a plain colour of its own, its end faces its face */
function applyContrast(mats,FIN,ec){
  const c=ec/100;
  // a finish's luminance as the model shows it: its colour; on wood times the decor's (its h, s, l: an hsl colour about the picture's mean)
  const hsl=d=>colorLum(new THREE.Color().setHSL(d.h/360,d.s/100,d.l/100).convertSRGBToLinear());
  EC_GROUPS.forEach(k=>{
    const f=k==='back'?{type:'uni'}:finOf(FIN,k);if(!f)return;
    const m=mats[k],l=mats[k+'Line'],y=colorLum(m.color)*(f.type==='wood'?hsl(DECORS[f.decor]):1);
    if(k!=='back'){
      const e=mats[k+'End'],yt=endStep(y,EC_END*c);
      e.map=m.map;e.roughness=m.roughness;e.color.copy(m.color);
      if(f.type==='uni')toLum(e.color,y,yt);else e.color.multiplyScalar(yt/y);   // wood: its picture scaled
      e.needsUpdate=true;
    }
    // the lines: the finish's colour, on wood a warm brown, brought to the step
    if(f.type==='uni')l.color.copy(m.color);else l.color.setRGB(1,.7,.47).multiplyScalar(y/colorLum(l.color));
    toLum(l.color,y,lineStep(y,EC_LINE0+EC_LINE*c));l.opacity=EC_OP;
  });
}

/* ---------- parts → meshes ---------- */
// a cabinet's parts (mm) and the way to add one to them: add(name, mat, x0, x1, y0, y1, z0, z1, extra) → the part
function partList(){const parts=[];return [parts,(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;}];}
// cabinet fronts open to DMAX; a door turns on its holder (pivot, side hinge), tilts (hinge B/F/U: axis x, s: its way) or slides (S: axis z);
// follow(a), if it has one, moves what goes with it (axis 'none': only that)
const DMAX=1.45;
function turnDoor(d){if(d.axis==='x')d.g.rotation.x=d.s*d.a;else if(d.axis==='z')d.g.position.z=d.a/DMAX*d.travel;else if(d.axis!=='none')d.g.rotation.y=d.s*d.a;if(d.follow)d.follow(d.a);}
/* c: computeParts() of a room; prev: the doors of the previous build (by key they keep how open they were);
   open: how new doors start. Returns the group (room axes, mm → m) and its doors */
function buildParts(c,mats,{prev=[],open=false}={}){
  const model=new THREE.Group(),doors=[],slideHolders={},partSeed=partSeeder(),prevDoors={};
  prev.forEach(d=>prevDoors[d.key]=d);
  const door=(g,extra)=>{const key=extra.key,pd=prevDoors[key];
    const d=Object.assign({g,a:pd?pd.a:0,t:pd?pd.t:(open?DMAX:0),last:pd&&pd.last,max:DMAX},extra);turnDoor(d);doors.push(d);};
  c.parts.forEach(p=>{
    const sx=(p.x1-p.x0)*MM,sy=(p.y1-p.y0)*MM,sz=(p.z1-p.z0)*MM;
    const thin=[sx,sy,sz].indexOf(Math.min(sx,sy,sz)),cx=(p.x0+p.x1)/2*MM,cy=(p.y0+p.y1)/2*MM,cz=(p.z0+p.z1)/2*MM;
    const hole=p.hole&&[p.hole[0]*MM-cx,p.hole[1]*MM-cx,p.hole[2]*MM-cz,p.hole[3]*MM-cz];   // a cut-out through its top (mm, room axes)
    const mesh=new THREE.Mesh(boxGeo(sx,sy,sz,partSeed(p),p.mat==='front'&&!/Цоколь/.test(p.name)?1:undefined,hole),[0,0,1,1,2,2].map(a=>a===thin?mats[p.mat]:mats[p.mat+'End']));
    mesh.castShadow=mesh.receiveShadow=true;mesh.userData.part=p;
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),mats[p.mat+'Line']);e.raycast=()=>{};mesh.add(e);
    if(p.mat==='front'){
      const holder=new THREE.Group(),key=p.name+'|'+doors.length;
      if(p.pivot){
        const hx=p.pivot.x*MM,hz=p.pivot.z*MM;
        holder.position.set(hx,0,hz);mesh.position.set(cx-hx,cy,cz-hz);
        door(holder,{s:p.pivot.s,key});
      }else if(p.hinge==='B'){
        // bottom-hinged front (dishwasher door): tilts forward around its lower edge
        // pivot: lower back edge of the appliance door (40 mm steel door behind the decor front)
        const zp=p.z0*MM-.04,yp=p.y0*MM+.05;holder.position.set(0,yp,zp);mesh.position.set(cx,cy-yp,cz-zp);   // hinge 50 mm above the door bottom
        door(holder,{s:1,axis:'x',key});
      }else if(p.hinge==='F'){
        // tilting flap: turns forward around its lower front edge
        holder.position.set(0,p.y0*MM,p.z1*MM);mesh.position.set(cx,cy-p.y0*MM,cz-p.z1*MM);
        door(holder,{s:1,axis:'x',key});
      }else if(p.hinge==='U'){
        // lift-up front: turns up around its upper front edge
        holder.position.set(0,p.y1*MM,p.z1*MM);mesh.position.set(cx,cy-p.y1*MM,cz-p.z1*MM);
        door(holder,{s:-1,axis:'x',key});
      }else if(p.hinge==='S'){
        // pull-out drawer: the front and the drawer box slide forward together
        mesh.position.set(cx,cy,cz);slideHolders[p.slide]=holder;
        door(holder,{s:1,axis:'z',travel:p.travel*MM,key});
      }else if(p.hinge){
        const hx=(p.hinge==='L'?p.x0:p.x1)*MM;
        holder.position.set(hx,0,p.z1*MM);mesh.position.set(cx-hx,cy,cz-p.z1*MM);
        door(holder,{s:p.hinge==='L'?-1:1,key});
      }else mesh.position.set(cx,cy,cz);
      if(p.hinge==='B'){ const dw=(p.x1-p.x0)*MM,dh=(p.y1-p.y0)*MM;   // appliance door behind the decor front
        const ad=new THREE.Mesh(new THREE.BoxGeometry(dw-.006,dh-.01,.04),mats.dishDoor);
        ad.position.set(cx,dh/2-.05,.02);ad.castShadow=true;holder.add(ad);
        const pn=new THREE.Mesh(new THREE.BoxGeometry(dw-.06,dh-.08,.004),mats.dishPanel);
        pn.position.set(cx,dh/2-.05,-.002);holder.add(pn);ad.userData.door=pn.userData.door=holder.userData.ownDoor=true; }   // «Без фасадов» takes off the front, not the door
      holder.add(mesh);holder.userData.front=true;model.add(holder);
    }else{mesh.position.set(cx,cy,cz);(p.inSlide&&slideHolders[p.inSlide]||model).add(mesh);}
  });
  // adjustable feet (Ø16 mm) under floor-standing cabinets; not part of the panel cut list
  if(c.FL>0)(c.feet||[]).forEach(([x,z])=>{
    // black plastic puck Ø15×5 mm on the floor + M6 steel pin screwed into the panel edge
    const puck=new THREE.Mesh(new THREE.CylinderGeometry(.0075,.0075,.005,20),mats.feet);
    puck.position.set(x*MM,.0025,z*MM);puck.castShadow=true;model.add(puck);
    const pin=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,c.FL*MM-.005,12),mats.pin);
    pin.position.set(x*MM,.005+(c.FL*MM-.005)/2,z*MM);model.add(pin);});
  return {model,doors};
}
/* ---------- dimension lines of a room (room axes, m): a line with ticks and its label, put into the room's group ----------
   (named apart from the plan's label/dim: all modules share one scope) */
const ROOM_LABEL_H=.095;   // m: a room label's height in the scene, less than the plan's: it stands on furniture (engine.js: dimLabel, fitLabels)
const roomDimMat=new THREE.LineBasicMaterial({color:0x2f5d50,depthTest:false,transparent:true});
const roomDimDepthMat=new THREE.LineBasicMaterial({color:0x2f5d50,depthTest:true,transparent:true});
// from a to b (vectors, m), ticks across along tick; seen through everything, or (depth) hidden behind what stands in front
function roomDim(g,a,b,txt,tick,depth=false){
  const t=tick.clone().multiplyScalar(.04);
  const pts=[a,b,a.clone().add(t),a.clone().sub(t),b.clone().add(t),b.clone().sub(t)];
  const l=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),depth?roomDimDepthMat:roomDimMat);l.renderOrder=19;g.add(l);
  const s=dimLabel(txt,ROOM_LABEL_H,depth);s.position.copy(a).add(b).multiplyScalar(.5);g.add(s);
}

/* nothing of a room's furniture shows below the floor, from any side: it rises out of the floor and sinks into it in a flight
   between views (the room's group moves down) — the floor plane alone would not hide it from below or through gaps.
   The top plane cuts it on the plan at the height of the walls (views.js: furnCut). Each room has its own two planes
   (in a flight one room sinks while another stays) and its own materials; its dimension lines are not cut */
function furnClip(){
  const f=new THREE.Plane(new THREE.Vector3(0,1,0),0),t=new THREE.Plane(new THREE.Vector3(0,-1,0),0);
  f.constant=.001;t.constant=100;return [f,t];   // kept: y ≥ −1 mm and y ≤ the top
}
function clipToFloor(g,planes){g.traverse(o=>{if(o.isSprite)return;[].concat(o.material||[]).forEach(m=>{if(m!==roomDimMat&&m!==roomDimDepthMat&&m.clippingPlanes!==planes){m.clippingPlanes=planes;m.clipShadows=true;}});});}
/* what of a room stands on the floor, seen from above: for «Следы» on the plan, where the walls leave only their footprints.
   The parts that start low (below 300 mm: carcasses, fronts, plinths — not the wall cabinets) and the room's own shapes
   (extra: [x0,x1,z0,z1,round] — the fridge, the installation, the toilet), room mm. Drawn light with a dark outline of the
   whole, on one flat mesh in the room's axes; it fades in and out by its opacity. null when nothing stands on the floor */
function furnFoot(c,extra=[]){
  const rs=c.parts.filter(p=>p.y0<300).map(p=>[p.x0,p.x1,p.z0,p.z1]).concat(extra);
  if(!rs.length)return null;
  const M=12,x0=Math.min(...rs.map(r=>r[0]))-M,x1=Math.max(...rs.map(r=>r[1]))+M,z0=Math.min(...rs.map(r=>r[2]))-M,z1=Math.max(...rs.map(r=>r[3]))+M;
  const s=Math.min(.5,2048/Math.max(x1-x0,z1-z0));   // px per mm
  const cv=document.createElement('canvas');cv.width=Math.ceil((x1-x0)*s);cv.height=Math.ceil((z1-z0)*s);
  const g=cv.getContext('2d');
  const shape=r=>{const a=(r[0]-x0)*s,b=(r[2]-z0)*s,w=(r[1]-r[0])*s,h=(r[3]-r[2])*s;g.beginPath();
    if(r[4])g.ellipse(a+w/2,b+h/2,w/2,h/2,0,0,Math.PI*2);else g.rect(a,b,w,h);};
  // every shape stroked wide, then every shape filled over the strokes: only the outline of the whole is left
  g.lineWidth=16*s;g.lineJoin='round';g.strokeStyle='#4a4d50';rs.forEach(r=>{shape(r);g.stroke();});
  g.fillStyle='#f3f1ec';rs.forEach(r=>{shape(r);g.fill();});
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;
  const m=new THREE.Mesh(new THREE.PlaneGeometry((x1-x0)*MM,(z1-z0)*MM),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,opacity:0}));
  m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2*MM,.003,(z0+z1)/2*MM);m.renderOrder=1;m.visible=false;m.raycast=()=>{};
  return m;
}
// a built set out of the scene: geometries and the textures not in the decor cache go
function disposeGroup(gr){if(!gr)return;gr.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!Array.isArray(o.material)&&o.material.map&&!Object.values(texCache).includes(o.material.map))o.material.map.dispose();});if(gr.parent)gr.parent.remove(gr);}

/* ---------- finishes in the panel: palette, context menu, long press ---------- */
// the decor and plain-colour swatches inside one room's panel (every room has its own palette)
function fillPalette(root){
  const esc=t=>String(t).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const w=root.querySelector('[aria-label="Декор"]');
  if(w)w.innerHTML=PALETTE_WOOD.map(d=>'<button data-decor="'+d.k+'" aria-pressed="false"><span class="sw" style="'+esc(d.bg)+'"></span><span>'+d.label+'<br><small>'+d.code+'</small></span></button>').join('');
  const u=root.querySelector('[aria-label="Монотонные декоры"]');
  if(u){const cc=u.querySelector('.cc');
    u.innerHTML=PALETTE_UNI.map(d=>'<button data-uc="'+d.c+'" data-un="'+esc(d.name)+'"><span class="sw" style="background:'+d.c+'"></span><span>'+d.label+'<br><small>'+d.code+'</small></span></button>').join('');
    if(cc)u.appendChild(cc);}
  // photo decors show their photo on the swatch
  root.querySelectorAll('[data-decor]').forEach(b=>{const d=DECORS[b.dataset.decor];if(d&&d.img){const sw=b.querySelector('.sw');sw.style.background=`url(${d.img}) center/cover`;}});
}
// one menu for the whole page: apply a swatch to one part group only; wheres: the groups this room has
const ctx=document.getElementById('ctx');let ctxPick=null;
function openCtx(x,y,pick,wheres){
  ctxPick=pick;ctx.hidden=false;
  ctx.querySelectorAll('[data-where]').forEach(b=>{b.hidden=!wheres.includes(b.dataset.where);});
  const w=ctx.offsetWidth,h=ctx.offsetHeight;
  ctx.style.left=Math.min(x,innerWidth-w-8)+'px';ctx.style.top=Math.min(y,innerHeight-h-8)+'px';
  [...ctx.querySelectorAll('[data-where]')].find(b=>!b.hidden).focus();
}
function closeCtx(){ctx.hidden=true;ctxPick=null;}
ctx.querySelectorAll('[data-where]').forEach(b=>b.addEventListener('click',()=>{const p=ctxPick;closeCtx();if(p)p(b.dataset.where);}));
document.addEventListener('pointerdown',e=>{if(!ctx.hidden&&!ctx.contains(e.target))closeCtx();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCtx();});
document.querySelectorAll('.panel').forEach(p=>p.addEventListener('scroll',closeCtx));
// long press (mouse or touch) opens the same menu; the click that follows is swallowed
function longPress(el,fn){
  let t=null,sx=0,sy=0;
  el.addEventListener('pointerdown',e=>{if(e.button!==0)return;sx=e.clientX;sy=e.clientY;el.dataset.lp='';clearTimeout(t);
    t=setTimeout(()=>{el.dataset.lp='1';fn(sx,sy);},550);});
  const stop=()=>clearTimeout(t);
  el.addEventListener('pointerup',stop);el.addEventListener('pointerleave',stop);el.addEventListener('pointercancel',stop);
  el.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>8)stop();});
  el.addEventListener('click',e=>{if(el.dataset.lp==='1'){e.preventDefault();e.stopImmediatePropagation();el.dataset.lp='';}},true);
}
// a text to the clipboard; where that is not allowed, the text is shown selected for Ctrl+C
function copyText(ta,text,msg,done){
  ta.value=text;
  (navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(()=>{msg.textContent=done;}).catch(()=>{ta.hidden=false;ta.focus();ta.select();msg.textContent='Выделено — нажмите Ctrl+C';});
}
