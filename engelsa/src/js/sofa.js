/* ---------- the sofa: IKEA MANSTAD, a corner sofa-bed, in green velour ----------
   2400 long, 1560 deep at its chaise, 900 high (as the shop gives it); the main part 950 deep, the chaise 900 wide; seat 450 high,
   the armrests and the back frame 660. Its back against a side wall (A.sofaWall: 'left', right of the way in, or 'right', mirrored), the chaise at the window wall's end,
   an armrest at each end: the far one across the main part, the chaise's along its outer side, the whole 1560. Every part upholstered, its edges rounded (the cushions softer); on short dark legs.
   Built in its own frame (x along the wall from its left end as one faces the wall, y up, z out into the room; mm), stood against the
   wall by standAgainst (walls.js) */
const SF={L:SOFA_L_,D:950,DC:1560,WC:900,H:900,ARM:200,ARMH:660,SEAT:450,LEG:40,BASE:330,BACK:200};
/* the velour: sage green, crushed, as chaotic as can be so its repeats don't show: a tile of 1200 mm (the parts' UVs are in metres:
   ExtrudeGeometry's) with faint wide washes, blotches darker and lighter of every size, stretched and turned every way, and the pile's
   fine streaks along one way, each a little askew. Every mark drawn again across the tile's edges, so the tile is seamless */
