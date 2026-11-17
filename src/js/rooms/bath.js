/* ---------- «Санузел» view: the toilet niche — the tall cabinet against the back wall, the installation along the left wall ----------
   Bathroom coordinates as in the bath tab, mm: x along the back wall from the left wall, y up, z from the back wall into the room;
   the bathroom's (0,0) is its origin on the plan. The niche, the ceiling and the riser box come from the plan
   (A.bNiche, A.bL, A.H, A.rX, A.rZ), how far the left wall shows is the view's frame (VS.bath.L). Own scope: the room modules share names. */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W, L, H, Rx, Rz are the plan's niche, ceiling and riser box
const P={W:1200,H:2600,Rx:250,Rz:250,Hi:1200,Di:200,Gap:300,Du:200,Nu:2,Dt:300,L:1100,Lt:800,Wc:800,Dm:200,Pl:80,Sp:1500,Nb:2,Nh:3,Ec:30,T:16,TF:16,Mid:true,Feet:false};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  // axes: x along the back wall (left wall at x=0), y up, z from the back wall into the room
  const [parts,add]=partList(),W=p.W,H=p.H,RB=100,FL=p.Feet?10:0;   // FL: the tall cabinet sits on 10 mm feet
  const zf=Math.max(p.Dt,p.Rz+TF), zc=zf-TF;   // front plane of the back run (tall cabinet + riser cladding)
  const xb=W, xa=W-Math.min(p.Wc,W-p.Rx);     // carcass at the right; cladding covers riser + filler on the left
  const pl=p.Pl, sp=p.Hi;   // door split follows the installation height
  // tall cabinet, floor to ceiling, against the back wall, standing on a plinth
  add('Бок пенала','carcass',xa,xa+T,FL,H,0,zc);
  add('Бок пенала','carcass',xb-T,xb,FL,H,0,zc);
  add('Дно пенала','carcass',xa+T,xb-T,FL+pl,FL+pl+T,0,zc);
  add('Крышка пенала','carcass',xa+T,xb-T,H-T,H,0,zc);
  add('Полка-разделитель пенала','carcass',xa+T,xb-T,sp-T/2,sp+T/2,0,zc);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,FL+pl+T,FL+pl+T+RB,0,T);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,H-T-RB,H-T,0,T);
  const sb=(sp-T/2-FL-pl-T)/(p.Nb+1);
  for(let i=1;i<=p.Nb;i++){const y=FL+pl+T+i*sb-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  const sh=(H-T-sp-T/2)/(p.Nh+1);
  for(let i=1;i<=p.Nh;i++){const y=sp+T/2+i*sh-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  if(pl>0)add('Цоколь пенала и короба (заподлицо с фасадами)','front',G/2,W-G/2,FL,FL+pl-G/2,zc,zf);
  // fronts: riser cladding (fixed, two panels) + 4 doors, split at the same height
  const xm=(xa+xb)/2;
  [[FL+pl+G/2,sp-G/2,'нижняя'],[sp+G/2,H-G/2,'верхняя']].forEach(([y0,y1,nm])=>{
    add('Облицовка короба, '+nm+' (фасад, глухой)','front',0,xa-G/2,y0,y1,zc,zf);
    add('Фасад пенала','front',xa+G/2,xm-G/2,y0,y1,zc,zf,{hinge:'L'});
    add('Фасад пенала','front',xm+G/2,xb-G/2,y0,y1,zc,zf,{hinge:'R'});
  });
  // upper cabinet above the installation, along the left wall
  p.Lt=Math.max(200,p.L-zf);   // installation run fills the rest of the left wall
  const yb=p.Hi+p.Gap,dc=p.Du-TF,z0=zf,z1=zf+p.Lt;
  // separate product: open niche box in the gap between the installation and the upper cabinet, with its own LDSP back
  if(p.Mid!==false&&p.Gap>2*T+20){
    const dm=p.Dm||200;
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z0,z0+T);
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z1-T,z1);
    add('Дно ниши над инсталляцией','carcass',T,dm,p.Hi,p.Hi+T,z0+T,z1-T);
    add('Крышка ниши над инсталляцией','carcass',T,dm,yb-T,yb,z0+T,z1-T);
    add('Задняя стенка ниши над инсталляцией','carcass',0,T,p.Hi,yb,z0+T,z1-T);
  }
  if(H-yb>2*T+60){
    add('Бок верхнего шкафа','carcass',0,dc,yb,H,z0,z0+T);
    add('Бок верхнего шкафа','carcass',0,dc,yb,H,z1-T,z1);
    add('Дно верхнего шкафа','carcass',0,dc,yb,yb+T,z0+T,z1-T);
    add('Крышка верхнего шкафа','carcass',0,dc,H-T,H,z0+T,z1-T);
    const rb=Math.min(RB,(H-yb-2*T)/3);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,yb+T,yb+T+rb,z0+T,z1-T);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,H-T-rb,H-T,z0+T,z1-T);
    const su=(H-yb-T)/(p.Nu+1);
    for(let i=1;i<=p.Nu;i++){const y=yb+i*su;add('Полка верхнего шкафа','carcass',T,dc-10,y,y+T,z0+T,z1-T);}
    const zm=(z0+z1)/2;
    add('Фасад верхнего шкафа','front',dc,p.Du,yb,H-G/2,z0+G/2,zm-G/2,{pivot:{x:p.Du,z:z0+G/2,s:1}});
    add('Фасад верхнего шкафа','front',dc,p.Du,yb,H-G/2,zm+G/2,z1-G/2,{pivot:{x:p.Du,z:z1-G/2,s:-1}});
  }
  // every board that reaches the floor is lifted onto the feet
  if(FL)parts.forEach(q=>{if(q.y0<FL)q.y0=FL;});
  // feet at the corners of each floor-standing unit (8 mm in from the outer faces): tall cabinet, and the riser cladding front
  const cnr=(x0,x1,z0,z1)=>[[x0+8,z0+8],[x1-8,z0+8],[x0+8,z1-8],[x1-8,z1-8]];
  const feet=[...cnr(xa,xb,0,zf),[8,zf-8],[xa-8,zf-8]];
  return {parts,zf,yb,Hb:p.Hi,FL,feet};
}

const O=()=>ROOMS.find(r=>r.id==='bath').origin;   // the bathroom's (0,0) on the plan, mm
function clamp(w){
  P.Wc=Math.min(w.Wc,P.W-P.Rx);
  P.Gap=Math.min(w.Gap,Math.max(0,P.H-P.Hi-200));
}
// sizes that belong to the walls come from the plan; the tall cabinet and the gap over the installation have to fit
function fromModel(w){P.W=A.bNiche;P.L=A.bL;P.H=A.H;P.Rx=A.rX;P.Rz=A.rZ;clamp(w);T=P.T||16;TF=P.TF||16;return current=computeParts(P);}

/* ---------- finishes and materials ---------- */
// finish per part group, as in the bath tab: wood decor or plain colour (no worktop here)
const FIN={carcass:Object.assign({},UNI.U963),front:{type:'wood',decor:'H1386'}};
const mats=makeMats();
applyMaterials(mats,FIN,P.Ec);
const tileMat=new THREE.MeshStandardMaterial({color:0x6b6e70,roughness:.6});
const whiteMat=new THREE.MeshStandardMaterial({color:0xf4f4f2,roughness:.25,metalness:.05});
const chromeMat=new THREE.MeshStandardMaterial({color:0xc9c9c6,roughness:.2,metalness:.9});

