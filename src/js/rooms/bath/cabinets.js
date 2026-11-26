/* ---------- parts (mm) ---------- */
function computeParts(p){
  // axes: x along the back wall (left wall at x=0), y up, z from the back wall into the room
  const [parts,add]=partList(),W=p.W,H=p.H,RB=100,FL=p.Feet?10:0;   // FL: the tall cabinet sits on 10 mm feet
  const zf=Math.max(p.Dt,p.Rz+TF), zc=zf-TF;   // front plane of the back run (tall cabinet + riser cladding)
  const xb=W, xa=W-Math.min(p.Wc,W-p.Rx);     // carcass at the right; cladding covers riser + filler on the left
  const pl=p.Pl, sp=p.Hi;   // door split follows the installation height
  // layout 2: an open section between the riser box and the tall cabinet, the cladding only over the box
  const L2=p.Lay===2, xs=p.Rx, os=L2&&xa-xs>2*T+40, xc=os?xs:xa-G/2;
  // tall cabinet, floor to ceiling, against the back wall, standing on a plinth
  add('Бок пенала','carcass',xa,xa+T,FL,H,0,zc);
  add('Бок пенала','carcass',xb-T,xb,FL,H,0,zc);
  add('Дно пенала','carcass',xa+T,xb-T,FL+pl,FL+pl+T,0,zc);
  add('Крышка пенала','carcass',xa+T,xb-T,H-T,H,0,zc);
  add('Полка-разделитель пенала','carcass',xa+T,xb-T,sp-T/2,sp+T/2,0,zc);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,FL+pl+T,FL+pl+T+RB,0,T);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,H-T-RB,H-T,0,T);
  const sb=(sp-T/2-FL-pl-T)/(p.Nb+1);
  for(let i=1;i<=p.Nb;i++){const y=FL+pl+T+i*sb-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  const sh=(H-T-sp-T/2)/(p.Nh+1);
  for(let i=1;i<=p.Nh;i++){const y=sp+T/2+i*sh-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  const plinth=(x0,x1)=>add('Цоколь пенала и короба (заподлицо с фасадами)','front',x0,x1,FL,FL+pl-G/2,zc,zf);
  if(pl>0){if(os){plinth(G/2,xs);plinth(xa,W-G/2);}else plinth(G/2,W-G/2);}
  // the open section: floor to ceiling, as deep as the run (flush with the cladding and the doors), its own LDSP back, shelves evenly;
  // its plinth between its sides, in its colour (it has no fronts)
  if(os){
    if(pl>0)add('Цоколь открытой секции','carcass',xs+T,xa-T,FL,FL+pl-G/2,zc,zf);
    add('Бок открытой секции','carcass',xs,xs+T,FL,H,0,zf);
    add('Бок открытой секции','carcass',xa-T,xa,FL,H,0,zf);
    add('Задняя стенка открытой секции','carcass',xs+T,xa-T,FL+pl,H,0,T);
    add('Дно открытой секции','carcass',xs+T,xa-T,FL+pl,FL+pl+T,T,zf);
    add('Крышка открытой секции','carcass',xs+T,xa-T,H-T,H,T,zf);
    const so=(H-T-FL-pl-T)/(p.Ns+1);
    for(let i=1;i<=p.Ns;i++){const y=FL+pl+T+i*so-T/2;add('Полка открытой секции','carcass',xs+T,xa-T,y,y+T,T,zf);}
  }
  // fronts: riser cladding (fixed, two panels) + 4 doors, split at the same height
  const xm=(xa+xb)/2;
  [[FL+pl+G/2,sp-G/2,'нижняя'],[sp+G/2,H-G/2,'верхняя']].forEach(([y0,y1,nm])=>{
    add('Облицовка короба, '+nm+' (фасад, глухой)','front',0,xc,y0,y1,zc,zf);
    add('Фасад пенала','front',xa+G/2,xm-G/2,y0,y1,zc,zf,{hinge:'L'});
    add('Фасад пенала','front',xm+G/2,xb-G/2,y0,y1,zc,zf,{hinge:'R'});
  });
  // upper cabinet above the installation, along the left wall
  // layout 1: over an open niche, its doors overlay; layout 2: no niche, it sits on the installation, its doors inset between its boards
  p.Lt=Math.max(200,p.L-zf);   // installation run fills the rest of the left wall
  const yb=L2?p.Hi:p.Hi+p.Gap,dc=p.Du-TF,z0=zf,z1=zf+p.Lt;
  // separate product: open niche box in the gap between the installation and the upper cabinet, with its own LDSP back
  if(!L2&&p.Gap>2*T+20){
    const dm=p.Dm||200;
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z0,z0+T);
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z1-T,z1);
    add('Дно ниши над инсталляцией','carcass',T,dm,p.Hi,p.Hi+T,z0+T,z1-T);
    add('Крышка ниши над инсталляцией','carcass',T,dm,yb-T,yb,z0+T,z1-T);
    add('Задняя стенка ниши над инсталляцией','carcass',0,T,p.Hi,yb,z0+T,z1-T);
  }
  if(H-yb>2*T+60){
    const dk=L2?p.Du:dc;   // inset doors: the boards go the whole depth, the doors sit in front of the shelves between them
    add('Бок верхнего шкафа','carcass',0,dk,yb,H,z0,z0+T);
    add('Бок верхнего шкафа','carcass',0,dk,yb,H,z1-T,z1);
    add('Дно верхнего шкафа','carcass',0,dk,yb,yb+T,z0+T,z1-T);
    add('Крышка верхнего шкафа','carcass',0,dk,H-T,H,z0+T,z1-T);
    const rb=Math.min(RB,(H-yb-2*T)/3);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,yb+T,yb+T+rb,z0+T,z1-T);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,H-T-rb,H-T,z0+T,z1-T);
    const su=(H-yb-T)/(p.Nu+1);
    for(let i=1;i<=p.Nu;i++){const y=yb+i*su;add('Полка верхнего шкафа','carcass',T,dc-10,y,y+T,z0+T,z1-T);}
    const zm=(z0+z1)/2,[fy0,fy1,za,zb]=L2?[yb+T+G,H-T-G,z0+T+G,z1-T-G]:[yb,H-G/2,z0+G/2,z1-G/2];
    add('Фасад верхнего шкафа','front',dc,p.Du,fy0,fy1,za,zm-G/2,{pivot:{x:p.Du,z:za,s:1}});
    add('Фасад верхнего шкафа','front',dc,p.Du,fy0,fy1,zm+G/2,zb,{pivot:{x:p.Du,z:zb,s:-1}});
  }
  // every board that reaches the floor is lifted onto the feet
  if(FL)parts.forEach(q=>{if(q.y0<FL)q.y0=FL;});
  // feet at the corners of each floor-standing unit (8 mm in from the outer faces): tall cabinet, the open section, the riser cladding front
  const cnr=(x0,x1,z0,z1)=>[[x0+8,z0+8],[x1-8,z0+8],[x0+8,z1-8],[x1-8,z1-8]];
  const feet=os?[...cnr(xa,xb,0,zf),...cnr(xs,xa,0,zf),[8,zf-8]]:[...cnr(xa,xb,0,zf),[8,zf-8],[xa-8,zf-8]];
  return {parts,zf,yb,Hb:p.Hi,FL,feet};
}

