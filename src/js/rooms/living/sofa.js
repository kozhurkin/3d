/* the white shelf over the sofa: a board 2000 × 250, 25 thick, white as the kitchen's carcasses, on the right wall under the mezzanine,
   in line with it (from the wardrobe's side toward the window); its bottom at 1375, 465 over the sofa's back, 300 under the mezzanine.
   Three white steel L-brackets, the desk shelf's (SHB, lBracket) as plain Ls, 150 from its ends and in its middle: the board on their
   arms, their wall arms up behind it (the board as far off the wall as they are thick).
   Its own axes as the desk shelf's: x along the wall from the wardrobe's side, z out from the wall; turned onto the kitchen's as the sofa */
const SS={L:2000,D:250,t:25,y0:1375,name:'Полка над диваном'};
function buildSofaShelf(g){
  const white=SHC.find(c=>c.name==='доска белая'),[parts,add]=partList();
  add(SS.name,'carcass',0,SS.L,SS.y0,SS.y0+SS.t,SHB.t,SHB.t+SS.D);
  const q=buildParts({parts},white.mats).model,box=boxIn(q);
  [SHB.end,SS.L/2,SS.L-SHB.end].forEach(c=>lBracket(box,c,SS.y0,SHB,white.br,true).forEach(o=>{o.userData.bracket=true;}));
  q.rotation.y=-Math.PI/2;q.position.set(P.Rx*MM,0,wardAt()*MM);q.userData.sofaShelf=true;q.userData.info=INFO.sofaShelf;
  g.add(q);
  return [];
}

/* the corner sofa as Hoff «Слим», beige-grey velour: 2060 × 1530, 910 high with its back cushions, the seat 450 high on 55 mm black
   plastic legs. The seat 1300 wide and 750 deep in front of a thin back (100 mm, 680 high: the height laid out without the cushions),
   530 in front of the cushions; the chaise 650 wide out to 1530. Two arms alike, 55 wide, from the legs up to 635, as deep as the seat;
   three back cushions 650 × 460 × 220 over the seat and the chaise, two throw pillows 480 × 360; the base stands
   20 mm back under the seat, stitched upright. Every soft piece rounded (furniture.js: roundBoxGeo). Its back against the right wall, opposite the desk, its window end 150 mm from the
   window wall (SF.gap; the desk's is DK.gap); the chaise at that end (corner on the right, seen from the front: the shop's picture mirrored).
   Own axes (mm): x across its front, y up, z from its back to its front, described with the chaise at x 0 and mirrored onto x W − x;
   turned onto the kitchen's: its x along z, its z along −x. Two groups — the sofa and the chaise —
   so the walk is stopped by its L, not by the whole rectangle.
   The chaise's seat, whole, is a lid: it turns up on its upper back edge, at the thin back (LID_MAX: 40°), over a box for bedding,
   white inside; the back cushion and the throw pillow on it rise out of its way. It lays out as a «дельфин»: the drawer under the
   seat rolls out till its front is in line with the chaise's, then the bed block lying in it (anthracite, a strap on its front)
   tips its front up over the drawer's front, slides forward and rises level with the seat, its back against the seat's front:
   one bed with the chaise, 1950 × 1420 between the arms in front of the thin back. Both go as the kitchen's fronts do
   (clicks — on the seat or the drawer for the bed, «Открыты/Закрыты», the walk) */
const SF={W:2060,D:850,Dc:1530,H:910,seat:450,leg:55,arm:55,armH:635,chaise:650,back:100,backH:680,ys:280,base:20,gap:150,lidDx:10,boxDx:20};   // gap: from the window wall; lidDx: the chaise's lid in from the arm's side; boxDx: its box's window side
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
const sofaAt=()=>P.L-SF.gap-SF.W;   // kitchen z of its end toward the kitchen wall; the chaise is at the other
function buildSofa(g,opts){
  const {W,D,Dc,H,seat,leg:lg,arm,armH,chaise:cw,back,backH,ys,base,lidDx,boxDx}=SF,xc=arm+cw,xr=W-arm;   // xc: the chaise ends, the seat begins; xr: the right arm
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
  // 145 × 21 × 61 cm; in front of the arm (it ends with the seat) the base fills out to the chaise's side, under the lid
  // (boxDx in from the arm's side, 10 deeper than the lid's edge)
  const bz=Dc-base,t=20;
  C(boxDx,xc,lg,ys,bz-t,bz,8);C(arm,xc,lg,ys,0,t,8);C(arm,arm+t,lg,ys,t,bz-t,8);C(xc-t,xc,lg,ys,t,bz-t,8);C(boxDx,arm,lg,ys,D,bz-t,8);
  Cf(arm+t,xc-t,lg,lg+15,t,bz-t,sofaBoxMat);
  Cf(arm+t,xc-t,lg+15,ys,bz-t-1,bz-t,sofaBoxMat);Cf(arm+t,xc-t,lg+15,ys,t,t+1,sofaBoxMat);
  Cf(arm+t,arm+t+1,lg+15,ys,t+1,bz-t-1,sofaBoxMat);Cf(xc-t-1,xc-t,lg+15,ys,t+1,bz-t-1,sofaBoxMat);
  // its seat in one piece from the back to its front (a seam left against the sofa's seat): the lid on its hinge; a click on the
  // chaise's box lifts it too (its frame), as one on the drawer lays out the bed; 10 mm to the left, toward the sofa's seat (lidDx)
  const lid=new THREE.Group();lid.position.set(0,seat*MM,back*MM);chaise.add(lid);
  mk(lid,seat,back)(lidDx,xc+lidDx,ys,seat,back,Dc,45);
  // stitches up the fronts of the bases, 130 mm apart
  for(let x=130;x<xc-40;x+=130)Cf(x-2,x+2,lg+15,ys-15,Dc-base,Dc-base+1.5,seamMat);
  // and up the chaise base's sides in front of the arm and of the sofa's base, as far apart, from its front back
  for(let z=bz-130;z>D+40;z-=130)[[boxDx-1.5,boxDx],[xc,xc+1.5]].forEach(([x0,x1])=>Cf(x0,x1,lg+15,ys-15,z-2,z+2,seamMat));
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

