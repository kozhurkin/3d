/* ---------- «Кухня» view: the kitchen wall with its left wall, the cabinets and the appliances along it ----------
   Kitchen coordinates as in the kitchen tab, mm: x along the kitchen wall from the left wall, y up, z from the wall into the room;
   the kitchen's (0,0) is its origin on the plan. The wall width and the ceiling come from the plan (A.kW, A.H),
   how far the left wall shows is the view's frame (VS.kitchen.L). Own scope: the room modules share names (P, T, computeParts…). */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W and H are the plan's kitchen wall and ceiling, L and Rx where the window wall and the right wall are (kitchen axes): from the plan too
const P={W:2200,H:2600,B1:450,B2:450,B3:600,Fr:600,Fh:2000,Fd:665,Ct:900,Db:600,Pl:100,Dw:350,Gw:550,Gh:650,Ha:400,Da:600,Hx:-150,Nw:1,Ant:true,AntUp:false,Dish:true,Apron:true,OvDr:false,Hob:'built',HobAlong:false,Plinth:true,Ec:30,T:16,TF:16,Tt:38,L:4750,Rx:3200};
let current=null;
// dining table by the left wall: from the kitchen wall z, along the wall w (its short side, the end against the wall), into the room l, top t thick, h high
const TB={z:1350,w:700,l:1300,t:30,h:750,leg:40,in:50};

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
  // mezzanine row up to the ceiling: three equal boxes over the worktop and one over the fridge; bottoms are overlaid.
  // Their fronts open to the sides in turn, or up (AntUp)
  if(p.Ant!==false&&p.Ha>2*T+40){
    const aw=xr/3,boxes=[[0,aw],[aw,2*aw],[2*aw,xr],[xr,xF]];
    boxes.forEach(([x0,x1],i)=>{
      const nm=' — '+(i<3?(i+1):'над холодильником');
      add('Дно антресоли'+nm,'carcass',x0,x1,yAnt,yAnt+T,0,zcA);
      add('Бок антресоли'+nm,'carcass',x0,x0+T,yAnt+T,H,0,zcA);
      add('Бок антресоли'+nm,'carcass',x1-T,x1,yAnt+T,H,0,zcA);
      add('Крышка антресоли'+nm,'carcass',x0+T,x1-T,H-T,H,0,zcA);
      add('Ребро жёсткости антресоли'+nm,'carcass',x0+T,x1-T,yAnt+T,yAnt+T+Math.min(80,(p.Ha-2*T)/3),0,T);
      add('Фасад антресоли','front',x0+G/2,x1-G/2,yAnt+G/2,H-G/2,zcA,zfA,{hinge:p.AntUp?'U':i%2?'R':'L'});
    });
  }
  const feet=[];
  return {parts,FL,feet,ovY,xr,xF,ytop,yW,yAnt,zfB,zfW,Hb:p.Ct};
}

const O=()=>ROOMS.find(r=>r.id==='kitchen').origin;   // the kitchen's (0,0) on the plan, mm
// the hob (300 mm wide) stays inside its cabinet, 20 mm clear of the right edge (fridge side); not used when it is turned along
function clamp(w){const hm=Math.max(0,(P.B3-300)/2);P.Hx=Math.max(-hm,Math.min(hm-20,w.Hx));}
// sizes that belong to the walls come from the plan; a run longer than the wall is left as it is, the panel says so
function fromModel(w){P.W=A.kW;P.H=A.H;P.L=A.kL;P.Rx=A.hallW-A.kOver+A.kW;clamp(w);T=P.T||16;TF=P.TF||16;current=computeParts(P);
  // the worktop's cut-out for the sink's bowl, under its rim (not in the cut list's parts: they stay as the old kitchen's)
  const top=current.parts.find(q=>q.name==='Столешница'),x=P.B1/2;
  if(top)top.hole=[x-SK.w/2,x+SK.w/2,SK.z-SK.d/2,SK.z+SK.d/2];
  return current;}
/* the sink in the first base cabinet, in the middle of it (mm): its rim 400 × 440 on the worktop, 10 thick (4 of them sunk in it);
   its bowl 340 × 380 outside, its corners rounded by 20, walls 1 thick, down to 170 under the worktop's top; a drain 70 across */
const SK={z:300,rw:400,rd:440,w:340,d:380,r:20,wall:1,deep:170,drain:35};

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
const linerMat=new THREE.MeshStandardMaterial({color:0xf1f2f0,roughness:.45});   // the fridge inside, its bins
const binMat=new THREE.MeshStandardMaterial({color:0xdfe5e7,roughness:.3});
const shelfMat=new THREE.MeshStandardMaterial({color:0xcfe0e2,roughness:.05,metalness:.1,transparent:true,opacity:.35,depthWrite:false});
const ovenGlassMat=new THREE.MeshStandardMaterial({color:0x111214,roughness:.08,metalness:.3,transparent:true,opacity:.75,depthWrite:false});   // tinted: the cavity shows through
const cavityMat=new THREE.MeshStandardMaterial({color:0x2a2c2f,roughness:.55});   // the oven's enamel

/* what the things that are not cabinets are: the card under the «i» that comes up when the cursor rests on one (engine.js) */
const INFO={
  table:()=>({title:'Обеденный стол',lines:[`${TB.l/10} × ${TB.w/10} см, высота ${TB.h/10} см, торцом к левой стене.`,`Столешница ${TB.t} мм — ${finName(FIN.top)}, как у кухни.`,`Четыре стальные ножки ${TB.leg} × ${TB.leg} мм.`]}),
  desk:{title:'Письменный стол HEMNES (IKEA)',lines:['Чёрно-коричневый, массив сосны.','155 × 65 см, высота 74 см, под столом 67 см.','Слева тумба с дверцей и полкой, справа два ящика.']},
  addon:{title:'Надстройка HEMNES для стола (IKEA)',lines:['Чёрно-коричневая, массив сосны.','152 × 25 см, высота 63 см; стол с ней — 137 см.','По краям две секции с ящиком и полками, посередине открытая полка.']},
  macbook:{title:'MacBook Pro 16″ (Apple)',lines:['Серебристый, алюминиевый корпус.','35,57 × 24,81 см, толщина 1,68 см; 2,1 кг.','Экран Liquid Retina XDR 16,2″, 3456 × 2234; крышка открывается до 110°.']},
  vitrine:{title:'Витрина HEMNES с 3 ящиками (IKEA)',lines:['Чёрно-коричневая, массив сосны, закалённое стекло.','90 × 37 см, высота 197 см.','Две стеклянные дверцы, три переставные полки, три ящика.']},
  chair:{title:'Стул BERGMUND (IKEA)',lines:['Чёрный, массив дерева; мягкое сиденье и спинка в чехле из тёмно-серой рогожки.','52 × 52 см, высота 95 см; сиденье 52 × 41 см на высоте 51 см.','Спинка 48 см, сужается кверху до 37 см; угол к сиденью 104°.','Выдвинут от стола; нажатие задвигает его под стол и обратно.']},
  sofa:{title:'Угловой диван Hoff «Слим»',lines:['Механизм «дельфин», угол универсальный (здесь оттоманка справа, у окна).','206 × 153 см, высота 91 см; сиденье на высоте 45 см.','Спальное место 142 × 195 см; в оттоманке ящик для белья 145 × 23 × 61 см.','Велюр, бежево-серый; три приспинные подушки 65 × 46 см, две декоративные 48 × 36 см.']}
};

/* the dining table: a worktop-decor top on four steel legs, its end against the left wall (kitchen axes, m) */
function buildTable(g){
  const box=boxIn(g),x1=TB.l*MM,z0=TB.z*MM,z1=(TB.z+TB.w)*MM,y1=TB.h*MM,y0=(TB.h-TB.t)*MM;
  const sx=x1,sy=y1-y0,sz=z1-z0,thin=1;
  const top=new THREE.Mesh(boxGeo(sx,sy,sz,77),[0,0,1,1,2,2].map(a=>a===thin?mats.top:mats.topEnd));
  top.position.set(x1/2,(y0+y1)/2,(z0+z1)/2);top.castShadow=top.receiveShadow=true;
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(top.geometry),mats.edge);e.raycast=()=>{};top.add(e);g.add(top);
  const l=TB.leg*MM,i=TB.in*MM,legs=[[i,z0+i],[x1-i-l,z0+i],[i,z1-i-l],[x1-i-l,z1-i-l]].map(([x,z])=>box(x,x+l,0,y0,z,z+l,blackMat));
  [top,...legs].forEach(m=>{m.userData.info=INFO.table;m.userData.table=true;});
}

