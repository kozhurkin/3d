/* ---------- «Кухня» view: the kitchen wall with its left wall, the cabinets and the appliances along it ----------
   Kitchen coordinates as in the kitchen tab, mm: x along the kitchen wall from the left wall, y up, z from the wall into the room;
   the kitchen's (0,0) is its origin on the plan. The wall width and the ceiling come from the plan (A.kW, A.H),
   how far the left wall shows is the view's frame (VS.kitchen.L). Own scope: the room modules share names (P, T, computeParts…). */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W and H are the plan's kitchen wall and ceiling
const P={W:2200,H:2600,B1:450,B2:450,B3:600,Fr:600,Fh:2000,Fd:665,Ct:900,Db:600,Pl:100,Dw:350,Gw:550,Gh:650,Ha:400,Da:600,Hx:-150,Nw:1,Ant:true,Dish:true,Apron:true,OvDr:false,Hob:'built',HobAlong:false,Plinth:true,Ec:30,T:16,TF:16,Tt:38};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  // axes: x along the kitchen wall from the left wall, y up, z from the wall into the room
  const parts=[],W=p.W,H=p.H,RB=100,FL=0;
  const add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  const pl=p.Plinth!==false?p.Pl:0, ytop=p.Ct-p.Tt;          // base carcass from the plinth to the underside of the worktop
  const zfB=p.Db-20, zcB=zfB-TF;                              // base fronts sit 20 mm behind the worktop edge
  const base=[{w:p.B1,k:'sink',nm:'под мойку'},{w:p.B2,k:'door',nm:'средний'},{w:p.B3,k:'oven',nm:'под духовку'}];
  let x=0,ovY=0;const runs=[];
  if(p.Dish!==false)base[1]={w:p.B2,k:'dish',nm:'посудомоечная машина'};
  base.forEach((b,i)=>{
    const x0=x,x1=x+b.w;runs.push({x0,x1,k:b.k});x=x1;
    const nm=' — '+b.nm;
    if(b.k==='dish'){   // built-in dishwasher: no carcass, only a front hung on its door
      add('Фасад посудомоечной машины','front',x0+G/2,x1-G/2,pl+G/2,ytop-G/2,zcB,zfB,{hinge:'B'});return;}
    add('Бок нижнего шкафа'+nm,'carcass',x0,x0+T,pl,ytop,0,zcB);
    add('Бок нижнего шкафа'+nm,'carcass',x1-T,x1,pl,ytop,0,zcB);
    add('Дно нижнего шкафа'+nm,'carcass',x0+T,x1-T,pl,pl+T,0,zcB);
    add('Царга передняя'+nm,'carcass',x0+T,x1-T,ytop-T,ytop,zcB-RB,zcB);
    add('Царга задняя'+nm,'carcass',x0+T,x1-T,ytop-RB,ytop,0,T);
    if(b.k==='door')add('Полка нижнего шкафа'+nm,'carcass',x0+T,x1-T,(pl+ytop)/2,(pl+ytop)/2+T,T,zcB-20);
    if(b.k==='oven'){
      const OG=G/2+3;   // oven-to-front gap: the oven is drawn 3 mm in from the cabinet sides, so top/bottom match its side gaps
      if(p.OvDr){   // oven down on the plinth, pull-out drawer between the oven and the worktop
        ovY=pl;const oy1=pl+595;
        add('Полка над духовкой','carcass',x0+T,x1-T,oy1,oy1+T,0,zcB);
        const fy0=oy1+OG,fy1=ytop-G/2;   // overlay front covers the shelf edge
        add('Фасад ящика над духовкой','front',x0+G/2,x1-G/2,fy0,fy1,zcB,zfB,{hinge:'S',slide:'ov',travel:zcB-80});
        const dy0=oy1+T+G/2+8,dh=Math.max(50,fy1-dy0-22),dx0=x0+T+13,dx1=x1-T-13,dz0=40;   // the drawer box stays on top of the shelf
        add('Бок ящика','carcass',dx0,dx0+T,dy0,dy0+dh,dz0,zcB,{inSlide:'ov'});
        add('Бок ящика','carcass',dx1-T,dx1,dy0,dy0+dh,dz0,zcB,{inSlide:'ov'});
        add('Задняя стенка ящика','carcass',dx0+T,dx1-T,dy0,dy0+dh,dz0,dz0+T,{inSlide:'ov'});
        add('Дно ящика','back',dx0,dx1,dy0-4,dy0,dz0,zcB,{inSlide:'ov'});
      }else{        // oven right under the hob, tilting flap below it
        const oy=ytop-595;ovY=oy;
        add('Полка под духовку','carcass',x0+T,x1-T,oy-T,oy,0,zcB);
        add('Фасад откидной под духовкой','front',x0+G/2,x1-G/2,pl+G/2,oy-OG,zcB,zfB,{hinge:'F'});   // overlay front covers the shelf edge
      }
    }else{
      add('Фасад нижнего шкафа','front',x0+G/2,x1-G/2,pl+G/2,ytop-G/2,zcB,zfB,{hinge:i===0?'L':'R'});
    }
  });
  const xr=x, xF=xr+p.Fr;   // end of the base run, end of the fridge niche
  // one continuous plinth; it also covers the dishwasher feet, the dishwasher door opens above it
  if(pl>0)add('Цоколь кухни','front',0,xr,0,pl-G/2,zcB-40-T,zcB-40);
  add('Столешница','top',0,xr,ytop,p.Ct,0,p.Db);
  if(p.Apron)add('Фартук','apron',0,xr,p.Ct,Math.min(p.Ct+p.Gw,H-p.Ha-200),0,6);   // one 6 mm wall panel from the worktop to the wall cabinets
  // wall cabinets over the base run; the one over the hob starts higher and carries the cooker hood
  const zfW=p.Dw, zcW=zfW-TF, yAnt=H-p.Ha, yW=Math.min(p.Ct+p.Gw,yAnt-200);   // the mezzanine line stays fixed even with mezzanines off
  const zfA=p.Da, zcA=zfA-TF;
  runs.forEach((r,i)=>{
    const y0=r.k==='oven'?Math.max(yW,p.Ct+p.Gh):yW, nm=r.k==='oven'?' — над варкой':' — '+(i+1);
    if(yAnt-y0<2*T+60)return;
    add('Бок навесного шкафа'+nm,'carcass',r.x0,r.x0+T,y0,yAnt,0,zcW);
    add('Бок навесного шкафа'+nm,'carcass',r.x1-T,r.x1,y0,yAnt,0,zcW);
    add('Дно навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,y0,y0+T,0,zcW);
    add('Крышка навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,yAnt-T,yAnt,0,zcW);
    const rb=Math.min(80,(yAnt-y0-2*T)/3);
    add('Ребро жёсткости навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,y0+T,y0+T+rb,0,T);
    add('Ребро жёсткости навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,yAnt-T-rb,yAnt-T,0,T);
    const st=(yAnt-y0-T)/(p.Nw+1);
    for(let j=1;j<=p.Nw;j++){const y=y0+j*st;add('Полка навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,y-T/2,y+T/2,T,zcW-10);}
    add('Фасад навесного шкафа','front',r.x0+G/2,r.x1-G/2,y0,yAnt-G/2,zcW,zfW,{hinge:i===0?'L':'R'});
  });
  // mezzanine row up to the ceiling: three equal boxes over the worktop and one over the fridge; bottoms are overlaid
  if(p.Ant!==false&&p.Ha>2*T+40){
    const aw=xr/3,boxes=[[0,aw],[aw,2*aw],[2*aw,xr],[xr,xF]];
    boxes.forEach(([x0,x1],i)=>{
      const nm=' — '+(i<3?(i+1):'над холодильником');
      add('Дно антресоли'+nm,'carcass',x0,x1,yAnt,yAnt+T,0,zcA);
      add('Бок антресоли'+nm,'carcass',x0,x0+T,yAnt+T,H,0,zcA);
      add('Бок антресоли'+nm,'carcass',x1-T,x1,yAnt+T,H,0,zcA);
      add('Крышка антресоли'+nm,'carcass',x0+T,x1-T,H-T,H,0,zcA);
      add('Ребро жёсткости антресоли'+nm,'carcass',x0+T,x1-T,yAnt+T,yAnt+T+Math.min(80,(p.Ha-2*T)/3),0,T);
      add('Фасад антресоли','front',x0+G/2,x1-G/2,yAnt+G/2,H-G/2,zcA,zfA,{hinge:i%2?'R':'L'});
    });
  }
  const feet=[];
  return {parts,FL,feet,ovY,xr,xF,ytop,yW,yAnt,zfB,zfW,Hb:p.Ct};
}

const O=()=>ROOMS.find(r=>r.id==='kitchen').origin;   // the kitchen's (0,0) on the plan, mm
function clamp(){
  const hm=Math.max(0,(P.B3-300)/2);P.Hx=Math.max(-hm,Math.min(hm-20,P.Hx));   // the hob (300 mm wide) stays inside its cabinet, 20 mm clear of the right edge (fridge side); not used when it is turned along
  // the run (three bases + fridge niche) has to fit on the wall
  const over=P.B1+P.B2+P.B3+P.Fr-P.W;if(over>0)P.Fr=Math.max(500,P.Fr-over);
}
// sizes that belong to the walls come from the plan; the run of cabinets and the fridge has to fit on the wall
function fromModel(){P.W=A.kW;P.H=A.H;clamp();T=P.T||16;TF=P.TF||16;current=computeParts(P);}
fromModel();

/* ---------- finishes and materials ---------- */
// finish per part group: wood decor or plain colour
const FIN={carcass:{type:'uni',color:'#F1F0EA',name:'Белый премиум W1000 ST9'},front:{type:'uni',color:'#C2B8AA',name:'Серый кашемир U702 ST9'},top:{type:'wood',decor:'C1385'},apron:null};
const mats=makeMats();
applyMaterials(mats,FIN,P.Ec);
// appliances
const chromeMat=new THREE.MeshStandardMaterial({color:0xc9c9c6,roughness:.2,metalness:.9});
const blackMat=new THREE.MeshStandardMaterial({color:0x1d1e20,roughness:.35});
const sinkMat=new THREE.MeshStandardMaterial({color:0x2a2b2d,roughness:.6});
const burnerMat=new THREE.MeshStandardMaterial({color:0x7a2a24,roughness:.4,emissive:0x2a0705});
const ovenMat=new THREE.MeshStandardMaterial({color:0xb9bcbf,roughness:.3,metalness:.6});
const steelMat=new THREE.MeshStandardMaterial({color:0xa9a7a2,roughness:.38,metalness:.75});
const fridgeSideMat=new THREE.MeshStandardMaterial({color:0x8d8c89,roughness:.45,metalness:.55});
const handleMat=new THREE.MeshStandardMaterial({color:0x5c5d5f,roughness:.35,metalness:.7});
const dishMat=new THREE.MeshStandardMaterial({color:0x9fa3a6,roughness:.4,metalness:.6});
const dishInMat=new THREE.MeshStandardMaterial({color:0x6d7276,roughness:.5,metalness:.5});
const glassMat=new THREE.MeshStandardMaterial({color:0x151617,roughness:.1,metalness:.2});

/* appliances stand in the cabinets: sink, hob, dishwasher, oven, cooker hood, fridge (kitchen axes, m) */
function buildAppliances(g){
  const c=current;
  const box=(x0,x1,y0,y1,z0,z1,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
  const ct=P.Ct*MM,xr=c.xr*MM,b1=P.B1*MM,b2=P.B2*MM,b3=P.B3*MM;
  // sink with mixer in the first base cabinet
  { const cx=b1/2,cz=.3;
    box(cx-.2,cx+.2,ct-.004,ct+.006,cz-.22,cz+.22,blackMat);
    box(cx-.17,cx+.17,ct-.17,ct+.0065,cz-.19,cz+.19,sinkMat);
    const tap=new THREE.Mesh(new THREE.CylinderGeometry(.014,.016,.32,16),blackMat);tap.position.set(cx,ct+.16,.06);g.add(tap);
    box(cx-.012,cx+.012,ct+.28,ct+.31,.06,.26,blackMat); }
  // two-zone hob over the oven cabinet
  { const free=P.Hob==='free',along=!!P.HobAlong,hd=free?.145:.15;   // hd: half the hob's short side
    // along the worktop: centred in the cabinet, back edge 20 mm off the wall; across: shifted by the slider
    const hz=free?.315:.32,cx=b1+b2+b3/2+(along?0:P.Hx*MM),zc=along?.02+hd:hz;   // hz: centre of the hob in its own description, zc: where that centre goes
    // the hob is described with burners one behind the other (dx across, z into the room); "along" turns it 90° and moves its centre from z=hz to z=zc
    const at=(dx,z)=>along?[cx+z-hz,zc+dx]:[cx+dx,z];
    const hb=(dx0,dx1,y0,y1,z0,z1,mat)=>along?box(cx+z0-hz,cx+z1-hz,y0,y1,zc+dx0,zc+dx1,mat):box(cx+dx0,cx+dx1,y0,y1,z0,z1,mat);
    const disc=(r,h,dx,y,z,mat,seg)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat);const [x,zz]=at(dx,z);m.position.set(x,y,zz);g.add(m);};
    if(free){   // tabletop two-burner hob standing on the worktop
      const hh=.065;
      hb(-.145,.145,ct+.008,ct+hh,.07,.56,blackMat);
      hb(-.14,.14,ct+hh,ct+hh+.004,.075,.555,glassMat);
      [.2,.43].forEach(z=>disc(.075,.002,0,ct+hh+.005,z,burnerMat,32));
      [[-.11,.07],[.11,.07],[-.11,.56],[.11,.56]].forEach(([dx,z])=>disc(.008,.008,dx,ct+.004,z,blackMat,10));
      const kz=along?zc+.152:.567;   // knobs always on the front face
      [-.06,.06].forEach(dx=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.015,16),chromeMat);k.rotation.x=Math.PI/2;k.position.set(cx+dx,ct+.035,kz);g.add(k);});
    }else{   // built-in glass hob flush in a worktop cut-out
      hb(-.15,.15,ct,ct+.006,.06,.58,blackMat);
      [.18,.44].forEach(z=>disc(.085,.002,0,ct+.007,z,burnerMat,32));
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
  // built-in oven under the hob
  { const x0=b1+b2,yo=c.ovY*MM,zf=c.zfB*MM;
    box(x0+.003,x0+b3-.003,yo,yo+.595,zf-.02,zf+.004,ovenMat);   // standard 595 mm oven fills its niche
    box(x0+.06,x0+b3-.06,yo+.08,yo+.46,zf+.004,zf+.007,glassMat);
    box(x0+.08,x0+b3-.08,yo+.5,yo+.52,zf+.007,zf+.03,chromeMat); }
  // cooker hood under the wall cabinet over the hob
  { const x0=b1+b2,yh=Math.max(c.yW,P.Ct+P.Gh)*MM;
    if(yh>c.yW*MM+.01||true)box(x0+.01,x0+b3-.01,yh-.05,yh,.02,P.Dw*MM+.03,chromeMat); }
  // freestanding fridge in the style of a Haier 3-door: stainless door and two drawers, display, edge handles, feet
  { const x0=xr+.01,x1=c.xF*MM-.01,fh=P.Fh*MM,fd=P.Fd*MM,ft=.03,lift=.02,bodyD=fd-.06;
    box(x0,x1,lift,fh,.02,bodyD,fridgeSideMat);
    const yD=lift+fh*.44,yM=lift+(yD-lift)*.6,gap=.006;   // lower drawer 60 %, upper 40 % of the drawer zone
    box(x0,x1,yD+gap/2,fh,bodyD,bodyD+.05,steelMat);                   // main door
    box(x0,x1,yM+gap/2,yD-gap/2,bodyD,bodyD+.05,steelMat);               // upper drawer
    box(x0,x1,lift,yM-gap/2,bodyD,bodyD+.05,steelMat);                   // lower drawer
    [yD,yM].forEach(y=>box(x0+.02,x1-.02,y-.028,y-.006,bodyD+.05,bodyD+.052,handleMat));   // drawer grips under each gap
    box(x0-.005,x0,yD+.25,yD+.25+fh*.3,bodyD+.006,bodyD+.044,handleMat);   // vertical edge handle on the left side of the door (no overlap, no flicker)
    const cx=(x0+x1)/2;
    box(cx-.028,cx+.028,fh-.42,fh-.22,bodyD+.05,bodyD+.052,glassMat);          // display
    box(cx-.03,cx+.03,fh-.085,fh-.075,bodyD+.05,bodyD+.052,handleMat);        // logo strip
    [[x0+.04,bodyD-.03],[x1-.04,bodyD-.03],[x0+.04,.06],[x1-.04,.06]].forEach(([x,z])=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,lift,16),blackMat);f.position.set(x,lift/2,z);g.add(f);}); }
}

