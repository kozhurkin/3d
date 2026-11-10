/* ---------- apartment model, mm: one for every tab ----------
   Plain data and arithmetic only (no THREE, no DOM), so it also runs in Node for checks.
   x → right, z → from the entrance door toward the kitchen (top view: entrance at the top, kitchen at the bottom).
   origin: inner corner of the hall between the bearing wall with the entrance door and the hall's left wall */
const APT_A={
  H:2600,                           // ceiling height
  hallW:1200,                       // hall between its side walls
  hL1:650, bDoor:600, bDoorH:2000, hL2:650,   // hall left wall: wall, bathroom doorway, wall up to the kitchen wall
  kOver:200,                        // kitchen wall runs this far past the hall side of the hall's left wall
  kW:2200, kL:4750,                 // kitchen wall; kitchen left and right walls from the kitchen wall to the window wall
  winW:1500, winH:1200, winS:800,   // kitchen window in the outer wall, centred: width, height, sill height from the floor
  bNiche:1200,                      // bathroom along its back wall: toilet niche, then the partition next to the tall cabinet
  bL:1100, bWs:500, bStub:600,      // bath tab: niche depth, wall at the niche end, partition stub next to the tall cabinet
  bGap:500,                         // opening between the wall at the niche end and the shower partition
  rX:250, rZ:250,                   // sewer riser box in the back-left corner of the bathroom
  vOff:150,                         // vent shaft wall: this far from the kitchen-side edge of the bathroom doorway
  bear:200, wt:100,                 // outer bearing walls of the apartment (entrance + bathroom back, bathroom/kitchen left), inner walls
  eD0:84, eD1:976, eDH:2016,        // entrance door opening (as in the hall tab)
  eRv:100                           // entrance door frame: this far into the bearing wall from the hall (the reveal the hall cabinet clads)
};

/* Builds the whole model from the sizes; a: the sizes to change, the rest come from APT_A.
   Walls: rect r=[x0,x1,z0,z1]; ext: outer side of an outside wall; holes along the long side: [from, to, top, sill];
   rooms: the tabs that show the wall. Rooms: floor rect r and origin — where the room tab's own (0,0) lies on the plan */