/* four chairs as IKEA BERGMUND, black, its cover dark grey matting, as its drawing: 520 × 520 over the legs on the floor, 950 high. The seat 520 wide,
   510 high at its front, 410 deep in front of the back, upholstered all round (90 thick, the frame under the cover), sloping back
   to 470 at the back; the back 480 high from there to the top, narrowing to 370 at its top, 40 thick, its top corners rounded,
   down behind the seat to its bottom; the back to the seat 104°. Four square legs tapering to the floor, splayed out to its corners.
   Two along each long side of the table, 20 mm clear of its legs, 40 apart; the far ones pulled out at first (the seat's front 80 out
   past the table's edge: they end just short of the display cabinet), the kitchen wall's ones pushed in; a click pushes one in under the table till its seat's front
   is 10 short of the table's middle (the chair across comes as far), and back out. The walker passes through them (walk.js: userData.walkThrough).
   Own axes (mm): x across, y up, z from its back to the seat's front; its front toward the table */
const CH={W:520,D:520,H:950,seat:510,seatBack:470,depth:410,cush:90,angle:104,legT:42,legB:30,backB:500,backTop:370,backT:40,out:80,clear:20,gap:40};
/* the cover: dark grey matting (рогожка), a basket weave of pairs of threads in squares 4 mm across, as a picture and its bumps.
   A tile of 4 × 4 squares (16 mm); per: how many tiles to a unit of the geometry's uv (m: 62.5) */
const chairFabrics={};
// a rounded box's uv in m, as the back's (each face's 0…1 times its sizes), so the weave is as big on its narrow faces (k: as roundBoxGeo's)
function metricUV(geo,s,k=4){const uv=geo.attributes.uv,per=(2*k+2)**2;
  for(let i=0;i<uv.count;i++){const [au,,av]=BOX_UV[Math.floor(i/per)];uv.setXY(i,uv.getX(i)*s[au],uv.getY(i)*s[av]);}
  uv.needsUpdate=true;return geo;}
