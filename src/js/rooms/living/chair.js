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

