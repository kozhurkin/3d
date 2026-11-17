/* ---------- «Кухня» view: the kitchen wall with its left wall, the cabinets and the appliances along it ----------
   Kitchen coordinates as in the kitchen tab, mm: x along the kitchen wall from the left wall, y up, z from the wall into the room;
   the kitchen's (0,0) is its origin on the plan. The wall width and the ceiling come from the plan (A.kW, A.H),
   how far the left wall shows is the view's frame (VS.kitchen.L). The rest of the room (the desk, the sofa, the wardrobe…) is
   living.js's, built here with the kitchen. Own scope: the room modules share names (P, T, computeParts…). */
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
  const [parts,add]=partList(),W=p.W,H=p.H,RB=100,FL=0;
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
    // the front rail lies flat under the worktop; under the sink it stands on edge by the front: lying flat it would go through the bowl
    { const edge=b.k==='sink';add('Царга передняя'+nm,'carcass',x0+T,x1-T,ytop-(edge?RB:T),ytop,zcB-(edge?T:RB),zcB); }
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
  olive:()=>({title:'Настенная полка с ящиками',lines:['Массив сосны, покраска оливковая; ручки керамические.',`${OL.W/10} × ${OL.D/10} см, высота ${OL.H/10} см.`,`Низ на ${SPICE_Y/10} см от пола, в ${(SPICE_Y-TB.h)/10} см над столешницей.`],price:16000,url:'https://ozon.ru/t/EIGVFHm',shop:'Ozon'}),
  tiered:()=>({title:'Настенная полка, 3 яруса',lines:['Дерево, тонировка тёплая коричневая.',`${SQ.W/10} × ${SQ.D/10} см, высота ${SQ.H/10} см.`,`Низ на ${SPICE_Y/10} см от пола, в ${(SPICE_Y-TB.h)/10} см над столешницей.`],price:13000,url:'https://ozon.ru/t/EIGVFHm',shop:'Ozon'}),
  table:()=>({title:'Обеденный стол',lines:[`${TB.l/10} × ${TB.w/10} см, высота ${TB.h/10} см, торцом к левой стене.`,`Столешница ${TB.t} мм — ${finName(FIN.top)}, как у кухни.`,`Четыре стальные ножки ${TB.leg} × ${TB.leg} мм.`]}),
  chair:{title:'Стул BERGMUND (IKEA)',lines:['Чёрный, массив дерева; мягкое сиденье и спинка в чехле из тёмно-серой рогожки.','52 × 52 см, высота 95 см; сиденье 52 × 41 см на высоте 51 см.','Спинка 48 см, сужается кверху до 37 см; угол к сиденью 104°.','Задвинут под стол; нажатие выдвигает его и обратно.']},
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

/* the pendant lamp over the dining table, in the middle of it, its shade's bottom its own height over the tabletop (higher only if its cord
   does not reach so far). A click (or the card's «Следующий вариант →») changes it for the next of three IKEA lamps (LAMPS), round, BLÅSVERK at first
   (engine.js: userData.click); the one hung stays through the kitchen's rebuilds. Each a white cord from its top (hang) up to its canopy
   on the ceiling, as long as it is (cord); lit. Own axes (mm): y up from the shade's bottom, from the shade's axis */