/* what the things that are not cabinets are: the card under the «i» that comes up when the cursor rests on one (engine.js), as in the kitchen */
const INFO={
  tray:()=>{const [x0,x1,z0,z1]=trayRect(),cm=v=>Math.round(v/10);   // its sizes as the plan has them now
    return {title:'Душевой поддон',lines:[`${cm(x1-x0)} × ${cm(z1-z0)} см, высота ${cm(TRAY.H)} см: во всю душевую, от левой стены до перегородки.`,
      'Литьевой мрамор, белый; верх под сланец, четыре ската к трапу.',
      `Квадратный хромированный трап ${cm(TRAY.drain)} × ${cm(TRAY.drain)} см, в четверти длины от левой стены.`]};},
  sinkCab:()=>{const n=washNiche(),S=SINK_CAB,y0=WASH.sinkT+S.Gap,y1=Math.min(y0+S.H,A.H),cm=v=>Math.round(v/10);   // its width is the niche's
    return {title:'Зеркальный шкафчик над раковиной',lines:[`${cm(n.w)} × ${cm(S.D)} см, высота ${cm(y1-y0)} см: во всю ширину ниши.`,
      `Корпус — ЛДСП ${finName(finOf(FIN,'carcass'))}, фасады — ${finName(finOf(FIN,'front'))}; на дверях зеркало 4 мм.`,
      `Две распашные двери, ${S.N} полки внутри.`,
      `Низ в ${cm(y0)} см от пола, на ${cm(S.Gap)} см выше раковины; на крыше светильник 45 см.`,
      'Нажатие открывает и закрывает двери.']};},
  curtain:()=>{const cm=v=>Math.round(v/10),C=CURT,r=curtRod();
    return {title:'Шторка для душа',lines:[`${cm(C.w)} × ${cm(C.h)} см, клеёнка (PEVA), полупрозрачная, матовая; люверсы и кольца — хром.`,
      `Штанга прямая, ${cm(r.x1-r.xb)} см: слева в перегородку, справа заходит за стенку у ниши и упирается в шар кронштейна на её задней стороне; нержавеющая сталь, хром, Ø 2 см; в ${cm(curtRodY())} см от пола.`,
      `Низ шторки в ${cm(C.gap)} см над поддоном.`,
      'Нажатие задёргивает шторку или отодвигает её за стенку.']};},
  rack:()=>{const cm=v=>Math.round(v/10),R=RACK;
    return {title:'Душевая система AM.PM Chic 2.0 с термостатом',lines:[`Высота ${cm(R.top+10-(R.y-R.r))} см (штанга выдвигается, 88–127 см), верхний душ Ø ${cm(R.head)} см в ${cm(R.reach)} см от стены; ручная лейка Ø ${cm(R.hand)} см, шланг 1,75 м.`,
      'Латунь, хром; межосевое расстояние 150 мм.',
      `Термостат в ${cm(R.y)} см от пола (${cm(R.y-TRAY.H)} см над поддоном), верхний душ в ${cm(R.top-45)} см; на левой стене посередине душевой.`],price:21000,url:'https://ozon.ru/t/RhrtHZA',shop:'Ozon'};}
};

/* the installation and the toilet stand in the niche (bath axes, m): the tiled installation box along the left wall
   under the upper cabinet, its flush plate, the wall-hung bowl facing +x with its seat */
function buildSanitary(g,opts){
  const box=boxIn(g);
  const zf=current.zf*MM,di=P.Di*MM,hi=P.Hi*MM,lt=P.Lt*MM,cz=zf+lt/2;
  box(0,di,0,hi,zf,zf+lt,tileMat);
  box(di,di+.008,hi-.28,hi-.115,cz-.123,cz+.123,chromeMat);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.18,.15,.36,32),whiteMat);
  bowl.scale.set(.7/.36,1,1);bowl.position.set(di+.15,.22,cz);bowl.castShadow=bowl.receiveShadow=true;g.add(bowl);   // 700 mm long: 200 mm sunk into the box, 500 mm out
  const seat=new THREE.Mesh(new THREE.CylinderGeometry(.185,.185,.02,32),whiteMat);
  seat.scale.set(.5/.37,1,1);seat.position.set(di+.25,.41,cz);g.add(seat);
  wash=new THREE.Group();wash.userData.wash=true;const doors=buildWash(wash,opts);g.add(wash);
  tray=new THREE.Group();tray.userData.tray=true;tray.userData.info=INFO.tray;buildTray(tray);g.add(tray);
  rack=buildRack(g);
  return doors.concat(buildCurtain(g,opts));
}

/* ---------- the shower tray: white cast marble under slate, behind the step at the niche end ----------
   It fills the shower: from the left wall to the shower partition, from the wall at the niche end to the kitchen wall
   (sizes from the plan; 1000 × 700 as they are now), 150 mm high. Its top falls in four faces to a square chrome drain
   a quarter of its length from the left wall, half way across. A product of its own, not in the cut list, no sizes in the panel.
   The bath tab shows it only while the frame takes it in whole (the left wall up to the kitchen wall). Bath axes, mm */
const TRAY={H:150,drain:120,at:.25};   // height; the drain's side; where it is along the tray from the left wall
let tray=null;
const trayRect=()=>[0,A.bWs+A.bGap,A.bL+A.wt,kZ0-zB0];   // x0, x1, z0, z1
/* the top's relief as a height field (mm), lit through a normal map; its colour an even white, a shade darker down in the relief.
   The slate: value noise bent by noise of its own (domain warp) cut in thin layers, each ending in a short sharp step, as split
   stone flakes; a fine grain over it; the four faces falling 6 mm to the drain. 1 px ≈ 1 mm of a 1000 × 700 tray.
   Made once, on the first tray (≈ 0.15 s); where a canvas has no pixels (the checks in Node) the top stays plain */
