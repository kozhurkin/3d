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