function chairFabric(per){
  if(chairFabrics[per])return chairFabrics[per];
  const tex=bump=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
    g.fillStyle=bump?'#000':'#3c3d3f';g.fillRect(0,0,64,64);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){const across=(i+j)%2===0,x=i*16,y=j*16;
      for(let k=0;k<2;k++){   // two threads to a square, each lit along its middle
        const [tx,ty,tw,th]=across?[x,y+k*8,16,8]:[x+k*8,y,8,16],gr=across?g.createLinearGradient(0,ty,0,ty+th):g.createLinearGradient(tx,0,tx+tw,0);
        gr.addColorStop(0,bump?'#202020':'#2f3032');gr.addColorStop(.5,bump?'#ffffff':(k?'#55575a':'#4d4f52'));gr.addColorStop(1,bump?'#202020':'#2f3032');
        g.fillStyle=gr;g.fillRect(tx+.5,ty+.5,tw-1,th-1);}}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(t.repeat)t.repeat.set(per,per);t.anisotropy=8;if(!bump)t.encoding=THREE.sRGBEncoding;return t;};
  return chairFabrics[per]=new THREE.MeshStandardMaterial({map:tex(false),bumpMap:tex(true),bumpScale:.0006,roughness:.97});
}
const chairWood=new THREE.MeshStandardMaterial({color:0x1e1c1b,roughness:.5});   // black-stained solid wood
// where they stand (kitchen mm): x of each one's middle, its side (−1 the kitchen wall's, 1 the far one); how far in and out it goes
function chairsAt(){
  const x0=TB.in+TB.leg+CH.clear+CH.W/2,under=TB.w/2-10;
  return {under,travel:under+CH.out,list:[-1,1].flatMap(side=>[x0,x0+CH.W+CH.gap].map(x=>({x,side})))};
}
function buildChairs(g,opts){
  const {W,D,H,seat,seatBack,depth,cush,angle,legT,legB,backB,backTop,backT}=CH,{under,travel,list}=chairsAt();
  // the seat's slope; the back's lean (from upright): the two make the angle between them; the back's front where it meets the seat's top
  const ts=Math.atan2(seat-seatBack,depth),tb=(angle-90)*Math.PI/180-ts,zf=D-depth;
  const yBot=z=>seat-cush/Math.cos(ts)-(D-z)*Math.tan(ts);   // the seat's underside at z
  const yb=yBot(zf),zp=zf+(seatBack-yb)*Math.tan(tb),hb=(H-yb)/Math.cos(tb);   // the back's bottom: down to the seat's underside; its length
  // a tapered square leg from (x0, z0) on the floor up to (x1, z1) under the seat
  const leg=(q,x0,z0,x1,z1)=>{const y=yBot(z1),h=Math.hypot(x1-x0,y,z1-z0),m=new THREE.Mesh(new THREE.CylinderGeometry(legT/Math.SQRT2*MM,legB/Math.SQRT2*MM,h*MM,4),chairWood);
    m.rotation.set(Math.atan2(z1-z0,y),Math.PI/4,-Math.atan2(x1-x0,y),'ZXY');m.position.set((x0+x1)/2*MM,y/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;q.add(m);};
  // the back's outline (m, x across from its middle, y up from its bottom): a trapezoid, its corners rounded (the top ones more),
  // drawn a bevel in, the bevel rounds its edges
  const bv=8,backGeo=(()=>{const sh=new THREE.Shape(),m=v=>v*MM,pts=[[-backB/2+bv,bv,12],[backB/2-bv,bv,12],[backTop/2-bv,hb-bv,45],[-backTop/2+bv,hb-bv,45]];
    pts.forEach(([x,y,r],i)=>{const [ax,ay]=pts[(i+3)%4],[bx,by]=pts[(i+1)%4],to=(px,py)=>{const d=Math.hypot(px-x,py-y);return [x+(px-x)*r/d,y+(py-y)*r/d];};
      const [x1,y1]=to(ax,ay),[x2,y2]=to(bx,by);if(i)sh.lineTo(m(x1),m(y1));else sh.moveTo(m(x1),m(y1));sh.quadraticCurveTo(m(x),m(y),m(x2),m(y2));});
    sh.closePath();return new THREE.ExtrudeGeometry(sh,{depth:(backT-2*bv)*MM,bevelEnabled:true,bevelThickness:bv*MM,bevelSize:bv*MM,bevelSegments:3,curveSegments:8});})();
  return list.map(({x,side},i)=>{
    // the chair where it is pushed in: its front under the table by «under»; across the table it is turned round
    const c=new THREE.Group(),zt=side<0?TB.z+under-D:TB.z+TB.w-under+D;
    c.position.set((x+side*W/2)*MM,0,zt*MM);c.rotation.y=side<0?0:Math.PI;
    Object.assign(c.userData,{chair:true,info:INFO.chair,walkThrough:true});g.add(c);
    const q=new THREE.Group();c.add(q);   // what slides: all of it, so a click anywhere on it moves it
    // the legs: on the floor at the corners of 520 × 520; up under the seat's front corners, the rear ones into the back's bottom
    const f=legB/2,u=legT/2+2,zr=zp-backT/2;
    [[f,u],[W-f,W-u]].forEach(([x0,x1])=>{leg(q,x0,D-f,x1,D-u);leg(q,x0,f,x1,zr);});
    // the seat on its front top edge, sloping back, from under the back to its front
    const st=new THREE.Group();st.position.set(0,seat*MM,D*MM);st.rotation.x=-ts;q.add(st);
    const sm=new THREE.Mesh(metricUV(roundBoxGeo(W*MM,cush*MM,(depth+backT)*MM,25*MM),[W*MM,cush*MM,(depth+backT)*MM]),chairFabric(1000/16));sm.position.set(W/2*MM,-cush/2*MM,-(depth+backT)/2*MM);sm.castShadow=sm.receiveShadow=true;st.add(sm);
    // the back: its front on the seat's back edge, leaning back
    const b=new THREE.Group();b.position.set(W/2*MM,yb*MM,zp*MM);b.rotation.x=-tb;q.add(b);
    const bk=new THREE.Mesh(backGeo,chairFabric(1000/16));bk.position.z=-(backT-bv)*MM;bk.castShadow=bk.receiveShadow=true;b.add(bk);
    // pulled out: away from the table (its own −z); the kitchen wall's ones start pushed in, the far ones pulled out
    return applDoor(q,{key:'chair'+i,axis:'z',travel:-travel*MM,startOpen:side>0},opts);
  });
}

/* the writing desk as IKEA HEMNES 155×65, black-brown, with its add-on unit: 1550 × 650, 740 high, 670 free under its knee rail. A top on two
   pedestals of 50 mm legs: on the left a cabinet with a frame-and-panel door and a shelf, on the right two drawers; inset
   fronts with knobs. Along the left wall of the kitchen, its end 150 mm from the window wall. Its own axes (mm): x along it from
   the window end, y up, z from the wall into the room; turned onto the kitchen's: its x toward the kitchen wall (−z), its z along x */
const DK={W:1550,D:650,H:740,top:30,leg:50,ov:20,ped:420,free:670,gap:150};   // gap: from the window wall
const deskFIN={carcass:{type:'uni',color:'#3b302a',name:'Чёрно-коричневый'},front:{type:'uni',color:'#3b302a',name:'Чёрно-коричневый'},top:{type:'uni',color:'#3b302a',name:'Чёрно-коричневый'},apron:null};
const deskMats=makeMats();applyMaterials(deskMats,deskFIN,0);   // solid wood: the end faces as dark as the rest (no edge-band contrast)
function deskParts(){
  const parts=[],add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  const {W,D,H,top,leg:l,ov,ped,free}=DK,yt=H-top,zF=D-ov,zb=zF-l,t=16,ft=18,fz1=zF-5,fz0=fz1-ft,y0=130,y1=640;
  add('Столешница письменного стола','top',0,W,yt,H,0,D);
  [[ov,ov+ped,'left'],[W-ov-ped,W-ov,'right']].forEach(([a,b,side])=>{
    const nm=side==='left'?' — тумба с дверцей':' — тумба с ящиками',ia=a+l,ib=b-l;
    [a,b-l].forEach(x=>[0,zb].forEach(z=>add('Ножка'+nm,'carcass',x,x+l,0,yt,z,z+l)));
    [a,b-l].forEach(x=>add('Боковина'+nm,'carcass',x+(l-t)/2,x+(l+t)/2,80,yt,l,zb));
    add('Задняя стенка'+nm,'carcass',ia,ib,80,yt,(l-t)/2,(l+t)/2);
    add('Нижняя царга'+nm,'carcass',ia,ib,80,y0,zF-5-20,zF-5);
    add('Верхняя царга'+nm,'carcass',ia,ib,y1,yt,zF-5-20,zF-5);
    add('Дно'+nm,'carcass',ia,ib,y0-t,y0,(l+t)/2,zF-25);
    const fx0=ia+2,fx1=ib-2,cx0=a+(l+t)/2,cx1=b-(l+t)/2;   // fronts between the legs; inside between the sides
    if(side==='left'){
      add('Полка'+nm,'carcass',cx0,cx1,390,390+t,(l+t)/2,fz0-10);
      add('Дверца'+nm,'front',fx0,fx1,y0+2,y1-2,fz0,fz1,{hinge:'L',knobs:[[fx1-40,380]],panel:true});
    }else{
      const ym=440;
      [[y0+2,ym-2,'d1','нижний'],[ym+2,y1-2,'d2','верхний']].forEach(([f0,f1,k,w])=>{
        const n=' — '+w+' ящик';
        add('Фасад ящика'+n,'front',fx0,fx1,f0,f1,fz0,fz1,{hinge:'S',slide:k,travel:450,knobs:[[(fx0+fx1)/2,(f0+f1)/2]]});
        const bx0=cx0+13,bx1=cx1-13,by0=f0+12,by1=f1-40,bz0=fz0-520;
        add('Бок ящика'+n,'carcass',bx0,bx0+12,by0,by1,bz0,fz0,{inSlide:k});
        add('Бок ящика'+n,'carcass',bx1-12,bx1,by0,by1,bz0,fz0,{inSlide:k});
        add('Задняя стенка ящика'+n,'carcass',bx0+12,bx1-12,by0,by1,bz0,bz0+12,{inSlide:k});
        add('Дно ящика'+n,'back',bx0,bx1,by0-4,by0,bz0,fz0,{inSlide:k});
      });
    }
  });
  // between the pedestals: the knee rail in front (free height under it), a rail at the back
  add('Царга передняя','carcass',ov+ped,W-ov-ped,free,yt,zF-20,zF);
  add('Царга задняя','carcass',ov+ped,W-ov-ped,yt-100,yt,0,20);
  addOnParts(add);
  return parts;
}
/* the HEMNES add-on unit on the desk's top, at the wall, in the middle of its length: 1520 × 250, 630 high (the desk with it 1370).
   Two towers at the ends, each with a drawer at the bottom and two shelves; between them an open part with a shelf;
   a rail under the top across the whole front. Desk axes, mm */
const AU={W:1520,D:250,H:630,tower:400};
function addOnParts(add){
  const ox=(DK.W-AU.W)/2,oy=DK.H,{W,D,H,tower:tw}=AU,t=16,zF=D-15,yt=H-20,nm=' надстройки';
  const a=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>add(name+nm,mat,ox+x0,ox+x1,oy+y0,oy+y1,z0,z1,Object.assign({info:INFO.addon},extra));
  a('Столешница','top',0,W,yt,H,0,D);
  const sides=[15,15+tw-t,W-15-tw,W-15-t];   // the outer sides and the towers' inner sides
  sides.forEach(x=>a('Боковина','carcass',x,x+t,0,yt,0,zF));
  a('Задняя стенка','carcass',15+t,W-15-t,0,yt,0,8);
  a('Верхняя царга','carcass',15+t,W-15-t,yt-55,yt,zF-20,zF);
  // the middle: a shelf, a low rail at the front
  a('Полка','carcass',15+tw,W-15-tw,350,350+t,8,zF-20);
  a('Нижняя царга','carcass',15+tw,W-15-tw,0,40,zF-40,zF-20);
  // the towers: a drawer at the bottom, a board over it, two shelves (as in IKEA's picture: not the same in both)
  [[15+t,15+tw-t,'a1','левый',[216,461]],[W-15-tw+t,W-15-t,'a2','правый',[366,435]]].forEach(([x0,x1,k,w,sh])=>{
    const n=' — '+w+' ящик';
    a('Полка над ящиком','carcass',x0,x1,108,108+t,8,zF);
    sh.forEach(y=>a('Полка','carcass',x0,x1,y,y+t,8,zF-20));
    const fx0=x0+2,fx1=x1-2,fz1=zF,fz0=fz1-18;
    a('Фасад ящика'+n,'front',fx0,fx1,4,104,fz0,fz1,{hinge:'S',slide:k,travel:180,knobs:[[ox+(fx0+fx1)/2,oy+54]]});
    const bx0=x0+8,bx1=x1-8,by0=12,by1=84,bz0=20;
    a('Бок ящика'+n,'carcass',bx0,bx0+12,by0,by1,bz0,fz0,{inSlide:k});
    a('Бок ящика'+n,'carcass',bx1-12,bx1,by0,by1,bz0,fz0,{inSlide:k});
    a('Задняя стенка ящика'+n,'carcass',bx0+12,bx1-12,by0,by1,bz0,bz0+12,{inSlide:k});
    a('Дно ящика'+n,'back',bx0,bx1,by0-4,by0,bz0,fz0,{inSlide:k});
  });
}
/* the fronts of the HEMNES pieces, on their doors (they swing and slide with them): knobs [[x,y]…], a frame round a door's
   panel (panel), or a glass door (glass): its front a 4 mm pane in the middle of a frame of the front's thickness. Part mm, m */
const glassPaneMat=new THREE.MeshStandardMaterial({color:0xd6e6e8,roughness:.05,metalness:.1,transparent:true,opacity:.18,depthWrite:false});
function hemnesFronts(doors,mats){
  doors.forEach(dr=>{
    const m=dr.g.children.find(o=>o.userData.part&&o.userData.part.mat==='front'),p=m.userData.part,mp=m.position,hz=(p.z1-p.z0)/2*MM;
    const at=(x,y)=>[x*MM-(p.x0+p.x1)/2*MM+mp.x,y*MM-(p.y0+p.y1)/2*MM+mp.y],b=boxIn(dr.g);
    const frame=(f,z0,z1)=>[[p.x0,p.x1,p.y1-f,p.y1],[p.x0,p.x1,p.y0,p.y0+f],[p.x0,p.x0+f,p.y0+f,p.y1-f],[p.x1-f,p.x1,p.y0+f,p.y1-f]]
      .forEach(([x0,x1,y0,y1])=>{const [a,c]=at(x0,y0),[e,h]=at(x1,y1);b(a,e,c,h,z0,z1,mats.front);});
    (p.knobs||[]).forEach(([x,y])=>{const k=new THREE.Mesh(new THREE.CylinderGeometry(.014,.011,.024,20),handleMat);k.rotation.x=Math.PI/2;
      const [kx,ky]=at(x,y);k.position.set(kx,ky,mp.z+hz+.012);k.castShadow=true;dr.g.add(k);});
    if(p.panel)frame(60,mp.z+hz,mp.z+hz+.004);   // the door's frame round its panel
    if(p.info)dr.g.userData.info=p.info;   // its knobs and frame tell what it is a front of
    if(p.glass){m.material=glassPaneMat;m.scale.z=4/(p.z1-p.z0);m.castShadow=false;m.children.forEach(c=>{c.visible=false;});frame(p.glass,mp.z-hz,mp.z+hz);}
  });
}
// the desk in g: its parts on its own group, turned along the left wall
function buildDesk(g,opts){
  const d=buildParts({parts:deskParts()},deskMats,opts);
  hemnesFronts(d.doors,deskMats);
  d.model.rotation.y=Math.PI/2;d.model.position.set(0,0,(P.L-DK.gap)*MM);d.model.userData.desk=true;d.model.userData.info=INFO.desk;
  g.add(d.model);
  return d.doors.concat(buildMacbook(d.model,opts));
}

/* the laptop on the desk: MacBook Pro 16″, silver — 355.7 × 248.1, 16.8 thick (Apple's sizes): 1.5 feet, a 9.4 body, 0.6 over it for
   its keys, a 5.3 lid. In the middle of the desk's length, in front of the add-on unit, its back 360 from the wall. The lid opens on its
   hinge at the back to 110°, open from the start (a click anywhere on the laptop, «Открыты/Закрыты», the walk); the screen lights up as it opens.
   Its own axes (mm): x along the desk, y up from the desk's top, z from its back toward its front, as the desk's */
const MB={W:355.7,D:248.1,feet:1.5,base:9.4,keys:.6,lid:5.3,at:360,open:110*Math.PI/180};
const mbSilverMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#e3e4e5').convertSRGBToLinear(),roughness:.4,metalness:.15});
/* pictures instead of parts: the body's top face carries the keyboard in its black well, the speakers by its sides, the trackpad;
   the lid's inner face its glass, the display and the notch, and the display's picture lights up (emissiveMap) as the lid opens.
   Nothing lies over a face, so nothing flickers on it or shows through. Drawn once, 4 px to a mm; mbDrawTop and mbDrawLid only
   draw on a canvas (no THREE), so they can be drawn apart, as pictures */
const MB_PX=4;
const MB_KEYS=[[[1.5],...Array(12).fill([1]),[1]],[...Array(13).fill([1]),[1.5]],[[1.5],...Array(12).fill([1]),[1]],
  [[1.75],...Array(11).fill([1]),[1.75]],[[2.25],...Array(10).fill([1]),[2.25]],[[1],[1],[1],[1.25],[5],[1.25],[1],[1],[1,'ud'],[1]]];
// the keys (mm on the top, x from the left, z from the back): 14.5 of 19 mm across, a row of function keys 11 deep, five rows 17 deep
function mbKeys(){
  const u=19,kx=(MB.W-14.5*u+2)/2,kz=14,keys=[];
  MB_KEYS.forEach((r,i)=>{const z0=i?kz+13+(i-1)*u:kz,z1=z0+(i?17:11);let x=kx;
    r.forEach(([w,ud])=>{const x1=x+w*u-2,zm=(z0+z1)/2;
      if(ud)keys.push([x,x1,z0,zm-.5],[x,x1,zm+.5,z1]);else keys.push([x,x1,z0,z1]);   // the arrows up and down: half keys
      x+=w*u;});});
  return {keys,well:[kx-3,MB.W-kx+3,kz-3,kz+13+4*u+17+3],grilles:[[12,36],[MB.W-36,MB.W-12]].map(([a,b])=>[a,b,kz,kz+13+4*u+17]),pad:[(MB.W-160)/2,(MB.W+160)/2,135,235]};
}
// a canvas of w × h mm and a rounded rectangle on it ([x0, x1, y0, y1] mm, r mm; corners [tl, tr, br, bl] rounded or not)
function mbCanvas(c,w,h){
  const k=MB_PX;c.width=Math.round(w*k);c.height=Math.round(h*k);const g=c.getContext('2d');
  const rr=([x0,x1,y0,y1],r,fill,cs=[1,1,1,1])=>{const R=cs.map(o=>o?r*k:0);g.beginPath();g.moveTo(x0*k+R[0],y0*k);
    g.arcTo(x1*k,y0*k,x1*k,y1*k,R[1]);g.arcTo(x1*k,y1*k,x0*k,y1*k,R[2]);g.arcTo(x0*k,y1*k,x0*k,y0*k,R[3]);g.arcTo(x0*k,y0*k,x1*k,y0*k,R[0]);
    g.closePath();g.fillStyle=fill;g.fill();};
  return {g,k,rr};
}
// the body's top: its top at the hinge
function mbDrawTop(c){
  const {g,k,rr}=mbCanvas(c,MB.W,MB.D),t=mbKeys();
  g.fillStyle='#e3e4e5';g.fillRect(0,0,c.width,c.height);
  rr(t.well,2,'#0c0c0d');
  t.keys.forEach(q=>{rr(q,1.2,'#242527');rr([q[0]+.3,q[1]-.3,q[2]+.2,q[3]-.5],1,'#151617');});   // a lighter rim: the key's sides
  g.fillStyle='#9fa1a4';t.grilles.forEach(([x0,x1,z0,z1])=>{for(let z=z0+1;z<z1;z+=1.25)for(let x=x0+1;x<x1;x+=1.25)g.fillRect(x*k,z*k,.5*k,.5*k);});   // the speakers' holes
  rr(t.pad,3,'#c9cacc');rr([t.pad[0]+.4,t.pad[1]-.4,t.pad[2]+.4,t.pad[3]-.4],2.7,'#d9dadc');
}
/* the lid's inner face, W × (D − 2), its top the display's top (the lid's edge away from the hinge): the black glass to 1.5 mm from
   the edge; the display 16.2″ (3456 × 2234) 345.6 × 223.4, its top 7 from the edge; the notch 31 × 6 in the middle of its top.
   glow: the picture the display shows (the emissive map: black but the display) — a wallpaper, the menu bar, the dock — or what
   the lid looks like unlit (the display black glass) */
const MB_SCREEN={w:345.6,h:223.4,top:7};
function mbDrawLid(c,glow){
  const W=MB.W,H=MB.D-2,{w,h,top}=MB_SCREEN,x0=(W-w)/2,x1=x0+w,y1=top+h,{g,k,rr}=mbCanvas(c,W,H);
  g.fillStyle=glow?'#000':'#e3e4e5';g.fillRect(0,0,c.width,c.height);
  if(!glow){rr([1.5,W-1.5,1.5,H-1.5],6,'#0c0c0d');rr([x0,x1,top,y1],3,'#050506');}
  else{
    const gr=g.createLinearGradient(x0*k,top*k,x1*k,y1*k);gr.addColorStop(0,'#1d2a6e');gr.addColorStop(.5,'#6a3fa3');gr.addColorStop(1,'#e5799b');
    rr([x0,x1,top,y1],3,gr,[1,1,0,0]);
    const sp=g.createRadialGradient((x0+w*.7)*k,(top+h*.35)*k,0,(x0+w*.7)*k,(top+h*.35)*k,w*.45*k);sp.addColorStop(0,'rgba(255,190,220,.45)');sp.addColorStop(1,'rgba(255,190,220,0)');
    g.fillStyle=sp;g.fillRect(x0*k,top*k,w*k,h*k);
    g.fillStyle='rgba(255,255,255,.22)';g.fillRect(x0*k,top*k,w*k,3.7*k);   // the menu bar
    const dw=150,dx=(W-dw)/2,dy=y1-15;rr([dx,dx+dw,dy,dy+12.5],4,'rgba(255,255,255,.28)');   // the dock and its icons
    ['#3d8bf2','#f4f4f4','#5ac85a','#fbbd2e','#f25c54','#a35cf2','#2fc1d8','#f78f3a','#7a7d82','#e04a8c','#4b6ef5','#38b26a'].forEach((col,i)=>rr([dx+3+i*12,dx+12+i*12,dy+1.75,dy+10.75],2.2,col));
  }
  rr([W/2-15.5,W/2+15.5,top-.5,top+6],2,'#000',[0,0,1,1]);   // the notch, in front of the display's top
}
// the materials, once: the body's top; the lid's inner face, its glow 0…1 by emissiveIntensity
let mbTopMat=null,mbLidMat=null;
function mbMats(){
  if(mbTopMat)return;
  const tex=draw=>{const c=document.createElement('canvas');draw(c);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;};
  mbTopMat=new THREE.MeshStandardMaterial({map:tex(mbDrawTop),roughness:.4,metalness:.15});
  mbLidMat=new THREE.MeshStandardMaterial({map:tex(c=>mbDrawLid(c,false)),emissiveMap:tex(c=>mbDrawLid(c,true)),emissive:0xffffff,emissiveIntensity:0,roughness:.15});
}
const mbFootMat=new THREE.MeshStandardMaterial({color:0x2a2b2d,roughness:.8});
function buildMacbook(desk,opts){
  const {W,D,feet,base,keys,lid,at,open}=MB,yb=feet+base;mbMats();
  const place=new THREE.Group();place.position.set((DK.W-W)/2*MM,DK.H*MM,at*MM);place.userData.macbook=true;place.userData.info=INFO.macbook;desk.add(place);
  const q=new THREE.Group();place.add(q);   // the door's holder: everything, so a click anywhere on it opens it
  // a rounded box, silver but one face (the box's: 2 top, 3 bottom) with its picture (sizes mm)
  const rb=(g,x0,x1,y0,y1,z0,z1,r,face,mat)=>{const m=new THREE.Mesh(roundBoxGeo((x1-x0)*MM,(y1-y0)*MM,(z1-z0)*MM,r*MM),[0,1,2,3,4,5].map(i=>i===face?mat:mbSilverMat));
    m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
  // the body on four round feet: its top's picture (a box's top face: the picture's top at the back)
  rb(q,0,W,feet,yb,0,D,4,2,mbTopMat);
  [[24,24],[W-24,24],[24,D-24],[W-24,D-24]].forEach(([x,z])=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,feet*MM,20),mbFootMat);f.position.set(x*MM,feet/2*MM,z*MM);q.add(f);});
  // the lid on its hinge at the back, half its thickness over the keys' room; closed, it lies over the top, from its back to its front.
  // Its inner face's picture (a box's bottom face: the picture's top away from the hinge)
  const L=new THREE.Group();L.position.set(0,(yb+keys+lid/2)*MM,2*MM);q.add(L);
  rb(L,0,W,-lid/2,lid/2,0,D-2,2.5,3,mbLidMat);
  // the display lights up as the lid opens past 30°, full by 63°
  const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const follow=a=>{L.rotation.x=-a;mbLidMat.emissiveIntensity=sm((a-.5)/.6);};
  // it starts open
  return [applDoor(q,{key:'macbook',axis:'none',max:open,startOpen:true,follow},opts)];
}