let trayTex=null;
function makeTrayTex(){
  const W=1024,Hp=716,mmPx=1000/W;
  const canvas=()=>{const c=document.createElement('canvas');c.width=W;c.height=Hp;const g=c.getContext('2d');return {c,g,img:g.createImageData(W,Hp)};};
  const col=canvas(),nrm=canvas();
  const tex=(o,srgb)=>{const t=new THREE.CanvasTexture(o.c);t.anisotropy=8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;};
  if(!(col.img.data&&col.img.data.length===W*Hp*4))return {map:null,normalMap:null};
  const hash=(i,j)=>{let h=Math.imul(i,374761393)+Math.imul(j,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
  const noise=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*fx*(fx*(fx*6-15)+10),v=fy*fy*fy*(fy*(fy*6-15)+10);
    const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
  const fbm=(x,y,n)=>{let s=0,k=.5,f=1;for(let o=0;o<n;o++){s+=k*noise(x*f+o*17.3,y*f-o*9.1);f*=2.03;k*=.5;}return s/(1-Math.pow(.5,n));};
  const cx=TRAY.at*W,cy=Hp/2,hgt=new Float32Array(W*Hp),cav=new Float32Array(W*Hp);
  for(let y=0;y<Hp;y++)for(let x=0;x<W;x++){
    const X=x*mmPx,Y=y*mmPx;
    const wx=fbm(X/400,Y/400,3)-.5,wy=fbm(X/400+5.2,Y/400+1.3,3)-.5;
    const u=X/260+1.6*wx,v=Y/200+1.6*wy;                   // the grain a little longer along the tray
    const soft=fbm(u,v,4);                                  // broad soft waves
    const r=1-Math.abs(2*fbm(u*1.7+3.1,v*1.7-2.2,4)-1),crease=r*r*r;   // sharp folds where the ridged noise peaks
    const jag=fbm(X/14,Y/14,2)-.5,t=(soft+.05*jag)*4,f=t-Math.floor(t);
    const mask=Math.min(1,Math.max(0,(fbm(X/300-7,Y/300+3,2)-.42)*5));   // flakes only in patches
    const e=Math.min(1,f/.12),chip=(Math.floor(t)+e*e*(3-2*e)-t)*mask;   // a short drop at each layer's edge, then flat
    const face=Math.max(x<cx?(cx-x)/cx:(x-cx)/(W-cx),Math.abs(y-cy)/cy);   // 0 at the drain, 1 at the edges
    hgt[y*W+x]=soft*2.2+crease*.5+chip*.45+(fbm(X/4,Y/4,2)-.5)*.06+face*3;
    cav[y*W+x]=soft*.6+crease*.4;
  }
  const K=2.5,at=(x,y)=>hgt[Math.min(Hp-1,Math.max(0,y))*W+Math.min(W-1,Math.max(0,x))];   // K: the relief shown a little deeper than it is
  const C=col.img.data,N=nrm.img.data;
  for(let y=0;y<Hp;y++)for(let x=0;x<W;x++){
    const i=y*W+x,o=i*4;
    // canvas x runs along +u, its rows down = −v: the normal's green leans to +v
    const nx=-(at(x+1,y)-at(x-1,y))/(2*mmPx)*K,ny=(at(x,y+1)-at(x,y-1))/(2*mmPx)*K;const l=Math.hypot(nx,ny,1);
    N[o]=(nx/l*.5+.5)*255;N[o+1]=(ny/l*.5+.5)*255;N[o+2]=(1/l*.5+.5)*255;N[o+3]=255;
    const k=.95+.05*cav[i];C[o]=243*k;C[o+1]=243*k;C[o+2]=240*k;C[o+3]=255;
  }
  col.g.putImageData(col.img,0,0);nrm.g.putImageData(nrm.img,0,0);
  return {map:tex(col,true),normalMap:tex(nrm,false)};
}
const trayMats=(()=>{
  const top=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.72});
  const side=new THREE.MeshStandardMaterial({color:0xefefec,roughness:.75});
  // the drain's grate: a round cover in the square, four arc slots round it, as on a Ø110 trap
  const grate=new THREE.MeshStandardMaterial({map:drawnTex(128,g=>{g.fillStyle='#d6d6d3';g.fillRect(0,0,128,128);g.strokeStyle='#5c5e60';g.lineWidth=5;
    for(let k=0;k<4;k++){g.beginPath();g.arc(64,64,50,k*Math.PI/2+.25,(k+1)*Math.PI/2-.25);g.stroke();}
    g.lineWidth=2;g.beginPath();g.arc(64,64,34,0,Math.PI*2);g.stroke();g.strokeRect(5,5,118,118);},1,1,true),roughness:.2,metalness:.85});
  return {top,side,grate};
})();
function buildTray(g){
  const [x0,x1,z0,z1]=trayRect().map(v=>v*MM),h=TRAY.H*MM,{top,side,grate}=trayMats;
  if(!trayTex){trayTex=makeTrayTex();if(trayTex.map){top.map=trayTex.map;top.normalMap=trayTex.normalMap;top.needsUpdate=true;}}
  const body=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,h,z1-z0),[side,side,top,side,side,side]);   // the top (+y) face slate, the rest plain
  body.position.set((x0+x1)/2,h/2,(z0+z1)/2);body.castShadow=body.receiveShadow=true;body.userData.part='Душевой поддон';g.add(body);
  const d=TRAY.drain*MM,cx=x0+(x1-x0)*TRAY.at,cz=(z0+z1)/2;
  const m=new THREE.Mesh(new THREE.BoxGeometry(d,.003,d),[chromeMat,chromeMat,grate,chromeMat,chromeMat,chromeMat]);
  m.position.set(cx,h+.0015,cz);m.receiveShadow=true;g.add(m);
}

/* ---------- the shower rack: a thermostat, its riser with the overhead shower on an arm, the hand shower in a holder ----------
   On the left wall half way along the tray, its water sprays toward the partition, not out of the opening. The thermostat bar
   1150 from the floor on two elbows 150 apart, its knobs at the ends; the riser up to 2100, held to the wall under its top,
   turning in a round bend into the arm out to the Ø220 head 442 from the wall, the arm turning down to it the same way
   (as AM.PM Chic 2.0, F0782A500: its rack 880–1270 high, the hose 1750); the hand shower Ø110 in a holder on the riser,
   its hose hanging from the thermostat's outlet. A product of its own, not in the cut list; shown with the tray. Two groups: what is on the wall stops
   the walker, the arm with the head is over the head (walkThrough), else the walk takes the whole rack for one box. Bath axes, mm */
