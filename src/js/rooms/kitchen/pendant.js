/* the pendant lamp over the dining table, in the middle of it, its shade's bottom its own height over the tabletop (higher only if its cord
   does not reach so far). A click (or the card's «Следующий вариант →») changes it for the next of three IKEA lamps (LAMPS), round, BLÅSVERK at first
   (engine.js: userData.click); the one hung stays through the kitchen's rebuilds. Each a white cord from its top (hang) up to its canopy
   on the ceiling, as long as it is (cord); lit. Own axes (mm): y up from the shade's bottom, from the shade's axis */
let pendantModel=0;   // in LAMPS
const pendantMats=(()=>{
  // MISTERHULT's weave: strips across both diagonals and along, the holes between them clear (cut by alphaTest)
  const N=256,s=32,t=drawnTex(N,g=>{
    g.lineWidth=6;g.lineCap='butt';
    const tone=i=>['#d8b47c','#c9a26a','#e0bf8a','#bf965e'][i%4];
    const line=(x0,y0,x1,y1,i)=>{g.strokeStyle=tone(i);g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();};
    for(let k=-N,i=0;k<=2*N;k+=s,i++){line(k,0,k+N,N,i);line(k,0,k-N,N,i+1);}
    for(let y=s/4,i=0;y<N;y+=s/2,i++)line(0,y,N,y,i+2);
  },6,2);
  const col=h=>new THREE.Color(h).convertSRGBToLinear(),D=THREE.DoubleSide;
  return {
    weave:new THREE.MeshStandardMaterial({map:t,alphaTest:.5,side:D,roughness:.75,emissive:0xffcf8a,emissiveMap:t,emissiveIntensity:.18}),
    bamboo:new THREE.MeshStandardMaterial({color:col('#c9a26a'),side:D,roughness:.6}),
    white:new THREE.MeshStandardMaterial({color:0xf3f2ef,roughness:.55}),
    bulb:new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffe2b0,emissiveIntensity:1,roughness:.1}),
    beige:new THREE.MeshStandardMaterial({color:col('#dcd0b4'),side:D,roughness:.22,metalness:.1}),   // BLÅSVERK's glossy top and its tube
    seam:new THREE.MeshStandardMaterial({color:col('#b9ae98'),roughness:.3,metalness:.4}),            // the ring where its two halves meet
    opal:new THREE.MeshStandardMaterial({color:0xf6f5f1,side:D,roughness:.45,emissive:0xfff1dc,emissiveIntensity:.5}),   // its diffuser, lit
    steel:new THREE.MeshStandardMaterial({color:col('#ecebe4'),side:D,roughness:.45}),                // BUNKEFLO's powder-coated shade
    birch:new THREE.MeshStandardMaterial({color:col('#e2cda4'),roughness:.6})                         // its birch top
  };
})();
/* the three lamps, in the click's round: over the height of its shade's bottom over the tabletop, hang where the cord comes out, cord its length, canopy its outline [r, y up from its bottom];
   shade(put, lathe, V, mt) puts the rest */
