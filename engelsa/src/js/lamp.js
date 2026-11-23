/* ---------- the chandelier: in the middle of the ceiling, at the rose (A.lamp: which one, 'none' without; set in the plan's panel) ----------
   Each kind (LAMPS) builds itself in its own frame: y down from the ceiling (mm), x and z round its axis; its group hangs from the
   ceiling's middle. Seen while the walls stand whole up to the ceiling (as the rose), on the «Комната» tab too: it is chosen there.
   A third of its height and more is its rod (as they are): the glass starts lower. It casts no shadow (a blot on the floor in the
   sun's light that a lamp under the ceiling would not make). A click on it puts the next one.
   In the walk an obstacle only if it comes down to the head (lampBoxes) */
const lampGold=new THREE.MeshStandardMaterial({color:new THREE.Color('#c9a25a').convertSRGBToLinear(),roughness:.3,metalness:.9});
const lampBrass=new THREE.MeshStandardMaterial({color:new THREE.Color('#a8834e').convertSRGBToLinear(),roughness:.35,metalness:.85});   // antique brass
/* the frosted glass of the discs, pressed with a fine pattern of dimples: a tile of 120 mm (a disc's cap UVs are 0…1 across it)
   of small round bumps every way, a little lighter and darker; the same canvas is its bump. Opaque (milky), so it goes into the .glb */
function dimpleTexture(){
  const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
  let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  g.fillStyle='#808080';g.fillRect(0,0,N,N);
  for(let i=0;i<900;i++){const x=rnd()*N,y=rnd()*N,r=2+rnd()*5,v=rnd()<.5?40+rnd()*50:170+rnd()*60;
    g.fillStyle=`rgba(${v|0},${v|0},${v|0},.55)`;g.beginPath();g.ellipse(x,y,r,r*(.6+rnd()*.4),rnd()*Math.PI,0,2*Math.PI);g.fill();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;
}
const lampGlass=new THREE.MeshStandardMaterial({color:new THREE.Color('#efe9df').convertSRGBToLinear(),roughness:.35,metalness:0,
  emissive:new THREE.Color('#3a3226'),bumpMap:dimpleTexture(),bumpScale:.002});   // the faint emissive: the bulbs inside lighting it up
const lampGroup=new THREE.Group();scene.add(lampGroup);
// a rod of radius r (mm) from a to b ([x, y, z] in its frame), tapering to r1 at b
function lampRod(par,a,b,r,mat,r1=r){
  const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).multiplyScalar(MM),l=d.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r1*MM,r*MM,l,12),mat);
  m.position.set((a[0]+b[0])/2*MM,(a[1]+b[1])/2*MM,(a[2]+b[2])/2*MM);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  par.add(m);return m;
}
// a round part on the axis: radius r, from y0 to y1 down from the ceiling (mm)
function lampCyl(g,r,y0,y1,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,(y1-y0)*MM,32),mat);
  m.position.y=-(y0+y1)/2*MM;g.add(m);return m;}
/* «MyLight», 8 bulbs (Ozon): Ø 600, 535 from the ceiling, all its metal brass. A cup on the ceiling Ø 100 and a rod down to a hub at 190,
   its 10 arms out from a collar and a little up, a ring at each end; textured glass discs in tiers from 185 (a third of the height
   above them), each hanging by its top edge, its face out: the top tier's 10 from the arms' rings, under it rings ever smaller and
   the discs leaning out at the top more and more, so together they make a bowl down to 535. A tier: its ring's radius r, how many n,
   turned by ph (of the step between them), the disc's Ø d, its top t down from the ceiling, its lean b (rad) */
