/* ---------- the wardrobe: 1601 × 2600 × 506, against the photo wallpaper's wall at its left end (as one faces the wall), or against the
   door wall in its right corner (A.wardWall, set in the plan's panel; WARD_AT) ----------
   Taupe outside, cream inside. Below a plinth; the main case on four hinged doors (the left door hinged on the left, the middle pair
   from the middle out, the right door on the right) and three black edge handles where they meet, one at each meeting: the middle one
   on the left door of the pair, the right one of it opens by a push; on top a cupboard on four doors without handles. Inside the main case three sections: shelves on the left and on the right (one door each), in the middle (two
   doors) a shelf with a rail under it, a shelf lower down and two drawers at the bottom; the top cupboard in three.
   Built in its own frame: u across from its left side, y up from the floor, d out from its back (mm); turned onto the wall.
   It stands against the skirting board. Its doors are cabinet doors (engine.js: furnDoors): they open on a click or a hold */
const WD={T:16,BACK:4,FRONT:18,PLINTH:60,TOP:380,GAP:3,HANDLE:[12,1120,100]};   // panels, back, doors; plinth; top cupboard; gaps; handle: width, top, bottom
const srgb=h=>new THREE.Color(h).convertSRGBToLinear();
const wardOut=new THREE.MeshStandardMaterial({color:srgb('#B8AEA6'),roughness:.6});   // taupe, matt
const wardIn=new THREE.MeshStandardMaterial({color:srgb('#E9E2DA'),roughness:.65});    // cream
const wardBlack=new THREE.MeshStandardMaterial({color:0x111111,roughness:.4,metalness:.4});
const wardRail=new THREE.MeshStandardMaterial({color:0x9a9a98,roughness:.3,metalness:.9});
const wardGroup=new THREE.Group();scene.add(wardGroup);
// the wardrobe in the room, mm: the wall it stands at, its back off the wall (the skirting board), its left side off the corner (the other wall's skirting board)
const wardWall=()=>WALLS.find(w=>w.id===A.wardWall);
// where on a wall it stands: from the left end as one faces the wall, or in the right corner
const WARD_AT={right:'left',left:'left',door:'right',window:'left'};
function buildWardrobe(){
  emptyGroup(wardGroup,false);furnDoors.length=0;
  const w=wardWall();if(!w)return;
  const {T,BACK,FRONT,PLINTH,TOP,GAP}=WD,W=A.wardW,D=A.wardD,Hh=A.wardH,dC=D-FRONT,yM=Hh-TOP;   // the case's front; the main case's top
  const g=new THREE.Group();wardGroup.add(g);g.userData.wardrobe=true;
  const box=(par,x0,x1,y0,y1,z0,z1,mat,lines=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry((x1-x0)*MM,(y1-y0)*MM,(z1-z0)*MM),mat);
    m.position.set((x0+x1)/2*MM,(y0+y1)/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;
    if(lines)m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),edgeMat));par.add(m);return m;};
  // the plinth, set back 20 from the case's front
  box(g,T,W-T,0,PLINTH,BACK,dC-20,wardOut);
  // a case from y0 to y1: its sides, top and bottom outside in taupe, the back inside in cream; partitions at u
  const kase=(y0,y1,parts)=>{
    box(g,0,T,y0,y1,0,dC,wardOut);box(g,W-T,W,y0,y1,0,dC,wardOut);
    box(g,T,W-T,y1-T,y1,0,dC,wardOut);box(g,T,W-T,y0,y0+T,0,dC,wardIn);
    box(g,T,W-T,y0+T,y1-T,0,BACK,wardIn,false);
    parts.forEach(u=>box(g,u-T/2,u+T/2,y0+T,y1-T,BACK,dC,wardIn));
  };
  const q=(W-2*T)/4,u1=T+q,u3=T+3*q;   // a door's share of the inside; the partitions: a door in from either side
  kase(PLINTH,yM,[u1,u3]);kase(yM,Hh,[u1,u3]);
  const shelf=(a,b,y)=>box(g,a,b,y,y+T,BACK,dC-2,wardIn);
  // the side sections: five shelves each, evenly
  [[T,u1-T/2],[u3+T/2,W-T]].forEach(([a,b])=>{for(let i=1;i<=5;i++)shelf(a,b,PLINTH+T+i*(yM-PLINTH-2*T)/6-T/2);});
  // the middle: a shelf with the rail under it, a shelf over the drawers, two drawers
  const a=u1+T/2,b=u3-T/2;
  shelf(a,b,yM-420);shelf(a,b,PLINTH+T+420);
  { const r=new THREE.Mesh(new THREE.CylinderGeometry(.0125,.0125,(b-a)*MM,16),wardRail);r.rotation.z=Math.PI/2;
    r.position.set((a+b)/2*MM,(yM-420-70)*MM,(dC/2)*MM);g.add(r); }
  [0,1].forEach(i=>{const y0=PLINTH+T+10+i*205;box(g,a+3,b-3,y0,y0+190,dC-30,dC-12,wardIn);});   // the drawer fronts, behind the doors
  // the doors: four on the main case, four on the top cupboard; hinged at hinge (u) on the case's front, s the way they turn out
  const door=(x0,x1,y0,y1,hingeLeft,handle)=>{
    const hx=hingeLeft?x0:x1,p=new THREE.Group();p.position.set(hx*MM,0,D*MM);g.add(p);
    box(p,x0-hx,x1-hx,y0,y1,-FRONT,0,wardOut);
    // the handle: a black profile along the edge away from the hinge, standing 2 out of the face and 1 past the edge, its back 1 in from
    // the leaf's: no face of it in a plane with the leaf's (they would flicker)
    if(handle){const [hw,ht,hb]=WD.HANDLE,e=hingeLeft?x1-hx:x0-hx;box(p,hingeLeft?e-hw:e-1,hingeLeft?e+1:e+hw,hb,ht,1-FRONT,2,wardBlack,false);}
    furnDoors.push({g:p,h:(y1-y0)*MM,t:0,a:0,max:1.6,s:hingeLeft?-1:1,wardrobe:true});
  };
  const dw=(W-5*GAP)/4,dx=i=>GAP+i*(dw+GAP);
  // the hinges: the left door's on the left, the middle pair's at the partitions (they open from the middle), the right door's on the right;
  // a handle at each meeting of two doors: the middle one on the pair's left door
  [[0,true,true],[1,true,true],[2,false,false],[3,false,true]].forEach(([i,l,hd])=>{
    door(dx(i),dx(i)+dw,PLINTH+GAP,yM-GAP/2,l,hd);door(dx(i),dx(i)+dw,yM+GAP/2,Hh-GAP,l,false);});
  // onto the wall: from its left end as one faces it, or in its right corner (the skirting board at the corner kept)
  const [r0,r1]=w.run;standAgainst(g,w,WARD_AT[w.id]==='right'?r1-r0-PL_T-W:PL_T);
}
buildWardrobe();modelHooks.push(buildWardrobe);
// where it stands in the room (m): what the walk can't go through, [x0,x1,z0,z1,y0,y1]
function wardrobeBoxes(){const g=wardGroup.children[0];return g?[standBox(g,0,A.wardW,0,A.wardD,A.wardH)]:[];}
// the doors swing toward where they are sent, a held one follows the hold
frameHooks.push((dt,ease)=>{furnDoors.forEach(d=>{
  if(held&&held.d===d){d.t=Math.min(d.max,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}else d.a+=(d.t-d.a)*ease(.07);
  d.g.rotation.y=d.s*d.a;});});
