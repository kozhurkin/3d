/* ---------- the shower curtain: on a rod across the shower just past the wall at the niche end ----------
   The rod straight: on the left (as one goes in) into the partition, on the right past the end of the wall at the niche end,
   into the ball of a bracket on that wall's back (the shower's side), half way along the wall: a round flange on three screws, a stem, a ball with one
   blind hole toward the partition, the rod's end in it. Drawn back the curtain gathers in folds behind that wall, up to 10 short of its end; a click draws it
   across the opening. Frosted half-clear vinyl 1000 × 2200 down to 10 over the tray, eyelets along its top: chrome rings as the rod's
   (two half circles joined by straight bits) hung on the rod go through them, the cloth's top over the rings' bottoms.
   One of the room's doors (key 'curtain', axis 'none': follow(a) shapes it): 0 drawn back, 1 across; a click, «Открыты/Закрыты»
   (open: across), a long press, the walk (it does not stop the walker). The cloth's top flat along the rod about each eyelet,
   between them it bulges out to either side in turn: its width kept, the closer the rings the deeper the folds. Bath axes, mm */
const CURT={h:2200,w:1000,off:45,ball:16,gap:10,rings:10,pad:10,edge:10,flat:5,ring:[16,28],tube:2.5,eye:[4,12],round:3};   // the cloth's height and width; the rod's axis from the wall; the bracket's ball radius (the rod Ø20 through it); the cloth's bottom over the tray; rings; the gap at the partition and at the end of the wall at the niche end; an eyelet's centre from the cloth's side; the cloth flat on either side of an eyelet's centre; a ring's half width (its half circles' radius) and half height; its tube's radius; an eyelet's hole radius and its centre under the cloth's top; how blunt the folds' crests are drawn back (none drawn across)
// the rod's height: the cloth from 10 over the tray; the hole's top resting on the ring's bottom, the ring's inside on the rod (Ø20)
const curtRodY=()=>{const C=CURT,yh=TRAY.H+C.gap+C.h-C.eye[1];return yh+C.eye[0]-C.tube+2*C.ring[1]-C.tube-10;};
// the rod (mm): its bracket's ball at xb on the wall's back (zw), the rod's end in it, the run clear of the ball from xs to x1, at z
const curtRod=()=>{const C=CURT,xb=bWs/2,zw=A.bL+A.wt;return {xb,zw,xs:xb+C.ball,x1:xSh-xL,z:zw+C.off};};
// frosted vinyl: plain grey, 60 % clear
const CURT_OP=.4,curtainMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#cccccc').convertSRGBToLinear(),roughness:.35,transparent:true,opacity:CURT_OP,depthWrite:false,side:THREE.DoubleSide});
/* its half shadow: a shadow map knows no half clear, so for the shadow the cloth is a fine random sieve of 4 mm cells, as
   many of them stopping the light as the cloth is opaque (cells of random greys, those under 1 − opacity through), the soft
   shadow filter (PCF) blurs it into an even shadow 40 % of a full one. Cells in the cloth's own uv (its length and height),
   so they go with it as it gathers. One more mesh of some fifteen hundred triangles in the shadow pass, its shape made again only while it moves */
const CELL=4,curtainShadowMat=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaTest:1-CURT_OP,
  alphaMap:(t=>{t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;})(drawnTex(64,g=>{
    for(let i=0;i<64;i++)for(let j=0;j<64;j++){let h=Math.imul(i,374761393)+Math.imul(j,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);
      const v=((h^(h>>>16))>>>0)%255+1;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(i,j,1,1);}},1,1))});