let pendantModel=0;   // in LAMPS
const pendantMats=(()=>{
  // MISTERHULT's weave: strips across both diagonals and along, the holes between them clear (cut by alphaTest)
  const N=256,s=32,t=drawnTex(N,g=>{
    g.lineWidth=6;g.lineCap='butt';
    const tone=i=>['#d8b47c','#c9a26a','#e0bf8a','#bf965e'][i%4];
    const line=(x0,y0,x1,y1,i)=>{g.strokeStyle=tone(i);g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();};
    for(let k=-N,i=0;k<=2*N;k+=s,i++){line(k,0,k+N,N,i);line(k,0,k-N,N,i+1);}
    for(let y=s/4,i=0;y<N;y+=s/2,i++)line(0,y,N,y,i+2);
  },6,2);
  const col=h=>new THREE.Color(h).convertSRGBToLinear(),D=THREE.DoubleSide;
  return {
    weave:new THREE.MeshStandardMaterial({map:t,alphaTest:.5,side:D,roughness:.75,emissive:0xffcf8a,emissiveMap:t,emissiveIntensity:.18}),
    bamboo:new THREE.MeshStandardMaterial({color:col('#c9a26a'),side:D,roughness:.6}),
    white:new THREE.MeshStandardMaterial({color:0xf3f2ef,roughness:.55}),
    bulb:new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffe2b0,emissiveIntensity:1,roughness:.1}),
    beige:new THREE.MeshStandardMaterial({color:col('#dcd0b4'),side:D,roughness:.22,metalness:.1}),   // BLÅSVERK's glossy top and its tube
    seam:new THREE.MeshStandardMaterial({color:col('#b9ae98'),roughness:.3,metalness:.4}),            // the ring where its two halves meet
    opal:new THREE.MeshStandardMaterial({color:0xf6f5f1,side:D,roughness:.45,emissive:0xfff1dc,emissiveIntensity:.5}),   // its diffuser, lit
    steel:new THREE.MeshStandardMaterial({color:col('#ecebe4'),side:D,roughness:.45}),                // BUNKEFLO's powder-coated shade
    birch:new THREE.MeshStandardMaterial({color:col('#e2cda4'),roughness:.6})                         // its birch top
  };
})();
/* the three lamps, in the click's round: over the height of its shade's bottom over the tabletop, hang where the cord comes out, cord its length, canopy its outline [r, y up from its bottom];
   shade(put, lathe, V, mt) puts the rest */
