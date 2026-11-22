/* the wall shelf over the dining table: on the left wall over the table's end, in the middle of its width, its bottom SPICE_Y over the floor.
   Two of them, one shown (spiceModel): a click on it (engine.js: userData.click; a click on a drawer works the drawer) or the link in its card shows the other;
   which one stays through the kitchen's rebuilds. Each in its own axes (mm): x along it from the window's side, y up from its bottom,
   z from the wall into the room; both in one group turned onto the kitchen's as the desk (living/desk.js): its x toward the kitchen wall (−z), its z along x.
   The olive one, as the shop's «полка настенная из массива дерева с ящиками»: solid pine painted olive, 600 wide, 900 high, 120 deep.
   Two sides the whole height; a back of six tongue-and-groove boards; at the bottom three drawers with white ceramic knobs under the
   first shelf, two more shelves over it (lv); at the top a board, a front rail with a scalloped bottom under it and a scalloped crest
   behind it over it; a scalloped apron under the bottom board */
const SPICE_Y=1150;   // both shelves' bottom over the floor
const OL={W:600,H:900,D:120,t:18,back:10,lv:{bottom:40,drawers:176,shelves:[400,630],top:842},rail:60,crest:40,wave:25,travel:80};
let spiceModel=0;   // 0 the tiered one (SQ), shown at first; 1 the olive one
const oliveFIN={carcass:{type:'uni',color:'#6B7A5C',name:'Оливковый'},front:{type:'uni',color:'#6B7A5C',name:'Оливковый'},top:{type:'uni',color:'#6B7A5C',name:'Оливковый'},apron:null};
const oliveMats=makeMats();applyMaterials(oliveMats,oliveFIN,10);   // edge contrast as the tiered one
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