const DISC_TIERS=[
  {r:285,n:10,ph:0,d:150,t:185,b:0},{r:262,n:10,ph:.5,d:140,t:205,b:-.1},{r:215,n:10,ph:.25,d:135,t:262,b:-.2},
  {r:165,n:9,ph:0,d:125,t:318,b:-.3},{r:112,n:8,ph:.5,d:115,t:368,b:-.4},{r:62,n:6,ph:0,d:105,t:410,b:-.45},{r:22,n:3,ph:.2,d:100,t:439,b:-.3}
];
const DISC_T=4;   // the glass's thickness
function lampDiscs(g){
  // the cup on the ceiling, the rod, the hub with its collar under it
  const cyl=(r,y0,y1)=>lampCyl(g,r,y0,y1,lampBrass);
  cyl(50,0,26);cyl(7,26,172);cyl(22,168,218);cyl(30,184,198);
  // the arms: from the collar out to the top tier's ring, rising 20 toward their ends, a cap and a ring there the disc hangs from;
  // the bulbs on them hid by the glass
  const T0=DISC_TIERS[0];
  for(let i=0;i<T0.n;i++){const a=2*Math.PI*i/T0.n,c=Math.cos(a),s=Math.sin(a);lampRod(g,[26*c,-191,26*s],[(T0.r+8)*c,-171,(T0.r+8)*s],6,lampBrass);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(6*MM,1.5*MM,6,16),lampBrass);ring.position.set(T0.r*c*MM,-(T0.t-5)*MM,T0.r*s*MM);
    ring.rotation.y=-a;g.add(ring);}
  // the discs: each in a pivot at its hanging point, x out from the axis, turned about its tangent by the lean
  const geo={};
  DISC_TIERS.forEach(({r,n,ph,d,t,b})=>{
    const G=geo[d]||(geo[d]=new THREE.CylinderGeometry(d/2*MM,d/2*MM,DISC_T*MM,40).rotateZ(Math.PI/2));   // its faces along x: out and in
    for(let i=0;i<n;i++){const a=2*Math.PI*(i+ph)/n,p=new THREE.Group();
      p.position.set(r*Math.cos(a)*MM,-t*MM,r*Math.sin(a)*MM);p.rotation.y=-a;g.add(p);
      const q=new THREE.Group();q.rotation.z=b;p.add(q);
      const m=new THREE.Mesh(G,lampGlass);m.position.y=-d/2*MM;m.userData.disc=true;q.add(m);}
  });
}
/* branches with strands of discs: «Aine Light», crystal, 6 bulbs (Wildberries), 500 × 450, 450 from the ceiling; a bigger one like it
   (Ozon), Ø 800, 1330 from the ceiling. A gold cup on the ceiling (Ø 120 × 25) and a rod to the hub, gold branches out from it every way,
   knobbly twigs up off them (the rod a quarter of the height and more); from the branches on thin wires strands of small discs —
   white hammered glass and clear faceted crystal at random — down to a rounded bottom, lowest in the middle. Inside, on a stem under
   the hub, candle bulbs in cups. An oval's long side along the side walls (z), as the rose's. Random but seeded: the same every time.
   The discs (hundreds) are two meshes, one of each glass, the wires one of lines. A kind: its sizes W (along z) × D, height H; the hub's
   level; how many branches N, bulbs n; the seed. The discs are as big in both, the rest (the branches' rise, the bottom's curve) grows with it */
const BR={disc:{white:17,crystal:14},jit:5,   // the discs' radii; a strand's sway
  aine:{W:500,D:450,H:450,hub:170,N:12,n:6,seed:5},big:{W:800,D:800,H:1330,hub:880,N:16,n:8,seed:9}};
const lampWhite=new THREE.MeshStandardMaterial({color:new THREE.Color('#f3efe8').convertSRGBToLinear(),roughness:.45,side:THREE.DoubleSide,
  emissive:new THREE.Color('#2a251c'),bumpMap:dimpleTexture(),bumpScale:.0015});
const lampCrystal=new THREE.MeshStandardMaterial({color:new THREE.Color('#dce5ea').convertSRGBToLinear(),roughness:.08,metalness:.25,
  side:THREE.DoubleSide,flatShading:true,emissive:new THREE.Color('#1c2226')});