/* the display cabinet as IKEA HEMNES glass-door cabinet with 3 drawers, black-brown/light brown: 900 × 370, 1970 high, solid pine.
   45 mm corner posts, two glass doors over three adjustable shelves, three drawers under them; all of it dark, as the desk.
   Its back against the desk's end by the kitchen wall, its side against the left wall, its fronts toward the kitchen wall.
   Own axes (mm): x across its front from the left wall's far side as seen from the front, y up, z from its back to its front;
   turned onto the kitchen's: its x along −x, its z along −z */
const VT={W:900,D:370,H:1970,post:45,top:22};
const vitAt=()=>P.L-DK.gap-DK.W;   // kitchen z of its back: the desk's end
function vitrineParts(){
  const parts=[],add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  const {W,D,H,post:l,top}=VT,yt=H-top,zF=D-15,t=16,fz1=zF-3,fz0=fz1-20,rz0=zF-25,rz1=zF-5,nm=' витрины';
  const xa=10,xb=W-10,ia=xa+l,ib=xb-l,sa=xa+(l+t)/2,sb=xb-(l+t)/2,zb=27;   // posts' outer x; between the posts; inner faces of the sides; back panel's front
  add('Столешница'+nm,'top',0,W,yt,H,0,D);
  [xa,xb-l].forEach(x=>[5,zF-l].forEach(z=>add('Стойка'+nm,'carcass',x,x+l,0,yt,z,z+l)));
  [xa,xb-l].forEach(x=>add('Боковина'+nm,'carcass',x+(l-t)/2,x+(l+t)/2,90,yt,5+l,zF-l));
  add('Задняя стенка'+nm,'carcass',ia,ib,90,yt,zb-8,zb);
  add('Нижняя царга'+nm,'carcass',ia,ib,70,100,rz0,rz1);
  add('Дно'+nm,'carcass',sa,sb,100-t,100,zb,rz0);
  add('Царга между ящиками и дверцами'+nm,'carcass',ia,ib,756,778,rz0,rz1);
  add('Дно отделения за стеклом'+nm,'carcass',sa,sb,756,778,zb,rz0);
  add('Верхняя царга'+nm,'carcass',ia,ib,1920,yt,rz0,rz1);
  [1050,1330,1610].forEach(y=>add('Полка'+nm,'carcass',sa,sb,y,y+18,zb,zF-l-5));
  const fx0=ia+2,fx1=ib-2,xm=(fx0+fx1)/2;
  add('Стеклянная дверца'+nm,'front',fx0,xm-2,780,1918,fz0,fz1,{hinge:'L',glass:50,knobs:[[xm-2-30,1320]]});
  add('Стеклянная дверца'+nm,'front',xm+2,fx1,780,1918,fz0,fz1,{hinge:'R',glass:50,knobs:[[xm+2+30,1320]]});
  const kx=[fx0+(fx1-fx0)*.2,fx0+(fx1-fx0)*.8];
  [[102,370,'v3','нижний'],[374,586,'v2','средний'],[590,752,'v1','верхний']].forEach(([f0,f1,k,w])=>{
    const n=' — '+w+' ящик'+nm;
    add('Фасад ящика'+n,'front',fx0,fx1,f0,f1,fz0,fz1,{hinge:'S',slide:k,travel:270,knobs:kx.map(x=>[x,(f0+f1)/2])});
    const bx0=ia+7,bx1=ib-7,by0=f0+12,by1=f1-30,bz0=fz0-290;
    add('Бок ящика'+n,'carcass',bx0,bx0+12,by0,by1,bz0,fz0,{inSlide:k});
    add('Бок ящика'+n,'carcass',bx1-12,bx1,by0,by1,bz0,fz0,{inSlide:k});
    add('Задняя стенка ящика'+n,'carcass',bx0+12,bx1-12,by0,by1,bz0,bz0+12,{inSlide:k});
    add('Дно ящика'+n,'back',bx0,bx1,by0-4,by0,bz0,fz0,{inSlide:k});
  });
  return parts;
}
function buildVitrine(g,opts){
  const d=buildParts({parts:vitrineParts()},deskMats,opts);
  hemnesFronts(d.doors,deskMats);
  d.model.rotation.y=Math.PI;d.model.position.set(VT.W*MM,0,vitAt()*MM);d.model.userData.vitrine=true;d.model.userData.info=INFO.vitrine;
  g.add(d.model);
  return d.doors;
}