/* ---------- dimension lines of the kitchen (kitchen axes; they belong to the kitchen and move with it) ---------- */
const dim=(a,b,txt,tick)=>roomDim(dimsGroup,a,b,txt,tick);
function buildDims(){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
  const c=current,zf=P.Db+40;let x=0;
  [P.B1,P.B2,P.B3].forEach(w=>{dim(V(x,P.Ct+60,zf),V(x+w,P.Ct+60,zf),`${w}`,Y);x+=w;});
  dim(V(c.xr,P.Fh+60,P.Fd+40),V(c.xF,P.Fh+60,P.Fd+40),`${P.Fr}`,Y);
  dim(V(0,P.H+120,0),V(P.W,P.H+120,0),`${P.W}`,Y);
  dim(V(-60,0,zf),V(-60,P.Ct,zf),`${P.Ct}`,X);
  dim(V(-60,P.Ct,P.Dw+40),V(-60,c.yW,P.Dw+40),`${c.yW-P.Ct}`,X);
  if(P.Ant!==false)dim(V(P.W+80,c.yAnt,P.Dw+40),V(P.W+80,P.H,P.Dw+40),`${P.Ha}`,X);
  dim(V(P.W+80,0,0),V(P.W+80,0,P.Db),`${P.Db}`,Y);
}

