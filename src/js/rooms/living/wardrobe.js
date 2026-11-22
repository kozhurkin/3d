/* ========== the living part: by the right wall ========== */

/* the wardrobe as OZON «Уютная логика», white or grey (wardColor), handleless (push-to-open) hinged doors: a corner unit 964 × 964, 500 deep, and an
   add-on section 400 wide — 1364 along the right wall, 964 out from it, 2200 high. Against the right wall by the sofa's end toward the
   kitchen wall: its leg (500 wide) out from the wall along the sofa's arm, its door toward the kitchen wall; along the wall from the
   leg the corner unit's other door, then the add-on section, their doors into the room. The corner unit as the shop's picture: on the
   left (along the wall) a carcass 480 wide with four shelves, its back against the wall; on the right the leg, a carcass 964 wide, its
   back at the sofa, with the corner behind the left one, for hangers — a shelf at the top, two rods one over the other through the leg
   up to its side at the wall; shelves in the add-on section.
   At the inner corner a fixed L-shaped stile of two strips, one in each front's plane: the corner unit's doors go up to them, so they
   open clear of each other. As a variant (wardExt) a second add-on section on the leg's end, the first one's mirror image: 400 along
   the leg, out into the room (the leg 1364 out from the wall), its door toward the kitchen wall in line with the leg's, hinged at its
   outer end. On the leg's end (the section's, if it has one), into the room: a mirror in a black frame, a coat rail under it. Sides down to the floor, a 70 mm plinth between them, the overlay doors over it.
   Built in the kitchen's axes (mm): no turn — the doors turn on their own hinges (pivot), the leg's way and the wall's. Two groups —
   the leg and the run along the wall — so the walk is stopped by its L, not by the whole rectangle */
// the «Уютная логика» backs (the wardrobe's and the mezzanine's): HDF t thick, nailed over the carcass's rear edges, in from its edges
const HDF={t:4,in:2};
const WR={W:1364,D:964,C:964,d:500,H:2200,pl:70,t:16,ft:16,gap:2,strip:50,shelves:4,top:1650,rods:[1590,860],rod:25,
  mirror:{w:400,h:400,y0:1300,frame:10,d:20}};   // W along the wall, D out from it; C the corner unit's legs, d the depth;
   // the left part's shelves (evenly), the right part's top shelf and its rods (their axes), the rods' Ø; on the leg's end the mirror
   // (its frame, its bottom); the coat rail under it: HK
// the wardrobe and the mezzanine, each in one finish all over, each its own: white or Диамант серый U963 ST9 (furniture.js: UNI, as the
// bathroom's carcass) — the next one by a click on its panels (a door's click opens it) or by its card's «Следующий вариант →»; it stays through the kitchen's rebuilds.
// Of forms (the wardrobe: without and with the section on the leg's end) each in both colours: variant i — colour i % colours, form
// ⌊i / colours⌋ (form); a new form builds the kitchen again
const WARD_COLORS=[{type:'uni',color:'#F1F0EA',name:'Белый'},UNI.U963];
const paintIn=(mats,f)=>applyMaterials(mats,{carcass:f,front:f,top:f,apron:null},30);   // mats in one finish f all over
function colorSwitch(forms=1){
  const k=WARD_COLORS.length;
  const o={i:0,form:0,mats:makeMats(),
    paint(){paintIn(o.mats,WARD_COLORS[o.i%k]);},
    click(){o.i=(o.i+1)%(k*forms);o.paint();const f=Math.floor(o.i/k);if(f!==o.form){o.form=f;rebuild();}},
    // its card c (card() gives it again): its colour first, which variant of how many and a link to the next one (paged)
    card:(card,c)=>paged(Object.assign(c,{lines:[`Цвет: ${finName(WARD_COLORS[o.i%k])}.`].concat(c.lines)}),o.i,k*forms,o.click,card)};
  o.paint();return o;
}
const wardColor=colorSwitch(2),mzColor=colorSwitch();
/* the backs at the sofa (the leg's, the add-on's on its end): HDF as bought, or LDSP as thick as the carcass in place of it, white or grey,
   or LDSP with slatted panels glued over it (WARD_BACKS, BACK_PANELS) — the next by a click on any of them or by their card's «Следующий вариант →»;
   a new thickness or other panels build the kitchen again; it stays through the rebuilds. The LDSP: one row over the leg's whole rear (the end
   section's too), flush with its end, 4 short of the wall, of sheets cut from one more add-on section (INFO.wardBack) — its two sides (480 × 2200), and with the end section its door too (400 × 2126) against the
   wall, its top level with theirs: its shortfall at the bottom is behind the sofa (400 + 480 + 480 = 1364 − 4); the carcasses as
   deep as ever: the wardrobe 12 more toward the kitchen wall (wardGrow), the racks' room 12 less. Their colour their own (backMats) */
