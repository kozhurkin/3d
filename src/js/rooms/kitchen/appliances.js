/* the sink in the first base cabinet, in the middle of it (mm): its rim 400 × 440 on the worktop, 10 thick (4 of them sunk in it);
   its bowl 340 × 380 outside, its corners rounded by 20, walls 1 thick, down to 170 under the worktop's top; a drain 70 across */
const SK={z:300,rw:400,rd:440,w:340,d:380,r:20,wall:1,deep:170,drain:35};

// appliances
const chromeMat=new THREE.MeshStandardMaterial({color:0xc9c9c6,roughness:.2,metalness:.9});
const blackMat=new THREE.MeshStandardMaterial({color:0x1d1e20,roughness:.35});
const burnerMat=new THREE.MeshStandardMaterial({color:0x7a2a24,roughness:.4,emissive:0x2a0705});
const ovenMat=new THREE.MeshStandardMaterial({color:0xb9bcbf,roughness:.3,metalness:.6});
const steelMat=new THREE.MeshStandardMaterial({color:0xa9a7a2,roughness:.38,metalness:.75});
const fridgeSideMat=new THREE.MeshStandardMaterial({color:0x8d8c89,roughness:.45,metalness:.55});
const handleMat=new THREE.MeshStandardMaterial({color:0x5c5d5f,roughness:.35,metalness:.7});
const dishMat=new THREE.MeshStandardMaterial({color:0x9fa3a6,roughness:.4,metalness:.6});
const dishInMat=new THREE.MeshStandardMaterial({color:0x6d7276,roughness:.5,metalness:.5});
const glassMat=new THREE.MeshStandardMaterial({color:0x151617,roughness:.1,metalness:.2});
const linerMat=new THREE.MeshStandardMaterial({color:0xf1f2f0,roughness:.45});   // the fridge inside, its bins
const binMat=new THREE.MeshStandardMaterial({color:0xdfe5e7,roughness:.3});
const shelfMat=new THREE.MeshStandardMaterial({color:0xcfe0e2,roughness:.05,metalness:.1,transparent:true,opacity:.35,depthWrite:false});
const ovenGlassMat=new THREE.MeshStandardMaterial({color:0x111214,roughness:.08,metalness:.3,transparent:true,opacity:.75,depthWrite:false});   // tinted: the cavity shows through
const cavityMat=new THREE.MeshStandardMaterial({color:0x2a2c2f,roughness:.55});   // the oven's enamel

/* a door of an appliance: its holder g turns or slides as a cabinet front does (furniture.js: turnDoor); by its key it keeps
   how open it was through a rebuild; it opens and closes on a click or in the walk, not with the kitchen's fronts (loose).
   A new one starts closed, or open already if it has startOpen */
function applDoor(g,extra,{prev=[]}={}){
  const pd=prev.find(d=>d.key===extra.key),max=extra.max||DMAX,a0=extra.startOpen?max:0;
  const d=Object.assign({g,a:pd?pd.a:a0,t:pd?pd.t:a0,last:pd&&pd.last},extra,{max});turnDoor(d);return d;
}

/* a flat piece in g: the shape sh (its x along the kitchen's x, its y along z; from (x, z)) from y down by depth. The sink and the hob are
   built of them: a piece with a hole, the hole filled by another of the same outline, so nothing lies over anything (it would flicker
   from far); seg: how many points a curve of it gets (a hole and what fills it the same) */
function slab(g,sh,depth,x,y,z,mat,seg=8){
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:seg}),mat);
  m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
const holed=(sh,hole)=>{sh.holes.push(hole);return sh;};

/* appliances stand in the cabinets: sink, hob, dishwasher, oven, cooker hood, fridge (kitchen axes, m).
   Returns the doors of the oven and the fridge */