const O=()=>ROOMS.find(r=>r.id==='bath').origin;   // the bathroom's (0,0) on the plan, mm
function clamp(w){
  P.Wc=Math.min(w.Wc,P.W-P.Rx);
  P.Gap=Math.min(w.Gap,Math.max(0,P.H-P.Hi-200));
}
// sizes that belong to the walls come from the plan; the tall cabinet and the gap over the installation have to fit
function fromModel(w){P.W=A.bNiche;P.L=A.bL;P.H=A.H;P.Rx=A.rX;P.Rz=A.rZ;clamp(w);T=P.T||16;TF=P.TF||16;return current=computeParts(P);}

/* ---------- finishes and materials ---------- */
// finish per part group, as in the bath tab: wood decor or plain colour (no worktop here)
const FIN={carcass:{type:'uni',color:'#6E7173',name:'Диамант серый U963 ST9'},front:{type:'wood',decor:'H1386'}};
const mats=makeMats();
applyMaterials(mats,FIN,P.Ec);
const tileMat=new THREE.MeshStandardMaterial({color:0x6b6e70,roughness:.6});
const whiteMat=new THREE.MeshStandardMaterial({color:0xf4f4f2,roughness:.25,metalness:.05});
const chromeMat=new THREE.MeshStandardMaterial({color:0xc9c9c6,roughness:.2,metalness:.9});
const darkMat=new THREE.MeshStandardMaterial({color:0x2b2d2f,roughness:.35,metalness:.2});