/* the panels glued over the LDSP (Ozon), upright, W wide (as sold), t thick: one row of them over the LDSP's, from the leg's end toward the wall, the
   last one cut, up to the LDSP's end (4 short of the wall); floor to top, cut from L. Their outer face at the sofa: the wardrobe t more toward the kitchen wall.
   САВАШ ГРАНЬ (MDF, as the maker's drawings): its face a run of facets fw wide, each sloping from its full thickness down by drop (ours, by the
   drawing) to a step up to the next one (an extruded profile). A module 116 wide: a tongue 10 under the piece before it, four facets (vis: 106 shows);
   each facet high on the wall's side. Its finishing strip (head: 36.5 wide, a tongue 10 under the module next to it, one facet) at the leg's end,
   whole modules from it, the last one cut by whole facets, its starter strip (tail: one facet, a rebate under its other edge for that module's
   tongue) after it: the row whole facets, short of the wall by what is left (< fw).
   Only what shows is drawn: the tongues lie hidden. So that the facets read in the scene: the edges drawn, as the furniture's, and each facet
   darker down to the foot of its step (shade: as in a groove's shadow).
   САВАШ «Графит» (acoustic, as the maker's drawing) — 600 wide, a dark backing (base) and n slats over it, slat wide, evenly (W / n apart): the
   first one flush with the panel's edge, the backing a gap past the last one at the other. Laid with that flush edge at the leg's end: the row
   starts with a slat, and over the joints the gap stays the same; the last panel cut at the wall, its slat there too if it falls on the cut.
   name: the product; a strip's: which it is */
const pmat=(c,vc)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.7,vertexColors:!!vc});
const BACK_PANELS={
  gran:{W:116,vis:106,L:2800,t:16,fw:26.5,drop:6,shade:.78,price:750,url:'https://ozon.ru/t/QGoXSss',slatMat:pmat(WARD_COLORS[0].color,true),
    name:'Панель ГРАНЬ САВАШ «Белый»',
    head:{W:36.5,vis:26.5,price:150,url:'https://ozon.ru/t/JHTewdc',name:'Финишная планка ГРАНЬ САВАШ «Белый»',strip:'finish'},
    tail:{W:26.5,vis:26.5,price:150,url:'https://ozon.ru/t/sZYUjbm',name:'Стартовая планка ГРАНЬ САВАШ «Белый»',strip:'start'}},
  graphite:{W:600,L:2780,t:9,base:3,n:16,slat:25,price:2600,url:'https://ozon.ru/t/bmatRZn',baseMat:pmat('#232427'),slatMat:pmat('#45474b'),
    name:'Панель САВАШ «Графит»'}};