function buildCurtain(sani,opts){
  const C=CURT,{xb,zw,xs,x1,z}=curtRod(),zr=z*MM,yr=curtRodY()*MM,rb0=C.ball*MM,X0=xs+C.pad,y0=TRAY.H+C.gap,y1=y0+C.h,yh=y1-C.eye[1],hr=C.eye[0];
  const [ra,rb]=C.ring.map(v=>v*MM),tb=C.tube*MM,yc=yr+.01+tb-rb;   // a ring's centre: its inside resting on the rod
  const curtain=new THREE.Group();curtain.userData.curtain=true;curtain.userData.walkThrough=true;curtain.userData.info=INFO.curtain;sani.add(curtain);
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
  const n=C.rings,M=24,cols=[{t:0}];
  for(let j=0;j<n;j++){cols.push({j,e:-C.flat},{j,e:-hr,hole:true},{j,e:hr},{j,e:C.flat});if(j<n-1)for(let k=1;k<M;k++)cols.push({j,u:k/M});}
  cols.push({t:1});
  const K=cols.length,ys=[y1,yh+hr,yh-hr,y0],pos=new Float32Array(K*4*3),uv=new Float32Array(K*4*2),idx=[],tile=64*CELL;   // the sieve's uv: one tile of its texture every 64 cells
  for(let c=0;c<K-1;c++)for(let r=0;r<3;r++){if(r===1&&cols[c].hole)continue;const a=c*4+r;idx.push(a,a+1,a+4,a+1,a+5,a+4);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setIndex(idx);
  const cloth=new THREE.Mesh(geo,curtainMat);cloth.castShadow=cloth.receiveShadow=true;cloth.customDepthMaterial=curtainShadowMat;cloth.userData.part='Шторка для душа';cloth.userData.tris=idx.length/3;cloth.userData.pos=pos;g.add(cloth);
  // a ring: two half circles joined by straight bits, across the rod; an eyelet: a chrome rim about the hole, on both faces of the cloth
  const st=rb-ra,ringPts=[];
  [1,-1].forEach(sd=>{for(let k=0;k<16;k++){const f=Math.PI*k/16;ringPts.push(new THREE.Vector3(0,sd*(st+ra*Math.sin(f)),sd*ra*Math.cos(f)));}
    for(let k=0;k<6;k++)ringPts.push(new THREE.Vector3(0,sd*(st-2*st*k/6),-sd*ra));});
  const ringGeo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts,true),48,tb,8,true),eyeGeo=new THREE.TorusGeometry((hr+1.25)*MM,1.25*MM,6,16);
  const rings=[...Array(n)].map(()=>{const r=new THREE.Mesh(ringGeo,chromeMat);r.castShadow=true;r.userData.ring=true;g.add(r);return r;});
  const eyes=[...Array(n)].map(()=>{const e=new THREE.Mesh(eyeGeo,chromeMat);e.userData.eyelet=true;g.add(e);return e;});
  /* a fold between two eyelets, its flat ends D apart: a hump A·prof(u,c) to one side, as deep as makes it L long (halving A).
     prof: sin² blunted by tanh, c how much: c → 0 plain sin², at 3 steep sides and a crest rounded to about half the fold's width
     (drawn back the folds are 12 wide and 42 deep: plain sin² would come to a point there) */
  const prof=(u,c)=>Math.tanh(c*Math.sin(Math.PI*u)**2)/Math.tanh(c);
  const foldLen=(A,D,c)=>{let L=0,p=0;const N=64;for(let i=1;i<=N;i++){const q=prof(i/N,c);L+=Math.hypot(D/N,A*(q-p));p=q;}return L;};
  const foldDepth=(L,D,c)=>{if(foldLen(0,D,c)>=L)return 0;let a=0,b=L;for(let i=0;i<30;i++){const m=(a+b)/2;if(foldLen(m,D,c)<L)a=m;else b=m;}return b;};
  // the cloth from behind the wall out to its edge, its folds as deep as keep its width
  let last=-1;
  const shape=a=>{const k=Math.min(1,Math.max(0,a));if(k===last)return;last=k;
    const w0=bWs-C.pad-X0,w=w0+k*(x1-C.pad-X0-w0),tj=j=>(C.edge+j*(w-2*C.edge)/(n-1))/w,D=(w-2*C.edge)/(n-1)-2*C.flat,Lf=(C.w-2*C.edge)/(n-1)-2*C.flat;
    // the crests blunt drawn back, plain drawn across; as deep to either side (the eyelets evenly spaced), but off the wall at the niche end (the rod 45 out): drawn back a little shallower than its width asks
    const cb=Math.max(1e-3,C.round*(1-k)),fa=Math.min(foldDepth(Lf,D,cb),C.off-3);
    cols.forEach((o,c)=>{let t,f=0;
      if(o.t!==undefined)t=o.t;else if(o.u===undefined)t=tj(o.j)+o.e/w;
      else{const t0=tj(o.j)+C.flat/w;t=t0+o.u*(tj(o.j+1)-C.flat/w-t0);f=(o.j%2?-fa:fa)*prof(o.u,cb);}
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