const lampBulb=new THREE.MeshStandardMaterial({color:0xfff4dc,emissive:new THREE.Color('#ffd28a'),emissiveIntensity:.9});
const lampWire=new THREE.LineBasicMaterial({color:new THREE.Color('#b8975a').convertSRGBToLinear()});
// discs [x, y down, z, radius, turn] (mm) as one mesh: each a flat k-gon standing upright, facing the way of its turn
function lampDiscMesh(g,list,mat,k){
  const pos=[],uv=[],idx=[],ext=g.userData.ext;
  list.forEach(([x,y,z,R,th])=>{const o=pos.length/3,tx=-Math.sin(th),tz=Math.cos(th);pos.push(x*MM,-y*MM,z*MM);uv.push(.5,.5);
    ext[1]=Math.max(ext[1],y+R);
    for(let i=0;i<k;i++){const a=2*Math.PI*i/k,c=Math.cos(a),s=Math.sin(a),px=x+R*c*tx,pz=z+R*c*tz;
      pos.push(px*MM,(-y+R*s)*MM,pz*MM);uv.push(.5+.5*c,.5+.5*s);idx.push(o,o+1+i,o+1+(i+1)%k);
      ext[0]=Math.max(ext[0],Math.abs(px));ext[2]=Math.max(ext[2],Math.abs(pz));}});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat);m.userData.discs=list.length;g.add(m);return m;
}
function lampBranches(g,c){
  let seed=c.seed;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const {W,D,H:Hh,hub,N,n}=c,{disc,jit}=BR,P=(x,y,z)=>[x,-y,z],k=Math.max(W,D)/500,t=Math.sqrt(k);g.userData.ext=[0,0,0];   // k: its size to the small one's
  // the anchors' oval: the discs' sway and size kept inside W × D
  const ax=D/2-disc.white-jit,az=W/2-disc.white-jit,at=(a,r)=>[ax*r*Math.cos(a),az*r*Math.sin(a)];
  lampCyl(g,60,0,22,lampGold);lampCyl(g,61,19,25,lampGold);lampCyl(g,5*t,25,hub,lampGold);lampCyl(g,18*t,hub-10*t,hub+25*t,lampGold);
  // the stem under the hub with the bulbs round it: arms out to cups, a candle bulb in each; a ball at its end
  const y=v=>hub+v*k,rb=85*k;
  lampCyl(g,4*t,y(25),y(132),lampGold);const ball=new THREE.Mesh(new THREE.SphereGeometry(12*t*MM,16,12),lampGold);ball.position.y=-y(140)*MM;g.add(ball);
  for(let i=0;i<n;i++){const a=2*Math.PI*(i+.5)/n,c=Math.cos(a),s=Math.sin(a);lampRod(g,P(0,y(116),0),P(rb*c,y(116),rb*s),3*t,lampGold);
    const cup=lampCyl(g,12,y(116)-24,y(116)+4,lampGold);cup.position.x=rb*c*MM;cup.position.z=rb*s*MM;
    const b=new THREE.Mesh(new THREE.SphereGeometry(15*MM,16,12),lampBulb);b.scale.y=1.6;b.position.set(rb*c*MM,-(y(116)-48)*MM,rb*s*MM);g.add(b);}
  // the branches: each from the hub in three pieces to its tip, a twig up off its middle each side; knobs on the tips.
  // Where strands hang from: along the branches and the twigs, and a few round the hub
  const pt=(a,r,y)=>{const [x,z]=at(a,r);return [x,y,z];},anchors=[];   // an anchor: [x, y down, z, how far out 0…1]
  for(let i=0;i<6;i++)anchors.push([...pt(2*Math.PI*i/6,.12,y(30)),.12]);
  const knob=(p)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(4.5*t*MM,10,8),lampGold);m.position.set(p[0]*MM,-p[1]*MM,p[2]*MM);g.add(m);};
  const along=(p,q,t)=>p.map((v,j)=>v+(q[j]-v)*t);
  for(let i=0;i<N;i++){const a=2*Math.PI*(i+rnd()*.4)/N;
    const p0=pt(a,.06,hub),p1=pt(a+(rnd()-.5)*.15,.5,y(-6+rnd()*12)),p2=pt(a+(rnd()-.5)*.2,1,y(-25+rnd()*15));
    lampRod(g,P(...p0),P(...p1),6*t,lampGold,4*t);lampRod(g,P(...p1),P(...p2),4*t,lampGold,2.2*t);knob(p2);
    [.3,.45,.62,.8,.92,1].forEach((f)=>anchors.push([...(f<=.5?along(p0,p1,f/.5):along(p1,p2,(f-.5)/.5)),f]));
    [-1,1].forEach(sd=>{const q=pt(a+sd*(.28+rnd()*.12),.62+rnd()*.2,y(-32-rnd()*20));lampRod(g,P(...p1),P(...q),3*t,lampGold,1.5*t);knob(q);
      anchors.push([...q,.7]);});
  }
  // the strands: from an anchor a wire down, discs on it every 30–38, swaying a little, to a bottom lower toward the middle
  const whites=[],crystals=[],wire=[];
  anchors.forEach(([x,y0,z,r])=>{
    const bot=Hh-4-(60*r*r+rnd()*30)*k;let yy=y0+18+rnd()*14,last=y0;
    while(true){const w=rnd()<.6,R=w?disc.white:disc.crystal;if(yy>bot&&last>y0)break;if(yy+R>Hh)break;
      const d=[x+(rnd()-.5)*2*jit,yy,z+(rnd()-.5)*2*jit,R,rnd()*Math.PI];(w?whites:crystals).push(d);
      wire.push(x*MM,-last*MM,z*MM,d[0]*MM,-(yy-R)*MM,d[2]*MM);last=yy+R;yy+=R+16+rnd()*8;}
  });
  lampDiscMesh(g,whites,lampWhite,14);lampDiscMesh(g,crystals,lampCrystal,8);
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(wire,3));
  const l=new THREE.LineSegments(lg,lampWire);l.raycast=()=>{};g.add(l);
}
const LAMPS={
  discs:{n:'Диски',build:lampDiscs,H:535,size:'Ø 600',info:{title:'Люстра MyLight, 8 плафонов (Ozon)',price:8232,shop:'Ozon',url:'https://ozon.ru/t/sZSVo8F',
    lines:[['Размер','Ø 60, высота 53,5 см'],['Материал','стекло, металл'],['Лампы','8 × E14 до 60 Вт (480 Вт)'],['Площадь','25–30 м²']]}},
  branches:{n:'Ветви 50',build:g=>lampBranches(g,BR.aine),H:BR.aine.H,size:`${BR.aine.W} × ${BR.aine.D}`,info:{title:'Люстра хрустальная Aine Light, 6 рожков (Wildberries)',
    price:8051,shop:'Wildberries',url:'https://www.wildberries.ru/catalog/1605669544/detail.aspx',
    lines:[['Размер','50 × 45, высота 45 см'],['Материал','алюминий, стекло К9'],['Лампы','6 × E14 до 60 Вт (360 Вт)'],
      ['Площадь','до 35 м²']]}},
  branches80:{n:'Ветви 80',build:g=>lampBranches(g,BR.big),H:BR.big.H,size:`Ø ${BR.big.W}`,
    info:{title:'Люстра хрустальная с висюльками (Ozon)',
    price:12234,shop:'Ozon',url:'https://ozon.ru/t/Z2pmmdJ',lines:[['Размер','Ø 80, высота 133 см']]}}
};
const LAMP_KINDS=Object.keys(LAMPS);
/* its card («i»): the kind's own, the place under it. Several kinds: a link to the next one, as the plan panel's buttons go */
function nextLamp(){const i=LAMP_KINDS.indexOf(A.lamp);setModel({...A,lamp:LAMP_KINDS[(i+1)%LAMP_KINDS.length]});return lampInfo();}
function lampInfo(){
  const L=LAMPS[A.lamp];if(!L)return null;
  const page=LAMP_KINDS.length>1?{next:nextLamp,variant:[LAMP_KINDS.indexOf(A.lamp)+1,LAMP_KINDS.length]}:{};
  return {...page,...L.info,lines:[...L.info.lines,['Место',`по центру потолка, низ в ${H-L.H} от пола`],
    'Нажатие на люстру — следующий вариант.']};
}
function buildLamp(){
  emptyGroup(lampGroup,false);
  const L=LAMPS[A.lamp];if(!L)return;
  const g=new THREE.Group();g.userData.lamp=A.lamp;g.userData.info=lampInfo;g.userData.click=nextLamp;g.position.set(A.W/2*MM,H*MM,A.L/2*MM);lampGroup.add(g);
  L.build(g);
}
buildLamp();modelHooks.push(buildLamp);
// where it hangs (m), [x0,x1,z0,z1,y0,y1]: an obstacle in the walk only when it comes down to the head (Ø 800: its bottom at 1730)
function lampBoxes(){
  const L=LAMPS[A.lamp];if(!L)return [];
  const g=lampGroup.children[0],e=g&&g.userData.ext,hx=e?e[0]:300,hz=e?e[2]:300;
  return [[A.W/2-hx,A.W/2+hx,A.L/2-hz,A.L/2+hz,H-L.H,H].map(v=>v*MM)];
}
frameHooks.push(()=>{const V=vs();lampGroup.visible=!!V&&!wallFeetMode&&V.Wm!=='edges'&&wallCut>=H*MM-1e-6;});