// c: the LDSP's colour (WARD_COLORS); over: the panels over it (BACK_PANELS)
const WARD_BACKS=[{hdf:true},{c:0},{c:1},{c:1,over:'graphite'},{c:0,over:'gran'}];
const backMats=makeMats();paintIn(backMats,WARD_COLORS[0]);   // the backs' own: the LDSP's colour, the HDF's 'back' as made
const wardBack={i:0,at:()=>WARD_BACKS[wardBack.i],
  click(){const g0=wardGrow(),o0=wardBack.at().over;wardBack.i=(wardBack.i+1)%WARD_BACKS.length;if(ldspBack())paintIn(backMats,WARD_COLORS[wardBack.at().c]);
    if(wardGrow()!==g0||wardBack.at().over!==o0)rebuild();}};
const ldspBack=()=>!wardBack.at().hdf;
const backPanels=()=>BACK_PANELS[wardBack.at().over]||null;   // the panels over the LDSP, if any
/* where they show (kitchen x [from, to]), from the leg's end u0 toward the wall: the strip at the leg's end (head), the panels (the last one cut),
   the strip at the wall's (tail); faceted, the row whole facets (L), short of the LDSP's end by what is left. vis: how wide one shows */
const panelLay=()=>{const bp=backPanels(),vis=bp.vis||bp.W,u0=P.Rx-wardLeg(),u1=P.Rx-HDF.t,ps=[];
  const L=bp.fw?Math.floor((u1-u0)/bp.fw+1e-9)*bp.fw:u1-u0,{head:h,tail:t}=bp,r0=h?h.vis:0,f=L-(t?t.vis:0);
  for(let r=r0;r<f-1e-9;r+=vis)ps.push([u0+r,u0+Math.min(r+vis,f)]);
  return {head:h&&[u0,u0+r0],tail:t&&[u0+f,u0+L],pieces:ps,cut:ps[ps.length-1][1]-ps[ps.length-1][0]<vis};};
