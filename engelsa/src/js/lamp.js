/* ---------- the chandelier: in the middle of the ceiling, at the rose (A.lamp: which one, 'none' without; set in the plan's panel) ----------
   Each kind (LAMPS) builds itself in its own frame: y down from the ceiling (mm), x and z round its axis; its group hangs from the
   ceiling's middle. Seen while the walls stand whole up to the ceiling (as the rose), on the «Комната» tab too: it is chosen there.
   Not an obstacle in the walk: it hangs over the head */
const lampGold=new THREE.MeshStandardMaterial({color:new THREE.Color('#c9a25a').convertSRGBToLinear(),roughness:.3,metalness:.9});
const lampBlack=new THREE.MeshStandardMaterial({color:0x151515,roughness:.45,metalness:.5});
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
// a rod of radius r (mm) from a to b ([x, y, z] in its frame)
function lampRod(par,a,b,r,mat){
  const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).multiplyScalar(MM),l=d.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,l,12),mat);m.castShadow=true;
  m.position.set((a[0]+b[0])/2*MM,(a[1]+b[1])/2*MM,(a[2]+b[2])/2*MM);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  par.add(m);return m;
}
/* «MyLight», 8 bulbs (Ozon): Ø 600, 530 from the ceiling. A black ceiling cup and rod, a gold hub with 8 gold arms out and a little up;
   textured glass discs in tiers, each hanging by its top edge, its face out: the top tier's 8 from the arms' ends, under it rings
   ever smaller and the discs leaning out at the top more and more, so together they make a bowl down to 530. A tier: its ring's
   radius r, how many n, turned by ph (of the step between them), the disc's Ø d, its top t down from the ceiling, its lean b (rad) */
const DISC_TIERS=[
  {r:285,n:8,ph:0,d:170,t:80,b:0},{r:268,n:8,ph:.5,d:160,t:110,b:-.08},{r:225,n:10,ph:.25,d:150,t:195,b:-.18},
  {r:175,n:9,ph:0,d:140,t:270,b:-.28},{r:120,n:8,ph:.5,d:130,t:335,b:-.38},{r:65,n:6,ph:0,d:120,t:390,b:-.5},{r:22,n:3,ph:.2,d:110,t:425,b:-.3}
];
const DISC_T=4;   // the glass's thickness
function lampDiscs(g){
  // the cup on the ceiling, the rod, the hub
  const cyl=(r,y0,y1,mat)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r*MM,r*MM,(y1-y0)*MM,32),mat);m.position.y=-(y0+y1)/2*MM;m.castShadow=true;g.add(m);return m;};
  cyl(55,0,22,lampBlack);cyl(57,18,24,lampGold);cyl(6,24,72,lampBlack);cyl(20,72,102,lampGold);
  // the arms: from the hub out to the top tier's ring, rising 15 toward their ends; the bulbs on them hid by the glass
  const T0=DISC_TIERS[0];
  for(let i=0;i<T0.n;i++){const a=2*Math.PI*i/T0.n,c=Math.cos(a),s=Math.sin(a);lampRod(g,[18*c,-90,18*s],[T0.r*c,-75,T0.r*s],5,lampGold);}
  // the discs: each in a pivot at its hanging point, x out from the axis, turned about its tangent by the lean
  const geo={};
  DISC_TIERS.forEach(({r,n,ph,d,t,b})=>{
    const G=geo[d]||(geo[d]=new THREE.CylinderGeometry(d/2*MM,d/2*MM,DISC_T*MM,40).rotateZ(Math.PI/2));   // its faces along x: out and in
    for(let i=0;i<n;i++){const a=2*Math.PI*(i+ph)/n,p=new THREE.Group();
      p.position.set(r*Math.cos(a)*MM,-t*MM,r*Math.sin(a)*MM);p.rotation.y=-a;g.add(p);
      const q=new THREE.Group();q.rotation.z=b;p.add(q);
      const m=new THREE.Mesh(G,lampGlass);m.position.y=-d/2*MM;m.castShadow=true;m.userData.disc=true;q.add(m);}
  });
}
const LAMPS={
  discs:{n:'Диски',build:lampDiscs,H:530,D:600,info:{title:'Люстра MyLight, 8 плафонов (Ozon)',price:8232,shop:'Ozon',url:'https://ozon.ru/t/sZSVo8F',
    lines:[['Размер','Ø 60, высота 53 см'],['Материал','стекло, металл'],['Лампы','8 × E14 до 60 Вт (480 Вт)'],['Площадь','25–30 м²']]}}
};
const LAMP_KINDS=Object.keys(LAMPS);
/* its card («i»): the kind's own, the place under it. Several kinds: a link to the next one, as the plan panel's buttons go */
function nextLamp(){const i=LAMP_KINDS.indexOf(A.lamp);setModel({...A,lamp:LAMP_KINDS[(i+1)%LAMP_KINDS.length]});return lampInfo();}
function lampInfo(){
  const L=LAMPS[A.lamp];if(!L)return null;
  const page=LAMP_KINDS.length>1?{next:nextLamp,variant:[LAMP_KINDS.indexOf(A.lamp)+1,LAMP_KINDS.length]}:{};
  return {...page,...L.info,lines:[...L.info.lines,['Место',`по центру потолка, низ в ${H-L.H} от пола`]]};
}
function buildLamp(){
  emptyGroup(lampGroup,false);
  const L=LAMPS[A.lamp];if(!L)return;
  const g=new THREE.Group();g.userData.lamp=A.lamp;g.userData.info=lampInfo;g.position.set(A.W/2*MM,H*MM,A.L/2*MM);lampGroup.add(g);
  L.build(g);
}
buildLamp();modelHooks.push(buildLamp);
frameHooks.push(()=>{const V=vs();lampGroup.visible=!!V&&!wallFeetMode&&V.Wm!=='edges'&&wallCut>=H*MM-1e-6;});