const VELOUR_TILE=1.2;   // m
function velourTexture(){
  const N=1024,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  g.fillStyle='#7f907c';g.fillRect(0,0,N,N);
  // a mark at x, y drawn by f in its own frame (turned by rot), again on the far side of every edge it comes near (within m)
  const wrap=(x,y,m,rot,f)=>{for(const dx of [-N,0,N])for(const dy of [-N,0,N]){
    if(x+dx<-m||x+dx>N+m||y+dy<-m||y+dy>N+m)continue;g.save();g.translate(x+dx,y+dy);g.rotate(rot);f();g.restore();}};
  const blot=(r,asp,col)=>wrap(rnd()*N,rnd()*N,r,rnd()*Math.PI,()=>{g.scale(1,asp);const gr=g.createRadialGradient(0,0,0,0,0,r);
    gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(-r,-r,2*r,2*r);});
  for(let i=0;i<14;i++){const a=.05+rnd()*.06;blot(220+rnd()*260,.5+rnd()*.5,rnd()<.5?`rgba(70,88,70,${a})`:`rgba(170,184,165,${a})`);}   // the washes
  for(let i=0;i<380;i++){const a=.08+rnd()*.2,r=12+Math.pow(rnd(),1.8)*140;
    blot(r,.3+rnd()*.7,rnd()<.55?`rgba(70,88,70,${a})`:`rgba(170,184,165,${a})`);}
  for(let i=0;i<2800;i++){const l=4+rnd()*30,a=.06+rnd()*.1;g.fillStyle=rnd()<.5?`rgba(200,212,195,${a})`:`rgba(60,75,60,${a})`;
    wrap(rnd()*N,rnd()*N,l,(rnd()-.5)*.5,()=>g.fillRect(0,0,l,1));}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=8;
  t.repeat.x=t.repeat.y=1/VELOUR_TILE;
  return t;
}
const velour=new THREE.MeshPhysicalMaterial({map:velourTexture(),roughness:.85,sheen:new THREE.Color(0x9fb59a)});   // the sheen: the velour's pile catching the light
const sofaLeg=new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.5});
const sofaGroup=new THREE.Group();scene.add(sofaGroup);
// a soft box x0…x1 × y0…y1 × z0…z1 (mm) with its edges rounded by r: a rounded rectangle across x, y drawn r in, made whole by the bevel
function softBox(par,x0,x1,y0,y1,z0,z1,r,mat=velour){
  const k=MM,a=x0+r,b=x1-r,c=y0+r,d=y1-r,q=Math.min(r,(b-a)/2,(d-c)/2)*.6,S=new THREE.Shape();
  S.moveTo((a+q)*k,c*k);S.lineTo((b-q)*k,c*k);S.quadraticCurveTo(b*k,c*k,b*k,(c+q)*k);S.lineTo(b*k,(d-q)*k);S.quadraticCurveTo(b*k,d*k,(b-q)*k,d*k);
  S.lineTo((a+q)*k,d*k);S.quadraticCurveTo(a*k,d*k,a*k,(d-q)*k);S.lineTo(a*k,(c+q)*k);S.quadraticCurveTo(a*k,c*k,(a+q)*k,c*k);
  const geo=new THREE.ExtrudeGeometry(S,{depth:(z1-z0-2*r)*k,bevelEnabled:true,bevelThickness:r*k,bevelSize:r*k,bevelSegments:3,curveSegments:4});
  geo.translate(0,0,(z0+r)*k);
  const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;par.add(m);return m;
}
function buildSofa(){
  emptyGroup(sofaGroup,false);
  const w=WALLS.find(v=>v.id===A.sofaWall);if(!w)return;
  const {L,D,DC,WC,H,ARM,ARMH,SEAT,LEG,BASE,BACK}=SF,g=new THREE.Group();sofaGroup.add(g);g.userData.sofa=true;
  // which end is the chaise's: the one at the window wall (the wall's left end as one faces it, or its right end)
  const [r0,r1]=w.run,dir=w.face[1],toWin=dir[1]==='x'&&dir[0]==='+'?'left':'right';   // facing a side wall from -x the window end is on the right
  const X=x=>toWin==='right'?x:L-x,span=(a,b)=>{const p=X(a),q=X(b);return [Math.min(p,q),Math.max(p,q)];};   // x from the armrest end
  const box=(a,b,y0,y1,z0,z1,r,mat)=>{const [p,q]=span(a,b);return softBox(g,p,q,y0,y1,z0,z1,r,mat);};
  // legs at the corners of the base and the chaise
  [[60,60],[L/2,60],[L-60,60],[60,D-60],[L-WC+60,D-60],[L-WC+60,DC-60],[L-60,DC-60]].forEach(([x,z])=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(.04,LEG*MM,.04),sofaLeg);m.position.set(X(x)*MM,LEG/2*MM,z*MM);m.castShadow=true;g.add(m);});
  box(0,L,LEG,BASE,0,D,25);                     // the base along the back
  box(L-WC,L,LEG,BASE,D-60,DC,25);               // the chaise's base (into the main one)
  box(0,ARM,LEG,ARMH,0,D,30).userData.armrest=true;          // the armrest at the far end
  box(L-ARM,L,LEG,ARMH,0,DC,30).userData.armrest=true;      // the chaise's, along its outer side
  box(ARM,L-ARM,BASE-10,ARMH,0,BACK,30);        // the back frame
  box(ARM+5,L-WC,BASE,SEAT,BACK+10,D-5,45);      // the seat cushion
  box(L-WC,L-ARM-5,BASE,SEAT,BACK+10,DC-5,45);   // the chaise's cushion
  // three back cushions on the seat against the back frame, leaning back a little
  const cw=(L-2*ARM-10)/3;
  [0,1,2].forEach(i=>{const m=box(ARM+5+i*cw,ARM+5+(i+1)*cw-6,SEAT-10,H-20,BACK-20,BACK+210,70);
    // the lean: turned about its lower front edge, its top back toward the wall
    const py=(SEAT-10)*MM,pz=(BACK+210)*MM;m.geometry.translate(0,-py,-pz);m.geometry.rotateX(-.12);m.geometry.translate(0,py,pz);});
  standAgainst(g,w,toWin==='right'?r1-r0-A.sofaGap-L:A.sofaGap);   // its back at the skirting board, its chaise's end sofaGap off the window wall
}
buildSofa();modelHooks.push(buildSofa);
// where it stands (m): the main part and the chaise (not an obstacle in the walk)
function sofaBoxes(){
  const g=sofaGroup.children[0];if(!g)return [];
  const w=WALLS.find(v=>v.id===A.sofaWall),dir=w.face[1],right=!(dir[1]==='x'&&dir[0]==='+'),X=x=>right?x:SF.L-x;
  const [a,b]=[X(SF.L-SF.WC),X(SF.L)].sort((p,q)=>p-q);
  return [standBox(g,0,SF.L,0,SF.D,SF.H),standBox(g,a,b,0,SF.DC,SF.SEAT)];
}