const wardExt=()=>wardColor.form===1;   // the wardrobe with its second add-on section, on the leg's end
const wardLeg=()=>WR.D+(wardExt()?WR.W-WR.C:0);   // how far the leg goes out from the wall: up to the section's end, if it has one
const wardEndName=()=>wardExt()?'доп. секции, выступающей в комнату':'углового шкафа';   // whose end the mirror and the coat rail are on
const wardAt=()=>sofaAt();   // kitchen z of its side at the sofa; it goes from there toward the kitchen wall
// its LDSP backs at the sofa grow it by what they are thicker than the HDF, and the panels over them by theirs: the carcasses as deep, all of it
// that much toward the kitchen wall (its back's outer face still at the sofa: wardAt), the racks' room that much less
const wardGrow=()=>(ldspBack()?WR.t-HDF.t:0)+(backPanels()?backPanels().t:0);
const wardBody=()=>wardAt()-wardGrow();   // kitchen z of the carcasses' sofa side: where the HDF back's outer face is
const wardEnd=()=>wardBody()-WR.W;   // kitchen z of its far side along the wall
function wardrobeParts(){
  const [parts,add]=partList(),own={sofaBack:true,info:INFO.wardBack};   // own: the backs at the sofa's (their click, their card)
  const {W,D,C,d,H,pl,t,ft,gap}=WR,X=P.Rx,s=wardBody(),yt=H-t,cd=d-ft;   // X: the wall; s: the carcasses' sofa side; cd: the carcass's depth behind the doors
  const xF=X-d,zF=s-d,xE=X-D,zE=s-C,zA=s-W;   // the doors' faces: along the wall, the leg's; the leg's end; the corner unit's far side; the add-on's
  const fy0=pl+gap,fy1=H-gap,cu=' углового шкафа',ad=' доп. секции';
  // a carcass as the shop's: sides down to the floor at its ends, the top, the bottom and the plinths (in front, at the back in front of
  // the back: no hole under the bottom) between them, all as deep; the HDF back over their rear edges, 2 in from the carcass's edges, down to the bottom's underside, in as many
  // sheets alike, edge to edge; its shelves at ys (20 in from the front); across its width u0–u1, its body from behind its doors (v0) to
  // its back's outer face (v1); along the wall (u: z, v: x) or along the leg (u: x, v: z)
  // A carcass at the sofa (sofa): its HDF back is one of the backs at the sofa (sofaBack: their click, their card); none with the LDSP ones, those
  // go in one row over the leg's whole rear (below)
  const carcass=(nm,u0,u1,v0,v1,leg,ys,sheets=1,sofa=false)=>{
    const a=(n,mat,ua,ub,y0,y1,va,vb,e)=>leg?add(n+nm,mat,ua,ub,y0,y1,va,vb,e):add(n+nm,mat,va,vb,y0,y1,ua,ub,e);
    [u0,u1-t].forEach(u=>a('Боковина','carcass',u,u+t,0,H,v0,v1-HDF.t));
    a('Крыша','carcass',u0+t,u1-t,yt,H,v0,v1-HDF.t);
    a('Дно','carcass',u0+t,u1-t,pl,pl+t,v0,v1-HDF.t);
    a('Цоколь','carcass',u0+t,u1-t,0,pl,v0,v0+t);
    a('Цоколь задний','carcass',u0+t,u1-t,0,pl,v1-HDF.t-t,v1-HDF.t);
    const b0=u0+HDF.in,sw=(u1-u0-2*HDF.in)/sheets;
    if(!(sofa&&ldspBack()))for(let i=0;i<sheets;i++)a(sheets>1?`Лист ${i+1} задней стенки`:'Задняя стенка','back',b0+i*sw,b0+(i+1)*sw,pl,H-HDF.in,v1-HDF.t,v1,sofa?own:null);
    ys.forEach(y=>a('Полка','carcass',u0+t,u1-t,y,y+t,v0+20,v1-HDF.t));
  };
  // the corner unit: two carcasses, held together by the stile. On the left (along the wall, zE up to the leg's carcass: 480) the one
  // for shelves, its back against the wall, four shelves as the add-on's, its side at the leg in the leg's door plane, against the leg's
  // carcass (fixed to it); on the right the leg (xE to the wall: 964), for hangers, its back at the sofa in two sheets, a side against
  // the wall: the shelf at the top, the rods under it (buildWardrobe) through the corner behind the left one
  const n=WR.shelves,st=(yt-pl-t-n*t)/(n+1),shelfY=[...Array(n)].map((_,i)=>Math.round(pl+t+(i+1)*st+i*t));   // the add-on section's too
  carcass(cu+' — слева',zE,zF+ft,X-cd,X,false,shelfY);   // up to the leg's carcass
  carcass(cu+' — справа',xE,X,s-cd,s,true,[],2,true);
  add('Полка'+cu+' — справа','carcass',xE+t,X-t,WR.top,WR.top+t,s-cd,s-HDF.t);
  // the stile at the inner corner: a strip in each front's plane, the one along the wall over the corner where they meet
  const w=WR.strip;
  add('Планка'+cu+' — у дивана','carcass',xF-w,xF,fy0,fy1,zF,zF+ft);
  add('Планка'+cu+' — вдоль стены','carcass',xF,xF+ft,fy0,fy1,zF-w,zF+ft);
  // its two doors, hinged at their outer ends, up to the strips: the leg's toward the kitchen wall, the other into the room
  add('Дверь'+cu+' — у дивана','front',xE+gap/2,xF-w-gap,fy0,fy1,zF,zF+ft,{pivot:{x:xE+gap/2,z:zF,s:1}});
  add('Дверь'+cu+' — вдоль стены','front',xF,xF+ft,fy0,fy1,zE+gap/2,zF-w-gap,{pivot:{x:xF,z:zE+gap/2,s:-1}});
  // the add-on section: four shelves as the corner unit's left part, its door hinged at the far end
  carcass(ad,zA,zE,X-cd,X,false,shelfY);
  add('Дверь'+ad,'front',xF,xF+ft,fy0,fy1,zA+gap/2,zE-gap/2,{pivot:{x:xF,z:zA+gap/2,s:-1}});
  // the second one, if it has it: on the leg's end (xN its outer side), the first one turned to the leg — its back at the sofa, its door in
  // line with the leg's, hinged at its outer end
  if(wardExt()){
    const xN=X-wardLeg(),an=ad+' — на торце';
    carcass(an,xN,xE,s-cd,s,true,shelfY,1,true);
    add('Дверь'+an,'front',xN+gap/2,xE-gap/2,fy0,fy1,zF,zF+ft,{pivot:{x:xN+gap/2,z:zF,s:1}});
  }
  // the LDSP backs at the sofa, if they are LDSP: flush with the leg's end, edge to edge toward the wall (what is left, 4, at the wall), over the carcasses' rear edges —
  // the donor's two sides (480 = its carcass's depth: d − ft − HDF), with the end section its door (400 × 2126) against the wall, top level
  if(ldspBack()){
    const side=d-ft-HDF.t,dw=W-C,dh=fy1-fy0,ws=wardExt()?[side,side,dw]:[side,side];
    let u=X-wardLeg();
    ws.forEach((w,i)=>{const dr=i===2;add(`Лист ${i+1} задней стенки шкафа — у дивана`,'carcass',u,u+w,dr?H-dh:0,H,s-HDF.t,s-HDF.t+t,own);u+=w;});
  }
  return parts;
}
/* the mezzanine as OZON «Уютная логика» 100×50×50 (two of them), white or grey (mzColor), apart from the wardrobe: two sections 1000 long, 500 deep and 500 high, two handleless doors
   in each, hinged at the section's ends, into the room. On the right wall over the sofa, from 1700 up to the wardrobe's top at 2200,
   along the wall from the wardrobe's side toward the window. Kitchen axes (mm), as the wardrobe */