/* the corner sofa as Hoff «Слим», beige-grey velour: 2060 × 1530, 910 high with its back cushions, the seat 450 high on 55 mm black
   plastic legs. The seat 1300 wide and 750 deep in front of a thin back (100 mm, 680 high: the height laid out without the cushions),
   530 in front of the cushions; the chaise 650 wide out to 1530. Two arms alike, 55 wide, from the legs up to 635, as deep as the seat;
   three back cushions 650 × 460 × 220 over the seat and the chaise, two throw pillows 480 × 360; the base stands
   20 mm back under the seat, stitched upright. Every soft piece rounded (furniture.js: roundBoxGeo). Its back against the right wall, opposite the desk, its window end 150 mm from the
   window wall, lined up with the desk's; the chaise at that end (corner on the right, seen from the front: the shop's picture mirrored).
   Own axes (mm): x across its front, y up, z from its back to its front, described with the chaise at x 0 and mirrored onto x W − x;
   turned onto the kitchen's: its x along z, its z along −x. Two groups — the sofa and the chaise —
   so the walk is stopped by its L, not by the whole rectangle.
   The chaise's seat, whole, is a lid: it turns up on its upper back edge, at the thin back (LID_MAX: 40°), over a box for bedding,
   white inside; the back cushion and the throw pillow on it rise out of its way. It lays out as a «дельфин»: the drawer under the
   seat rolls out till its front is in line with the chaise's, then the bed block lying in it (anthracite, a strap on its front)
   tips its front up over the drawer's front, slides forward and rises level with the seat, its back against the seat's front:
   one bed with the chaise, 1950 × 1420 between the arms in front of the thin back. Both go as the kitchen's fronts do
   (clicks — on the seat or the drawer for the bed, «Открыты/Закрыты», the walk) */