const RACK={y:1150,len:300,r:30,out:70,top:2100,reach:442,head:220,hand:110,holder:1550};
let rack=null;
function buildRack(sani){
  const wall=new THREE.Group(),over=new THREE.Group();
  [wall,over].forEach((o,i)=>{o.userData.rack=i?'over':'wall';o.userData.info=INFO.rack;sani.add(o);});over.userData.walkThrough=true;
  let g=wall;
  const R=RACK,[,,z0,z1]=trayRect(),c=(z0+z1)/2*MM,x=R.out*MM,y=R.y*MM,r=R.r*MM,top=R.top*MM,ax=R.reach*MM;
  // a cylinder along y, or along z / x (turn 'z' / 'x'), into g or another group (to)
  const cyl=(r0,r1,h,mat,px,py,pz,turn,to=g)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,32),mat);m.position.set(px,py,pz);
    if(turn==='z')m.rotation.x=Math.PI/2;else if(turn==='x')m.rotation.z=Math.PI/2;m.castShadow=true;to.add(m);return m;};
  // the thermostat: the bar along the wall, the knobs at its ends, the elbows into the wall
  cyl(r,r,R.len*MM,chromeMat,x,y,c,'z').userData.rackPart='thermostat';
  [-1,1].forEach(s=>{cyl(.028,.028,.05,chromeMat,x,y,c+s*(R.len/2+25)*MM,'z');                       // knob
    cyl(.026,.026,.004,darkMat,x,y,c+s*(R.len/2+51)*MM,'z');                                           // its cap
    cyl(.012,.012,x-r/2,chromeMat,(x-r/2)/2,y,c+s*.075,'x');                                           // elbow
    cyl(.032,.032,.008,chromeMat,.004,y,c+s*.075,'x');});                                              // its wall rose
  // the riser, its wall bracket; over the head: the arm and the overhead shower
  const bend=.06,drop=.03;   // the bends' radii: the riser into the arm, the arm down to the head
  cyl(.011,.011,top-bend-y-r,chromeMat,x,(y+r+top-bend)/2,c).userData.rackPart='riser';
  cyl(.008,.008,x,chromeMat,x/2,top-.25,c,'x');cyl(.025,.025,.008,chromeMat,.004,top-.25,c,'x');cyl(.016,.016,.04,chromeMat,x,top-.25,c);
  g=over;
  // a quarter of a pipe ring about (cx, cy) in the wall's normal plane, from the angle a (rad) on
  const arc=(rad,cx,cy,a)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(rad,.011,16,24,Math.PI/2),chromeMat);m.position.set(cx,cy,c);m.rotation.z=a;
    m.castShadow=true;m.userData.rackPart='bend';g.add(m);};
  arc(bend,x+bend,top-bend,Math.PI/2);                                                                 // the riser turns out into the arm
  cyl(.011,.011,ax-drop-x-bend,chromeMat,(x+bend+ax-drop)/2,top,c,'x');
  arc(drop,ax-drop,top-drop,0);                                                                        // the arm turns down to the head
  cyl(.014,.014,.008,chromeMat,ax,top-.026,c);                                                         // the head's ball joint nut
  cyl(R.head/2*MM,R.head/2*MM,.01,chromeMat,ax,top-.035,c).userData.rackPart='head';
  cyl(R.head/2*MM-.012,R.head/2*MM-.012,.002,darkMat,ax,top-.041,c);                                   // its nozzle plate
  // the hand shower in its holder: the handle a little out of plumb, its top leaning out; the head on the handle's end
  // by its rim (the handle goes into its side), its face turned off the handle's line a little down, into the shower
  g=wall;
  cyl(.016,.016,.04,chromeMat,x,R.holder*MM,c);
  const boxH=boxIn(g);boxH(x+.01,x+.04,R.holder*MM-.015,R.holder*MM+.015,c-.012,c+.012,chromeMat);
  const hand=new THREE.Group(),tilt=-.15;hand.position.set(x+.05,R.holder*MM,c);hand.rotation.z=tilt;hand.userData.rackPart='hand';g.add(hand);
  cyl(.014,.012,.22,chromeMat,0,-.06,0,null,hand);                                                    // handle, its end 50 over the holder
  const hr=R.hand/2*MM,fa=-.2,n=[Math.cos(fa),Math.sin(fa)],u=[-n[1],n[0]];                              // the face's normal; up the head's plane
  const hc=[u[0]*(hr-.012),.05+u[1]*(hr-.012)];                                                         // the head's centre: the handle 12 into its rim
  const hd=cyl(hr,hr,.028,chromeMat,hc[0],hc[1],0,null,hand);hd.rotation.z=fa-Math.PI/2;hd.userData.rackPart='handHead';   // head
  const hf=cyl(hr-.008,hr-.008,.002,darkMat,hc[0]+n[0]*.015,hc[1]+n[1]*.015,0,null,hand);hf.rotation.z=fa-Math.PI/2;   // its face
  // the hose, in the wall's normal plane: from a nut under the thermostat straight down, round a loop and straight up in front
  // of the thermostat, then in a smooth bend into the handle's end along its line; 1750 long
  const hb=[x+.05+.17*Math.sin(tilt),R.holder*MM-.17*Math.cos(tilt)],dd=[Math.sin(tilt),-Math.cos(tilt)];   // the handle's end; down its line
  cyl(.012,.012,.018,chromeMat,x,y-r-.007,c);                                                           // the outlet's nut
  const Ru=.06,yU=.41+Ru,x2=x+2*Ru,y1=1,path=[];
  for(let v=y-r-.016;v>yU;v-=.01)path.push([x,v]);
  for(let i=0;i<=16;i++){const a=Math.PI*(1+i/16);path.push([x+Ru+Ru*Math.cos(a),yU+Ru*Math.sin(a)]);}
  for(let v=yU+.01;v<y1;v+=.01)path.push([x2,v]);
  const B=[[x2,y1],[x2,y1+.14],[hb[0]+dd[0]*.1,hb[1]+dd[1]*.1],hb];
  for(let i=1;i<=24;i++){const t=i/24,s=1-t,w=[s*s*s,3*s*s*t,3*s*t*t,t*t*t];path.push([0,1].map(j=>w.reduce((a,wi,q)=>a+wi*B[q][j],0)));}
  const hose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.map(([px,py])=>new THREE.Vector3(px,py,c))),path.length*2,.008,12,false),chromeMat);
  hose.castShadow=true;hose.userData.rackPart='hose';hose.userData.path=path;g.add(hose);
  return [wall,over];
}

/* ---------- the shower curtain: on a rod across the shower just past the wall at the niche end ----------
   The rod straight: on the left (as one goes in) into the partition, on the right past the end of the wall at the niche end,
   into the ball of a bracket on that wall's back (the shower's side), half way along the wall: a round flange on three screws, a stem, a ball with one
   blind hole toward the partition, the rod's end in it. Drawn back the curtain gathers in folds behind that wall, up to 10 short of its end; a click draws it
   across the opening. Frosted half-clear vinyl 1000 × 2200 down to 10 over the tray, eyelets along its top: chrome rings as the rod's
   (two half circles joined by straight bits) hung on the rod go through them, the cloth's top over the rings' bottoms.
   One of the room's doors (key 'curtain', axis 'none': follow(a) shapes it): 0 drawn back, 1 across; a click, «Открыты/Закрыты»
   (open: across), a long press, the walk (it does not stop the walker). The cloth's top flat along the rod about each eyelet,
   between them it bulges out to either side in turn: its width kept, the closer the rings the deeper the folds. Bath axes, mm */
const CURT={h:2200,w:1000,off:45,ball:16,gap:10,rings:10,pad:10,edge:10,flat:5,ring:[16,28],tube:2.5,eye:[4,12]};   // the cloth's height and width; the rod's axis from the wall; the bracket's ball radius (the rod Ø20 through it); the cloth's bottom over the tray; rings; the gap at the partition and at the end of the wall at the niche end; an eyelet's centre from the cloth's side; the cloth flat on either side of an eyelet's centre; a ring's half width (its half circles' radius) and half height; its tube's radius; an eyelet's hole radius and its centre under the cloth's top
// the rod's height: the cloth from 10 over the tray; the hole's top resting on the ring's bottom, the ring's inside on the rod (Ø20)
const curtRodY=()=>{const C=CURT,yh=TRAY.H+C.gap+C.h-C.eye[1];return yh+C.eye[0]-C.tube+2*C.ring[1]-C.tube-10;};
// the rod (mm): its bracket's ball at xb on the wall's back (zw), the rod's end in it, the run clear of the ball from xs to x1, at z
const curtRod=()=>{const C=CURT,xb=A.bWs/2,zw=A.bL+A.wt;return {xb,zw,xs:xb+C.ball,x1:A.bWs+A.bGap,z:zw+C.off};};
// frosted vinyl: plain grey, 60 % clear
const CURT_OP=.4,curtainMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#cccccc').convertSRGBToLinear(),roughness:.35,transparent:true,opacity:CURT_OP,depthWrite:false,side:THREE.DoubleSide});
/* its half shadow: a shadow map knows no half clear, so for the shadow the cloth is a fine random sieve of 4 mm cells, as
   many of them stopping the light as the cloth is opaque (cells of random greys, those under 1 − opacity through), the soft
   shadow filter (PCF) blurs it into an even shadow 40 % of a full one. Cells in the cloth's own uv (its length and height),
   so they go with it as it gathers. One more mesh of some four hundred triangles in the shadow pass, its shape made again only while it moves */
const CELL=4,curtainShadowMat=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaTest:1-CURT_OP,
  alphaMap:(t=>{t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;})(drawnTex(64,g=>{
    for(let i=0;i<64;i++)for(let j=0;j<64;j++){let h=Math.imul(i,374761393)+Math.imul(j,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);
      const v=((h^(h>>>16))>>>0)%255+1;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(i,j,1,1);}},1,1))});
