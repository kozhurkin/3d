/* ---------- furniture: what every cabinet set shares ----------
   Decor textures (decors.js), panel geometry with the grain along the panel, materials and their finishes,
   cabinet parts → meshes with fronts on holders that open. Rooms (js/rooms/*.js) call these with their own parts and finishes. */

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

/* texture offset depends on the part itself, not on its index, so adding or removing parts never reshuffles the grain;
   seed = part name + its order among parts with that name: sizes, heights and feet never change the grain pattern.
   One seeder per build */
function partSeeder(){
  const seedCount={};
  return function partSeed(p){let h=2166136261;const n=seedCount[p.name]=(seedCount[p.name]||0)+1;const k=p.name+'|'+n;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h%100000+13;}
}
function boxGeo(sx,sy,sz,seed,axis){
  // grain follows the longest side of each panel, like a real cut from a board
  const g=new THREE.BoxGeometry(sx,sy,sz),uv=g.attributes.uv,r=rng(seed),ox=r(),oy=r();
  const dims=[sx,sy,sz],ax=axis??dims.indexOf(Math.max(sx,sy,sz));   // axis forces the grain direction
  const faces=[[2,1],[2,1],[0,2],[0,2],[0,1],[0,1]]; // which axes a face's u,v run along
  for(let f=0;f<6;f++){
    const [au,av]=faces[f],du=dims[au],dv=dims[av];
    const swap=(au===ax)||(av!==ax&&du>dv);
    for(let i=0;i<4;i++){const j=f*4+i,u=uv.getX(j),v=uv.getY(j);
      if(swap)uv.setXY(j,v*dv/RU+ox,u*du/RV+oy);else uv.setXY(j,u*du/RU+ox,v*dv/RV+oy);}
  }
  return g;
}

/* materials of one cabinet set: panels by group, their end faces (торцы, darkened to read the construction), joint lines */
function makeMats(){
  const mats={
    carcass:new THREE.MeshStandardMaterial({roughness:.72,metalness:0}),
    front:new THREE.MeshStandardMaterial({roughness:.66,metalness:0}),
    top:new THREE.MeshStandardMaterial({roughness:.55,metalness:0}),
    apron:new THREE.MeshStandardMaterial({roughness:.5,metalness:0}),
    back:new THREE.MeshStandardMaterial({color:0xd9d2c4,roughness:.9}),
    edge:new THREE.LineBasicMaterial({color:0x22180f,transparent:true,opacity:.55})
  };
  mats.carcassEnd=new THREE.MeshStandardMaterial({roughness:.72});
  mats.frontEnd=new THREE.MeshStandardMaterial({roughness:.66});
  mats.topEnd=new THREE.MeshStandardMaterial({roughness:.55});
  mats.apronEnd=new THREE.MeshStandardMaterial({roughness:.5});
  mats.backEnd=mats.back;
  return mats;
}
// finish of a part group: wood decor or plain colour; the apron follows the worktop unless set separately
const finOf=(FIN,k)=>k==='apron'&&!FIN.apron?FIN.top:FIN[k];
const finName=f=>f.type==='wood'?DECORS[f.decor].name+(DECORS[f.decor].code?' '+DECORS[f.decor].code:''):f.name;
function applyMaterials(mats,FIN,ec){
  ['carcass','front','top','apron'].forEach(k=>{
    const m=mats[k],f=finOf(FIN,k);
    if(f.type==='uni'){m.map=null;m.color.copy(new THREE.Color(f.color).convertSRGBToLinear());m.roughness=.6;}
    else{const d=DECORS[f.decor];m.map=getTex(f.decor);m.color.setScalar(d.img?(d.gain||PHOTO_GAIN):1);m.roughness=k==='front'?.66:.72;}
    m.needsUpdate=true;
  });
  applyContrast(mats,FIN,ec);
}
// ec: contrast of end faces and joint lines, %; light finishes darken them, dark finishes lighten them softly
function applyContrast(mats,FIN,ec){
  const c=ec/100;
  const lum=k=>{const f=finOf(FIN,k);if(f.type==='wood')return DECORS[f.decor].l/100;const s=new THREE.Color(f.color);return .3*s.r+.59*s.g+.11*s.b;};
  ['carcass','front','top','apron'].forEach(k=>{
    const m=mats[k],e=mats[k+'End'],dark=lum(k)<.42;
    e.map=m.map;e.roughness=m.roughness;e.color.copy(m.color);
    if(dark){e.emissive.setRGB(.13*c,.11*c,.08*c);}
    else{e.color.multiplyScalar(1-.72*c);e.emissive.setRGB(0,0,0);}
    e.needsUpdate=true;
  });
  const darkFronts=lum('front')<.42;
  mats.edge.opacity=.25+.75*c;
  if(darkFronts)mats.edge.color.setRGB(.13+.32*c,.11+.28*c,.09+.22*c);
  else mats.edge.color.setRGB(.13*(1-c),.09*(1-c),.06*(1-c));
}