const LAMPS=[
  /* BLÅSVERK, beige: 370 across, 180 high — a glossy beige dome over a white opal bowl, a ring where they meet, 95 up; the bowl's bottom
     dished in round its middle. On a beige aluminium tube 16 across, 280 long; the opal bowl glows */
  {name:'BLÅSVERK',price:3500,url:'https://ozon.ru/t/GAWH6H0',over:800,hang:460,cord:1100,canopy:[[0,0],[8,1],[22,8],[32,22],[37,42],[37,65]],
    lines:['Глянцевый бежевый верх, снизу белый матовый рассеиватель; бежевая алюминиевая трубка, белый шнур.','Ø37 см, высота 18 см; трубка 28 см, шнур 110 см; лампа E27, шар опаловый.'],
    shade(put,lathe,V,mt){
      lathe(new THREE.SplineCurve([V(185,95),V(186,105),V(183,128),V(175,150),V(158,167),V(125,177),V(70,180),V(10,180)]).getPoints(30),mt.beige,64);
      lathe(new THREE.SplineCurve([V(0,12),V(85,10),V(100,4),V(115,0),V(138,4),V(160,20),V(174,45),V(182,70),V(184,95)]).getPoints(30),mt.opal,64);
      lathe([V(185,88),V(187,90),V(187,97),V(185,99)],mt.seam,64);
      put(new THREE.CylinderGeometry(8*MM,8*MM,280*MM,16),mt.beige,320);
    }},
  /* BUNKEFLO, white and birch: 360 across, its steel shade 115 high — a skirt flaring a little to its open bottom, a rounded shoulder up to
     a white collar 85 across, 30 high, a solid birch cylinder 75 across, 42 high, on it. An E27 socket inside, an opal globe bulb under it */
  {name:'BUNKEFLO',price:5000,url:'https://ozon.ru/t/dwjZCNy',over:800,hang:187,cord:1400,canopy:[[0,0],[20,0],[22,2],[33,46],[33,48]],
    lines:['Белый, сталь с порошковым покрытием; сверху вставка из массива берёзы; белая потолочная чашка-конус.','Ø36 см; шнур 140 см; лампа E27, шар опаловый.'],
    shade(put,lathe,V,mt){
      lathe(new THREE.SplineCurve([V(180,0),V(177,15),V(172,45),V(167,72),V(158,92),V(130,105),V(90,111),V(48,114)]).getPoints(30),mt.steel,64);
      put(new THREE.CylinderGeometry(40*MM,43*MM,31*MM,32),mt.white,129.5);
      put(new THREE.CylinderGeometry(37.5*MM,37.5*MM,42*MM,32),mt.birch,166);
      put(new THREE.CylinderGeometry(20*MM,20*MM,40*MM,20),mt.white,100);
      put(new THREE.SphereGeometry(40*MM,24,16),mt.bulb,42);
    }},
  /* MISTERHULT, handwoven bamboo: its shade 450 across, 400 high, a gourd — a neck 160 across at the top, widest 150 up from its bottom,
     a solid bamboo band round its open bottom (370 across); its weave open, so the light and the sun go through it. An E27 socket in
     the neck, a clear globe bulb under it */
  {name:'MISTERHULT',price:9000,url:'https://ozon.ru/t/EIG8Q2j',over:700,hang:350,cord:1600,canopy:[[0,0],[8,0],[30,4],[44,14],[50,31],[50,46]],
    lines:['Бамбук, ручное плетение; белый шнур и потолочная чашка.','Абажур Ø45 см, высота 40 см; шнур до 160 см; лампа E27, шар прозрачный.'],
    shade(put,lathe,V,mt){
      const R=225,band=40;
      lathe(new THREE.SplineCurve([V(R-30,band),V(R-12,100),V(R,150),V(R-8,210),V(R-35,265),V(R-80,320),V(R-125,360),V(85,385),V(80,392)]).getPoints(40),mt.weave,64);
      lathe([V(R-41,0),V(R-37,6),V(R-34,band-6),V(R-30,band+2)],mt.bamboo,64);
      lathe([V(80,386),V(83,388),V(83,400),V(80,402)],mt.bamboo,40);
      put(new THREE.CylinderGeometry(...[20,20,70].map(v=>v*MM),20),mt.white,315);
      put(new THREE.SphereGeometry(47.5*MM,24,16),mt.bulb,237.5);
    }}
];
// a lamp's canopy's height; where its shade's bottom is hung (mm from the floor)
const canopyH=L=>L.canopy[L.canopy.length-1][1];
function pendantY(L){return Math.max(TB.h+L.over,P.H-canopyH(L)-L.cord-L.hang);}
function buildPendant(g){
  const q=new THREE.Group();q.position.set((TB.l/2)*MM,0,(TB.z+TB.w/2)*MM);
  // the card: which of the three it is and a link to the next one (engine.js: info.variant, info.next — it hangs the next and gives its card), its price and the shop
  const card=()=>{const L=LAMPS[pendantModel];
    return {title:`Подвесной светильник ${L.name} (IKEA)`,lines:L.lines.concat(`Над серединой обеденного стола, низ абажура в ${Math.round((pendantY(L)-TB.h)/10)} см над столешницей.`),
      price:L.price,url:L.url,shop:'Ozon',variant:[pendantModel+1,LAMPS.length],next:()=>{click();return card();}};};
  const click=()=>{pendantModel=(pendantModel+1)%LAMPS.length;fillPendant(q);};
  Object.assign(q.userData,{pendant:true,walkThrough:true,info:card,click});
  g.add(q);fillPendant(q);
}
// the lamp hung now, in q: what was there goes (the clipping planes its materials had go to the new ones)
function fillPendant(q){
  const old=q.children.slice(),planes=old.length?old[0].material.clippingPlanes:null;
  old.forEach(o=>{q.remove(o);if(o.geometry)o.geometry.dispose();});
  const L=LAMPS[pendantModel],y=pendantY(L),m=v=>v*MM,mt=pendantMats,V=(r,h)=>new THREE.Vector2(m(r),m(h));
  q.position.y=m(y);q.userData.model=L.name;
  const put=(geo,mat,py=0)=>{const o=new THREE.Mesh(geo,mat);o.position.y=m(py);o.castShadow=o.receiveShadow=true;q.add(o);return o;};
  const lathe=(pts,mat,n=48)=>put(new THREE.LatheGeometry(pts,n),mat);
  L.shade(put,lathe,V,mt);
  // the cord from its top up to the canopy on the ceiling
  const top=P.H-y-canopyH(L);
  put(new THREE.CylinderGeometry(m(3.5),m(3.5),m(top-L.hang),8),mt.white,(top+L.hang)/2).userData.cord=true;
  const cp=lathe(L.canopy.map(([r,h])=>V(r,h)),mt.white,32);cp.userData.canopy=true;cp.position.y=m(top);
  if(planes)clipToFloor(q,planes);
}