let curtain=null;
function buildCurtain(sani,opts){
  const C=CURT,{xb,zw,xs,x1,z}=curtRod(),zr=z*MM,yr=curtRodY()*MM,rb0=C.ball*MM,X0=xs+C.pad,y0=TRAY.H+C.gap,y1=y0+C.h,yh=y1-C.eye[1],hr=C.eye[0];
  const [ra,rb]=C.ring.map(v=>v*MM),tb=C.tube*MM,yc=yr+.01+tb-rb;   // a ring's centre: its inside resting on the rod
  curtain=new THREE.Group();curtain.userData.curtain=true;curtain.userData.walkThrough=true;curtain.userData.info=INFO.curtain;sani.add(curtain);
  // the rod (stays): straight from the partition (a flange Ø30 there) into the bracket's ball, its end in the ball's blind hole (to its middle)
  const put=(geo,x,y,zz,rx,rz,part,mat=chromeMat)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,zz);m.rotation.set(rx||0,0,rz||0);m.castShadow=true;if(part)m.userData.rodPart=part;curtain.add(m);return m;};
  const r0=xb*MM,zw0=zw*MM;
  put(new THREE.CylinderGeometry(.01,.01,x1*MM-r0,24),(r0+x1*MM)/2,yr,zr,0,Math.PI/2,'run');
  put(new THREE.CylinderGeometry(.015,.015,.008,24),x1*MM-.004,yr,zr,0,Math.PI/2,'flange');
  // the bracket: the flange Ø46 on the wall with three screws, the stem (a wider foot, a neck), the ball the rod goes through
  put(new THREE.CylinderGeometry(.023,.023,.006,32),xb*MM,yr,zw0+.003,Math.PI/2,0,'flange');
  [Math.PI/2,Math.PI*7/6,Math.PI*11/6].forEach(a=>put(new THREE.CylinderGeometry(.002,.002,.001,8),xb*MM+.016*Math.cos(a),yr+.016*Math.sin(a),zw0+.0062,Math.PI/2,0,null,darkMat));
  put(new THREE.CylinderGeometry(.011,.012,.008,24),xb*MM,yr,zw0+.01,Math.PI/2);
  put(new THREE.CylinderGeometry(.007,.009,zr-rb0-zw0-.014+.004,24),xb*MM,yr,(zw0+.014+zr-rb0+.004)/2,Math.PI/2);
  put(new THREE.SphereGeometry(rb0,32,24),xb*MM,yr,zr,0,0,'ball');
  const g=new THREE.Group();curtain.add(g);
  /* the cloth: columns across its width, four rows down it (its top, the eyelets' band, the hem); in the band no face over the
     eyelets' holes. Columns: the cloth's left side; for each eyelet the ends of the flat about it and the hole's sides; between
     eyelets M − 1 more along the fold. Where they stand along the width (t, 0…1) and how far off the rod (f) — shape() */
  const n=C.rings,M=8,cols=[{t:0}];
  for(let j=0;j<n;j++){cols.push({j,e:-C.flat},{j,e:-hr,hole:true},{j,e:hr},{j,e:C.flat});if(j<n-1)for(let k=1;k<M;k++)cols.push({j,u:k/M});}
  cols.push({t:1});
  const K=cols.length,ys=[y1,yh+hr,yh-hr,y0],pos=new Float32Array(K*4*3),uv=new Float32Array(K*4*2),idx=[],tile=64*CELL;   // the sieve's uv: one tile of its texture every 64 cells
  for(let c=0;c<K-1;c++)for(let r=0;r<3;r++){if(r===1&&cols[c].hole)continue;const a=c*4+r;idx.push(a,a+1,a+4,a+1,a+5,a+4);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setIndex(idx);
  const cloth=new THREE.Mesh(geo,curtainMat);cloth.castShadow=cloth.receiveShadow=true;cloth.customDepthMaterial=curtainShadowMat;cloth.userData.part='Шторка для душа';cloth.userData.tris=idx.length/3;g.add(cloth);
  // a ring: two half circles joined by straight bits, across the rod; an eyelet: a chrome rim about the hole, on both faces of the cloth
  const st=rb-ra,ringPts=[];
  [1,-1].forEach(sd=>{for(let k=0;k<16;k++){const f=Math.PI*k/16;ringPts.push(new THREE.Vector3(0,sd*(st+ra*Math.sin(f)),sd*ra*Math.cos(f)));}
    for(let k=0;k<6;k++)ringPts.push(new THREE.Vector3(0,sd*(st-2*st*k/6),-sd*ra));});
  const ringGeo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts,true),48,tb,8,true),eyeGeo=new THREE.TorusGeometry((hr+1.25)*MM,1.25*MM,6,16);
  const rings=[...Array(n)].map(()=>{const r=new THREE.Mesh(ringGeo,chromeMat);r.castShadow=true;r.userData.ring=true;g.add(r);return r;});
  const eyes=[...Array(n)].map(()=>{const e=new THREE.Mesh(eyeGeo,chromeMat);e.userData.eyelet=true;g.add(e);return e;});
  // a fold between two eyelets, its flat ends D apart: a hump A sin²(πu) to one side, as deep as makes it L long (halving A)
  const foldLen=(A,D)=>{let L=0;for(let i=0;i<32;i++)L+=Math.hypot(D,A*Math.PI*Math.sin(2*Math.PI*(i+.5)/32));return L/32;};
  const foldDepth=(L,D)=>{if(foldLen(0,D)>=L)return 0;let a=0,b=L;for(let i=0;i<30;i++){const m=(a+b)/2;if(foldLen(m,D)<L)a=m;else b=m;}return b;};
  // the cloth from behind the wall out to its edge, its folds as deep as keep its width
  let last=-1;
  const shape=a=>{const k=Math.min(1,Math.max(0,a));if(k===last)return;last=k;
    const w0=A.bWs-C.pad-X0,w=w0+k*(x1-C.pad-X0-w0),tj=j=>(C.edge+j*(w-2*C.edge)/(n-1))/w,D=(w-2*C.edge)/(n-1)-2*C.flat,Lf=(C.w-2*C.edge)/(n-1)-2*C.flat;
    // as deep to either side (the eyelets evenly spaced), but off the wall at the niche end (the rod 45 out): drawn back a little shallower than its width asks
    const fa=Math.min(foldDepth(Lf,D),C.off-3);
    cols.forEach((o,c)=>{let t,f=0;
      if(o.t!==undefined)t=o.t;else if(o.u===undefined)t=tj(o.j)+o.e/w;
      else{const t0=tj(o.j)+C.flat/w;t=t0+o.u*(tj(o.j+1)-C.flat/w-t0);f=(o.j%2?-fa:fa)*Math.sin(Math.PI*o.u)**2;}
      const x=(X0+t*w)*MM;
      ys.forEach((y,r)=>{pos.set([x,y*MM,zr+(r<3?f:.8*f)*MM],(c*4+r)*3);uv.set([t*C.w/tile,(y-y0)/tile],(c*4+r)*2);});});
    geo.attributes.position.needsUpdate=geo.attributes.uv.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
    for(let j=0;j<n;j++){const x=(X0+tj(j)*w)*MM;rings[j].position.set(x,yc,zr);eyes[j].position.set(x,yh*MM,zr);}
    g.userData.eyes=eyes.map(e=>[Math.round(e.position.x*1000),Math.round(e.position.y*1000)]);g.userData.fold=Math.round(fa);
    g.userData.edge=Math.round(X0+w);g.userData.top=Math.round(y1);};
  const prev=opts.prev.find(d=>d.key==='curtain');
  const d=Object.assign({g,a:0,t:0,max:1,key:'curtain',axis:'none',follow:shape},prev&&{a:prev.a,t:prev.t,last:prev.last});
  if(!prev&&opts.open)d.t=d.max;turnDoor(d);
  return [d];
}

/* ---------- the washing machine and the sink over it: in the niche right of the bathroom door ----------
   The niche runs from the partition next to the tall cabinet to the hall wall, from the back wall (sizes from the plan).
   The machine stands in it facing the room, a flat «water lily» sink with its mixer hangs over it, and over the sink a wall
   cabinet with two hinged mirror doors and shelves, a lamp on its top (the machine's door opens, see washerDoor): a product of its own, not in the bathroom's cut list, no sizes in the panel
   (its finishes are the bathroom's). Bath axes, mm.
   The bath tab's frame ends at the partition, so its own view hides them; the plan and the walk show them */