function apartment(a){
  const A=Object.assign({},APT_A,a);
  const hLen=A.hL1+A.bDoor+A.hL2;      // hall left wall up to the kitchen wall
  const kZ0=hLen, kZ1=hLen+A.wt;       // kitchen wall (bathroom side, kitchen side)
  const xL=A.kOver-A.kW;               // inner face of the common left wall
  const xB1=-A.wt;                     // bathroom side of the hall's left wall
  const zB0=0;                         // the bathroom back wall continues the hall bearing wall
  const zEnd=kZ1+A.kL;                 // inner face of the outer wall with the window
  const winX=(xL+A.hallW)/2;           // window centre, middle of the kitchen
  const zV0=A.hL1+A.bDoor+A.vOff;      // vent shaft wall (bathroom side); the shaft runs from it to the kitchen wall
  const bx=v=>xL+v, bz=v=>zB0+v;       // bath tab coordinates → plan
  const xSh=bx(A.bWs+A.bGap);          // shower partition, bathroom-niche side

  const WALLS=[
    {id:'entry',name:'Несущая стена: вход и санузел',r:[xL-A.bear,A.hallW+A.bear,-A.bear,0],ext:'-z',rooms:['hall','bath'],holes:[[A.eD0,A.eD1,A.eDH]]},
    {id:'rightOuter',name:'Правая стена прихожей (внешняя)',r:[A.hallW,A.hallW+A.bear,0,zEnd],ext:'+x',rooms:['hall','kitchen']},
    {id:'leftOuter',name:'Несущая левая стена: санузел и кухня',r:[xL-A.bear,xL,0,zEnd],ext:'-x',rooms:['bath','kitchen']},
    {id:'window',name:'Стена кухни с окном (внешняя)',r:[xL-A.bear,A.hallW+A.bear,zEnd,zEnd+A.bear],ext:'+z',rooms:['kitchen'],holes:[[winX-A.winW/2,winX+A.winW/2,A.winS+A.winH,A.winS]]},
    {id:'hallBath',name:'Стена прихожая / санузел',r:[xB1,0,0,hLen],rooms:['hall','bath'],holes:[[A.hL1,A.hL1+A.bDoor,A.bDoorH]]},
    {id:'kitchen',name:'Стена кухни',r:[xL,A.kOver,kZ0,kZ1],rooms:['kitchen','bath','hall']},
    {id:'passRight',name:'Стенка справа от прохода на кухню',r:[A.hallW-A.kOver,A.hallW,kZ0,kZ1],rooms:['hall','kitchen']},   // mirrors the kitchen wall end: the passage gets 200 mm on both sides
    {id:'bathStub',name:'Перегородка у пенала',r:[bx(A.bNiche),bx(A.bNiche+A.wt),zB0,bz(A.bStub)],rooms:['bath']},
    {id:'nicheEnd',name:'Стенка в конце ниши',r:[xL,bx(A.bWs),bz(A.bL),bz(A.bL+A.wt)],rooms:['bath']},
    {id:'shower',name:'Стенка между душем и раковиной',r:[xSh,xSh+A.wt,bz(A.bL),kZ0],rooms:['bath']},   // from the niche end down to the kitchen wall
    {id:'shaft',name:'Стенка вентшахты',r:[xSh+A.wt,xB1,zV0,zV0+A.wt],rooms:['bath']},   // closes the shaft between the partition, the hall wall and the kitchen wall
    {id:'riser',name:'Канализационный короб',r:[xL,bx(A.rX),zB0,bz(A.rZ)],rooms:['bath']}
  ];
  const ROOMS=[
    {id:'hall',name:'Прихожая',r:[0,A.hallW,0,kZ1],origin:[0,0],col:'--fl-hall',at:[A.hallW/2,hLen/2+150]},
    {id:'bath',name:'Санузел',r:[xL,xB1,zB0,kZ0],origin:[xL,zB0],col:'--fl-bath',at:[(xSh+xB1)/2-150,(bz(A.bStub)+bz(A.bL))/2+40]},   // open middle of the room, clear of all walls
    {id:'kitchen',name:'Кухня',r:[xL,A.hallW,kZ1,zEnd],origin:[xL,kZ1],col:'--fl-kit',at:[(xL+A.kOver)/2,kZ1+675]}   // near the kitchen wall corner, where it was before the kitchen grew
  ];
  const BOX={x0:xL-A.bear,x1:A.hallW+A.bear,z0:-A.bear,z1:zEnd+A.bear};
  return {A,H:A.H,hLen,kZ0,kZ1,xL,xB1,zB0,zEnd,winX,zV0,bx,bz,WALLS,ROOMS,BOX};
}

/* What does not fit with these sizes: [] when everything does. The plan's size sliders stop at the last value that fits.
   Walls may touch but not overlap, and none may come out shorter than nothing; plus the rules a plan of walls alone can't see */
function aptProblems(a){
  const m=apartment(a),A=m.A,out=[];
  m.WALLS.forEach(w=>{if(w.r[1]<w.r[0]||w.r[3]<w.r[2])out.push(`«${w.name}» не помещается`);});
  m.WALLS.forEach((p,i)=>m.WALLS.slice(i+1).forEach(q=>{
    const ox=Math.min(p.r[1],q.r[1])-Math.max(p.r[0],q.r[0]),oz=Math.min(p.r[3],q.r[3])-Math.max(p.r[2],q.r[2]);
    if(ox>.5&&oz>.5)out.push(`«${p.name}» и «${q.name}» пересекаются`);}));
  if(A.hallW-2*A.kOver<600)out.push('Проход на кухню уже 600 мм');
  if(A.eD0<0||A.eD1>A.hallW)out.push('Входной проём не помещается в ширину прихожей');
  if(A.bNiche+A.wt>m.xB1-m.xL)out.push('Ниша с перегородкой у пенала не помещается в ширину санузла');
  if(m.zV0<A.bL)out.push('Стенка вентшахты не доходит до перегородки душа');
  if(A.winW>A.hallW-m.xL-200)out.push('Окно шире кухни (нужно хотя бы по 100 мм до боковых стен)');
  if(Math.max(A.eDH,A.bDoorH,A.winS+A.winH)>A.H-50)out.push('Проём выше потолка (нужно хотя бы 50 мм)');
  if(A.eRv+70>A.bear)out.push('Коробка входной двери (70 мм) не помещается в несущую стену');
  return out;
}
