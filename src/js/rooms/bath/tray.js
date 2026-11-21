/* ---------- the shower tray: white cast marble under slate, behind the step at the niche end ----------
   It fills the shower: from the left wall to the shower partition, from the wall at the niche end to the kitchen wall
   (sizes from the plan; 1000 × 700 as they are now), 150 mm high. Its top falls in four faces to a square chrome drain
   a quarter of its length from the left wall, half way across. A product of its own, not in the cut list, no sizes in the panel.
   The bath tab shows it only while the frame takes it in whole (the left wall up to the kitchen wall). Bath axes, mm */
const TRAY={H:150,drain:120,at:.25};   // height; the drain's side; where it is along the tray from the left wall
let tray=null;
const trayRect=()=>[0,xSh-xL,A.bL+A.wt,kZ0-zB0];   // x0, x1, z0, z1
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