const WASH={W:595,H:850,D:540,back:40,sinkD:600,sinkY:880,sinkT:1000};
const SINK_CAB={D:200,Gap:300,H:700,N:2};   // the cabinet over the sink: depth with its doors, from the sink's top up to its bottom, height, shelves
let wash=null;
const washNiche=()=>{const x0=A.bNiche+A.wt,x1=xB1-xL;return {x0,x1,cx:(x0+x1)/2,w:x1-x0};};
const washRect=()=>{const n=washNiche(),w=Math.min(WASH.W,n.w-4)/2;return [n.cx-w,n.cx+w,WASH.back,WASH.back+WASH.D];};
const darkMat=new THREE.MeshStandardMaterial({color:0x2b2d2f,roughness:.35,metalness:.2});
const portMat=new THREE.MeshStandardMaterial({color:0x4a9be0,roughness:.05,metalness:.1,transparent:true,opacity:.4,depthWrite:false});
const lampBodyMat=new THREE.MeshStandardMaterial({color:0x4a4c50,roughness:.3,metalness:.8});
const lampMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff3dc,emissiveIntensity:1,roughness:.4});
const mirrorMat=new THREE.MeshStandardMaterial({color:0xdfe7ec,roughness:.06,metalness:.55});
// the cabinet over the sink: the width of the niche, up to the ceiling at most, back rails at the wall, the doors overlay
function sinkCabParts(){
  const n=washNiche(),S=SINK_CAB,x0=n.x0,x1=n.x1,y0=WASH.sinkT+S.Gap,y1=Math.min(y0+S.H,A.H),dc=S.D-TF,xm=(x0+x1)/2,[parts,add]=partList();
  add('Бок шкафчика над раковиной','carcass',x0,x0+T,y0,y1,0,dc);
  add('Бок шкафчика над раковиной','carcass',x1-T,x1,y0,y1,0,dc);
  add('Дно шкафчика над раковиной','carcass',x0+T,x1-T,y0,y0+T,0,dc);
  add('Крышка шкафчика над раковиной','carcass',x0+T,x1-T,y1-T,y1,0,dc);
  const rb=Math.min(100,(y1-y0-2*T)/3);
  add('Ребро жёсткости шкафчика над раковиной','carcass',x0+T,x1-T,y0+T,y0+T+rb,0,T);
  add('Ребро жёсткости шкафчика над раковиной','carcass',x0+T,x1-T,y1-T-rb,y1-T,0,T);
  const su=(y1-y0-T)/(S.N+1);
  for(let i=1;i<=S.N;i++){const y=y0+i*su;add('Полка шкафчика над раковиной','carcass',x0+T,x1-T,y,y+T,T,dc-10);}
  add('Фасад шкафчика над раковиной','front',x0+G/2,xm-G/2,y0+G/2,y1-G/2,dc,S.D,{hinge:'L'});
  add('Фасад шкафчика над раковиной','front',xm+G/2,x1-G/2,y0+G/2,y1-G/2,dc,S.D,{hinge:'R'});
  return parts;
}
function buildWash(g,opts){
  const box=boxIn(g),n=washNiche(),[x0,x1,z0,z1]=washRect().map(v=>v*MM),cx=n.cx*MM,h=WASH.H*MM;
  // the machine (its own group): a hollow body, the drum in it behind the loading opening, the drawer and the display; the round door
  const mc=new THREE.Group();mc.userData.machine=true;g.add(mc);
  const mb=boxIn(mc),t=.012,fz=z1-t,dy=WD.y*MM,hr=WD.glass*MM;
  mb(x0,x0+t,0,h,z0,fz,whiteMat);mb(x1-t,x1,0,h,z0,fz,whiteMat);                 // sides
  mb(x0+t,x1-t,h-t,h,z0,fz,whiteMat);mb(x0+t,x1-t,0,t,z0,fz,whiteMat);            // top, bottom
  mb(x0+t,x1-t,t,h-t,z0,z0+t,whiteMat);                                           // back
  { const sh=new THREE.Shape();sh.moveTo(x0,0);sh.lineTo(x1,0);sh.lineTo(x1,h);sh.lineTo(x0,h);sh.lineTo(x0,0);   // front with the loading opening
    const hole=new THREE.Path();hole.absarc(cx,dy,hr,0,Math.PI*2,true);sh.holes.push(hole);
    const fr=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false,curveSegments:32}),whiteMat);
    fr.position.z=fz;fr.castShadow=fr.receiveShadow=true;mc.add(fr); }
  buildDrum(mc,cx,dy,fz,hr);
  mb(x0+.01,x0+.17,h-.1,h-.03,z1,z1+.006,whiteMat);   // drawer
  mb(cx+.03,cx+.17,h-.085,h-.045,z1,z1+.004,darkMat);   // display
  const wd=washerDoor(cx,z1,opts.prev.find(d=>d.key==='washer'),opts.open);g.add(wd.g);
  // the sink: a shallow bowl (bottom, rims) with the mixer on its back deck, 30 mm over the machine
  const sw=Math.min(600,n.w)/2*MM,sx0=cx-sw,sx1=cx+sw,y0=WASH.sinkY*MM,y1=WASH.sinkT*MM,sd=WASH.sinkD*MM,r=.035,deck=.13;
  box(sx0,sx1,y0,y0+.02,0,sd,whiteMat);
  box(sx0,sx1,y0,y1,0,deck,whiteMat);
  box(sx0,sx1,y0,y1,sd-r,sd,whiteMat);
  box(sx0,sx0+r,y0,y1,deck,sd-r,whiteMat);
  box(sx1-r,sx1,y0,y1,deck,sd-r,whiteMat);
  const drain=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.004,24),chromeMat);drain.position.set(cx,y0+.022,(deck+sd)/2);g.add(drain);
  mixer(g,cx,y1,deck/2);
  // the cabinet over the sink; a 4 mm mirror glued on each door edge to edge, swings with it
  const cab=buildParts({parts:sinkCabParts()},mats,opts);
  cab.doors.forEach(d=>{const p=d.g.children[0].userData.part,hp=d.g.position;
    const mr=new THREE.Mesh(new THREE.BoxGeometry((p.x1-p.x0)*MM,(p.y1-p.y0)*MM,.004),mirrorMat);
    mr.position.set((p.x0+p.x1)/2*MM-hp.x,(p.y0+p.y1)/2*MM-hp.y,p.z1*MM+.002-hp.z);mr.userData.mirror=true;d.g.add(mr);});
  // a lamp on the cabinet's top: a bracket holding a bar 450 mm long out in front of the mirrors, its underside glowing
  { const top=Math.max(...cab.doors.map(d=>d.g.children[0].userData.part.y1))*MM+G/2*MM,zd=SINK_CAB.D*MM,y0=top+.03,y1=y0+.025,z0=zd+.045,z1=z0+.025;
    const lamp=(mat,...a)=>{box(...a,mat).userData.lamp=mat===lampMat?'glow':'body';};
    lamp(lampBodyMat,cx-.02,cx+.02,top,y1,zd-.06,z0);              // bracket
    lamp(lampBodyMat,cx-.225,cx+.225,y0,y1,z0,z1);                 // bar
    lamp(lampMat,cx-.222,cx+.222,y0-.002,y0,z0+.002,z1-.002); }    // diffuser
  cab.model.userData.sinkCab=true;cab.model.userData.info=INFO.sinkCab;g.add(cab.model);
  return [wd,...cab.doors];
}
/* the machine's door, as real ones: Ø480 mm with a Ø330 mm glass, on a hinge 12 mm past its edge; a free door opens to 180°,
   here the niche's walls stop it (the partition next to the tall cabinet on the left, the hall wall on the right).
   It opens toward the half that was clicked: as it starts to open from closed it hinges on that side (the click's point is
   d.hit, engine.js: pickDoor); opened otherwise («Открыты») it keeps the side it had, the left one at first.
   One of the room's doors (key 'washer'): a click, «Открыты/Закрыты», the walk. Bath axes, m */