/* four chairs as IKEA BERGMUND, black, its cover dark grey matting, as its drawing: 520 × 520 over the legs on the floor, 950 high. The seat 520 wide,
   510 high at its front, 410 deep in front of the back, upholstered all round (90 thick, the frame under the cover), sloping back
   to 470 at the back; the back 480 high from there to the top, narrowing to 370 at its top, 40 thick, its top corners rounded,
   down behind the seat to its bottom; the back to the seat 104°. Four square legs tapering to the floor, splayed out to its corners.
   Two along each long side of the table, 20 mm clear of its legs, 40 apart; all pushed in at first, under the table till the seat's front
   is 10 short of the table's middle (the chair across comes as far); a click pulls one out (the seat's front 80 out past the table's edge:
   the far ones end just short of the display cabinet), and back in. The walker passes through them (walk.js: userData.walkThrough).
   Own axes (mm): x across, y up, z from its back to the seat's front; its front toward the table */
const CH={W:520,D:520,H:950,seat:510,seatBack:470,depth:410,cush:90,angle:104,legT:42,legB:30,backB:500,backTop:370,backT:40,out:80,clear:20,gap:40};
// a rounded box's uv in m, as the back's (each face's 0…1 times its sizes), so the weave is as big on its narrow faces (k: as roundBoxGeo's)
function metricUV(geo,s,k=4){const uv=geo.attributes.uv,per=(2*k+2)**2;
  for(let i=0;i<uv.count;i++){const [au,,av]=BOX_UV[Math.floor(i/per)];uv.setXY(i,uv.getX(i)*s[au],uv.getY(i)*s[av]);}
  uv.needsUpdate=true;return geo;}
/* the cover: dark grey matting (рогожка), a basket weave of pairs of threads in squares 4 mm across, as a picture and its bumps.
   A tile of 4 × 4 squares (16 mm), 62.5 of them to a unit of the geometry's uv (m: metricUV) */
const chairFabric=(()=>{
  const tex=bump=>drawnTex(64,g=>{
    g.fillStyle=bump?'#000':'#3c3d3f';g.fillRect(0,0,64,64);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){const across=(i+j)%2===0,x=i*16,y=j*16;
      for(let k=0;k<2;k++){   // two threads to a square, each lit along its middle
        const [tx,ty,tw,th]=across?[x,y+k*8,16,8]:[x+k*8,y,8,16],gr=across?g.createLinearGradient(0,ty,0,ty+th):g.createLinearGradient(tx,0,tx+tw,0);
        gr.addColorStop(0,bump?'#202020':'#2f3032');gr.addColorStop(.5,bump?'#ffffff':(k?'#55575a':'#4d4f52'));gr.addColorStop(1,bump?'#202020':'#2f3032');
        g.fillStyle=gr;g.fillRect(tx+.5,ty+.5,tw-1,th-1);}}
  },1000/16,1000/16,!bump);
  return new THREE.MeshStandardMaterial({map:tex(false),bumpMap:tex(true),bumpScale:.0006,roughness:.97});
})();
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
    const sm=new THREE.Mesh(metricUV(roundBoxGeo(W*MM,cush*MM,(depth+backT)*MM,25*MM),[W*MM,cush*MM,(depth+backT)*MM]),chairFabric);sm.position.set(W/2*MM,-cush/2*MM,-(depth+backT)/2*MM);sm.castShadow=sm.receiveShadow=true;st.add(sm);
    // the back: its front on the seat's back edge, leaning back
    const b=new THREE.Group();b.position.set(W/2*MM,yb*MM,zp*MM);b.rotation.x=-tb;q.add(b);
    const bk=new THREE.Mesh(backGeo,chairFabric);bk.position.z=-(backT-bv)*MM;bk.castShadow=bk.receiveShadow=true;b.add(bk);
    // pulled out: away from the table (its own −z); all start pushed in
    return applDoor(q,{key:'chair'+i,axis:'z',travel:-travel*MM},opts);
  });
}

/* the wall shelf over the dining table: on the left wall over the table's end, in the middle of its width, its bottom SPICE_Y over the floor.
   Two of them, one shown (spiceModel): a click on it (engine.js: userData.click; a click on a drawer works the drawer) or the link in its card shows the other;
   which one stays through the kitchen's rebuilds. Each in its own axes (mm): x along it from the window's side, y up from its bottom,
   z from the wall into the room; both in one group turned onto the kitchen's as the desk: its x toward the kitchen wall (−z), its z along x.
   The olive one, as the shop's «полка настенная из массива дерева с ящиками»: solid pine painted olive, 600 wide, 900 high, 120 deep.
   Two sides the whole height; a back of six tongue-and-groove boards; at the bottom three drawers with white ceramic knobs under the
   first shelf, two more shelves over it (lv); at the top a board, a front rail with a scalloped bottom under it and a scalloped crest
   behind it over it; a scalloped apron under the bottom board */