const MZ={n:2,L:1000,d:500,y0:1700,y1:2200,t:16,ft:16,gap:2,price:3500,url:'https://ozon.ru/t/ivoD7B6'};   // each section an OZON product: its price, its link
function mezzanineParts(){
  const [parts,add]=partList();
  const {n,L,d,y0,y1,t,ft,gap}=MZ,X=P.Rx,cd=d-ft,xF=X-d;
  for(let i=0;i<n;i++){
    const z0=wardAt()+i*L,z1=z0+L,zm=(z0+z1)/2,nm=' антресоли — секция '+(i+1);
    // the sides, the top and the bottom as deep, the HDF back over their rear edges (as the wardrobe's)
    [z0,z1-t].forEach(z=>add('Боковина'+nm,'carcass',X-cd,X-HDF.t,y0,y1,z,z+t));
    add('Крыша'+nm,'carcass',X-cd,X-HDF.t,y1-t,y1,z0+t,z1-t);
    add('Дно'+nm,'carcass',X-cd,X-HDF.t,y0,y0+t,z0+t,z1-t);
    add('Задняя стенка'+nm,'back',X-HDF.t,X,y0+HDF.in,y1-HDF.in,z0+HDF.in,z1-HDF.in);
    add('Дверь'+nm+', левая','front',xF,xF+ft,y0+gap,y1-gap,z0+gap/2,zm-gap/2,{pivot:{x:xF,z:z0+gap/2,s:-1}});
    add('Дверь'+nm+', правая','front',xF,xF+ft,y0+gap,y1-gap,zm+gap/2,z1-gap/2,{pivot:{x:xF,z:z1-gap/2,s:1}});
  }
  return parts;
}
function buildMezzanine(g,opts){
  const d=buildParts({parts:mezzanineParts()},mzColor.mats,opts);
  d.model.userData.mezzanine=true;d.model.userData.info=INFO.mezzanine;
  d.model.children.forEach(o=>{o.userData.click=mzColor.click;});   // the next colour
  g.add(d.model);
  return d.doors;
}
const rodMat=new THREE.MeshStandardMaterial({color:0xc8c9cb,roughness:.25,metalness:.85});   // chrome
const mirrorMat=new THREE.MeshStandardMaterial({color:0xc9d1d4,roughness:.06,metalness:.35});   // the glass: light, glossy
const wardBlackMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#3a3b3d').convertSRGBToLinear(),roughness:.5,metalness:.2});   // the mirror's frame, the coat rail: dark grey (their cards say black)
const knobWoodMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#9c7552').convertSRGBToLinear(),roughness:.7});   // its hooks' balls
/* the coat rail under the mirror: a black bar along the face, hooks off it — each a black peg, a wooden ball on its end.
   L along the face, h its height, t out from the face, y its bottom; the pegs' length and Ø, the balls' Ø */