const WD={R:240,glass:165,hinge:12,y:440};
/* a plain drum behind the loading opening (radius hr, centre at y, front panel's back at fz; m): the rubber cuff, the steel drum
   Ø470 × 340 with its front ring and back. Lit as if the body were open (no shadows inside) so it reads */
const drumMat=new THREE.MeshStandardMaterial({color:0xb9bdc1,roughness:.35,metalness:.6,side:THREE.DoubleSide});
const rubberMat=new THREE.MeshStandardMaterial({color:0x2b2c2e,roughness:.85,side:THREE.DoubleSide});
/* the basin mixer on the sink's back deck (x, z its axis, y the deck's top; m), chrome as the shower rack (mm): a tall round body Ø40
   up to 170 on a foot ring, a flat spout 36 × 16 straight out toward the room from 110 up, 160 from the axis, the aerator under its
   tip; on top a flat lever plate as wide, round over the body, out over the spout: one piece (a disc and a plate would share faces
   and flicker). Every piece one chrome, as the rack's: they cast shadows, none takes one, so none looks darker than the rest */
function mixer(g,x,y,z){
  const cyl=(r,h,py,pz)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),chromeMat);c.position.set(x,py,pz);c.castShadow=true;
    c.userData.mixer=true;g.add(c);return c;};
  const top=y+.17,sw=.018;
  cyl(.022,.004,y+.002,z);                                           // the foot ring
  cyl(.02,top-y-.004,(y+.004+top)/2,z);                              // the body
  const sp=new THREE.Mesh(new THREE.BoxGeometry(2*sw,.016,.16),chromeMat);sp.position.set(x,y+.118,z+.08);sp.castShadow=true;sp.userData.mixer=true;g.add(sp);   // the spout
  cyl(.011,.006,y+.107,z+.145);                                      // its aerator
  cyl(.014,.012,top+.006,z);                                         // the lever's hub
  // the lever: in plan round at the back over the body, straight out to 110; flat from the hub's top up 8
  const sh=new THREE.Shape();sh.moveTo(sw,0);sh.lineTo(sw,.11);sh.lineTo(-sw,.11);sh.lineTo(-sw,0);sh.absarc(0,0,sw,Math.PI,2*Math.PI,false);
  const lv=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.008,bevelEnabled:false,curveSegments:24}),chromeMat);
  lv.rotation.x=Math.PI/2;lv.position.set(x,top+.02,z);lv.castShadow=true;lv.userData.mixer=true;g.add(lv);   // its shape's y along z, down from top+20
}

function buildDrum(g,cx,y,fz,hr){
  const R=.235,cuff=.04,z1=fz-cuff,z0=z1-.34;
  const put=(m,z)=>{m.position.set(cx,y,z);m.userData.drum=true;g.add(m);return m;};
  const tube=(r,d,z,mat)=>{const m=put(new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,48,1,true),mat),z);m.rotation.x=Math.PI/2;return m;};
  tube(hr,cuff,fz-cuff/2,rubberMat);                                       // cuff
  tube(R,z1-z0,(z0+z1)/2,drumMat);                                         // drum
  put(new THREE.Mesh(new THREE.RingGeometry(hr,R,48),drumMat),z1);         // its front ring
  put(new THREE.Mesh(new THREE.CircleGeometry(R,48),drumMat),z0);          // its back
}
function washerMax(side){
  const n=washNiche(),hx=WD.R+WD.hinge,reach=hx+WD.R,front=WASH.back+WASH.D;
  const room=side<0?n.cx-hx-n.x0:n.x1-n.cx-hx,wall=side<0?A.bStub:A.hL1;   // hinge to the side wall; how far that wall comes out
  return wall>front?Math.PI/2+Math.asin(Math.min(1,Math.max(0,(room-50)/reach))):Math.PI;   // past 90° its 50 mm bulge meets the wall
}
function washerDoor(cx,zf,prev,open){
  const R=WD.R*MM,hx=(WD.R+WD.hinge)*MM,g=new THREE.Group(),door=new THREE.Group();g.position.set(cx,WD.y*MM,zf);g.add(door);
  const cyl=(r,d,z,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,48),mat);m.rotation.x=Math.PI/2;m.position.z=z;m.castShadow=true;door.add(m);return m;};
  // the dark ring with the glass in its middle: a translucent blue bowl, the drum seen through it
  { const sh=new THREE.Shape();sh.absarc(0,0,R,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,WD.glass*MM,0,Math.PI*2,true);sh.holes.push(hole);
    const ring=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.04,bevelEnabled:false,curveSegments:48}),chromeMat);ring.castShadow=true;ring.userData.ring=true;door.add(ring); }
  cyl(WD.glass*MM,.06,.03,portMat).castShadow=false;
  const part=(w,h,d,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.z=z;door.add(m);return m;};
  const handle=part(.025,.11,.03,.045,darkMat),hinge=part(.03,.12,.03,.015,darkMat);
  const d=Object.assign({g,a:0,t:0,key:'washer',closed:true},prev&&{a:prev.a,t:prev.t,last:prev.last,closed:prev.closed,side:prev.side});
  d.turn=side=>{d.side=side;d.s=side;d.max=washerMax(side);
    g.position.x=cx+side*hx;door.position.x=-side*hx;handle.position.x=-side*(R-.04);hinge.position.x=side*(R+.006);};
  d.turn(d.side||-1);if(!prev&&open)d.t=d.max;turnDoor(d);
  return d;
}
// every frame (before the room turns its doors): the bath view hides the niche, the shower tray, its rack and curtain unless its frame shows it whole; the door takes the clicked side as it starts to open
frameHooks.push(()=>{
  if(wash)wash.visible=view!=='bath';
  if(tray)tray.visible=view!=='bath'||VS.bath.L>=trayRect()[3];   // the bath view: only when its frame takes the whole tray in
  if(rack)rack.forEach(o=>o.visible=!tray||tray.visible);           // the rack with it
  // and the curtain; in the bath view's cut mode it hides with the wall at the niche end, along which it runs
  if(curtain){const w=WALLS.find(v=>v.id==='nicheEnd'),vw=VIEWS.bath;
    curtain.visible=(!tray||tray.visible)&&(view!=='bath'||VS.bath.Wm!=='auto'||sideVisible(fadeSide(w,vw),fadeWall(w,vw).r.map(v=>v*MM),camera.position));}
  const d=VIEWS.bath&&VIEWS.bath.furniture().doors.find(x=>x.key==='washer');if(!d)return;
  if(d.t>0&&d.closed&&d.a<.002){const full=d.t>=d.max-.01,mid=(O()[0]+washNiche().cx)*MM;d.turn(d.hit?(d.hit.x>mid?1:-1):d.side);d.hit=null;d.t=full?d.max:Math.min(d.t,d.max);d.closed=false;}
  else if(d.t===0&&d.a<.002)d.closed=true;
  if(!(held&&held.d===d))d.hit=null;   // a click that did not open it from closed (or a hover) leaves no side behind; a long press keeps it
  if(d.t>d.max)d.t=d.max;
});