/* ---------- the kitchen in the scene: built when it is on screen and something changed ---------- */
let model=null,doors=[],appl=null,dimsGroup=null,foot=null,dirty=true;
const clip=furnClip();   // the kitchen's floor and top planes
function build(){
  T=P.T||16;TF=P.TF||16;current=computeParts(P);
  const prev=doors,V=VS.kitchen;disposeGroup(model);
  ({model,doors}=buildParts(current,mats,{prev,open:V.fronts==='open'}));
  appl=new THREE.Group();buildAppliances(appl);model.add(appl);
  dimsGroup=new THREE.Group();buildDims();model.add(dimsGroup);
  clipToFloor(model,clip);
  // its footprint for «Контуры» on the plan: the base run and the fridge
  foot=furnFoot(current,[[current.xr+10,current.xF-10,20,P.Fd-10]]);if(foot){foot.material.clippingPlanes=[clip[0]];model.add(foot);}
  place();scene.add(model);dirty=false;applyVisibility();updatePanel();
}
// the kitchen where it lies on the plan
function place(){if(!model)return;const [ox,oz]=O();model.position.x=ox*MM;model.position.z=oz*MM;}
// what the kitchen shows wherever it is seen: fronts (the appliances and the dimensions: every frame, below)
function applyVisibility(){
  if(!model)return;const V=VS.kitchen;
  model.children.forEach(o=>{if(o.userData.front)o.visible=V.fronts!=='hidden';});
}
// every frame: built when in the scene (its view, or the plan with «Шкафы») and changed; the fronts swing toward where
// they were sent, or follow a long press
frameHooks.push((dt,ease)=>{
  const on=view==='kitchen',s=presence('kitchen');
  if(dirty&&(on||s>.001))build();
  if(!model)return;
  // in a flight the kitchen sinks into the floor or rises out of it; the floor hides what is below
  model.visible=s>.001;model.position.y=-(1-s)*(P.H*MM+.1);
  // on the plan it is cut at the walls' height (its top plane goes down with it in a flight), in «Контуры» its footprint shows
  const fc=furnCut('kitchen');clip[1].constant=fc.c+model.position.y;
  if(foot){const o=fc.f*s;foot.visible=o>.01;foot.material.opacity=o;foot.position.y=.003-model.position.y;}   // the footprint stays on the floor, fading with the room
  // its dimension lines only in its own view, once it is reached; the appliances go with the walls there (as in the kitchen
  // tab), elsewhere the walls are there
  dimsGroup.visible=on&&VS.kitchen.dims!==false&&!inTransition();
  appl.visible=!on||VS.kitchen.walls!==false;
  if(on&&wallGroup)wallGroup.visible=VS.kitchen.walls!==false;
  if(model.visible)doors.forEach(d=>{
    if(held&&held.d===d){d.t=Math.min(DMAX,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}
    else d.a+=(d.t-d.a)*ease(.09);
    turnDoor(d);});
});

/* camera presets of the kitchen (as in the kitchen tab), moved to where the kitchen lies on the plan */
function setCam(v){
  const base=Math.max(P.H,P.W*1.15)*MM*1.75*Math.max(1,Math.pow(1/(camera.aspect||1),.95));
  const c=current,b1=P.B1*MM,b2=P.B2*MM,b3=P.B3*MM,[ox,oz]=O().map(u=>u*MM);
  const views={persp:[-.55,1.3,base*1.1],front:[0,1.5,base],side:[-1.25,1.45,base*.85],perspR:[.55,1.3,base*1.2],sink:[.25,1.05,base*.4],hob:[-.25,1.15,base*.55],back:[Math.PI+.4,1.3,base*1.18],upper:[.5,1.2,3.5]};
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];
  const at=(x,y,z)=>goalT.set(ox+x,y,oz+z);
  if(v==='sink')at(b1/2,P.Ct*MM,.3);
  else if(v==='hob')at(b1+b2+b3/2+(P.HobAlong?0:P.Hx*MM),(P.Ct+Math.max(c.yW,P.Ct+P.Gh))/2*MM,.3);   // between the hob and the cooker hood
  else if(v==='upper')at(P.W/2*MM,c.yAnt*MM-.15,.3);
  else if(v==='persp')at(P.W/2*MM-.25,P.H/2*MM,.45);   // a little left of the wall centre, so the kitchen sits in the middle of the frame
  else at(P.W/2*MM,P.H/2*MM,.45);
  shortWay();
}