const SPICE_Y=1150;   // both shelves' bottom over the floor
const OL={W:600,H:900,D:120,t:18,back:10,lv:{bottom:40,drawers:176,shelves:[400,630],top:842},rail:60,crest:40,wave:25,travel:80};
let spiceModel=0;   // 0 the tiered one (SQ), shown at first; 1 the olive one
const oliveFIN={carcass:{type:'uni',color:'#6B7A5C',name:'Оливковый'},front:{type:'uni',color:'#6B7A5C',name:'Оливковый'},top:{type:'uni',color:'#6B7A5C',name:'Оливковый'},apron:null};
const oliveMats=makeMats();applyMaterials(oliveMats,oliveFIN,0);
const knobMat=new THREE.MeshStandardMaterial({color:0xf4f2ec,roughness:.25});
// the drawers' openings between the sides and the two dividers
const oliveBays=()=>{const {W,t}=OL,b=(W-4*t)/3;return [0,1,2].map(i=>[t+i*(b+t),t+i*(b+t)+b]);};
function oliveParts(){
  const [parts,add]=partList();
  const {W,H,D,t,back:bk,lv}=OL,x0=t,x1=W-t,yb=lv.bottom+t,yd=lv.drawers,nm=' полки над обеденным столом';
  [0,W-t].forEach(x=>add('Боковина'+nm,'carcass',x,x+t,0,H,0,D));
  add('Дно'+nm,'carcass',x0,x1,lv.bottom,yb,0,D);
  add('Крыша'+nm,'carcass',x0,x1,lv.top,lv.top+t,0,D);
  // the back: six boards side by side, on the bottom, under the top
  backBoards(add,'Вагонка'+nm,x0,x1,yb,lv.top,bk,BB.olive);
  [yd,...lv.shelves].forEach(y=>add('Полка'+nm,'carcass',x0,x1,y,y+t,bk,D));
  const bays=oliveBays();
  bays.slice(1).forEach(([a])=>add('Перегородка'+nm,'carcass',a-t,a,yb,yd,bk,D));
  // the drawers: inset fronts flush with the sides, their boxes behind them
  bays.forEach(([a,b],i)=>{
    const k='sp'+i,n=nm+' — ящик '+(i+1),fz0=D-16,by0=yb+6,by1=yd-24,bz0=bk+4;
    add('Фасад ящика'+n,'front',a+2,b-2,yb+2,yd-2,fz0,D,{hinge:'S',slide:k,travel:OL.travel});
    add('Бок ящика'+n,'carcass',a+3,a+11,by0,by1,bz0,fz0,{inSlide:k});
    add('Бок ящика'+n,'carcass',b-11,b-3,by0,by1,bz0,fz0,{inSlide:k});
    add('Задняя стенка ящика'+n,'carcass',a+11,b-11,by0,by1,bz0,bz0+8,{inSlide:k});
    add('Дно ящика'+n,'back',a+3,b-3,by0-4,by0,bz0,fz0,{inSlide:k});
  });
  return parts;
}
/* a shelf's back: six tongue-and-groove boards from x0 to x1, bk thick, a groove (gap) between each two; in the groove the tongue
   (backGrooves), its colour (dark), deep back from their faces; tone: each board's finish a little lighter or darker, as cut boards are.
   Each shelf its own (BB): on the olive paint narrower, its tongue dark olive; on the brown wood its tongue dark brown, the boards' tones apart */
