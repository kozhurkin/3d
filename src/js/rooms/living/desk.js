/* ========== the work place: by the left wall ========== */

/* the writing desk as IKEA HEMNES 155×65, black-brown, with its add-on unit: 1550 × 650, 740 high, 670 free under its knee rail. A top on two
   pedestals of 50 mm legs: on the left a cabinet with a frame-and-panel door and a shelf, on the right two drawers; inset
   fronts with knobs. Along the left wall of the kitchen, its end 100 mm from the window wall (DK.gap; against it when
   the kitchen says so: kitchen.js, placeDining, DeskWall). Its own axes (mm): x along it from the window end, y up, z from the wall into the room;
   turned onto the kitchen's: its x toward the kitchen wall (−z), its z along x */
const DK={W:1550,D:650,H:740,top:30,leg:50,ov:20,ped:420,free:670,gap:100};   // gap: from the window wall (set by the kitchen: living.setGap)
const GAP=DK.gap;
const deskFIN={carcass:{type:'uni',color:'#3b302a',name:'Чёрно-коричневый'},front:{type:'uni',color:'#3b302a',name:'Чёрно-коричневый'},top:{type:'uni',color:'#3b302a',name:'Чёрно-коричневый'},apron:null};
const deskMats=makeMats();applyMaterials(deskMats,deskFIN,0);   // solid wood: the end faces as dark as the rest (no edge-band contrast)
function deskParts(){
  const [parts,add]=partList();
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
  shelfParts(add);
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
/* the shelf over the add-on unit, in the middle of the desk's length, one of four (SHC): IKEA HEMNES wall shelf at first (hemnesParts),
   its top level with the display cabinet's; or a board 1500 × 250, 30 thick, its bottom 300 over the add-on unit (1370 + 300 = 1670),
   on two brackets: black-brown as the desk, oak Casella (on dark grey brackets both), white (on white ones). A click on any of them
   (engine.js: userData.click) shows the next; the one shown stays through the kitchen's rebuilds. Desk axes, mm */
const SH={W:1500,D:250,t:30,gap:300,name:'Полка над столом'};
const shelfFinMats=f=>{const m=makeMats();applyMaterials(m,Object.assign({},deskFIN,{carcass:f}),0);return m;};
const bracketWhite=new THREE.MeshStandardMaterial({color:0xf2f2ef,roughness:.45,metalness:.2}),bracketGrey=new THREE.MeshStandardMaterial({color:0x222325,roughness:.45,metalness:.3});
const SHC=[{name:'HEMNES',hemnes:true,mats:deskMats,br:bracketGrey},   // its mats and br: the board's and its brackets' while hidden
  {name:'доска как стол',desc:'Чёрно-коричневая, как стол',mats:deskMats,br:bracketGrey,brName:'тёмно-серых'},
  {name:'доска дуб Каселла',desc:'Дуб Каселла натуральный, как столешница кухни',mats:shelfFinMats({type:'wood',decor:'C1385'}),br:bracketGrey,brName:'тёмно-серых'},
  {name:'доска белая',desc:'Белый премиум W1000 ST9, как корпуса кухни',mats:shelfFinMats({type:'uni',color:'#F1F0EA',name:'Белый премиум W1000 ST9'}),br:bracketWhite,brName:'белых'}];
let shelfPick=0,nextShelf=()=>{};   // which one is shown; nextShelf: shows the next on the desk built last (buildShelf)
const isHemnes=o=>!!(o.userData.part&&o.userData.part.hemnes===true);
const isShelf=o=>o.userData.shelfBracket===true||isHemnes(o)||!!(o.userData.part&&o.userData.part.name===SH.name);
// the shelves in the desk's built group: HEMNES or the board on its brackets shown, the board's colours as they are now
function showShelf(desk){
  const c=SHC[shelfPick],is=(m,k)=>SHC.some(s=>s.mats[k]===m);
  desk.children.filter(isShelf).forEach(o=>{
    const hm=isHemnes(o);o.visible=hm===!!c.hemnes;
    if(hm||c.hemnes)return;
    if(o.userData.shelfBracket===true){o.material=c.br;return;}
    o.material=o.material.map(m=>is(m,'carcass')?c.mats.carcass:is(m,'carcassEnd')?c.mats.carcassEnd:m);
    o.children.forEach(e=>{if(is(e.material,'edge'))e.material=c.mats.edge;});
  });
}
const shelfY0=()=>DK.H+AU.H+SH.gap;
function shelfParts(add){
  const x0=(DK.W-SH.W)/2,y0=shelfY0();
  add(SH.name,'carcass',x0,x0+SH.W,y0,y0+SH.t,0,SH.D,{info:INFO.shelf});
  hemnesParts(add);
}
/* IKEA HEMNES wall shelf, black-brown, solid pine: 1480 × 364 (its top), 339 high; its top level with the display cabinet's (1970).
   A top 22 over the carcass, 10 proud of it at the ends and in front; the carcass 1460 × 354: at each end a frame of two posts and
   two rails round a panel 268 wide (the frame's outer face 8 proud of it), a bottom 22 between them, a back at the wall; three open
   compartments 255 high, about 451 wide, two dividers between them, a rail 40 under the top across the front. Desk axes, mm */
const HM={W:1480,D:364,H:339,d:354,top:22,ov:10,side:35,post:43,rail:50,inset:8,bottom:22,front:40,div:18,back:8};
const hemnesY0=()=>VT.H-HM.H;
function hemnesParts(add){
  const {W,D,H,d,top,ov,side:sd,post,rail,inset,bottom:bt,front:fr,div,back:bk}=HM,ox=(DK.W-W)/2,oy=hemnesY0(),yt=H-top,nm=' полки HEMNES';
  const a=(name,x0,x1,y0,y1,z0,z1,mat='carcass')=>add(name+nm,mat,ox+x0,ox+x1,oy+y0,oy+y1,z0,z1,{info:INFO.shelf,hemnes:true});
  a('Верх',0,W,yt,H,0,D,'top');
  const ia=ov+sd,ib=W-ov-sd;   // inside, between the ends
  [[ov,ia,ov+inset,ia],[ib,W-ov,ib,W-ov-inset]].forEach(([x0,x1,p0,p1])=>{
    [0,d-post].forEach(z=>a('Стойка',x0,x1,0,yt,z,z+post));
    [[0,rail],[yt-rail,yt]].forEach(([y0,y1])=>a('Царга боковины',x0,x1,y0,y1,post,d-post));
    a('Филёнка боковины',p0,p1,rail,yt-rail,post,d-post);
  });
  a('Дно',ia,ib,0,bt,0,d);
  a('Задняя стенка',ia,ib,bt,yt,0,bk);
  a('Передняя царга',ia,ib,yt-fr,yt,d-20,d);
  const o=(ib-ia-2*div)/3;   // each compartment's width
  [1,2].forEach(k=>{const x=ia+k*o+(k-1)*div;a('Перегородка',x,x+div,bt,yt-fr,bk,d);});
}
/* its brackets: two powder-coated steel L-brackets under it (white or dark grey, as the shelf: showShelf), 25 wide, 4 thick,
   150 from its ends; an arm 200 under the board, another 150 down the wall, a strut at 45° between them. Added to the desk's built
   group (m), the board's colour on it and them; a click on any of them the next colour */
const SHB={end:150,w:25,t:4,arm:200,leg:150};
/* one such L-bracket in g, its axes as the desk's (mm → m): the wall at z 0, the room +z; its middle at x c, the board's bottom at
   y0. An arm under the board, another down the wall, the strut at 45° from the wall arm's foot up to the under arm; or (up) a plain
   L: the wall arm up from the under arm, behind the board, screwed to the wall over it. Its meshes */
function lBracket(box,c,y0,{w,t,arm,leg},mat,up=false){
  const m=v=>v*MM,bar=(ya,yb,z1)=>box(m(c-w/2),m(c+w/2),m(ya),m(yb),0,m(z1),mat);
  const ms=[bar(y0-t,y0,arm),up?bar(y0,y0-t+leg,t):bar(y0-leg,y0-t,t)];   // under the board; on the wall, up behind it or down
  if(!up){const s=bar(0,leg*Math.SQRT2,t);s.rotation.x=Math.PI/4;s.position.set(m(c),m(y0-t-leg/2),m(leg/2));ms.push(s);}   // the strut
  return ms;
}
function buildShelf(desk){
  const box=boxIn(desk),x0=(DK.W-SH.W)/2,y0=shelfY0(),br=SHC[shelfPick].br;
  const ms=[x0+SHB.end,x0+SH.W-SHB.end].flatMap(c=>lBracket(box,c,y0,SHB,br));
  ms.forEach(o=>Object.assign(o.userData,{info:INFO.shelf,shelfBracket:true}));
  nextShelf=()=>{shelfPick=(shelfPick+1)%SHC.length;showShelf(desk);};
  desk.children.filter(isShelf).forEach(o=>{o.userData.click=nextShelf;});
  showShelf(desk);
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
  hemnesFronts(d.doors,deskMats);buildShelf(d.model);
  d.model.rotation.y=Math.PI/2;d.model.position.set(0,0,(P.L-DK.gap)*MM);d.model.userData.desk=true;d.model.userData.info=INFO.desk;
  g.add(d.model);
  return d.doors.concat(buildMacbook(d.model,opts));
}