const LAMPS=[
  /* BLÅSVERK, beige: 370 across, 180 high — a glossy beige dome over a white opal bowl, a ring where they meet, 95 up; the bowl's bottom
     dished in round its middle. On a beige aluminium tube 16 across, 280 long; the opal bowl glows */
  {name:'BLÅSVERK',price:3500,url:'https://ozon.ru/t/GAWH6H0',over:800,hang:460,cord:1100,canopy:[[0,0],[8,1],[22,8],[32,22],[37,42],[37,65]],
    lines:['Глянцевый бежевый верх, снизу белый матовый рассеиватель; бежевая алюминиевая трубка, белый шнур.','Ø37 см, высота 18 см; трубка 28 см, шнур 110 см; лампа E27, шар опаловый.'],
    shade(put,lathe,V,mt){
      lathe(new THREE.SplineCurve([V(185,95),V(186,105),V(183,128),V(175,150),V(158,167),V(125,177),V(70,180),V(10,180)]).getPoints(30),mt.beige,64);
      lathe(new THREE.SplineCurve([V(0,12),V(85,10),V(100,4),V(115,0),V(138,4),V(160,20),V(174,45),V(182,70),V(184,95)]).getPoints(30),mt.opal,64);
      lathe([V(185,88),V(187,90),V(187,97),V(185,99)],mt.seam,64);
      put(new THREE.CylinderGeometry(8*MM,8*MM,280*MM,16),mt.beige,320);
    }},
  /* BUNKEFLO, white and birch: 360 across, its steel shade 115 high — a skirt flaring a little to its open bottom, a rounded shoulder up to
     a white collar 85 across, 30 high, a solid birch cylinder 75 across, 42 high, on it. An E27 socket inside, an opal globe bulb under it */
  {name:'BUNKEFLO',price:5000,url:'https://ozon.ru/t/dwjZCNy',over:800,hang:187,cord:1400,canopy:[[0,0],[20,0],[22,2],[33,46],[33,48]],
    lines:['Белый, сталь с порошковым покрытием; сверху вставка из массива берёзы; белая потолочная чашка-конус.','Ø36 см; шнур 140 см; лампа E27, шар опаловый.'],
    shade(put,lathe,V,mt){
      lathe(new THREE.SplineCurve([V(180,0),V(177,15),V(172,45),V(167,72),V(158,92),V(130,105),V(90,111),V(48,114)]).getPoints(30),mt.steel,64);
      put(new THREE.CylinderGeometry(40*MM,43*MM,31*MM,32),mt.white,129.5);
      put(new THREE.CylinderGeometry(37.5*MM,37.5*MM,42*MM,32),mt.birch,166);
      put(new THREE.CylinderGeometry(20*MM,20*MM,40*MM,20),mt.white,100);
      put(new THREE.SphereGeometry(40*MM,24,16),mt.bulb,42);
    }},
  /* MISTERHULT, handwoven bamboo: its shade 450 across, 400 high, a gourd — a neck 160 across at the top, widest 150 up from its bottom,
     a solid bamboo band round its open bottom (370 across); its weave open, so the light and the sun go through it. An E27 socket in
     the neck, a clear globe bulb under it */
  {name:'MISTERHULT',price:9000,url:'https://ozon.ru/t/EIG8Q2j',over:700,hang:350,cord:1600,canopy:[[0,0],[8,0],[30,4],[44,14],[50,31],[50,46]],
    lines:['Бамбук, ручное плетение; белый шнур и потолочная чашка.','Абажур Ø45 см, высота 40 см; шнур до 160 см; лампа E27, шар прозрачный.'],
    shade(put,lathe,V,mt){
      const R=225,band=40;
      lathe(new THREE.SplineCurve([V(R-30,band),V(R-12,100),V(R,150),V(R-8,210),V(R-35,265),V(R-80,320),V(R-125,360),V(85,385),V(80,392)]).getPoints(40),mt.weave,64);
      lathe([V(R-41,0),V(R-37,6),V(R-34,band-6),V(R-30,band+2)],mt.bamboo,64);
      lathe([V(80,386),V(83,388),V(83,400),V(80,402)],mt.bamboo,40);
      put(new THREE.CylinderGeometry(...[20,20,70].map(v=>v*MM),20),mt.white,315);
      put(new THREE.SphereGeometry(47.5*MM,24,16),mt.bulb,237.5);
    }}
];
// a lamp's canopy's height; where its shade's bottom is hung (mm from the floor)
const canopyH=L=>L.canopy[L.canopy.length-1][1];
function pendantY(L){return Math.max(TB.h+L.over,P.H-canopyH(L)-L.cord-L.hang);}
function buildPendant(g){
  const q=new THREE.Group();q.position.set((TB.l/2)*MM,0,(TB.z+TB.w/2)*MM);
  // the card: which of the three it is and a link to the next one (engine.js: info.variant, info.next — it hangs the next and gives its card), its price and the shop
  const card=()=>{const L=LAMPS[pendantModel];
    return {title:`Подвесной светильник ${L.name} (IKEA)`,lines:L.lines.concat(`Над серединой обеденного стола, низ абажура в ${Math.round((pendantY(L)-TB.h)/10)} см над столешницей.`),
      price:L.price,url:L.url,shop:'Ozon',variant:[pendantModel+1,LAMPS.length],next:()=>{click();return card();}};};
  const click=()=>{pendantModel=(pendantModel+1)%LAMPS.length;fillPendant(q);};
  Object.assign(q.userData,{pendant:true,walkThrough:true,info:card,click});
  g.add(q);fillPendant(q);
}
// the lamp hung now, in q: what was there goes (the clipping planes its materials had go to the new ones)
function fillPendant(q){
  const old=q.children.slice(),planes=old.length?old[0].material.clippingPlanes:null;
  old.forEach(o=>{q.remove(o);if(o.geometry)o.geometry.dispose();});
  const L=LAMPS[pendantModel],y=pendantY(L),m=v=>v*MM,mt=pendantMats,V=(r,h)=>new THREE.Vector2(m(r),m(h));
  q.position.y=m(y);q.userData.model=L.name;
  const put=(geo,mat,py=0)=>{const o=new THREE.Mesh(geo,mat);o.position.y=m(py);o.castShadow=o.receiveShadow=true;q.add(o);return o;};
  const lathe=(pts,mat,n=48)=>put(new THREE.LatheGeometry(pts,n),mat);
  L.shade(put,lathe,V,mt);
  // the cord from its top up to the canopy on the ceiling
  const top=P.H-y-canopyH(L);
  put(new THREE.CylinderGeometry(m(3.5),m(3.5),m(top-L.hang),8),mt.white,(top+L.hang)/2).userData.cord=true;
  const cp=lathe(L.canopy.map(([r,h])=>V(r,h)),mt.white,32);cp.userData.canopy=true;cp.position.y=m(top);
  if(planes)clipToFloor(q,planes);
}