/* ---------- panel ---------- */
const panel=document.querySelector('[data-panel="kitchen"]'),kq=s=>panel.querySelector(s);
kq('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
// how far from the kitchen wall the left wall shows: the view's frame, up to the window wall
const frameL=kq('#kFrameL');
const showL=()=>Math.min(VS.kitchen.L,A.kL);
frameL.addEventListener('input',e=>{VS.kitchen.L=+e.target.value;saveView('kitchen');syncKitchen();
  if(view==='kitchen'){buildWalls(VIEWS.kitchen);aimView();}});
// cabinet sizes
const ids=['B1','B2','B3','Hx','Ct','Db','Pl','Fr','Fh','Fd','Dw','Gw','Gh','Ha','Da','Nw'];
const syncIds=()=>ids.forEach(j=>{kq(`[data-p="${j}"]`).value=P[j];});
ids.forEach(id=>kq(`[data-p="${id}"]`).addEventListener('input',e=>{P[id]=+e.target.value;clamp();syncIds();build();}));
// what the kitchen has
function syncThick(){kq('#k-tAnt').checked=P.Ant!==false;kq('#k-tDish').checked=P.Dish!==false;kq('#k-tApron').checked=!!P.Apron;kq('#k-tOvDr').checked=!!P.OvDr;kq('#k-tHobAlong').checked=!!P.HobAlong;kq('#k-fHx').hidden=!!P.HobAlong;syncHob();panel.querySelectorAll('[data-thick]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.thick===(P[x.dataset.for]||16)));}
function syncHob(){panel.querySelectorAll('[data-hob]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.hob===(P.Hob||'built')));}
panel.querySelectorAll('[data-hob]').forEach(b=>b.addEventListener('click',()=>{P.Hob=b.dataset.hob;syncHob();build();}));
kq('#k-tOvDr').addEventListener('change',e=>{P.OvDr=e.target.checked;build();});
kq('#k-tHobAlong').addEventListener('change',e=>{P.HobAlong=e.target.checked;syncThick();build();});
kq('#k-tApron').addEventListener('change',e=>{P.Apron=e.target.checked;build();});
kq('#k-tDish').addEventListener('change',e=>{P.Dish=e.target.checked;build();});
kq('#k-tAnt').addEventListener('change',e=>{P.Ant=e.target.checked;build();});
panel.querySelectorAll('[data-thick]').forEach(b=>b.addEventListener('click',()=>{P[b.dataset.for]=+b.dataset.thick;syncThick();build();}));

// fronts: all open, all closed (or nothing pressed when they differ), or taken off
function syncDoorMode(){
  const V=VS.kitchen;let st=V.fronts;
  if(st!=='hidden'&&doors.length){const n=doors.filter(d=>d.t>=DMAX-.01).length,z=doors.filter(d=>d.t<=.01).length;
    st=n===doors.length?'open':z===doors.length?'closed':'mixed';if(st!=='mixed')V.fronts=st;}
  panel.querySelectorAll('[data-door]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.door===st));
}
panel.querySelectorAll('[data-door]').forEach(b=>b.addEventListener('click',()=>{
  const V=VS.kitchen;V.fronts=b.dataset.door;if(V.fronts!=='hidden')doors.forEach(d=>d.t=V.fronts==='open'?DMAX:0);
  syncDoorMode();applyVisibility();saveView('kitchen');}));
// dimensions, walls with the appliances
const toggles={dims:'#k-tDims',walls:'#k-tWall'};
Object.entries(toggles).forEach(([k,s])=>kq(s).addEventListener('change',e=>{VS.kitchen[k]=e.target.checked;applyVisibility();saveView('kitchen');}));

/* ---------- finishes: a swatch paints the carcass and the fronts; its menu paints one group ---------- */
fillPalette(panel);
const palette=[...panel.querySelectorAll('[data-decor],[data-uc]')];
palette.forEach(b=>{const t=document.createElement('span');t.className='tags';b.appendChild(t);});
const sameFin=(b,f)=>f.type==='wood'?b.dataset.decor===f.decor:(b.dataset.uc||'').toLowerCase()===(f.color||'').toLowerCase();
const WHERE=['carcass','front','top','apron'];
function syncFinish(){
  palette.forEach(b=>{
    const c=sameFin(b,FIN.carcass),f=sameFin(b,FIN.front),t=sameFin(b,FIN.top),a=P.Apron&&sameFin(b,finOf(FIN,'apron'));
    b.setAttribute('aria-pressed',c||f||t||a);
    b.querySelector('.tags').innerHTML=(c?'<b>К</b>':'')+(f?'<b>Ф</b>':'')+(t?'<b>С</b>':'')+(a?'<b>А</b>':'');
  });
  const custom=f=>f.type==='uni'&&!palette.some(b=>sameFin(b,f));
  const cf=custom(FIN.front)?FIN.front:custom(FIN.carcass)?FIN.carcass:null;
  kq('#k-uniColor').value=cf?cf.color:'#C2B8AA';
  kq('#k-ccCard').classList.toggle('on',!!cf);
  kq('#k-ccCode').textContent=cf?cf.color.toUpperCase():'палитра';
  kq('#k-ccTags').innerHTML=(custom(FIN.carcass)?'<b>К</b>':'')+(custom(FIN.front)?'<b>Ф</b>':'')+(custom(FIN.top)?'<b>С</b>':'')+(P.Apron&&custom(finOf(FIN,'apron'))?'<b>А</b>':'');
  kq('#k-finNow').innerHTML=`<span>Корпус</span><span>${finName(FIN.carcass)}</span><span>Фасады</span><span>${finName(FIN.front)}</span><span>Столешница</span><span>${finName(FIN.top)}</span>`+(P.Apron?`<span>Фартук</span><span>${FIN.apron?finName(FIN.apron)+' <button class="lnk" id="k-apronReset">как столешница</button>':'как столешница'}</span>`:'');
  const ar=kq('#k-apronReset');if(ar)ar.addEventListener('click',()=>{FIN.apron=null;applyMaterials(mats,FIN,P.Ec);syncFinish();updatePanel();});
}
function setFinish(f,where){
  // a plain click paints the carcass and fronts; the worktop changes only through the menu
  if(where==='both'){FIN.carcass=Object.assign({},f);FIN.front=Object.assign({},f);}else FIN[where]=Object.assign({},f);
  applyMaterials(mats,FIN,P.Ec);syncFinish();updatePanel();
}
const pickFor=b=>b.dataset.decor?{type:'wood',decor:b.dataset.decor}:{type:'uni',color:b.dataset.uc,name:b.dataset.un};
palette.forEach(b=>{
  b.addEventListener('click',()=>setFinish(pickFor(b),'both'));
  b.title='Клик — весь шкаф. Правая кнопка или долгое нажатие — только корпус, фасады, столешница или фартук';
  b.addEventListener('contextmenu',e=>{e.preventDefault();openCtx(e.clientX,e.clientY,w=>setFinish(pickFor(b),w),WHERE);});
  longPress(b,(x,y)=>openCtx(x,y,w=>setFinish(pickFor(b),w),WHERE));
});
// own colour: the picker paints the whole cabinet, or the group chosen in its menu
let ccWhere='both';
const ccInput=kq('#k-uniColor');
ccInput.addEventListener('click',()=>{if(!ccInput.dataset.keep)ccWhere='both';delete ccInput.dataset.keep;});
kq('#k-ccCard').addEventListener('contextmenu',e=>{e.preventDefault();openCtx(e.clientX,e.clientY,w=>{ccWhere=w;ccInput.dataset.keep='1';ccInput.click();},WHERE);});
ccInput.addEventListener('input',e=>setFinish({type:'uni',color:e.target.value,name:'Свой цвет '+e.target.value.toUpperCase()},ccWhere));
// contrast of the end faces and joint lines
const syncEc=()=>{kq('#k-Ec').value=P.Ec;kq('#k-oEc').textContent=P.Ec+'%';};
kq('#k-Ec').addEventListener('input',e=>{P.Ec=+e.target.value;applyContrast(mats,FIN,P.Ec);syncEc();});

/* ---------- cut list ---------- */
const matName=m=>m==='apron'?'Фартук 6 мм · '+finName(finOf(FIN,'apron')):m==='back'?'ХДФ 4':m==='top'?`Столешница ${P.Tt} мм · `+finName(finOf(FIN,'top')):`ЛДСП ${m==='front'?TF:T} · `+finName(finOf(FIN,m));
function cutList(){
  const map=new Map();
  current.parts.forEach(p=>{
    const d=[p.x1-p.x0,p.y1-p.y0,p.z1-p.z0].map(v=>Math.round(v)).sort((a,b)=>b-a);
    const key=p.name+'|'+d[0]+'|'+d[1];
    if(!map.has(key))map.set(key,{name:p.name,mat:p.mat,L:d[0],B:d[1],t:d[2],n:0});map.get(key).n++;
  });
  return [...map.values()];
}
function updateCut(){
  // group by material so each sheet decor can be ordered separately
  const rows=cutList().sort((a,b)=>matName(a.mat).localeCompare(matName(b.mat)));const area={};
  let last='';
  kq('#k-cut').innerHTML=rows.map(r=>{const mn=matName(r.mat);area[mn]=(area[mn]||0)+r.L*r.B*r.n/1e6;
    const head=mn!==last?`<tr><th colspan="3" class="mh">${mn}</th></tr>`:'';last=mn;
    return head+`<tr><td>${r.name}</td><td class="n">${r.L} × ${r.B}</td><td class="n">${r.n}</td></tr>`;}).join('');
  const total=rows.reduce((s,r)=>s+r.n,0);
  kq('#k-tot').innerHTML=`<span>${total} деталей</span>`+Object.entries(area).map(([k,v])=>`<span>${k}: ${v.toFixed(2)} м²</span>`).join('')+(current.FL>0?`<span>Опоры регулируемые М6, шайба Ø15×5: ${current.feet.length} шт</span>`:'');
  kq('#k-csv').value='Деталь;Материал;Длина;Ширина;Толщина;Кол-во\n'+rows.map(r=>[r.name,matName(r.mat),r.L,r.B,r.t,r.n].join(';')).join('\n');
}
kq('#k-copy').addEventListener('click',()=>{const ta=kq('#k-csv');copyText(ta,ta.value,kq('#k-copied'),'Скопировано');});

/* ---------- settings to start with: in this browser, or as a code for the chat ----------
   the cabinets and their finishes; the wall and the ceiling belong to the plan, the view settings are remembered by themselves */
const KEY='apt-kitchen-v2';
const getState=()=>{const p=Object.assign({},P);delete p.W;delete p.H;return {P:p,FIN:JSON.parse(JSON.stringify(FIN))};};
const FACTORY=JSON.stringify(getState());
function applyState(s){
  if(s.P)Object.assign(P,s.P);
  const okF=f=>f&&(f.type==='uni'||(f.type==='wood'&&DECORS[f.decor]));
  if(s.FIN&&okF(s.FIN.carcass)&&okF(s.FIN.front)){FIN.carcass=s.FIN.carcass;FIN.front=s.FIN.front;if(okF(s.FIN.top))FIN.top=s.FIN.top;FIN.apron=okF(s.FIN.apron)?s.FIN.apron:null;}
  fromModel();applyMaterials(mats,FIN,P.Ec);dirty=true;
}
{ const s=readJSON(KEY);if(s)applyState(s); }
const defMsg=kq('#k-defMsg');
kq('#k-saveDef').addEventListener('click',()=>{try{localStorage.setItem(KEY,JSON.stringify(getState()));defMsg.textContent='Сохранено в этом браузере';}catch(e){defMsg.textContent='Браузер не дал сохранить. Скопируйте код и пришлите в чат';}});
kq('#k-resetDef').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch(e){}applyState(JSON.parse(FACTORY));syncKitchen();defMsg.textContent='Исходные настройки возвращены';});
kq('#k-copyDef').addEventListener('click',()=>copyText(kq('#k-defCode'),JSON.stringify(getState()),defMsg,'Код скопирован'));
// sizes, the wall and the ceiling (from the plan), what the finishes are, what is left between the cabinets
function updatePanel(){
  ids.forEach(id=>{kq(`[data-p-out="${id}"]`).textContent=/^N/.test(id)?P[id]:P[id]+' мм';});
  kq('#k-W').textContent=P.W+' мм';kq('#k-H').textContent=P.H+' мм';
  const fc=finName(finOf(FIN,'carcass')),ff=finName(finOf(FIN,'front'));
  const dn=fc===ff?fc:`корпус — ${fc}; фасады — ${ff}`;
  kq('#kSub').textContent=`стена ${P.W} мм · потолок ${P.H} мм · ${dn}; столешница — ${finName(FIN.top)}`;
  { const t=P.T||16,f=v=>v.toFixed(1).replace('.',',').replace(',0',''),c=current;
    const pl=P.Plinth!==false?P.Pl:0,hb=P.Ct-P.Tt-pl;
    const free=P.W-(P.B1+P.B2+P.B3+P.Fr);
    kq('#k-gapBase').textContent=`Высота корпуса ${hb} мм · фасады ${hb-2} мм`+(free>0?` · справа свободно ${free} мм`:'');
    const hw=c.yAnt-c.yW,st=(hw-t)/(P.Nw+1);
    kq('#k-gapWall').textContent=`Высота навесных ${hw} мм`+(P.Nw?` · между полками ${f(st-t)} мм`:'')+` · вытяжка ${Math.max(c.yW,P.Ct+P.Gh)-P.Ct} мм над столешницей`; }
  updateCut();
}
// the sizes block stays open or closed as it was left
const sizesBox=kq('#k-sizesBox');
sizesBox.addEventListener('toggle',()=>{if(VS.kitchen.sizes!==sizesBox.open){VS.kitchen.sizes=sizesBox.open;saveView('kitchen');}});
function syncKitchen(){
  frameL.max=A.kL;frameL.value=showL();kq('#kFrameLOut').textContent=showL();
  sizesBox.open=VS.kitchen.sizes!==false;
  Object.entries(toggles).forEach(([k,s])=>{kq(s).checked=VS.kitchen[k]!==false;});
  syncIds();syncThick();syncDoorMode();syncFinish();syncEc();updatePanel();applyVisibility();
}

addView('kitchen',{
  rooms:['kitchen'],
  // the kitchen wall whole and the left wall up to L from it, as the kitchen tab showed them
  frame:()=>{const [ox,oz]=O();return [ox-A.bear,ox+A.kW,kZ0,oz+showL()];},
  // as in the kitchen tab: the sun aims at the middle of the wall, shadows cover 6 × 6 m
  sun:()=>{const [ox,oz]=O();return {x:(ox+A.kW/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
  anchor:O,   // the remembered camera moves with the kitchen
  furniture:()=>({model,doors,P,current,appl,dims:dimsGroup,clip,foot}),   // the built kitchen: for clicks on its fronts and the checks
  defaults:{Wm:'auto',Wh:100,L:1350,sizes:true,fronts:'closed',dims:true,walls:true},
  panel,
  home:()=>setCam('persp'),
  sync:syncKitchen,
  onDoors:syncDoorMode
});
// the plan changed the sizes: the wall, the ceiling and the kitchen's place come along. The kitchen is rebuilt (when next in
// the scene) only if its own sizes changed; otherwise it only moves — on the plan a slider moves every room at once
modelHooks.push(()=>{const was=JSON.stringify(P);fromModel();if(JSON.stringify(P)!==was)dirty=true;else place();syncKitchen();});
})();