function buildAppliances(g,opts){
  const c=current,doors=[];
  const box=boxIn(g);
  const ct=P.Ct*MM,xr=c.xr*MM,b1=P.B1*MM,b2=P.B2*MM,b3=P.B3*MM;
  // the sink in the first base cabinet, stainless (the fridge's steelMat), its mixer chrome: the rim round the bowl, the bowl open on
  // top down through the worktop's cut-out, its bottom round the drain (slab: each fills the other's hole)
  { const cx=b1/2,cz=SK.z*MM,yt=ct+.006,yb=ct-SK.deep*MM,m=v=>v*MM,{w,d,r,wall:t}=SK;
    // a rounded rectangle (mm, from the sink's middle; x across, y toward the room) on a shape or a hole
    const rect=(sh,w,d,r)=>{const x=m(w/2),y=m(d/2);r=m(r);sh.moveTo(-x+r,-y);sh.lineTo(x-r,-y);sh.quadraticCurveTo(x,-y,x,-y+r);sh.lineTo(x,y-r);
      sh.quadraticCurveTo(x,y,x-r,y);sh.lineTo(-x+r,y);sh.quadraticCurveTo(-x,y,-x,y-r);sh.lineTo(-x,-y+r);sh.quadraticCurveTo(-x,-y,-x+r,-y);return sh;};
    const drain=p=>p.absarc(0,0,m(SK.drain),0,Math.PI*2,false);
    slab(g,holed(rect(new THREE.Shape(),SK.rw,SK.rd,10),rect(new THREE.Path(),w,d,r)),.01,cx,yt,cz,steelMat).userData.sinkRim=true;   // its hole the bowl's outside
    slab(g,holed(rect(new THREE.Shape(),w,d,r),rect(new THREE.Path(),w-2*t,d-2*t,r-t)),yt-yb,cx,yt,cz,steelMat).userData.sinkBowl=true;   // the bowl's walls
    slab(g,holed(rect(new THREE.Shape(),w-2*t,d-2*t,r-t),drain(new THREE.Path())),.001,cx,yb+.001,cz,steelMat);   // its bottom
    slab(g,drain(new THREE.Shape()),.001,cx,yb+.001,cz,chromeMat);
    mixer(cx,ct,.05); }
  /* the mixer behind the sink, chrome as the bath's shower rack, after its drawing (mm, over the worktop): a foot ring Ø50 × 6, the body
     Ø43 up to 100, on its side a round hub, the lever's block on it (its axis at 57) and the stick Ø9 up to 141; from the body the tube
     Ø24 straight up, bent over by R 40 at the top (360 over the worktop) into an arm straight out toward the room, bent down again by
     R 40 short of a quarter by 8° into the spout, its bottom leaning out: the water out at 259, 210 from the tube's axis, over the
     bowl. Every piece casts a shadow, none takes one */
  function mixer(x,y0,z){
    const add=m=>{m.castShadow=true;m.userData.mixer=true;g.add(m);return m;};
    const cyl=(r,h,px,py,pz,ax)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),chromeMat);c.position.set(px,py,pz);
      if(ax==='x')c.rotation.z=Math.PI/2;else if(ax==='z')c.rotation.x=Math.PI/2;return add(c);};
    const m=v=>v*MM,tr=m(12),R=m(40),yc=y0+m(360-12-40),reach=m(210),tilt=8*Math.PI/180;   // yc: the bends' centres, the arm's axis R over them
    // the spout: from the far bend's end along (sin tilt, −cos tilt) in z–y down to the water's way out (z+reach, 259) — its length
    // and so the far bend's centre zf follow from the bend's height
    const oy=y0+m(259),oz=z+reach,ey=yc+R*Math.sin(tilt),L=(ey-oy)/Math.cos(tilt),zf=oz-L*Math.sin(tilt)-R*Math.cos(tilt);
    // a circle's arc in the y–z plane round (x, yc, zc) from its top: the near one a quarter down toward −z into the tube; the far one
    // toward +z, a quarter less the tilt (turned about its own axis first, so it ends the tilt short of straight down)
    const bend=(zc,s,more)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(R,tr,16,16,Math.PI/2+more),chromeMat);t.rotation.set(0,s*Math.PI/2,-more);
      t.position.set(x,yc,zc);return add(t);};
    // a piece along the spout from a down its axis by len, r across
    const lean=(r,a,len)=>{const c=cyl(r,len,x,ey-(a+len/2)*Math.cos(tilt),zf+R*Math.cos(tilt)+(a+len/2)*Math.sin(tilt));c.rotation.x=-tilt;return c;};
    cyl(m(25),m(6),x,y0+m(3),z);                                          // the foot ring
    cyl(m(21.5),m(94),x,y0+m(53),z);                                      // the body
    cyl(m(18),m(41),x+m(30.5),y0+m(57),z,'x');                            // the lever's hub, out of the body's side
    cyl(m(20),m(22),x+m(61),y0+m(57),z,'x');                              // the lever's block
    cyl(m(4.5),m(71),x+m(63),y0+m(105.5),z);                              // its stick, up to 141
    cyl(tr,yc-y0-m(100),x,(y0+m(100)+yc)/2,z);                            // the tube
    bend(z+R,1,0);                                                        // over into the arm
    cyl(tr,zf-z-R,x,yc+R,(z+R+zf)/2,'z');                                 // the arm
    bend(zf,-1,-tilt);                                                    // down into the spout
    lean(tr,0,L-m(20));                                                   // the spout, leaning out
    lean(m(12.5),L-m(20),m(20));                                          // the aerator at its end, the water out at 259
  }
  // two-zone hob over the oven cabinet
  { const free=P.Hob==='free',along=!!P.HobAlong,hd=free?.145:.15;   // hd: half the hob's short side
    // along the worktop: centred in the cabinet, back edge 20 mm off the wall; across: shifted by the slider
    const hz=free?.315:.32,cx=b1+b2+b3/2+(along?0:P.Hx*MM),zc=along?.02+hd:hz;   // hz: centre of the hob in its own description, zc: where that centre goes
    // the hob is described with burners one behind the other (dx across, z into the room); "along" turns it 90° and moves its centre from z=hz to z=zc
    const at=(dx,z)=>along?[cx+z-hz,zc+dx]:[cx+dx,z];
    const disc=(r,h,dx,y,z,mat,seg)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat);const [x,zz]=at(dx,z);m.position.set(x,y,zz);g.add(m);};
    // where the corners (dx0, z0)–(dx1, z1) of the description are in the kitchen: x0, x1, z0, z1 and the middle (m)
    const rect=(dx0,dx1,z0,z1)=>{const [ax,az]=at(dx0,z0),[bx,bz]=at(dx1,z1),x0=Math.min(ax,bx),x1=Math.max(ax,bx),w0=Math.min(az,bz),w1=Math.max(az,bz);
      return {x0,x1,z0:w0,z1:w1,mx:(x0+x1)/2,mz:(w0+w1)/2};};
    // the glass: a slab from y down by depth with a round hole for each zone [[z, r]] on its middle line, each filled by its burner —
    // the same circle, as deep, its top flush with the glass
    const glass=(dx0,dx1,z0,z1,y,depth,zones)=>{const q=rect(dx0,dx1,z0,z1),put=(sh,mat)=>slab(g,sh,depth,q.mx,y,q.mz,mat,24);
      const circle=(p,[z,r])=>{const [x,zz]=at(0,z);return p.absarc(x-q.mx,zz-q.mz,r,0,Math.PI*2,false);};
      const sh=new THREE.Shape();sh.moveTo(q.x0-q.mx,q.z0-q.mz);sh.lineTo(q.x1-q.mx,q.z0-q.mz);sh.lineTo(q.x1-q.mx,q.z1-q.mz);sh.lineTo(q.x0-q.mx,q.z1-q.mz);sh.lineTo(q.x0-q.mx,q.z0-q.mz);
      zones.forEach(zr=>{holed(sh,circle(new THREE.Path(),zr));put(circle(new THREE.Shape(),zr),burnerMat).userData.burner=true;});
      put(sh,glassMat).userData.hobGlass=true;};
    if(free){   // tabletop two-burner hob standing on the worktop: its body with the glass set into the top, 4 mm proud of it
      const hh=.065,q=rect(-.145,.145,.07,.56),sx=q.x1-q.x0,sz=q.z1-q.z0,i=.005;
      const body=new THREE.Mesh(boxGeo(sx,hh-.008,sz,1,undefined,[-sx/2+i,sx/2-i,-sz/2+i,sz/2-i]),blackMat);   // its top open under the glass
      body.position.set(q.mx,ct+(.008+hh)/2,q.mz);body.castShadow=body.receiveShadow=true;body.userData.hobBody=true;g.add(body);
      glass(-.14,.14,.075,.555,ct+hh+.004,.01,[[.2,.075],[.43,.075]]);   // down into the body, so it closes its top
      [[-.11,.07],[.11,.07],[-.11,.56],[.11,.56]].forEach(([dx,z])=>disc(.008,.008,dx,ct+.004,z,blackMat,10));
      const kz=along?zc+.152:.567;   // knobs always on the front face
      [-.06,.06].forEach(dx=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.015,16),chromeMat);k.rotation.x=Math.PI/2;k.position.set(cx+dx,ct+.035,kz);g.add(k);});
    }else{   // built-in glass hob: 6 mm of glass on the worktop, as the tabletop one's
      glass(-.15,.15,.06,.58,ct+.006,.006,[[.18,.085],[.44,.085]]);
    } }
  // built-in dishwasher behind the middle front
  if(P.Dish!==false){ const x0=b1+.003,x1=b1+b2-.003,yt=c.ytop*MM-.004,zc=c.zfB*MM-(P.TF||16)*MM,zd=zc-.045,pl=(P.Plinth!==false?P.Pl:0)*MM;
    // hollow tub: back, sides, top and bottom walls only, so the inside is visible with the door open
    const w=.05,rr=.045,zb=.03,zo=zd-.06,yb=pl;   // 50 mm walls, inner corners rounded
    const sh=new THREE.Shape();sh.moveTo(x0,0);sh.lineTo(x1,0);sh.lineTo(x1,yt);sh.lineTo(x0,yt);sh.lineTo(x0,0);
    const ix0=x0+w,ix1=x1-w,iy0=yb+w,iy1=yt-w,hole=new THREE.Path();
    hole.moveTo(ix0+rr,iy0);hole.lineTo(ix1-rr,iy0);hole.quadraticCurveTo(ix1,iy0,ix1,iy0+rr);hole.lineTo(ix1,iy1-rr);hole.quadraticCurveTo(ix1,iy1,ix1-rr,iy1);
    hole.lineTo(ix0+rr,iy1);hole.quadraticCurveTo(ix0,iy1,ix0,iy1-rr);hole.lineTo(ix0,iy0+rr);hole.quadraticCurveTo(ix0,iy0,ix0+rr,iy0);
    sh.holes.push(hole);
    const tub=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:zo-zb-w,bevelEnabled:false,curveSegments:10}),dishMat);
    tub.position.z=zb+w;tub.castShadow=tub.receiveShadow=true;g.add(tub);
    box(x0,x1,0,yt,zb,zb+w,dishInMat); }
  // built-in oven under the hob: a dark enamel cavity with a wire rack, the control panel on top, a door that tilts down
  // on its lower front edge (glass, a bar handle)
  { const x0=b1+b2+.003,x1=b1+b2+b3-.003,cx=(x0+x1)/2,yo=c.ovY*MM,zf=c.zfB*MM,yp=yo+.465,zr=zf-.02,zc=zf-.52,w=.03,zt=zf+.004;
    box(x0,x1,yp,yo+.595,zr,zt,ovenMat);                            // control panel
    box(cx-.08,cx+.08,yp+.04,yp+.09,zt,zt+.002,glassMat);            // its display
    [cx-.14,cx+.14].forEach(x=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.018,20),chromeMat);k.rotation.x=Math.PI/2;k.position.set(x,yp+.065,zt+.009);g.add(k);});
    box(x0,x0+w,yo,yp,zc,zr,cavityMat);box(x1-w,x1,yo,yp,zc,zr,cavityMat);                       // cavity: sides,
    box(x0+w,x1-w,yo,yo+w,zc,zr,cavityMat);box(x0+w,x1-w,yp-w,yp,zc,zr,cavityMat);               // bottom, top,
    box(x0+w,x1-w,yo+w,yp-w,zc,zc+w,cavityMat);                                                 // back
    const yr=yo+.19,n=9;   // the rack: wires front to back between two cross wires
    for(let i=0;i<n;i++){const x=x0+w+.02+i*(x1-x0-2*w-.04)/(n-1);box(x-.002,x+.002,yr,yr+.004,zc+w+.01,zr-.02,chromeMat);}
    [zc+w+.01,zr-.024].forEach(z=>box(x0+w,x1-w,yr+.004,yr+.008,z,z+.004,chromeMat));
    const dg=new THREE.Group();dg.position.set(0,yo,zt);g.add(dg);
    const db=boxIn(dg),D=(a,b,y0,y1,z0,z1,m)=>db(a,b,y0-yo,y1-yo,z0-zt,z1-zt,m);
    const wx0=x0+.06,wx1=x1-.06,wy0=yo+.07,wy1=yo+.4,yh=yo+.425;                          // the door: a frame round its window
    D(x0,x1,yo+.002,wy0,zr,zt,ovenMat);D(x0,x1,wy1,yp-.003,zr,zt,ovenMat);D(x0,wx0,wy0,wy1,zr,zt,ovenMat);D(wx1,x1,wy0,wy1,zr,zt,ovenMat);
    D(wx0,wx1,wy0,wy1,zt,zt+.003,ovenGlassMat);                       // its window, tinted
    D(wx0-.01,wx1+.01,wy0-.01,wy1+.01,zr-.003,zr,ovenGlassMat);                      // the inner pane
    D(x0+.08,x1-.08,yh,yh+.02,zt+.022,zt+.036,chromeMat);                        // the handle: a П, its legs at the bar's ends
    [x0+.08,x1-.095].forEach(x=>D(x,x+.015,yh,yh+.02,zt,zt+.022,chromeMat));
    doors.push(applDoor(dg,{key:'oven',axis:'x',s:1,max:Math.PI/2},opts)); }
  // cooker hood under the wall cabinet over the hob
  { const x0=b1+b2,yh=Math.max(c.yW,P.Ct+P.Gh)*MM;
    if(yh>c.yW*MM+.01||true)box(x0+.01,x0+b3-.01,yh-.05,yh,.02,P.Dw*MM+.03,chromeMat); }
  // freestanding fridge in the style of a Haier 3-door: a hollow body (steel outside, white inside, glass shelves), a stainless
  // door on hinges at the right (its handle on the left edge, bins inside it), two pull-out drawers with bins; display, feet
  { const x0=xr+.01,x1=c.xF*MM-.01,fh=P.Fh*MM,fd=P.Fd*MM,lift=.02,bodyD=fd-.06,zf=bodyD+.05,zb=.02,w=.03;
    const yD=lift+fh*.44,yM=lift+(yD-lift)*.6,gap=.006;   // lower drawer 60 %, upper 40 % of the drawer zone
    // a wall of the body: steel, white on the faces listed (BoxGeometry order: +x −x +y −y +z −z)
    const wall=(a,b,y0,y1,z0,z1,white)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(b-a,y1-y0,z1-z0),[0,1,2,3,4,5].map(i=>white.includes(i)?linerMat:fridgeSideMat));
      m.position.set((a+b)/2,(y0+y1)/2,(z0+z1)/2);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
    wall(x0,x0+w,lift,fh,zb,bodyD,[0,4]);wall(x1-w,x1,lift,fh,zb,bodyD,[1,4]);
    wall(x0+w,x1-w,fh-w,fh,zb,bodyD,[3,4]);wall(x0+w,x1-w,lift,lift+w,zb,bodyD,[2,4]);
    wall(x0+w,x1-w,lift+w,fh-w,zb,zb+w,[4]);
    [yM,yD].forEach(y=>box(x0+w,x1-w,y-.02,y+.02,zb+w,bodyD,linerMat));   // between the drawers and the main compartment
    const m0=yD+.02,m1=fh-w;
    [1,2,3].forEach(i=>{const y=m0+(m1-m0)*i/4;box(x0+w,x1-w,y-.003,y+.003,zb+w,bodyD-.075,shelfMat);});
    // the door: turns on its front right edge
    const dg=new THREE.Group();dg.position.set(x1,0,zf);g.add(dg);
    const db=boxIn(dg),D=(a,b,y0,y1,z0,z1,m)=>db(a-x1,b-x1,y0,y1,z0-zf,z1-zf,m),cx=(x0+x1)/2;
    D(x0,x1,yD+gap/2,fh,bodyD,zf,steelMat);
    D(x0-.005,x0,yD+.25,yD+.25+fh*.3,bodyD+.006,bodyD+.044,handleMat);   // vertical edge handle on the left side of the door (no overlap, no flicker)
    D(cx-.028,cx+.028,fh-.42,fh-.22,zf,zf+.002,glassMat);                // display
    D(cx-.03,cx+.03,fh-.085,fh-.075,zf,zf+.002,handleMat);               // logo strip
    D(x0+w,x1-w,yD+.03,fh-.03,bodyD-.004,bodyD,linerMat);                // its inside
    [.12,.42,.72].forEach(f=>{const y=yD+(fh-yD)*f;                       // the bins on it
      D(x0+.045,x1-.045,y,y+.008,bodyD-.065,bodyD-.004,binMat);D(x0+.045,x1-.045,y,y+.07,bodyD-.07,bodyD-.065,binMat);});
    doors.push(applDoor(dg,{key:'fridge',s:1},opts));
    // the drawers: the front, its grip at the top and a bin slide out together
    [['fridge-d1',lift,yM-gap/2,lift+w,yM-.02],['fridge-d2',yM+gap/2,yD-gap/2,yM+.02,yD-.02]].forEach(([key,y0,y1,c0,c1])=>{
      const sg=new THREE.Group();g.add(sg);const s=boxIn(sg),bx0=x0+w+.01,bx1=x1-w-.01,by0=c0+.005,by1=c1-.04,bz0=bodyD-.42,t=.006;
      s(x0,x1,y0,y1,bodyD,zf,steelMat);
      s(x0+.02,x1-.02,y1-.028+gap/2,y1-.006+gap/2,zf,zf+.002,handleMat);
      s(bx0,bx1,by0,by0+t,bz0,bodyD,binMat);s(bx0,bx0+t,by0,by1,bz0,bodyD,binMat);s(bx1-t,bx1,by0,by1,bz0,bodyD,binMat);s(bx0+t,bx1-t,by0,by1,bz0,bz0+t,binMat);
      doors.push(applDoor(sg,{key,axis:'z',s:1,travel:.38},opts));});
    [[x0+.04,bodyD-.03],[x1-.04,bodyD-.03],[x0+.04,.06],[x1-.04,.06]].forEach(([x,z])=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,lift,16),blackMat);f.position.set(x,lift/2,z);g.add(f);}); }
  return doors;
}