/* ---------- parts → meshes ---------- */
// cabinet fronts open to DMAX; a door turns on its holder (pivot, side hinge), tilts (hinge B/F: axis x) or slides (S: axis z)
const DMAX=1.45;
function turnDoor(d){if(d.axis==='x')d.g.rotation.x=d.a;else if(d.axis==='z')d.g.position.z=d.a/DMAX*d.travel;else d.g.rotation.y=d.s*d.a;}
const dishDoorMat=new THREE.MeshStandardMaterial({color:0xb4b7ba,roughness:.35,metalness:.65});
const dishPanelMat=new THREE.MeshStandardMaterial({color:0x6d7276,roughness:.5,metalness:.5});
const feetMat=new THREE.MeshStandardMaterial({color:0x1e1e1e,roughness:.6});
const pinMat=new THREE.MeshStandardMaterial({color:0xc8c8c4,metalness:.9,roughness:.3});
/* c: computeParts() of a room; prev: the doors of the previous build (by key they keep how open they were);
   open: how new doors start; edges: joint lines shown. Returns the group (room axes, mm → m) and its doors */
function buildParts(c,mats,{prev=[],open=false,edges=true}={}){
  const model=new THREE.Group(),doors=[],slideHolders={},partSeed=partSeeder(),prevDoors={};
  prev.forEach(d=>prevDoors[d.key]=d);
  const door=(g,extra)=>{const key=extra.key,pd=prevDoors[key];
    const d=Object.assign({g,a:pd?pd.a:0,t:pd?pd.t:(open?DMAX:0),last:pd&&pd.last,max:DMAX},extra);turnDoor(d);doors.push(d);};
  c.parts.forEach(p=>{
    const sx=(p.x1-p.x0)*MM,sy=(p.y1-p.y0)*MM,sz=(p.z1-p.z0)*MM;
    const thin=[sx,sy,sz].indexOf(Math.min(sx,sy,sz));
    const mesh=new THREE.Mesh(boxGeo(sx,sy,sz,partSeed(p),p.mat==='front'&&!/Цоколь/.test(p.name)?1:undefined),[0,0,1,1,2,2].map(a=>a===thin?mats[p.mat]:mats[p.mat+'End']));
    mesh.castShadow=mesh.receiveShadow=true;mesh.userData.part=p;
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),mats.edge);e.userData.edge=true;e.visible=edges;e.raycast=()=>{};mesh.add(e);
    const cx=(p.x0+p.x1)/2*MM,cy=(p.y0+p.y1)/2*MM,cz=(p.z0+p.z1)/2*MM;
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
        const ad=new THREE.Mesh(new THREE.BoxGeometry(dw-.006,dh-.01,.04),dishDoorMat);
        ad.position.set(cx,dh/2-.05,.02);ad.castShadow=true;holder.add(ad);
        const pn=new THREE.Mesh(new THREE.BoxGeometry(dw-.06,dh-.08,.004),dishPanelMat);
        pn.position.set(cx,dh/2-.05,-.002);holder.add(pn); }
      holder.add(mesh);holder.userData.front=true;model.add(holder);
    }else{mesh.position.set(cx,cy,cz);(p.inSlide&&slideHolders[p.inSlide]||model).add(mesh);}
  });
  // adjustable feet (Ø16 mm) under floor-standing cabinets; not part of the panel cut list
  if(c.FL>0)(c.feet||[]).forEach(([x,z])=>{
    // black plastic puck Ø15×5 mm on the floor + M6 steel pin screwed into the panel edge
    const puck=new THREE.Mesh(new THREE.CylinderGeometry(.0075,.0075,.005,20),feetMat);
    puck.position.set(x*MM,.0025,z*MM);puck.castShadow=true;model.add(puck);
    const pin=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,c.FL*MM-.005,12),pinMat);
    pin.position.set(x*MM,.005+(c.FL*MM-.005)/2,z*MM);model.add(pin);});
  return {model,doors};
}
// a built set out of the scene: geometries and the textures not in the decor cache go
function disposeGroup(gr){if(!gr)return;gr.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!Array.isArray(o.material)&&o.material.map&&!Object.values(texCache).includes(o.material.map))o.material.map.dispose();});if(gr.parent)gr.parent.remove(gr);}

/* ---------- finishes in the panel: palette, context menu, long press ---------- */
// the decor and plain-colour swatches inside one room's panel (decors.js renderPalette fills the first match in the whole page)
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
