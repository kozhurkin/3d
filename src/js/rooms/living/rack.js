/* the metal racks on the right wall's empty stretch: two alike side by side, from the corner by the way into the kitchen (the kitchen
   wall, z 0) up to the wardrobe's add-on section, RK.gap from both and between them; 250 deep at first — their fronts in line with the end of
   the wall right of the way in; a click on either (engine.js: userData.click) makes both 300 deep, then 350, then 250 again (RK_D; it
   stays through the kitchen's rebuilds) — and 1750 high. Each: four perforated L-angle posts at its corners (their flanges outward, on plastic
   feet; round holes RK.hole across, RK.pitch apart, through both flanges), RK.n shelves evenly from near the floor up to the posts'
   tops: each a sheet with its edges bent down all round, bolted to the posts through their holes — a hex head on each visible flange.
   Light grey powder-coated steel. Kitchen axes (mm), a group each with its «i» */
const RK_D=[250,300,350];
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
const rackW=()=>Math.max(0,Math.floor((wardEnd()-3*RK.gap)/2));
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