const HK={L:380,h:30,t:12,y:1170,n:4,peg:40,pegD:8,ball:26};
/* the mirror and the coat rail on the leg's end (its face at x Rx − wardLeg(), the room on its −x side), in the middle of its width, in g;
   each its own group with its own «i» */
function wardrobeEnd(g){
  const {mirror:M}=WR,x=P.Rx-wardLeg(),zc=(wardBody()-WR.d+wardAt())/2,f=M.frame,y1=M.y0+M.h;
  const group=(info,key)=>{const q=new THREE.Group();q.userData.info=info;q.userData[key]=true;g.add(q);return q;};
  const at=(q,m,x,y,z)=>{m.position.set(mm(x),mm(y),mm(z));m.castShadow=true;q.add(m);return m;};
  // the mirror: the frame round the glass, the glass set into it
  const mg=group(INFO.mirror,'mirror'),mb=boxIn(mg),b=(x0,x1,y0,y1,z0,z1,mat)=>mb(mm(x0),mm(x1),mm(y0),mm(y1),mm(z0),mm(z1),mat);
  b(x-M.d,x,y1-f,y1,zc-M.w/2,zc+M.w/2,wardBlackMat);b(x-M.d,x,M.y0,M.y0+f,zc-M.w/2,zc+M.w/2,wardBlackMat);
  [zc-M.w/2,zc+M.w/2-f].forEach(z=>b(x-M.d,x,M.y0+f,y1-f,z,z+f,wardBlackMat));
  b(x-M.d+4,x,M.y0+f,y1-f,zc-M.w/2+f,zc+M.w/2-f,mirrorMat).userData.glass=true;
  // the coat rail: the bar, the hooks evenly along it
  const hg=group(INFO.hanger,'hanger'),{L,h,t,y,n,peg,pegD,ball}=HK,yc=y+h/2;
  boxIn(hg)(mm(x-t),mm(x),mm(y),mm(y+h),mm(zc-L/2),mm(zc+L/2),wardBlackMat).userData.bar=true;
  for(let i=0;i<n;i++){
    const z=zc-L/2+L*(i+.5)/n;
    at(hg,new THREE.Mesh(new THREE.CylinderGeometry(mm(pegD/2),mm(pegD/2),mm(peg),12),wardBlackMat),x-t-peg/2,yc,z).rotation.z=Math.PI/2;
    at(hg,new THREE.Mesh(new THREE.SphereGeometry(mm(ball/2),18,12),knobWoodMat),x-t-peg-ball/2+4,yc,z).userData.ball=true;
  }
}
// the slatted panels on the LDSP backs at the sofa, in g: their own group, the backs' click and card
function wardSlats(g){
  const bp=backPanels(),{head,tail,pieces}=panelLay(),z0=wardAt()-bp.t,z1=wardAt(),H=WR.H;
  const q=new THREE.Group();q.userData.slats=true;q.userData.info=INFO.wardBack;q.userData.click=wardBack.click;g.add(q);
  const b=boxIn(q),box=(x0,x1,za,zb,mat)=>b(mm(x0),mm(x1),0,mm(H),mm(za),mm(zb),mat);
  // a faceted piece over a–e: its profile (kitchen x, z) round from the back, the facets from the e end back to a, each high on the wall's side
  // (e), down to the foot of its step at the next one's (a cut piece's last one as far as it goes)
  const saw=([a,e])=>{
    const w=e-a,{fw,t,drop}=bp,j1=Math.ceil(w/fw)-1,pts=[[e,z0],[a,z0],[a,z0+t-drop*(w-j1*fw)/fw]];
    for(let j=j1;j>0;j--)pts.push([e-j*fw,z0+t],[e-j*fw,z0+t-drop]);
    pts.push([e,z0+t]);
    const sh=new THREE.Shape();pts.forEach(([x,z],i)=>sh[i?'lineTo':'moveTo'](mm(x),-mm(z)));
    const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:mm(H),bevelEnabled:false}),bp.slatMat);
    m.rotation.x=-Math.PI/2;m.castShadow=m.receiveShadow=true;m.userData.profile=pts.map(p=>p.map(v=>Math.round(v*10)/10));q.add(m);
    // its edges, as the furniture's (furniture.js: buildParts), in the backs' colour's
    const ed=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),backMats.edge);ed.raycast=()=>{};m.add(ed);
    // each facet darker down to the foot of its step (shade there, 1 at its crest); the back and the ends' lower part as they are
    const ps=m.geometry.attributes.position,c=[];
    for(let i=0;i<ps.count;i++){const o=-ps.getY(i)/MM-z0,k=o<.5?1:Math.max(0,Math.min(1,(o-t+drop)/drop)),v=bp.shade+(1-bp.shade)*k;c.push(v,v,v);}
    m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
    return m;
  };
  if(head)saw(head).userData.strip=bp.head.strip;
  if(tail)saw(tail).userData.strip=bp.tail.strip;
  pieces.forEach(([a,e])=>{
    if(bp.fw){saw([a,e]).userData.module=true;return;}
    // the slats from its edge at a, as far as it goes (one on the cut as much as is left of it)
    const pitch=bp.W/bp.n,zb=z0+bp.base;box(a,e,z0,zb,bp.baseMat);
    for(let j=0,x=a;j<bp.n&&x<e;j++,x+=pitch)box(x,Math.min(x+bp.slat,e),zb,z1,bp.slatMat);
  });
}
function buildWardrobe(g,opts){
  const ps=wardrobeParts(),s=wardBody(),zF=s-WR.d,leg=p=>p.x0<P.Rx-WR.d||(p.z0+p.z1)/2>zF+WR.ft;   // the leg: out past the run's fronts, or behind its door; the left carcass's side at it goes with the run
  return [ps.filter(leg),ps.filter(p=>!leg(p))].flatMap((parts,i)=>{
    const d=buildParts({parts:parts.filter(p=>!p.sofaBack)},wardColor.mats,opts);
    d.model.userData.wardrobe=true;d.model.userData.info=INFO.wardrobe;
    d.model.children.forEach(o=>{o.userData.click=wardColor.click;});   // its panels (a new form: the kitchen built again), before the rods, the mirror and the coat rail join them
    // the backs at the sofa (HDF or LDSP) with their own materials, in the same group: a click on any of them gives them all the next one
    buildParts({parts:parts.filter(p=>p.sofaBack)},backMats,opts).model.children.slice().forEach(o=>{o.userData.click=wardBack.click;d.model.add(o);});
    // the rods in the leg: across its opening, in the middle of its depth behind the door, from side to side
    if(i===0){const x0=P.Rx-WR.D+WR.t,x1=P.Rx-WR.t,z=(zF+WR.ft+s-HDF.t)/2;
      WR.rods.forEach(y=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(WR.rod/2*MM,WR.rod/2*MM,(x1-x0)*MM,20),rodMat);
        r.rotation.z=Math.PI/2;r.position.set((x0+x1)/2*MM,y*MM,z*MM);r.castShadow=true;r.userData.rod=true;d.model.add(r);});
      wardrobeEnd(d.model);if(backPanels())wardSlats(d.model);}
    g.add(d.model);
    return d.doors;
  });
}

