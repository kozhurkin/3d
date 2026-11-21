/* ========== under the window ========== */

/* the heating radiator: ten white sections of 80, 800 × 570, 80 deep, on the window wall in the middle of the window (as the window,
   in the middle of the room), its front 100 from the wall (20 behind it for the brackets); its top RD.sill under the sill board's
   underside (walls.js: 10 under the sill), so it goes up and down with the sill (the kitchen's P.WinS). White a little glossy: the
   sill's own material (walls.js: winMat), so it stands out of the wall as the sill does. Each section: a front panel, 4 mm gaps between
   them; its top rounded from the panel over to the wall side (half a round, D/2 across), its bottom face closing it back
   to the wall side, a vertical tube between them; behind, through all of them,
   the two headers, plugged at both ends, an air valve in the right top plug. If the sill is too low for it (its bottom under RD.floor),
   there is none. Own axes (mm): x along the wall from its middle, y up, z from the wall into the room; turned onto the kitchen's */
const RD={n:10,sec:80,H:570,D:80,out:100,sill:100,floor:60,gap:4,face:8,lid:6,tube:24,hdr:30,plug:6};
const radTop=()=>P.WinS-10-RD.sill;
const radW=()=>RD.n*RD.sec;
const radOn=()=>radTop()-RD.H>=RD.floor;
const radValveMat=new THREE.MeshStandardMaterial({color:0xc9cdd1,roughness:.25,metalness:.85});
function buildRadiator(g){
  if(!radOn())return [];
  const q=new THREE.Group();q.rotation.y=Math.PI;q.position.set(P.Rx/2*MM,0,P.L*MM);q.userData.radiator=true;q.userData.info=INFO.radiator;g.add(q);
  const b=boxIn(q),put=(x0,x1,y0,y1,z0,z1)=>b(x0*MM,x1*MM,y0*MM,y1*MM,z0*MM,z1*MM,winMat);
  // a round piece along the wall: radius r, length len, its middle at (x, y, z)
  const along=(r,len,x,y,z,mat=winMat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,len*MM,24),mat);m.rotation.z=Math.PI/2;m.position.set(x*MM,y*MM,z*MM);m.castShadow=m.receiveShadow=true;q.add(m);return m;};
  const {n,sec,H,D,out,gap,face,lid,tube,hdr,plug}=RD,y1=radTop(),y0=y1-H,z0=out-D,zf=out-face,x0=-radW()/2,x1=radW()/2,yr=y1-D/2;   // yr: where the rounded top begins
  for(let i=0;i<n;i++){const a=x0+i*sec+gap/2,c=a+sec-gap,m=(a+c)/2;
    put(a,c,y0,yr,zf,out);                                          // the front panel
    const t=new THREE.Mesh(new THREE.CylinderGeometry(D/2*MM,D/2*MM,(c-a)*MM,24,1,false,0,Math.PI),winMat);   // its rounded top: the upper half of a round
    t.rotation.z=Math.PI/2;t.position.set(m*MM,yr*MM,(z0+D/2)*MM);t.castShadow=t.receiveShadow=true;t.userData.top=true;q.add(t);
    put(a,c,y0,y0+lid,z0,zf);                                       // its bottom
    put(m-tube/2,m+tube/2,y0+lid,yr,z0+10,zf);}                    // the vertical tube
  const hy=[y1-lid-hdr,y0+lid+hdr],hz=z0+10+(zf-z0-10)/2;          // the headers' axes
  hy.forEach(y=>{along(hdr/2,radW(),0,y,hz);[x0-plug/2,x1+plug/2].forEach(x=>along(20,plug,x,y,hz));});   // the headers, their plugs
  // the air valve: on the top plug at the right end, seen from the room (own +x: the group is turned, the kitchen's −x)
  along(5,12,x1+plug+6,hy[0],hz,radValveMat).userData.valve=true;
  return [];
}