/* ---------- dimension lines of the bathroom (bath axes; they belong to the bathroom and move with it) ---------- */
function buildDims(dim,gaps){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
  const zf=current.zf,yb=current.yb,z1=zf+P.Lt,xe=Math.max(P.Du,P.Di)+80;
  { const wc=Math.min(P.Wc,P.W-P.Rx),xa=P.W-wc,yd=P.H+120;
    dim(V(0,yd,0),V(P.Rx,yd,0),`${P.Rx}`,Y);
    if(xa>P.Rx)dim(V(P.Rx,yd,0),V(xa,yd,0),`${xa-P.Rx}`,Y);
    dim(V(xa,yd,0),V(P.W,yd,0),`${wc}`,Y);
    dim(V(0,yd+160,0),V(P.W,yd+160,0),`${P.W}`,Y); }
  dim(V(P.W,P.H+120,0),V(P.W,P.H+120,zf),`${zf}`,Y);
  dim(V(0,P.H+120,0),V(0,P.H+120,P.Rz),`${P.Rz}`,Y);
  if(zf>P.Rz)dim(V(0,P.H+120,P.Rz),V(0,P.H+120,zf),`${zf-P.Rz}`,Y);
  dim(V(0,P.H+120,zf),V(0,P.H+120,z1),`${P.Lt}`,Y);
  dim(V(0,P.H+280,0),V(0,P.H+280,P.L),`${P.L}`,Y);
  dim(V(P.W-60,0,zf+60),V(P.W-60,P.H,zf+60),`${P.H}`,X);
  dim(V(xe,0,z1-60),V(xe,P.Hi,z1-60),`${P.Hi}`,X);
  if(P.Gap>0)dim(V(xe,P.Hi,z1-60),V(xe,yb,z1-60),`${P.Gap}`,X);
  dim(V(0,yb-80,z1+40),V(P.Du,yb-80,z1+40),`${P.Du}`,Y);
  // between the shelves: each section of the tall cabinet that has them (the divider closes both), the upper cabinet
  const by=nms=>current.parts.filter(q=>q.mat==='carcass'&&nms.includes(q.name));
  const tall=by(['Дно пенала','Полка-разделитель пенала','Полка пенала','Крышка пенала']);
  if(P.Nb)gaps(tall.filter(q=>q.y0<=P.Hi));
  if(P.Nh)gaps(tall.filter(q=>q.y1>=P.Hi));
  if(P.Nu)gaps(by(['Дно верхнего шкафа','Полка верхнего шкафа','Крышка верхнего шкафа']));
}

/* camera presets of the bath tab, moved to where the bathroom lies on the plan */
function setCam(v){
  const base=Math.max(P.H,P.W*1.6)*MM*1.9*Math.max(1,Math.pow(1/(camera.aspect||1),.95));   // pull back on tall, narrow screens
  const views={persp:[.75,1.25,base],front:[Math.PI/2,1.5,base*.9],top:[.6,.42,base*1.2],tall:[.25,1.4,base*.95],upper:[1.35,1.3,base*.8],riser:[.45,1.2,base*.85]};
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];
  const zf=current.zf*MM,[ox,oz]=O().map(u=>u*MM),at=(x,y,z)=>goalT.set(ox+x,y,oz+z);
  if(v==='tall')at((P.Rx+P.W)/2*MM,P.H*MM*.5,zf*.5);
  else if(v==='upper')at(P.Du*MM*.5,(current.yb+(P.H-current.yb)/2)*MM,zf+P.Lt*MM/2);
  else if(v==='riser')at(P.Rx*MM*.5,P.H*MM*.55,zf);
  else if(v==='front')at(P.W/2*MM,P.H*MM*.45,zf+P.Lt*MM/2);
  else at(P.W/2*MM,P.H/2*MM,.55);
  shortWay();
}

/* ---------- panel: what the bathroom has (the niche over the installation, feet under the tall cabinet) and its texts ---------- */
const panel=document.querySelector('[data-panel="bath"]'),bq=s=>panel.querySelector(s);
bq('#b-tMid').addEventListener('change',e=>{P.Mid=e.target.checked;k.build();});
bq('#b-tFeet').addEventListener('change',e=>{P.Feet=e.target.checked;k.build();});
// the niche, the ceiling and the riser box (from the plan), the space between the shelves
function panelText(){
  bq('#b-W').textContent=P.W+' мм';bq('#b-L').textContent=P.L+' мм';bq('#b-H').textContent=P.H+' мм';bq('#b-R').textContent=`${P.Rx} × ${P.Rz} мм`;
  bq('#bSub').textContent=`ниша ${P.W} × ${P.L} мм · потолок ${P.H} мм · `+k.finDesc();
  const t=P.T||16,f=v=>v.toFixed(1).replace('.',',').replace(',0',''),fl=P.Feet?10:0;
  // free height between neighbouring shelves (from the top of one shelf to the underside of the next)
  const sb=(P.Hi-t/2-P.Pl-fl-t)/(P.Nb+1),sh=(P.H-t-P.Hi-t/2)/(P.Nh+1);
  const yb=P.Hi+P.Gap,su=(P.H-yb-t)/(P.Nu+1);
  const gap=(n,v)=>(n?`между полками ${f(v-t)} мм`:`без полок: высота отделения ${f(v-t)} мм`);
  bq('#b-gapB').textContent=`Высота дверей ${P.Hi-P.Pl-fl} мм · `+gap(P.Nb,sb);
  bq('#b-gapH').textContent=`Высота дверей ${P.H-P.Hi} мм · `+gap(P.Nh,sh);
  const on=P.Mid!==false;
  bq('#b-Dm').disabled=!on;bq('#b-fDm').style.opacity=on?1:.45;
  bq('#b-gapM').textContent=on?`Высота ниши ${P.Gap} мм · внутри ${Math.max(0,P.Gap-2*t)} мм`:'Ниша выключена в блоке «Состав»';
  bq('#b-gapM').style.opacity=on?1:.45;
  bq('#b-gapU').textContent=`Высота шкафа ${P.H-yb} мм · `+gap(P.Nu,su);
}

const k=roomKit('bath',{
  P,FIN,mats,px:'b',panel,origin:O,fromModel,setCam,panelText,
  fromPlan:['W','L','H','Rx','Rz','Lt'],
  ids:['Hi','Di','Gap','Du','Nu','Dm','Dt','Wc','Pl','Nh','Nb'],
  wish:['Wc','Gap'],
  slider:{sel:'#bFrameL',key:'L',max:()=>hLen,min:()=>A.bL+A.wt},   // how far from the back wall the left wall shows: from the niche end's far face up to the kitchen wall
  dims:buildDims,
  extra:{name:'sani',build:buildSanitary},   // the installation, the toilet, the washing machine and the sink go with the walls in the bathroom's view
  // its footprint: the installation box, the toilet (as buildSanitary has them) and the washing machine besides the tall cabinet
  foot:()=>{const zf=current.zf,cz=zf+P.Lt/2;return [[0,P.Di,zf,zf+P.Lt],[P.Di-200,P.Di+500,cz-180,cz+180,true],washRect()];},
  syncFlags:()=>{bq('#b-tMid').checked=P.Mid!==false;bq('#b-tFeet').checked=!!P.Feet;},
  view:{
    // the niche: the back wall up to the outer face of the partition next to the tall cabinet, the left wall up to L from the back wall
    frame:L=>{const [ox,oz]=O();return [ox-A.bear,ox+A.bNiche+A.wt,oz-A.bear,oz+L];},
    // the walls at the open side of the niche hide as in the bath tab: the partition while the camera is right of its inner face,
    // the wall at the niche end, the shower partition and the step between them while the camera is past the niche end;
    // the vent shaft wall (it comes in past 1400) has no rule of its own: it hides with the wall at the niche end
    fade:{bathStub:'+x',nicheEnd:'+z',shower:'+z',showerStep:'+z',shaft:'nicheEnd'},
    // as in the bath tab: the sun aims at the middle of the back wall, shadows cover 6 × 6 m
    sun:()=>{const [ox,oz]=O();return {x:(ox+A.bNiche/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
    defaults:{Wm:'auto',Wh:100,L:1400,sizes:true,fronts:'closed',dims:true,walls:true}
  }
});
})();