const SF={W:2060,D:850,Dc:1530,H:910,seat:450,leg:55,arm:55,armH:635,chaise:650,back:100,backH:680,ys:280,base:20};
const LID_MAX=40*Math.PI/180;   // rad: how far the chaise's lid opens: 40°, as far as its gas struts go
const LID_EASE=1-Math.sqrt(1-.09),LID_HOLD=HOLD_RATE/2;   // it goes half as fast as a cabinet front (common.js), on a click and held
const BED_TILT=22*Math.PI/180;  // rad: the bed block's front up over the drawer's front as it comes out
const BED_S=1.4,BED_HOLD_S=3;   // s: the whole way of the bed, out or in, evenly (the drawer 40 % of it, the block the rest): on a click, held
// beige-grey velour as in the shop's pictures; the colours are sRGB, as the plain finishes (furniture.js: applyMaterials)
const velourMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#b4aba3').convertSRGBToLinear(),roughness:.95});
const seamMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#968c84').convertSRGBToLinear(),roughness:.95});
const sofaLegMat=new THREE.MeshStandardMaterial({color:0x1b1b1b,roughness:.6});
const sofaBoxMat=new THREE.MeshStandardMaterial({color:0xeeeeea,roughness:.8});   // the chaise's box inside: white board
const bedMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#3d3e40').convertSRGBToLinear(),roughness:.9});   // the bed block: anthracite cloth
const sofaAt=()=>P.L-DK.gap-SF.W;   // kitchen z of its end toward the kitchen wall; the chaise is at the other
function buildSofa(g,opts){
  const {W,D,Dc,H,seat,leg:lg,arm,armH,chaise:cw,back,backH,ys,base}=SF,xc=arm+cw,xr=W-arm;   // xc: the chaise ends, the seat begins; xr: the right arm
  const group=()=>{const q=new THREE.Group();q.rotation.y=-Math.PI/2;q.position.set(P.Rx*MM,0,sofaAt()*MM);q.userData.info=INFO.sofa;q.userData.sofa=true;g.add(q);return q;};
  // a soft piece: rounded by r (mm) all round; mirrored, so the chaise is at x W; in a holder at (oy, oz) of its group
  const mk=(q,oy=0,oz=0)=>(x0,x1,y0,y1,z0,z1,r,mat=velourMat)=>{
    const m=new THREE.Mesh(roundBoxGeo((x1-x0)*MM,(y1-y0)*MM,(z1-z0)*MM,r*MM),mat);
    m.position.set((W-(x0+x1)/2)*MM,((y0+y1)/2-oy)*MM,((z0+z1)/2-oz)*MM);m.castShadow=m.receiveShadow=true;q.add(m);return m;};
  const flat=q=>{const b=boxIn(q);return (x0,x1,y0,y1,z0,z1,mat)=>b((W-x1)*MM,(W-x0)*MM,y0*MM,y1*MM,z0*MM,z1*MM,mat);};
  const sofa=group(),chaise=group(),S=mk(sofa),C=mk(chaise),Sf=flat(sofa),Cf=flat(chaise);
  // the sofa: the base under the seat, the seat cushion, the thin back, the two arms (rounded well over the top), the back cushions
  // (the chaise's one is the chaise's: it rises with its lid)
  const zd=D-base-720;   // the drawer's back (it has no wall there): the base behind it stays
  S(xc,xr,lg,ys,0,zd,12);
  S(arm,xr,ys,backH,0,back,35);
  [0,xr].forEach(x=>S(x,x+arm,lg,armH,0,D,26));   // the arms, alike, down to the legs
  const cushion=[0,1,2].map(i=>(i?S:C)(arm+i*650+3,arm+(i+1)*650-3,seat,H,back,back+220,80))[0];
  // the chaise: its box for bedding from the back to its front, walls 20 mm (white inside, 1 mm), its bottom 15 mm: inside
  // 145 × 21 × 61 cm; in front of the arm (it ends with the seat) the base fills out to the chaise's side
  const bz=Dc-base,t=20;
  C(0,xc,lg,ys,bz-t,bz,8);C(arm,xc,lg,ys,0,t,8);C(arm,arm+t,lg,ys,t,bz-t,8);C(xc-t,xc,lg,ys,t,bz-t,8);C(0,arm,lg,ys,D,bz-t,8);
  Cf(arm+t,xc-t,lg,lg+15,t,bz-t,sofaBoxMat);
  Cf(arm+t,xc-t,lg+15,ys,bz-t-1,bz-t,sofaBoxMat);Cf(arm+t,xc-t,lg+15,ys,t,t+1,sofaBoxMat);
  Cf(arm+t,arm+t+1,lg+15,ys,t+1,bz-t-1,sofaBoxMat);Cf(xc-t-1,xc-t,lg+15,ys,t+1,bz-t-1,sofaBoxMat);
  // its seat in one piece from the back to its front (a seam left against the sofa's seat): the lid on its hinge
  const lid=new THREE.Group();lid.position.set(0,seat*MM,back*MM);chaise.add(lid);
  mk(lid,seat,back)(0,xc,ys,seat,back,Dc,45);
  // stitches up the fronts of the bases, 130 mm apart
  for(let x=130;x<xc-40;x+=130)Cf(x-2,x+2,lg+15,ys-15,Dc-base,Dc-base+1.5,seamMat);
  // and up the chaise base's sides in front of the arm and of the sofa's base, as far apart, from its front back
  for(let z=bz-130;z>D+40;z-=130)[[-1.5,0],[xc,xc+1.5]].forEach(([x0,x1])=>Cf(x0,x1,lg+15,ys-15,z-2,z+2,seamMat));
  // legs
  [[30,30],[W-80,30],[W-80,D-base-80]].forEach(([x,z])=>S(x,x+50,0,lg,z,z+50,8,sofaLegMat));
  [[30,Dc-base-80],[xc-80,Dc-base-80]].forEach(([x,z])=>C(x,x+50,0,lg,z,z+50,8,sofaLegMat));
  // throw pillows leaning on the back cushions, by the left arm (on the chaise) and the right one, tilted toward the arms (mirrored)
  const PR=-.3,pillow=[[arm+40,-0.18,C],[xr-40-480,0.18,S]].map(([x,tz,f])=>{const p=f(x,x+480,seat+10,seat+370,back+225,back+345,55);p.rotation.x=PR;p.rotation.z=tz;return p;})[0];
  // what lies on the lid rises out of its way, straight up, its edges kept over the lid's top (y = seat + (z − back)·tan a).
  // Their edges (z, y) at rest: the back cushion's lower front one; the pillow's four, as it is tilted
  const edges=(yc,zc,hy,hz,rx)=>[[-1,-1],[-1,1],[1,-1],[1,1]].map(([u,v])=>[zc+u*hy*Math.sin(rx)+v*hz*Math.cos(rx),yc+u*hy*Math.cos(rx)-v*hz*Math.sin(rx)]);
  const riders=[[cushion,[[back+220,seat]]],[pillow,edges(seat+190,back+285,180,60,PR)]].map(([m,e])=>({m,e,y:m.position.y}));
  const follow=a=>{const tn=Math.tan(a);riders.forEach(r=>{r.m.position.y=r.y+Math.max(0,...r.e.map(([z,y])=>seat+(z-back)*tn-y))*MM;});};
  // the bed: the seat and the drawer in one holder that stays (a click on either lays it out); the drawer: its front (stitched up,
  // as the base was), sides 12 mm, a bottom, two legs; the block in it on its back lower edge, 1272 × 170 × 680 (between the sides),
  // stowed on the bottom; its strap shows once it is up, hanging
  const fold=new THREE.Group(),drawer=new THREE.Group(),block=new THREE.Group(),strap=new THREE.Group();
  sofa.add(fold);fold.add(drawer);drawer.add(block);block.add(strap);
  const Dr=mk(drawer),Drf=flat(drawer),tw=12,zf=D-base,yb0=lg+20,zb0=zf-t-680,bt=seat-ys;
  mk(fold)(xc,xr,ys,seat,back,D,45);
  Dr(xc,xr,lg,ys,zf-t,zf,12);Dr(xc,xc+tw,lg,ys,zd,zf-t,6);Dr(xr-tw,xr,lg,ys,zd,zf-t,6);Drf(xc+tw,xr-tw,lg,lg+15,zd,zf-t,seamMat);
  for(let x=xc+130;x<xr-40;x+=130)Drf(x-2,x+2,lg+15,ys-15,zf,zf+1.5,seamMat);
  [xc+30,xr-110].forEach(x=>Dr(x,x+50,0,lg,zf-80,zf-30,8,sofaLegMat));
  mk(block,yb0,zb0)(xc+tw+2,xr-tw-2,yb0,yb0+bt,zb0,zb0+680,30,bedMat);
  { const sx=(xc+xr)/2-150,yt=110,L=180;   // the strap: a loop 50 wide from the block's front, 110 up its 170
    strap.position.set(0,yt*MM,682*MM);const St=mk(strap,yt,682);
    St(sx-25,sx-13,yt-L,yt,682,685,3);St(sx+13,sx+25,yt-L,yt,682,685,3);St(sx-25,sx+25,yt-L,yt-L+12,682,685,3); }
  strap.visible=false;
  // where it is at a share k of its way: the drawer out by its first 40 %; then the block tips (to 55 %), slides forward till its back
  // upper edge is past the seat's front (to 70 %), and rises, levelling, that edge kept at the seat's front
  const sm=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},zs=zf-t+(Dc-D)-680,z2=D+bt*Math.sin(BED_TILT);
  const lay=a=>{const k=a/DMAX,dz=(Dc-D)*sm(k/.4),u1=sm((k-.4)/.15),u2=sm((k-.55)/.15),u3=sm((k-.7)/.3);
    let th=BED_TILT*u1,zb=zb0+dz+(z2-zs)*u2,yb=yb0;
    if(u3>0){th=BED_TILT*(1-u3);yb=yb0+(ys-yb0)*u3;zb=D+bt*Math.sin(th);}
    drawer.position.z=dz*MM;block.position.set(0,yb*MM,(zb-dz)*MM);block.rotation.x=-th;strap.rotation.x=th;strap.visible=u3>.6;};
  return [applDoor(lid,{key:'sofa-lid',axis:'x',s:-1,max:LID_MAX,ease:LID_EASE,holdRate:LID_HOLD,follow},opts),applDoor(fold,{key:'sofa-bed',axis:'none',rate:DMAX/BED_S,holdRate:DMAX/BED_HOLD_S,follow:lay},opts)];
}

