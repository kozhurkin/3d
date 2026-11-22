// over the table's length (kitchen x, mm); the kitchen's run below 1 m over it reaches this far from the kitchen wall (its worktop's edge; 0 without it)
const overTable=r=>r[0]<TB.l&&r[1]>0;
const runEdge=()=>Math.max(0,...current.parts.filter(q=>overTable([q.x0,q.x1])&&q.y0<1000).map(q=>q.z1));   // the kitchen's run is all by the kitchen wall
/* the room by the dining table's long sides (kitchen mm), as its card has it: [toward the kitchen wall, toward the window].
   Toward the kitchen wall: up to the run's edge, else the wall itself;
   toward the window: up to the nearest of the rest of the room along it (living/api.js: foot — the display cabinet), else the window wall */
function tableRoom(){
  const z1=TB.z+TB.w,w=Math.min(P.L,...living.foot().filter(r=>overTable(r)&&r[2]>=z1).map(r=>r[2]));
  return [TB.z-runEdge(),w-z1];
}
/* where the dining table stands along the left wall, the window wall's distance given (kitchen mm). The free room by its long sides,
   from the worktop's edge to the display cabinet's front, is split: the worktop's side 200 more (room to come up to the worktop), the
   rest in halves, the 10 mm rounding to the display cabinet's side. The desk stands 100 from the window wall, or against it (DeskWall) */
const DIN_MORE=200;
function placeDining(){
  const gap=P.DeskWall?0:living.GAP,k=runEdge(),free=P.L-gap-living.back-k-TB.w;
  living.setGap(gap);
  TB.z=k+Math.floor((free+DIN_MORE)/20)*10;
}

/* the dining table: a worktop-decor top on four steel legs, its end against the left wall (kitchen axes, m) */
function buildTable(g){
  const box=boxIn(g),x1=TB.l*MM,z0=TB.z*MM,z1=(TB.z+TB.w)*MM,y1=TB.h*MM,y0=(TB.h-TB.t)*MM;
  const sx=x1,sy=y1-y0,sz=z1-z0,thin=1;
  const top=new THREE.Mesh(boxGeo(sx,sy,sz,77),[0,0,1,1,2,2].map(a=>a===thin?mats.top:mats.topEnd));
  top.position.set(x1/2,(y0+y1)/2,(z0+z1)/2);top.castShadow=top.receiveShadow=true;
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(top.geometry),mats.topLine);e.raycast=()=>{};top.add(e);g.add(top);
  const l=TB.leg*MM,i=TB.in*MM,legs=[[i,z0+i],[x1-i-l,z0+i],[i,z1-i-l],[x1-i-l,z1-i-l]].map(([x,z])=>box(x,x+l,0,y0,z,z+l,blackMat));
  [top,...legs].forEach(m=>{m.userData.info=INFO.table;m.userData.table=true;});
  return [];
}