const BB={olive:{gap:3,deep:4,dark:'#3E4636',tone:0},tiered:{gap:4,deep:4,dark:'#241C16',tone:.08}},BOARD_TONE=[0,-.6,.5,-.3,.8,-.9];
const grooveMats={};
const grooveMat=c=>grooveMats[c]||(grooveMats[c]=new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.9}));
function backBoards(add,name,x0,x1,y0,y1,bk,{gap}){
  const n=BOARD_TONE.length,bw=(x1-x0-(n-1)*gap)/n;
  for(let i=0;i<n;i++){const a=x0+i*(bw+gap);add(name,'carcass',a,a+bw,y0,y1,0,bk,{board:i});}
}
function backGrooves(d,{deep,dark,tone}){
  const m=v=>v*MM,ms=d.model.children.filter(o=>o.userData.part&&typeof o.userData.part.board==='number').sort((a,b)=>a.userData.part.x0-b.userData.part.x0),bs=ms.map(o=>o.userData.part);
  if(tone)ms.forEach(o=>{const k=1+tone*BOARD_TONE[o.userData.part.board];
    o.material=o.material.map(mt=>{const c=mt.clone();c.color.multiplyScalar(k);return c;});});
  bs.slice(1).forEach((b,i)=>{const a=bs[i],z1=a.z1-deep;
    const o=new THREE.Mesh(new THREE.BoxGeometry(m(b.x0-a.x1),m(a.y1-a.y0),m(z1)),grooveMat(dark));
    o.position.set(m((a.x1+b.x0)/2),m((a.y0+a.y1)/2),m(z1/2));o.receiveShadow=true;o.userData.groove=true;d.model.add(o);});
}
/* a shaped piece of a shelf: a shape (m) extruded, its faces the carcass's finish, its cut edges the end's; the decor's u, v in its
   repeats (furniture.js: RU × RV m), the grain along the shape's x (alongX) or its y */
function shapedPiece(model,mats,sh,depth,alongX){
  const geo=new THREE.ExtrudeGeometry(sh,{depth:depth*MM,bevelEnabled:false,curveSegments:10}),uv=geo.attributes&&geo.attributes.uv;
  if(uv&&uv.setXY)for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);if(alongX)uv.setXY(i,v/RU,u/RV);else uv.setXY(i,u/RU,v/RV);}
  const o=new THREE.Mesh(geo,[mats.carcass,mats.carcassEnd]);o.castShadow=o.receiveShadow=true;o.userData.shaped=true;
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,40),mats.edge);e.raycast=()=>{};o.add(e);
  model.add(o);return o;
}
/* a board from x0 to x1 with one edge straight (at ys) and the other in n lobes reaching ye, d deep between them (a sine's hump each);
   z0…z1, in model's axes (mm) */
function wavyBoard(model,mats,x0,x1,ys,ye,d,n,z0,z1){
  const m=v=>v*MM,k=Math.sign(ys-ye),N=n*16,sh=new THREE.Shape();
  sh.moveTo(m(x0),m(ys));
  for(let i=0;i<=N;i++){const u=i/N;sh.lineTo(m(x0+(x1-x0)*u),m(ye+k*d*(1-Math.abs(Math.sin(Math.PI*n*u)))));}
  sh.lineTo(m(x1),m(ys));sh.closePath();
  const o=shapedPiece(model,mats,sh,z1-z0,true);o.position.z=m(z0);o.userData.wavy=true;return o;
}
function buildOliveShelf(opts){
  const d=buildParts({parts:oliveParts()},oliveMats,opts),{W,D,t,lv,rail,crest,wave}=OL,m=v=>v*MM,wb=(...a)=>wavyBoard(d.model,oliveMats,t,W-t,...a);
  backGrooves(d,BB.olive);
  wb(lv.top,lv.top-rail,wave,3,D-t,D);   // the front rail under the top
  wb(lv.top+t,lv.top+t+crest,wave,3,0,t);   // the crest over it, at the back
  wb(lv.bottom,0,wave,3,D-t,D);   // the apron under the bottom
  // a white ceramic knob in the middle of each drawer's front: a stem and a flattened ball
  d.doors.forEach(dr=>{
    const p=dr.g.children.find(o=>o.userData.part&&o.userData.part.mat==='front').userData.part,x=m((p.x0+p.x1)/2),y=m((p.y0+p.y1)/2);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(m(6),m(8),m(12),16),knobMat);stem.rotation.x=Math.PI/2;stem.position.set(x,y,m(p.z1+6));
    const head=new THREE.Mesh(new THREE.SphereGeometry(m(15),20,12),knobMat);head.scale.z=.7;head.position.set(x,y,m(p.z1+12+10));
    [stem,head].forEach(o=>{o.castShadow=true;o.userData.knob=true;dr.g.add(o);});
  });
  d.model.position.x=-m(W/2);
  return d;
}

