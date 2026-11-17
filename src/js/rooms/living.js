/* ---------- the rest of the kitchen room: what is not the kitchen ----------
   The room on the plan is one (ROOMS: kitchen). Along the kitchen wall stands the kitchen (kitchen.js: its cabinets, its appliances,
   the dining table with its chairs, its lamp and the shelf over it); the rest of the room is here: the work place by the left wall
   (the desk with its add-on unit and the shelf over it, the MacBook, the desk chair, the display cabinet) and the living part by the
   right wall (the wardrobe with its mirror and coat rail, the mezzanine, the sofa and the shelf over it, the metal racks).
   Kitchen coordinates (kitchen.js), mm. The kitchen builds all of it with its own things (kitchen.js: extra) and gives it what it
   needs (attach): where the walls are (P: Rx, L), its appliances' doors (applDoor), their handles' grey (handleMat), its rebuild.
   None of it is in the kitchen tab: it stands in the apartment (the plan, the walk). Own scope, as the room modules'. */
const living=(function(){
let P=null,applDoor=null,handleMat=null,rebuild=null;   // the kitchen's: living.attach

/* what they are: the card under the «i» (engine.js), as the kitchen's INFO */
const cm=mm=>String(mm/10).replace('.',',');   // mm as the cards' cm, a comma for the decimal
const INFO={
  desk:{title:'Письменный стол HEMNES (IKEA)',lines:['Чёрно-коричневый, массив сосны.','155 × 65 см, высота 74 см, под столом 67 см.','Слева тумба с дверцей и полкой, справа два ящика.']},
  addon:{title:'Надстройка HEMNES для стола (IKEA)',lines:['Чёрно-коричневая, массив сосны.','152 × 25 см, высота 63 см; стол с ней — 137 см.','По краям две секции с ящиком и полками, посередине открытая полка.']},
  macbook:{title:'MacBook Pro 16″ (Apple)',lines:['Серебристый, алюминиевый корпус.','35,57 × 24,81 см, толщина 1,68 см; 2,1 кг.','Экран Liquid Retina XDR 16,2″, 3456 × 2234; крышка открывается до 110°.']},
  shelf:()=>({title:'Настенная полка',lines:[`${SHC[shelfColor].desc}; на двух ${SHC[shelfColor].brName} стальных кронштейнах с косынкой.`,'150 × 25 см, толщина 3 см.','Кронштейны из стальной полосы 4 мм шириной 25 мм, в 15 см от краёв полки: плечо 20 см под полкой, стойка 15 см по стене вниз, косынка между ними.','Над надстройкой стола, в 30 см над ней: низ на 167 см от пола.',`Нажатие меняет цвет: ${SHC.map(c=>c.name).join(' → ')}.`]}),
  deskChair:{title:'Офисное кресло MILLBERGET (IKEA)',lines:['Бумстад золотисто-коричневый (кожа); подлокотники и крестовина на колёсиках чёрные.','65 × 65 см, высота 118–128 см; сиденье 52 × 49 см на высоте 46–56 см.','Выдвинуто от письменного стола; нажатие задвигает его под стол и обратно.']},
  vitrine:{title:'Витрина HEMNES с 3 ящиками (IKEA)',lines:['Чёрно-коричневая, массив сосны, закалённое стекло.','90 × 37 см, высота 197 см.','Две стеклянные дверцы, три переставные полки, три ящика.']},
  wardrobe:()=>wardColor.card(INFO.wardrobe,ozon({title:'Угловой шкаф «Уютная логика» (OZON)',lines:['Распашные двери без ручек (открываются нажатием).','Угловой 96,4 × 96,4 см и доп. секция 40 × 50 см, высота 220 см, глубина 50 см.','В угловом слева четыре полки, справа — полка и две штанги для вешалок; в доп. секции четыре полки.'],buy:WARD_PRODUCTS})),
  mezzanine:()=>mzColor.card(INFO.mezzanine,ozon({title:'Антресоль «Уютная логика» (OZON)',lines:['Распашные двери без ручек (открываются нажатием).',`${MZ.n} секции по ${MZ.L/10} см, глубина ${MZ.d/10} см, высота ${(MZ.y1-MZ.y0)/10} см; по две двери в каждой.`,'На стене над диваном, от 170 до 220 см от пола — вровень со шкафом.'],
    buy:[{name:'Антресоль 100 × 50 × 50',n:MZ.n,price:MZ.price,url:MZ.url}]})),
  mirror:()=>({title:'Зеркало',lines:[`40 × 40 см, в чёрной рамке ${WR.mirror.frame} мм.`,'На торце углового шкафа, от 130 до 170 см от пола.']}),
  rack:()=>({title:'Металлический стеллаж',lines:[`${cm(rackW())} × ${RK.D/10} см, высота ${RK.H/10} см.`,`Светло-серый, порошковая окраска; стойки — перфорированный уголок ${RK.post} × ${RK.post} мм, полки на болтах.`,`${RK.n} полок, нижняя у пола.`,'Два одинаковых рядом на правой стене, между проходом на кухню и угловым шкафом.',`Место под оба — ${cm(wardAt()-WR.W)} см вдоль стены, от угла до шкафа; зазоры по ${cm(RK.gap)} см с краёв и между ними.`]}),
  hanger:{title:'Настенная вешалка',lines:['Чёрная планка 38 × 3 см, четыре крючка с деревянными шариками.','На торце углового шкафа под зеркалом, на высоте 117 см.']},
  sofaShelf:()=>({title:'Полка над диваном',lines:['Белый премиум W1000 ST9, как корпуса кухни; на трёх белых стальных L-образных кронштейнах.',`${cm(SS.L)} × ${cm(SS.D)} см, толщина ${cm(SS.t)} см.`,`Кронштейны из стальной полосы ${SHB.t} мм шириной ${SHB.w} мм, в ${cm(SHB.end)} см от краёв и посередине: плечо ${cm(SHB.arm)} см под полкой, стойка ${cm(SHB.leg)} см по стене вверх, крепится над полкой.`,`Низ на ${cm(SS.y0)} см от пола, в ${cm(SS.y0-SF.H)} см над спинкой дивана; до антресоли ${cm(MZ.y0-SS.y0-SS.t)} см.`]}),
  sofa:{title:'Угловой диван-кровать «Слим» (Hoff)',price:29999,url:'https://hoff.ru/catalog/gostinaya/divany/uglovye/uglovoy_divan_krovat_slim_id9558189/?articul=80593875',shop:'Hoff',lines:['Механизм «дельфин», угол универсальный (здесь оттоманка справа, у окна).','206 × 153 см, высота 91 см; сиденье на высоте 45 см.','Спальное место 142 × 195 см; в оттоманке ящик для белья 145 × 23 × 61 см.','Велюр, бежево-серый; три приспинные подушки 65 × 46 см, две декоративные 48 × 36 см.']}
};

// 0 below 0, 1 above 1, eased in and out between (what goes with a door: the laptop's screen, the desk chair's turn, the sofa's bed)
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};

/* ========== the work place: by the left wall ========== */

/* the writing desk as IKEA HEMNES 155×65, black-brown, with its add-on unit: 1550 × 650, 740 high, 670 free under its knee rail. A top on two
   pedestals of 50 mm legs: on the left a cabinet with a frame-and-panel door and a shelf, on the right two drawers; inset
   fronts with knobs. Along the left wall of the kitchen, its end 150 mm from the window wall. Its own axes (mm): x along it from
   the window end, y up, z from the wall into the room; turned onto the kitchen's: its x toward the kitchen wall (−z), its z along x */
const DK={W:1550,D:650,H:740,top:30,leg:50,ov:20,ped:420,free:670,gap:150};   // gap: from the window wall
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
/* the wall shelf over the add-on unit: a board 1500 × 250, 30 thick, in the middle of the desk's length, its bottom 300 over the
   add-on unit (1370 + 300 = 1670). Black-brown as the desk at first; a click on it or its brackets (engine.js: userData.click) paints
   it oak Casella (on dark grey brackets both), then white (on white ones), then as the desk again; the colour stays through the
   kitchen's rebuilds. Desk axes, mm */
const SH={W:1500,D:250,t:30,gap:300,name:'Полка над столом'};
const shelfFinMats=f=>{const m=makeMats();applyMaterials(m,Object.assign({},deskFIN,{carcass:f}),0);return m;};
const bracketWhite=new THREE.MeshStandardMaterial({color:0xf2f2ef,roughness:.45,metalness:.2}),bracketGrey=new THREE.MeshStandardMaterial({color:0x222325,roughness:.45,metalness:.3});
const SHC=[{name:'как стол',desc:'Чёрно-коричневая, как стол',mats:deskMats,br:bracketGrey,brName:'тёмно-серых'},
  {name:'дуб Каселла',desc:'Дуб Каселла натуральный, как столешница кухни',mats:shelfFinMats({type:'wood',decor:'C1385'}),br:bracketGrey,brName:'тёмно-серых'},
  {name:'белый',desc:'Белый премиум W1000 ST9, как корпуса кухни',mats:shelfFinMats({type:'uni',color:'#F1F0EA',name:'Белый премиум W1000 ST9'}),br:bracketWhite,brName:'белых'}];
let shelfColor=0;
const isShelf=o=>o.userData.shelfBracket===true||!!(o.userData.part&&o.userData.part.name===SH.name);
// the shelf's board and its brackets in the desk's built group: the colours they have now
function paintShelf(desk){
  const c=SHC[shelfColor],is=(m,k)=>SHC.some(s=>s.mats[k]===m);
  desk.children.filter(isShelf).forEach(o=>{
    if(o.userData.shelfBracket===true){o.material=c.br;return;}
    o.material=o.material.map(m=>is(m,'carcass')?c.mats.carcass:is(m,'carcassEnd')?c.mats.carcassEnd:m);
    o.children.forEach(e=>{if(is(e.material,'edge'))e.material=c.mats.edge;});
  });
}
const shelfY0=()=>DK.H+AU.H+SH.gap;
function shelfParts(add){
  const x0=(DK.W-SH.W)/2,y0=shelfY0();
  add(SH.name,'carcass',x0,x0+SH.W,y0,y0+SH.t,0,SH.D,{info:INFO.shelf});
}
/* its brackets: two powder-coated steel L-brackets under it (white or dark grey, as the shelf: paintShelf), 25 wide, 4 thick,
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
  const box=boxIn(desk),x0=(DK.W-SH.W)/2,y0=shelfY0(),br=SHC[shelfColor].br;
  const ms=[x0+SHB.end,x0+SH.W-SHB.end].flatMap(c=>lBracket(box,c,y0,SHB,br));
  ms.forEach(o=>Object.assign(o.userData,{info:INFO.shelf,shelfBracket:true}));
  const next=()=>{shelfColor=(shelfColor+1)%SHC.length;paintShelf(desk);};
  desk.children.filter(isShelf).forEach(o=>{o.userData.click=next;});
  paintShelf(desk);
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

/* the desk chair as IKEA MILLBERGET, brown leather (Бумстад), black frame: 650 × 650 over its base, 1180 high, the seat 520 × 490
   at its lowest, 460. A five-star base on casters, the gas column, the mechanism under the seat; a tall back leaning back 12°, brown in
   front, a black shell behind, its top 190 a headrest: a thicker cushion, 35 proud of the back,
   10 wider, the back's cushion 50 up into it, so the two read as one; two black loop arms with brown pads, their tops 655 high: under the desk's knee rail (670). In the
   desk's knee space, facing it: pulled out at first (the seat's front 150 past the desk's edge), a click pushes it in under the desk till
   its back is 20 short of the desk's edge, and back out. Over the last 30% of the way out it swivels on its column, its back 20°
   toward the window, and straightens again before it goes in. A click moves it 20% slower than a cabinet front (common.js: ease). The walker passes through it (walk.js: userData.walkThrough).
   Own axes (mm): x across from its middle, y up, z from the column toward the seat's front */
const MC={W:650,H:1180,seat:460,sw:520,sd:490,cush:100,sz:255,back:{w:490,t:70,shell:25,y:400,z:-215,lean:12,head:190,headT:105,lap:50},
  arm:{x:295,top:655,pad:30,bar:25,t:30,z0:-200,z1:130,y0:315},base:{r:300,hub:110,tip:75,wheel:25},out:150,clear:20,turn:20,turnFrom:.7};
const leatherMat=(()=>{
  // fine grain: a speckle of pits as bumps, so the light breaks on it as on leather
  const t=drawnTex(128,g=>{
    g.fillStyle='#808080';g.fillRect(0,0,128,128);
    for(let i=0;i<900;i++){const v=90+((i*97)%80);g.fillStyle=`rgb(${v},${v},${v})`;g.beginPath();g.arc((i*53.7)%128,(i*31.3+i*i*.013)%128,.6+(i%3)*.5,0,Math.PI*2);g.fill();}
  },3);
  return new THREE.MeshStandardMaterial({color:new THREE.Color('#7d553a').convertSRGBToLinear(),roughness:.45,bumpMap:t,bumpScale:.0004});   // a deep tan, not orange; a soft sheen
})();
const plasticMat=new THREE.MeshStandardMaterial({color:0x1a1a1b,roughness:.45});
// where it stands (kitchen mm): the column's z (the middle of the desk's knee space), its x pushed in; how far it goes out
function deskChairAt(){
  const {back:b}=MC,tl=Math.tan(b.lean*Math.PI/180),bz=b.z-(DK.H-b.y)*tl;   // the back's front at the height of the desk's top
  const x=DK.D+MC.clear+bz;   // its front toward −x: its own z backward is the kitchen's x forward
  return {x,z:P.L-DK.gap-DK.W/2,travel:DK.D+MC.out+MC.sz-x};
}
function buildDeskChair(g,opts){
  const {sw,sd,cush,seat,sz,back:b,arm:a,base:bs}=MC,{x,z,travel}=deskChairAt(),m=v=>v*MM;
  const c=new THREE.Group();c.position.set(m(x),0,m(z));c.rotation.y=-Math.PI/2;   // its front (+z) toward the wall (−x)
  Object.assign(c.userData,{deskChair:true,info:INFO.deskChair,walkThrough:true});g.add(c);
  const sl=new THREE.Group(),q=new THREE.Group();c.add(sl);sl.add(q);   // what slides: all of it; in it what swivels on the column (its origin)
  const put=(geo,mat,px,py,pz,par=q)=>{const o=new THREE.Mesh(geo,mat);o.position.set(m(px),m(py),m(pz));o.castShadow=o.receiveShadow=true;par.add(o);return o;};
  const rbox=(w,h,d,r,mat,px,py,pz,par)=>put(roundBoxGeo(m(w),m(h),m(d),m(r)),mat,px,py,pz,par);
  // the base: a hub, five legs sloping down to the casters (one toward the front), each caster a fork and two wheels
  put(new THREE.CylinderGeometry(m(42),m(48),m(50),24),plasticMat,0,bs.hub,0);
  for(let i=0;i<5;i++){
    const l=new THREE.Group();l.rotation.y=i*Math.PI*2/5;q.add(l);
    const len=bs.r-30,slope=Math.atan2(bs.hub-bs.tip,len);
    const leg=put(new THREE.BoxGeometry(m(36),m(28),m(len)),plasticMat,0,(bs.hub+bs.tip)/2,30+len/2,l);leg.rotation.x=slope;
    put(new THREE.BoxGeometry(m(30),m(40),m(40)),plasticMat,0,bs.tip-15,bs.r,l);   // the fork's top
    [-11,11].forEach(dx=>{const w=put(new THREE.CylinderGeometry(m(bs.wheel),m(bs.wheel),m(18),20),plasticMat,dx,bs.wheel,bs.r+12,l);w.rotation.z=Math.PI/2;});
  }
  // the gas column: its shroud on the hub, the piston up into the mechanism; the mechanism and its knob
  const yp=seat-cush-35;   // the mechanism's bottom
  put(new THREE.CylinderGeometry(m(24),m(30),m(130),20),plasticMat,0,bs.hub+25+65,0);
  put(new THREE.CylinderGeometry(m(15),m(15),m(yp-bs.hub-150),16),handleMat,0,(bs.hub+150+yp)/2,0);
  put(new THREE.BoxGeometry(m(260),m(35),m(280)),plasticMat,0,yp+17.5,10);
  put(new THREE.CylinderGeometry(m(18),m(18),m(40),12),plasticMat,150,yp+5,110).rotation.z=Math.PI/2;
  // the seat: a rounded cushion on the mechanism, its front at sz
  rbox(sw,cush,sd,35,leatherMat,0,seat-cush/2,sz-sd/2);
  // the back on its bracket behind the seat: a brown front, the headrest over it, a black shell, leaning back
  const tl=b.lean*Math.PI/180,L=(MC.H-b.y)/Math.cos(tl),bk=new THREE.Group();bk.position.set(0,m(b.y),m(b.z));bk.rotation.x=-tl;q.add(bk);
  rbox(b.w,L-b.head+b.lap,b.t,30,leatherMat,0,(L-b.head+b.lap)/2,-b.t/2,bk);   // its top inside the headrest
  rbox(b.w+10,b.head,b.headT,40,leatherMat,0,L-b.head/2,b.headT/2-b.t,bk);   // its back on the shell, as the back's: proud in front
  rbox(b.w+12,L-12,b.shell,12,plasticMat,0,L/2-2,-b.t-b.shell/2+4,bk);
  put(new THREE.BoxGeometry(m(70),m(240),m(14)),plasticMat,0,30,-b.t-b.shell-3,bk);   // the bracket up the shell
  const bz=b.z-b.t-b.shell-10;
  put(new THREE.BoxGeometry(m(70),m(20),m(-bz-130)),plasticMat,0,yp+10,(bz-130)/2-10);   // from the mechanism to the bracket
  // the arms: a black loop each side, from under the seat up to a brown pad
  [-1,1].forEach(s=>{
    const ax=s*a.x,yb=a.top-a.pad-a.bar,len=a.z1-a.z0;
    put(new THREE.BoxGeometry(m(a.t),m(a.bar),m(len)),plasticMat,ax,yb+a.bar/2,(a.z0+a.z1)/2);   // under the pad
    put(new THREE.BoxGeometry(m(a.t),m(a.bar),m(len)),plasticMat,ax,a.y0+a.bar/2,(a.z0+a.z1)/2);   // under the seat's side
    [a.z0+a.t/2,a.z1-a.t/2].forEach(pz=>put(new THREE.BoxGeometry(m(a.t),m(yb-a.y0),m(a.t)),plasticMat,ax,(a.y0+yb)/2,pz));   // the posts
    rbox(60,a.pad,len+20,12,leatherMat,ax,a.top-a.pad/2,(a.z0+a.z1)/2);
    put(new THREE.BoxGeometry(m(Math.abs(ax)-130),m(20),m(40)),plasticMat,s*(Math.abs(ax)+130)/2,yp+10,-20);   // to the mechanism
  });
  // pulled out: away from the desk (its own −z), at first
  // its back toward the window (the kitchen's +z: its own +x), eased in over the end of the way out
  const follow=a=>{q.rotation.y=-MC.turn*Math.PI/180*smooth((a/DMAX-MC.turnFrom)/(1-MC.turnFrom));};
  const ease=1-Math.pow(1-.09,1/1.2);   // a front's .09 a frame, its time 1.2 times as long
  return [applDoor(sl,{key:'desk-chair',axis:'z',travel:-m(travel),startOpen:true,ease,follow},opts)];
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
  const follow=a=>{L.rotation.x=-a;mbLidMat.emissiveIntensity=smooth((a-.5)/.6);};
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
  const [parts,add]=partList();
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

/* ========== the living part: by the right wall ========== */

/* the wardrobe as OZON «Уютная логика», white or grey (wardColor), handleless (push-to-open) hinged doors: a corner unit 964 × 964, 500 deep, and an
   add-on section 400 wide — 1364 along the right wall, 964 out from it, 2200 high. Against the right wall by the sofa's end toward the
   kitchen wall: its leg (500 wide) out from the wall along the sofa's arm, its door toward the kitchen wall; along the wall from the
   leg the corner unit's other door, then the add-on section, their doors into the room. The corner unit as the shop's picture: on the
   left (along the wall) a narrow part with four shelves, a partition at the inner corner; on the right the leg with the corner behind
   it, for hangers — a shelf at the top, two rods one over the other through the leg up to the wall; shelves in the add-on section.
   At the inner corner a fixed L-shaped stile of two strips, one in each front's plane: the corner unit's doors go up to them, so they
   open clear of each other. On the leg's end, into the room: a mirror in a black frame, a coat rail under it. Sides down to the floor, a 70 mm plinth between them, the overlay doors over it.
   Built in the kitchen's axes (mm): no turn — the doors turn on their own hinges (pivot), the leg's way and the wall's. Two groups —
   the leg and the run along the wall — so the walk is stopped by its L, not by the whole rectangle */
const WR={W:1364,D:964,C:964,d:500,H:2200,pl:70,t:16,ft:16,gap:2,strip:50,shelves:4,top:1650,rods:[1590,860],rod:25,
  mirror:{w:400,h:400,y0:1300,frame:10,d:20}};   // W along the wall, D out from it; C the corner unit's legs, d the depth;
   // the left part's shelves (evenly), the right part's top shelf and its rods (their axes), the rods' Ø; on the leg's end the mirror
   // (its frame, its bottom); the coat rail under it: HK
// the wardrobe and the mezzanine, each in one finish all over, each its own: white or Диамант серый U963 ST9 (furniture.js: UNI, as the
// bathroom's carcass) — the next one by a click on its panels (a door's click opens it) or by its card's «Следующий вариант →»; it stays through the kitchen's rebuilds
const WARD_COLORS=[{type:'uni',color:'#F1F0EA',name:'Белый'},UNI.U963];
function colorSwitch(){
  const o={i:0,mats:makeMats(),
    paint(){const f=WARD_COLORS[o.i];applyMaterials(o.mats,{carcass:f,front:f,top:f,apron:null},30);},
    click(){o.i=(o.i+1)%WARD_COLORS.length;o.paint();},
    // its card c (card() gives it again): its colour first, which colour of how many and a link to the next one (engine.js: info.variant, info.next)
    card:(card,c)=>Object.assign(c,{lines:[`Цвет: ${finName(WARD_COLORS[o.i])}.`].concat(c.lines),variant:[o.i+1,WARD_COLORS.length],next:()=>{o.click();return card();}})};
  o.paint();return o;
}
const wardColor=colorSwitch(),mzColor=colorSwitch();
// a card of what is bought on Ozon as products (c.buy: [{name, n, price, url}], a row each in the card): the shop, the sum under its lines
const ozon=c=>Object.assign(c,{shop:'Ozon',lines:c.lines.concat(`Вместе ${c.buy.reduce((t,b)=>t+(b.n||1)*b.price,0).toLocaleString('ru-RU')} ₽.`)});
// the two OZON products it is made of (its card has a row for each)
const WARD_PRODUCTS=[
  {name:'Угловой 96,4 × 96,4 × 220',price:12000,url:'https://ozon.ru/t/sXBC1uj'},
  {name:'Доп. секция 40 × 50 × 220',price:5500,url:'https://ozon.ru/t/BSIni7B'}];
const wardAt=()=>sofaAt();   // kitchen z of its side at the sofa; it goes from there toward the kitchen wall
function wardrobeParts(){
  const [parts,add]=partList();
  const {W,D,C,d,H,pl,t,ft,gap}=WR,X=P.Rx,s=wardAt(),yt=H-t,cd=d-ft;   // X: the wall; cd: the carcass's depth behind the doors
  const xF=X-d,zF=s-d,xE=X-D,zE=s-C,zA=s-W;   // the doors' faces: along the wall, the leg's; the leg's end; the corner unit's far side; the add-on's
  const fy0=pl+gap,fy1=H-gap,cu=' углового шкафа',ad=' доп. секции';
  // the corner unit: its leg's end, its back at the sofa, its far side along the wall; an HDF back against the wall
  add('Торцевая стенка'+cu,'carcass',xE,xE+t,0,H,zF+ft,s);
  add('Стенка у дивана'+cu,'carcass',xE+t,X,0,H,s-t,s);
  add('Боковина'+cu,'carcass',X-cd,X,0,H,zE,zE+t);
  add('Задняя стенка'+cu+' — у дивана','back',X-4,X,pl,yt,zF+ft,s-t);
  add('Задняя стенка'+cu+' — вдоль стены','back',X-4,X,pl,yt,zE+t,zF+ft);
  // the top and the bottom in two pieces each, the plinth under both doors
  [['Крыша',yt,H],['Дно',pl,pl+t]].forEach(([n,y0,y1])=>{
    add(n+cu+' — у дивана','carcass',xE+t,X-4,y0,y1,zF+ft,s-t);
    add(n+cu+' — вдоль стены','carcass',xF+ft,X-4,y0,y1,zE+t,zF+ft);
  });
  // the left part: the partition at the inner corner, in line with the leg's door, and its shelves evenly between the bottom and the top
  add('Перегородка'+cu,'carcass',xF+ft,X-4,pl+t,yt,zF,zF+t);
  const n=WR.shelves,st=(yt-pl-t-n*t)/(n+1),shelfY=[...Array(n)].map((_,i)=>Math.round(pl+t+(i+1)*st+i*t));   // the add-on section's too
  shelfY.forEach(y=>add('Полка'+cu+' — слева','carcass',xF+ft+20,X-4,y,y+t,zE+t,zF));
  // the right part: its top shelf through the leg and the corner, on the leg's end, the panel at the sofa and the partition; the rods
  // under it (buildWardrobe)
  add('Полка'+cu+' — справа','carcass',xE+t,X-4,WR.top,WR.top+t,zF+ft,s-t);
  add('Цоколь'+cu+' — у дивана','carcass',xE+t,xF+ft,0,pl,zF+ft,zF+ft+t);
  add('Цоколь'+cu+' — вдоль стены','carcass',xF+ft,xF+ft+t,0,pl,zE+t,zF+ft+t);
  // the stile at the inner corner: a strip in each front's plane, the one along the wall over the corner where they meet
  const w=WR.strip;
  add('Планка'+cu+' — у дивана','carcass',xF-w,xF,fy0,fy1,zF,zF+ft);
  add('Планка'+cu+' — вдоль стены','carcass',xF,xF+ft,fy0,fy1,zF-w,zF+ft);
  // its two doors, hinged at their outer ends, up to the strips: the leg's toward the kitchen wall, the other into the room
  add('Дверь'+cu+' — у дивана','front',xE+gap/2,xF-w-gap,fy0,fy1,zF,zF+ft,{pivot:{x:xE+gap/2,z:zF,s:1}});
  add('Дверь'+cu+' — вдоль стены','front',xF,xF+ft,fy0,fy1,zE+gap/2,zF-w-gap,{pivot:{x:xF,z:zE+gap/2,s:-1}});
  // the add-on section: its own sides, top, bottom, plinth, back, four shelves as the corner unit's left part, its door hinged at the far end
  [zA,zE-t].forEach(z=>add('Боковина'+ad,'carcass',X-cd,X,0,H,z,z+t));
  add('Крыша'+ad,'carcass',X-cd,X-4,yt,H,zA+t,zE-t);
  add('Дно'+ad,'carcass',X-cd,X-4,pl,pl+t,zA+t,zE-t);
  add('Цоколь'+ad,'carcass',X-cd,X-cd+t,0,pl,zA+t,zE-t);
  add('Задняя стенка'+ad,'back',X-4,X,pl,yt,zA+t,zE-t);
  shelfY.forEach(y=>add('Полка'+ad,'carcass',X-cd+20,X-4,y,y+t,zA+t,zE-t));
  add('Дверь'+ad,'front',xF,xF+ft,fy0,fy1,zA+gap/2,zE-gap/2,{pivot:{x:xF,z:zA+gap/2,s:-1}});
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
    [z0,z1-t].forEach(z=>add('Боковина'+nm,'carcass',X-cd,X,y0,y1,z,z+t));
    add('Крыша'+nm,'carcass',X-cd,X-4,y1-t,y1,z0+t,z1-t);
    add('Дно'+nm,'carcass',X-cd,X-4,y0,y0+t,z0+t,z1-t);
    add('Задняя стенка'+nm,'back',X-4,X,y0+t,y1-t,z0+t,z1-t);
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
/* the white shelf over the sofa: a board 2000 × 250, 25 thick, white as the kitchen's carcasses, on the right wall under the mezzanine,
   in line with it (from the wardrobe's side toward the window); its bottom at 1375, 465 over the sofa's back, 300 under the mezzanine.
   Three white steel L-brackets, the desk shelf's (SHB, lBracket) as plain Ls, 150 from its ends and in its middle: the board on their
   arms, their wall arms up behind it (the board as far off the wall as they are thick).
   Its own axes as the desk shelf's: x along the wall from the wardrobe's side, z out from the wall; turned onto the kitchen's as the sofa */
const SS={L:2000,D:250,t:25,y0:1375,name:'Полка над диваном'};
function buildSofaShelf(g){
  const white=SHC.find(c=>c.name==='белый'),[parts,add]=partList();
  add(SS.name,'carcass',0,SS.L,SS.y0,SS.y0+SS.t,SHB.t,SHB.t+SS.D);
  const q=buildParts({parts},white.mats).model,box=boxIn(q);
  [SHB.end,SS.L/2,SS.L-SHB.end].forEach(c=>lBracket(box,c,SS.y0,SHB,white.br,true).forEach(o=>{o.userData.bracket=true;}));
  q.rotation.y=-Math.PI/2;q.position.set(P.Rx*MM,0,wardAt()*MM);q.userData.sofaShelf=true;q.userData.info=INFO.sofaShelf;
  g.add(q);
  return [];
}
/* the metal racks on the right wall's empty stretch: two alike side by side, from the corner by the way into the kitchen (the kitchen
   wall, z 0) up to the wardrobe's add-on section, RK.gap from both and between them; 200 deep at first — their fronts in line with the end of
   the wall right of the way in; a click on either (engine.js: userData.click) makes both 250 deep, then 300, then 200 again (RK_D; it
   stays through the kitchen's rebuilds) — and 1750 high. Each: four perforated L-angle posts at its corners (their flanges outward, on plastic
   feet; round holes RK.hole across, RK.pitch apart, through both flanges), RK.n shelves evenly from near the floor up to the posts'
   tops: each a sheet with its edges bent down all round, bolted to the posts through their holes — a hex head on each visible flange.
   Light grey powder-coated steel. Kitchen axes (mm), a group each with its «i» */
const RK_D=[200,250,300];
const RK={D:RK_D[0],H:1750,n:5,post:35,pt:2,foot:10,sheet:1,lip:30,y0:70,gap:10,hole:10,pitch:42,bolt:10,boltH:4};
const rackMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#c9ccc9').convertSRGBToLinear(),roughness:.55,metalness:.35});
// the posts' holes: a mask, one hole a tile (across the flange × one pitch along it), in the middle of it
const perfTex=drawnTex(64,c=>{c.fillStyle='#fff';c.fillRect(0,0,64,64);c.fillStyle='#000';c.beginPath();
  c.ellipse(32,32,32*RK.hole/RK.post,32*RK.hole/RK.pitch,0,0,2*Math.PI);c.fill();},1,(RK.H-RK.foot)/RK.pitch);
if(perfTex.offset){const b=RK.y0-RK.lip/2-RK.foot;perfTex.offset.y=(.5-b/RK.pitch%1+1)%1;}   // a hole where each shelf's bolt goes
const perfMat=rackMat.clone();perfMat.alphaMap=perfTex;perfMat.alphaTest=.5;   // the posts: as the rest, with the holes
const rackFootMat=new THREE.MeshStandardMaterial({color:0x1b1b1b,roughness:.7});
const boltMat=new THREE.MeshStandardMaterial({color:0xb9bdc1,roughness:.3,metalness:.85});   // zinc-plated
// one rack's width; where each starts along the wall
const rackW=()=>Math.max(0,Math.floor((wardAt()-WR.W-3*RK.gap)/2));
const rackAt=i=>RK.gap+i*(rackW()+RK.gap);
// the shelves' tops: evenly from y0 to the posts' tops (the spacing a whole number of pitches, so every bolt finds its hole)
const rackShelves=()=>[...Array(RK.n)].map((_,i)=>Math.round(RK.y0+i*(RK.H-RK.y0)/(RK.n-1)));
// the next depth for both, the kitchen built again (its footprint for the walk with them)
const rackClick=()=>{RK.D=RK_D[(RK_D.indexOf(RK.D)+1)%RK_D.length];rebuild();};
function buildRack(g){
  const W=rackW();if(W<300)return [];
  const {D,H,post:a,pt,foot,sheet,lip,bolt,boltH}=RK,X=P.Rx,x0=X-D,mm=v=>v*MM;
  [0,1].forEach(r=>{
    const z0=rackAt(r),z1=z0+W;
    const q=new THREE.Group();q.userData.rack=true;q.userData.info=INFO.rack;q.userData.click=rackClick;g.add(q);
    const bx=boxIn(q),b=(xa,xb,ya,yb,za,zb,mat)=>bx(mm(xa),mm(xb),mm(ya),mm(yb),mm(za),mm(zb),mat||rackMat);
    const so=(u,v)=>u<v?[u,v]:[v,u],plain=rackMat;
    const shelves=rackShelves();
    // the posts: an L at each corner, one flange in the rack's end (across x), one in its front or back (along z); a foot under it.
    // The holes on the flanges' broad faces only (a box's faces: +x −x +y −y +z −z)
    [[x0,1,true],[X,-1,false]].forEach(([x,sx,front])=>[[z0,1],[z1,-1]].forEach(([z,sz])=>{
      const xs=so(x,x+sx*a),zs=so(z,z+sz*a),xt=so(x,x+sx*pt),zt=so(z,z+sz*pt);
      b(xs[0],xs[1],foot,H,zt[0],zt[1],[plain,plain,plain,plain,perfMat,perfMat]).userData.post=true;
      b(xt[0],xt[1],foot,H,zs[0],zs[1],[perfMat,perfMat,plain,plain,plain,plain]);
      b(xs[0],xs[1],0,foot,zs[0],zs[1],rackFootMat);
      // the bolts' hex heads in the middle of each flange at each shelf's edge: on its end and on its front (the back's is at the wall)
      const xm=x+sx*a/2,zm=z+sz*a/2;
      shelves.forEach(y=>{const yb=y-lip/2;
        const he=new THREE.Mesh(new THREE.CylinderGeometry(mm(bolt/2/Math.cos(Math.PI/6)),mm(bolt/2/Math.cos(Math.PI/6)),mm(boltH),6),boltMat);
        he.rotation.x=Math.PI/2;he.position.set(mm(xm),mm(yb),mm(z-sz*boltH/2));he.userData.bolt=true;q.add(he);
        if(front){const hf=new THREE.Mesh(new THREE.CylinderGeometry(mm(bolt/2/Math.cos(Math.PI/6)),mm(bolt/2/Math.cos(Math.PI/6)),mm(boltH),6),boltMat);
          hf.rotation.z=Math.PI/2;hf.position.set(mm(x-boltH/2),mm(yb),mm(zm));hf.userData.bolt=true;q.add(hf);}
      });
    }));
    // the shelves inside the posts' flanges: the sheet on top, its four edges bent down
    const sx0=x0+pt,sx1=X-pt,sz0=z0+pt,sz1=z1-pt;
    shelves.forEach(y=>{
      b(sx0,sx1,y-sheet,y,sz0,sz1).userData.shelf=true;
      b(sx0,sx0+sheet,y-lip,y-sheet,sz0,sz1);b(sx1-sheet,sx1,y-lip,y-sheet,sz0,sz1);
      b(sx0+sheet,sx1-sheet,y-lip,y-sheet,sz0,sz0+sheet);b(sx0+sheet,sx1-sheet,y-lip,y-sheet,sz1-sheet,sz1);
    });
  });
  return [];
}
const rodMat=new THREE.MeshStandardMaterial({color:0xc8c9cb,roughness:.25,metalness:.85});   // chrome
const mirrorMat=new THREE.MeshStandardMaterial({color:0xc9d1d4,roughness:.06,metalness:.35});   // the glass: light, glossy
const wardBlackMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#3a3b3d').convertSRGBToLinear(),roughness:.5,metalness:.2});   // the mirror's frame, the coat rail: dark grey (their cards say black)
const knobWoodMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#9c7552').convertSRGBToLinear(),roughness:.7});   // its hooks' balls
/* the coat rail under the mirror: a black bar along the face, hooks off it — each a black peg, a wooden ball on its end.
   L along the face, h its height, t out from the face, y its bottom; the pegs' length and Ø, the balls' Ø */
const HK={L:380,h:30,t:12,y:1170,n:4,peg:40,pegD:8,ball:26};
/* the mirror and the coat rail on the leg's end (its face at x Rx − D, the room on its −x side), in the middle of its width, in g;
   each its own group with its own «i» */
function wardrobeEnd(g){
  const {mirror:M}=WR,x=P.Rx-WR.D,zc=wardAt()-WR.d/2,f=M.frame,y1=M.y0+M.h,mm=v=>v*MM;
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
function buildWardrobe(g,opts){
  const ps=wardrobeParts(),s=wardAt(),zF=s-WR.d,leg=p=>p.x0<P.Rx-WR.d||(p.z0+p.z1)/2>zF+WR.ft;   // the leg: out past the run's fronts, or behind its door; the partition goes with the run
  return [ps.filter(leg),ps.filter(p=>!leg(p))].flatMap((parts,i)=>{
    const d=buildParts({parts},wardColor.mats,opts);
    d.model.userData.wardrobe=true;d.model.userData.info=INFO.wardrobe;
    d.model.children.forEach(o=>{o.userData.click=wardColor.click;});   // its panels, before the rods, the mirror and the coat rail join them
    // the rods in the leg: across its opening, in the middle of its depth, from its end to the wall
    if(i===0){const x0=P.Rx-WR.D+WR.t,x1=P.Rx-4,z=(zF+WR.ft+s-WR.t)/2;
      WR.rods.forEach(y=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(WR.rod/2*MM,WR.rod/2*MM,(x1-x0)*MM,20),rodMat);
        r.rotation.z=Math.PI/2;r.position.set((x0+x1)/2*MM,y*MM,z*MM);r.castShadow=true;r.userData.rod=true;d.model.add(r);});
      wardrobeEnd(d.model);}
    g.add(d.model);
    return d.doors;
  });
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
  // its seat in one piece from the back to its front (a seam left against the sofa's seat): the lid on its hinge; a click on the
  // chaise's box lifts it too (its frame), as one on the drawer lays out the bed
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
  const zs=zf-t+(Dc-D)-680,z2=D+bt*Math.sin(BED_TILT);
  const lay=a=>{const k=a/DMAX,dz=(Dc-D)*smooth(k/.4),u1=smooth((k-.4)/.15),u2=smooth((k-.55)/.15),u3=smooth((k-.7)/.3);
    let th=BED_TILT*u1,zb=zb0+dz+(z2-zs)*u2,yb=yb0;
    if(u3>0){th=BED_TILT*(1-u3);yb=yb0+(ys-yb0)*u3;zb=D+bt*Math.sin(th);}
    drawer.position.z=dz*MM;block.position.set(0,yb*MM,(zb-dz)*MM);block.rotation.x=-th;strap.rotation.x=th;strap.visible=u3>.6;};
  return [applDoor(lid,{key:'sofa-lid',axis:'x',s:-1,max:LID_MAX,ease:LID_EASE,holdRate:LID_HOLD,follow,frame:chaise},opts),applDoor(fold,{key:'sofa-bed',axis:'none',rate:DMAX/BED_S,holdRate:DMAX/BED_HOLD_S,follow:lay},opts)];
}

return {
  attach(k){({P,applDoor,handleMat,rebuild}=k);},
  // all of it in g, in this order; their doors (the kitchen makes them loose)
  build:(g,o)=>[].concat(buildDesk(g,o),buildDeskChair(g,o),buildVitrine(g,o),buildSofa(g,o),buildWardrobe(g,o),buildMezzanine(g,o),buildSofaShelf(g),buildRack(g)),
  // what the walker cannot pass ([x0, x1, z0, z1], kitchen mm): the desk, the display cabinet, the sofa, the wardrobe, the racks
  foot:()=>[[0,DK.D,P.L-DK.gap-DK.W,P.L-DK.gap],[0,VT.W,vitAt()-VT.D,vitAt()],
    [P.Rx-SF.D,P.Rx,sofaAt(),sofaAt()+SF.W],[P.Rx-SF.Dc,P.Rx,sofaAt()+SF.W-SF.arm-SF.chaise,sofaAt()+SF.W],
    [P.Rx-WR.D,P.Rx,wardAt()-WR.d,wardAt()],[P.Rx-WR.d,P.Rx,wardAt()-WR.W,wardAt()-WR.d]].concat(rackW()>=300?[[P.Rx-RK.D,P.Rx,rackAt(0),rackAt(1)+rackW()]]:[]),
  // the userData keys its groups in g have
  keys:['desk','deskChair','vitrine','sofa','sofaShelf','wardrobe','mezzanine','rack']
};
})();