/* a door of an appliance: its holder g turns or slides as a cabinet front does (furniture.js: turnDoor); by its key it keeps
   how open it was through a rebuild; it opens and closes with the kitchen's fronts (clicks, «Открыты/Закрыты», the walk).
   A new one starts closed (opening, if the fronts are open), or open already if it has startOpen */
function applDoor(g,extra,{prev=[],open=false}={}){
  const pd=prev.find(d=>d.key===extra.key),max=extra.max||DMAX,a0=extra.startOpen?max:0;
  const d=Object.assign({g,a:pd?pd.a:a0,t:pd?pd.t:(open?max:a0),last:pd&&pd.last},extra,{max});turnDoor(d);return d;
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
  // the sink with its mixer in the first base cabinet: the rim round the bowl, the bowl open on top down through the worktop's cut-out,
  // its bottom round the drain (slab: each fills the other's hole)
  { const cx=b1/2,cz=SK.z*MM,yt=ct+.006,yb=ct-SK.deep*MM,m=v=>v*MM,{w,d,r,wall:t}=SK;
    // a rounded rectangle (mm, from the sink's middle; x across, y toward the room) on a shape or a hole
    const rect=(sh,w,d,r)=>{const x=m(w/2),y=m(d/2);r=m(r);sh.moveTo(-x+r,-y);sh.lineTo(x-r,-y);sh.quadraticCurveTo(x,-y,x,-y+r);sh.lineTo(x,y-r);
      sh.quadraticCurveTo(x,y,x-r,y);sh.lineTo(-x+r,y);sh.quadraticCurveTo(-x,y,-x,y-r);sh.lineTo(-x,-y+r);sh.quadraticCurveTo(-x,-y,-x+r,-y);return sh;};
    const drain=p=>p.absarc(0,0,m(SK.drain),0,Math.PI*2,false);
    slab(g,holed(rect(new THREE.Shape(),SK.rw,SK.rd,10),rect(new THREE.Path(),w,d,r)),.01,cx,yt,cz,blackMat).userData.sinkRim=true;   // its hole the bowl's outside
    slab(g,holed(rect(new THREE.Shape(),w,d,r),rect(new THREE.Path(),w-2*t,d-2*t,r-t)),yt-yb,cx,yt,cz,sinkMat).userData.sinkBowl=true;   // the bowl's walls
    slab(g,holed(rect(new THREE.Shape(),w-2*t,d-2*t,r-t),drain(new THREE.Path())),.001,cx,yb+.001,cz,sinkMat);   // its bottom
    slab(g,drain(new THREE.Shape()),.001,cx,yb+.001,cz,chromeMat);
    const tap=new THREE.Mesh(new THREE.CylinderGeometry(.014,.016,.32,16),blackMat);tap.position.set(cx,ct+.16,.06);g.add(tap);
    box(cx-.012,cx+.012,ct+.28,ct+.31,.06,.26,blackMat); }
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

/* ---------- dimension lines of the kitchen (kitchen axes; they belong to the kitchen and move with it) ---------- */
function buildDims(dim,gaps,group){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
  const c=current,zf=P.Db+40;let x=0;
  [P.B1,P.B2,P.B3].forEach(w=>{dim(V(x,P.Ct+60,zf),V(x+w,P.Ct+60,zf),`${w}`,Y);x+=w;});
  dim(V(c.xr,P.Fh+60,P.Fd+40),V(c.xF,P.Fh+60,P.Fd+40),`${P.Fr}`,Y);
  dim(V(0,P.H+120,0),V(P.W,P.H+120,0),`${P.W}`,Y);
  dim(V(-60,0,zf),V(-60,P.Ct,zf),`${P.Ct}`,X);
  dim(V(-60,P.Ct,P.Dw+40),V(-60,c.yW,P.Dw+40),`${c.yW-P.Ct}`,X);
  if(P.Ant!==false)dim(V(P.W+80,c.yAnt,P.Dw+40),V(P.W+80,P.H,P.Dw+40),`${P.Ha}`,X);
  dim(V(P.W+80,0,0),V(P.W+80,0,P.Db),`${P.Db}`,Y);
  // the table: how far from the kitchen wall, its sides, its height (shown with the table: see frame below)
  const tz1=TB.z+TB.w,tx=TB.l+60,n0=group.children.length;
  dim(V(40,TB.h,0),V(40,TB.h,TB.z),`${TB.z}`,Y);
  dim(V(tx,TB.h,TB.z),V(tx,TB.h,tz1),`${TB.w}`,Y);
  dim(V(0,TB.h,tz1+60),V(TB.l,TB.h,tz1+60),`${TB.l}`,Y);
  dim(V(tx,0,tz1+60),V(tx,TB.h,tz1+60),`${TB.h}`,X);
  group.children.slice(n0).forEach(o=>{o.userData.table=true;});
  // between the shelves of each wall cabinet
  if(P.Nw){const b=c.parts.filter(q=>/^(Дно|Полка|Крышка) навесного шкафа/.test(q.name));
    [...new Set(b.map(q=>q.x0))].forEach(x=>gaps(b.filter(q=>q.x0===x)));}
}

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

/* ---------- panel: what the kitchen has, the apron's finish and its texts ---------- */
const panel=document.querySelector('[data-panel="kitchen"]'),kq=s=>panel.querySelector(s);
function syncHob(){panel.querySelectorAll('[data-hob]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.hob===(P.Hob||'built')));}
panel.querySelectorAll('[data-hob]').forEach(b=>b.addEventListener('click',()=>{P.Hob=b.dataset.hob;syncHob();k.build();}));
kq('#k-tOvDr').addEventListener('change',e=>{P.OvDr=e.target.checked;k.build();});
kq('#k-tHobAlong').addEventListener('change',e=>{P.HobAlong=e.target.checked;k.syncThick();k.build();});
kq('#k-tApron').addEventListener('change',e=>{P.Apron=e.target.checked;k.build();});
kq('#k-tDish').addEventListener('change',e=>{P.Dish=e.target.checked;k.build();});
kq('#k-tAnt').addEventListener('change',e=>{P.Ant=e.target.checked;k.syncThick();k.build();});   // without them «вверх» is greyed out
kq('#k-tAntUp').addEventListener('change',e=>{P.AntUp=e.target.checked;k.build();});
// the wall and the ceiling (from the plan), what the finishes are, what is left between the cabinets
function panelText(){
  kq('#k-W').textContent=P.W+' мм';kq('#k-H').textContent=P.H+' мм';
  kq('#kSub').textContent=`стена ${P.W} мм · потолок ${P.H} мм · ${k.finDesc()}; столешница — ${finName(FIN.top)}`;
  { const t=P.T||16,f=v=>v.toFixed(1).replace('.',',').replace(',0',''),c=current;
    const pl=P.Plinth!==false?P.Pl:0,hb=P.Ct-P.Tt-pl;
    const free=P.W-(P.B1+P.B2+P.B3+P.Fr);
    kq('#k-gapBase').textContent=`Высота корпуса ${hb} мм · фасады ${hb-2} мм`+(free>0?` · справа свободно ${free} мм`:'');
    const over=kq('#k-runOver');over.hidden=free>=0;over.textContent=free<0?`Тумбы и ниша холодильника длиннее стены на ${-free} мм`:'';
    const hw=c.yAnt-c.yW,st=(hw-t)/(P.Nw+1);
    kq('#k-gapWall').textContent=`Высота навесных ${hw} мм`+(P.Nw?` · между полками ${f(st-t)} мм`:'')+` · вытяжка ${Math.max(c.yW,P.Ct+P.Gh)-P.Ct} мм над столешницей`; }
}

const k=roomKit('kitchen',{
  P,FIN,mats,px:'k',panel,origin:O,fromModel,setCam,panelText,
  fromPlan:['W','H','L','Rx'],
  ids:['B1','B2','B3','Hx','Ct','Db','Pl','Fr','Fh','Fd','Dw','Gw','Gh','Ha','Da','Nw'],
  wish:['Hx'],
  slider:{sel:'#kFrameL',key:'L',max:()=>A.kL},   // how far from the kitchen wall the left wall shows, up to the window wall
  dims:buildDims,
  extra:{name:'appl',build:(g,o)=>{const ap=buildAppliances(g,o);buildTable(g);return ap.concat(buildChairs(g,o),buildDesk(g,o),buildVitrine(g,o),buildSofa(g,o));}},   // the appliances (the oven's and the fridge's doors open), the tables, the dining chairs, the display cabinet and the sofa go with the walls in the kitchen's view
  // its own view shows the cabinets and the dining table — the table only once the frame shows the left wall past it; the desk,
  // the display cabinet and the sofa stand in the apartment (the plan, the walk), not in the kitchen tab
  frame:(on,{extra,dims,show})=>{
    const fits=show>=TB.z+TB.w;
    if(extra)extra.children.forEach(o=>{const u=o.userData;if(u.desk===true||u.vitrine===true||u.sofa===true)o.visible=!on;else if(u.table===true||u.chair===true)o.visible=!on||fits;});
    if(dims)dims.children.forEach(o=>{if(o.userData.table===true)o.visible=fits;});
  },
  foot:()=>[[current.xr+10,current.xF-10,20,P.Fd-10],[0,TB.l,TB.z,TB.z+TB.w],[0,DK.D,P.L-DK.gap-DK.W,P.L-DK.gap],[0,VT.W,vitAt()-VT.D,vitAt()],
    [P.Rx-SF.D,P.Rx,sofaAt(),sofaAt()+SF.W],[P.Rx-SF.Dc,P.Rx,sofaAt()+SF.W-SF.arm-SF.chaise,sofaAt()+SF.W]],   // its footprint: the fridge besides the base run, the table, the desk, the display cabinet, the sofa
  syncFlags:()=>{kq('#k-tAnt').checked=P.Ant!==false;kq('#k-tAntUp').checked=!!P.AntUp;kq('#k-tAntUp').disabled=P.Ant===false;kq('#k-fAntUp').style.opacity=P.Ant===false?.45:1;kq('#k-tDish').checked=P.Dish!==false;kq('#k-tApron').checked=!!P.Apron;kq('#k-tOvDr').checked=!!P.OvDr;kq('#k-tHobAlong').checked=!!P.HobAlong;kq('#k-fHx').hidden=!!P.HobAlong;syncHob();},
  // finishes: the worktop and the apron (as the worktop unless it has its own) besides the carcass and the fronts
  groups:['carcass','front','top','apron'],
  shown:g=>g!=='apron'||!!P.Apron,
  matName:m=>m==='apron'?'Фартук 6 мм · '+finName(finOf(FIN,'apron')):m==='top'?`Столешница ${P.Tt} мм · `+finName(finOf(FIN,'top')):null,
  takeFin:(f,ok)=>{if(ok(f.top))FIN.top=f.top;FIN.apron=ok(f.apron)?f.apron:null;},
  finNowTail:()=>P.Apron?`<span>Фартук</span><span>${FIN.apron?finName(FIN.apron)+' <button class="lnk" id="k-apronReset">как столешница</button>':'как столешница'}</span>`:'',
  afterSyncFinish:()=>{const ar=kq('#k-apronReset');if(ar)ar.addEventListener('click',()=>{FIN.apron=null;applyMaterials(mats,FIN,P.Ec);k.syncFinish();k.updatePanel();});},
  view:{
    // the kitchen wall whole and the left wall up to L from it, as the kitchen tab showed them
    frame:L=>{const [ox,oz]=O();return [ox-A.bear,ox+A.kW,kZ0,oz+L];},
    // as in the kitchen tab: the sun aims at the middle of the wall, shadows cover 6 × 6 m
    sun:()=>{const [ox,oz]=O();return {x:(ox+A.kW/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
    defaults:{Wm:'auto',Wh:100,L:1350,sizes:true,fronts:'closed',dims:true,walls:true}
  }
});
})();