/* the tiered one, as the shop's «вместительная: 3 яруса для хранения»: wood stained warm brown, 640 wide, 800 high, 150 deep. A top
   board over it all (25 over the sides, 20 over the front), a step moulding under it; a frieze with a scalloped bottom between the sides
   under that. The sides 130 deep down to 300 from the bottom, curving in to 90 there, a small scroll forward at their foot. A back of
   six tongue-and-groove boards; three tiers: at the bottom a wide shelf 150 deep, its front corners rounded; over it two shelves, each
   with a rail along its front on eight turned spindles */
const SQ={W:640,H:800,D:150,body:130,foot:90,ov:25,t:18,back:10,top:20,mould:15,frieze:80,wave:35,bottom:96,shelves:[288,506],
  rail:{h:12,d:25,up:44},spindles:8,round:30};
const tierFIN={carcass:{type:'wood',decor:'C1386'},front:{type:'wood',decor:'C1386'},top:{type:'wood',decor:'C1386'},apron:null};
const tierMats=makeMats();applyMaterials(tierMats,tierFIN,10);
function tierParts(){
  const [parts,add]=partList();
  const {W,H,D,body:B,ov,t,back:bk,top,mould,shelves,rail}=SQ,x0=ov+t,x1=W-ov-t,yt=H-top-mould,nm=' трёхъярусной полки';
  add('Крыша'+nm,'carcass',0,W,H-top,H,0,D);
  add('Карниз'+nm,'carcass',ov-10,W-ov+10,yt,H-top,0,B+10);
  backBoards(add,'Вагонка'+nm,x0,x1,25,yt,bk,BB.tiered);
  shelves.forEach(y=>{
    add('Полка'+nm,'carcass',x0,x1,y,y+t,bk,B);
    add('Бортик'+nm,'carcass',x0,x1,y+t+rail.up,y+t+rail.up+rail.h,B-rail.d,B);
  });
  return parts;
}
// a turned spindle (lathe), h high, its axis at (x, z), its foot at y (mm)
function spindle(model,mats,x,y,z,h){
  const V=(r,v)=>new THREE.Vector2(r*MM,v*h*MM),pts=[V(0,0),V(7,0),V(7,.12),V(4,.2),V(5,.3),V(8,.5),V(5,.7),V(4,.8),V(7,.88),V(7,1),V(0,1)];
  const o=new THREE.Mesh(new THREE.LatheGeometry(pts,14),mats.carcass);o.position.set(x*MM,y*MM,z*MM);o.castShadow=true;o.userData.spindle=true;model.add(o);return o;
}
function buildTieredShelf(opts){
  const d=buildParts({parts:tierParts()},tierMats,opts),{W,H,D,body:B,foot:F,ov,t,top,mould,frieze,wave,bottom,shelves,rail,spindles:n,round:r}=SQ,m=v=>v*MM;
  backGrooves(d,BB.tiered);
  const x0=ov+t,x1=W-ov-t,yt=H-top-mould;
  // the sides: their profile in z (shape x) and y, extruded along x
  [ov,W-ov-t].forEach(x=>{
    const sh=new THREE.Shape(),P=(a,b)=>[m(a),m(b)];
    sh.moveTo(...P(0,0));sh.lineTo(...P(0,yt));sh.lineTo(...P(B,yt));sh.lineTo(...P(B,300));
    sh.quadraticCurveTo(...P(B,250),...P(F,235));sh.lineTo(...P(F,60));sh.quadraticCurveTo(...P(F,15),...P(F+25,10));sh.lineTo(...P(F+25,0));sh.closePath();
    const o=shapedPiece(d.model,tierMats,sh,t,false);o.rotation.y=-Math.PI/2;o.position.x=m(x+t);o.userData.side=true;
  });
  wavyBoard(d.model,tierMats,x0,x1,yt,yt-frieze,wave,3,B-t,B);   // the frieze under the moulding
  // the bottom shelf: its front corners rounded, laid flat (the shape in x and z, extruded up)
  { const sh=new THREE.Shape(),zb=SQ.back,P=(a,b)=>[m(a),-m(b)];
    sh.moveTo(...P(x0,zb));sh.lineTo(...P(x1,zb));sh.lineTo(...P(x1,D-r));sh.quadraticCurveTo(...P(x1,D),...P(x1-r,D));
    sh.lineTo(...P(x0+r,D));sh.quadraticCurveTo(...P(x0,D),...P(x0,D-r));sh.closePath();
    const o=shapedPiece(d.model,tierMats,sh,t,true);o.rotation.x=-Math.PI/2;o.position.y=m(bottom);o.userData.bottomShelf=true; }
  // the spindles under each rail, evenly along it, in the middle of its depth
  shelves.forEach(y=>{for(let i=0;i<n;i++)spindle(d.model,tierMats,x0+(x1-x0)*(i+.5)/n,y+t,B-rail.d/2,rail.up);});
  d.model.position.x=-m(W/2);
  return d;
}
// both in one group over the table, the one chosen shown; their drawers are the kitchen's loose doors
function buildSpiceShelf(g,opts){
  const q=new THREE.Group(),ms=[[buildTieredShelf,INFO.tiered],[buildOliveShelf,INFO.olive]].map(([b,info])=>Object.assign(b(opts),{info}));
  q.rotation.y=Math.PI/2;q.position.set(0,SPICE_Y*MM,(TB.z+TB.w/2)*MM);
  const show=()=>ms.forEach((d,i)=>{d.model.visible=i===spiceModel;}),click=()=>{spiceModel=(spiceModel+1)%ms.length;show();};
  // each one's card: which of the two it is and a link to the other (engine.js: info.variant, info.next — it hangs the other and gives its card)
  const card=i=>()=>Object.assign(ms[i].info(),{variant:[i+1,ms.length],next:()=>{click();return card(spiceModel)();}});
  ms.forEach((d,i)=>Object.assign(d.model.userData,{spiceModel:i,info:card(i)}));
  Object.assign(q.userData,{spice:true,click});
  ms.forEach(d=>q.add(d.model));show();g.add(q);
  return ms.flatMap(d=>d.doors);
}

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

// the rest of the room (living.js) is built with the kitchen: what it needs of it
living.attach({P,applDoor,handleMat,rebuild:()=>k.build()});
const k=roomKit('kitchen',{
  P,FIN,mats,px:'k',panel,origin:O,fromModel,setCam,panelText,
  fromPlan:['W','H','L','Rx'],
  ids:['B1','B2','B3','Hx','Ct','Db','Pl','Fr','Fh','Fd','Dw','Gw','Gh','Ha','Da','Nw'],
  wish:['Hx'],
  slider:{sel:'#kFrameL',key:'L',max:()=>Math.min(A.kL,2650)},   // how far from the kitchen wall the left wall shows: up to 2650 (the window wall if nearer)
  dims:buildDims,
  // the appliances (the oven's and the fridge's doors open), the dining table, the lamp and the wall shelf over it, the dining chairs, and the rest
  // of the room (living.js: the desk, its chair, the display cabinet, the sofa, the wardrobe…) go with the walls in the kitchen's view. None of their doors is a cabinet front: «Фасады»
  // leaves them (loose), and they are built as they were (prev), never opened with the fronts
  extra:{name:'appl',build:(g,{prev})=>{const o={prev},ap=buildAppliances(g,o);buildTable(g);buildPendant(g);
    const all=ap.concat(buildSpiceShelf(g,o),buildChairs(g,o),living.build(g,o));
    all.forEach(d=>{d.loose=true;});return all;}},
  // its own view shows the cabinets and the dining table with its chairs, its lamp and the shelf over it — the table only once the frame shows the left wall past it; the rest of the room
  // (living.js) stands in the apartment (the plan, the walk), not in the kitchen tab
  frame:(on,{extra,dims,show})=>{
    const fits=show>=TB.z+TB.w,has=(u,ks)=>ks.some(k=>u[k]===true);
    if(extra)extra.children.forEach(o=>{const u=o.userData;if(has(u,living.keys))o.visible=!on;else if(has(u,['table','chair','pendant','spice']))o.visible=!on||fits;});
    if(dims)dims.children.forEach(o=>{if(o.userData.table===true)o.visible=fits;});
  },
  foot:()=>[[current.xr+10,current.xF-10,20,P.Fd-10],[0,TB.l,TB.z,TB.z+TB.w]].concat(living.foot()),   // its footprint: the fridge besides the base run, the table; the rest of the room's (living.js)
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
