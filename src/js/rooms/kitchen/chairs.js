/* four chairs as IKEA BERGMUND, black, its cover dark grey matting, as its drawing: 520 × 520 over the legs on the floor, 950 high. The seat 520 wide,
   510 high at its front, 410 deep in front of the back, upholstered all round (90 thick, the frame under the cover), sloping back
   to 470 at the back; the back 480 high from there to the top, narrowing to 370 at its top, 40 thick, its top corners rounded,
   down behind the seat to its bottom; the back to the seat 104°. Four square legs tapering to the floor, splayed out to its corners.
   Two along each long side of the table, 20 mm clear of its legs, 40 apart; all pushed in at first, under the table till the seat's front
   is 10 short of the table's middle (the chair across comes as far); a click pulls one out (the seat's front 80 out past the table's edge,
   less if the room on its side (tableRoom) is shorter: its back no further than the worktop's edge or the display cabinet), and back in.
   The walker passes through them (walk.js: userData.walkThrough).
   Own axes (mm): x across, y up, z from its back to the seat's front; its front toward the table */
const CH={W:520,D:520,H:950,seat:510,seatBack:470,depth:410,cush:90,angle:104,legT:42,legB:30,backB:500,backTop:370,backT:40,out:80,clear:20,gap:40};
// a rounded box's uv in m, as the back's (each face's 0…1 times its sizes), so the weave is as big on its narrow faces (k: as roundBoxGeo's)
function metricUV(geo,s,k=4){const uv=geo.attributes.uv,per=(2*k+2)**2;
  for(let i=0;i<uv.count;i++){const [au,,av]=BOX_UV[Math.floor(i/per)];uv.setXY(i,uv.getX(i)*s[au],uv.getY(i)*s[av]);}
  uv.needsUpdate=true;return geo;}
/* the cover: dark grey matting (рогожка), a basket weave of pairs of threads in squares 4 mm across, as a picture and its bumps.
   A tile of 4 × 4 squares (16 mm), 62.5 of them to a unit of the geometry's uv (m: metricUV) */
const chairFabric=(()=>{
  const tex=bump=>drawnTex(64,g=>{
    g.fillStyle=bump?'#000':'#3c3d3f';g.fillRect(0,0,64,64);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){const across=(i+j)%2===0,x=i*16,y=j*16;
      for(let k=0;k<2;k++){   // two threads to a square, each lit along its middle
        const [tx,ty,tw,th]=across?[x,y+k*8,16,8]:[x+k*8,y,8,16],gr=across?g.createLinearGradient(0,ty,0,ty+th):g.createLinearGradient(tx,0,tx+tw,0);
        gr.addColorStop(0,bump?'#202020':'#2f3032');gr.addColorStop(.5,bump?'#ffffff':(k?'#55575a':'#4d4f52'));gr.addColorStop(1,bump?'#202020':'#2f3032');
        g.fillStyle=gr;g.fillRect(tx+.5,ty+.5,tw-1,th-1);}}
  },1000/16,1000/16,!bump);
  return new THREE.MeshStandardMaterial({map:tex(false),bumpMap:tex(true),bumpScale:.0006,roughness:.97});
})();
const chairWood=new THREE.MeshStandardMaterial({color:0x1e1c1b,roughness:.5});   // black-stained solid wood
// where they stand (kitchen mm): x of each one's middle, its side (−1 the kitchen wall's, 1 the far one), how far it pulls out; how far in it goes
function chairsAt(){
  const x0=TB.in+TB.leg+CH.clear+CH.W/2,under=TB.w/2-10,room=tableRoom();
  const travel=side=>Math.max(0,under+Math.min(CH.out,room[side<0?0:1]-CH.D));
  return {under,list:[-1,1].flatMap(side=>[x0,x0+CH.W+CH.gap].map(x=>({x,side,travel:travel(side)})))};
}
function buildChairs(g,opts){
  const {W,D,H,seat,seatBack,depth,cush,angle,legT,legB,backB,backTop,backT}=CH,{under,list}=chairsAt();
  // the seat's slope; the back's lean (from upright): the two make the angle between them; the back's front where it meets the seat's top
  const ts=Math.atan2(seat-seatBack,depth),tb=(angle-90)*Math.PI/180-ts,zf=D-depth;
  const yBot=z=>seat-cush/Math.cos(ts)-(D-z)*Math.tan(ts);   // the seat's underside at z
  const yb=yBot(zf),zp=zf+(seatBack-yb)*Math.tan(tb),hb=(H-yb)/Math.cos(tb);   // the back's bottom: down to the seat's underside; its length
  // a tapered square leg from (x0, z0) on the floor up to (x1, z1) under the seat
  const leg=(q,x0,z0,x1,z1)=>{const y=yBot(z1),h=Math.hypot(x1-x0,y,z1-z0),m=new THREE.Mesh(new THREE.CylinderGeometry(legT/Math.SQRT2*MM,legB/Math.SQRT2*MM,h*MM,4),chairWood);
    m.rotation.set(Math.atan2(z1-z0,y),Math.PI/4,-Math.atan2(x1-x0,y),'ZXY');m.position.set((x0+x1)/2*MM,y/2*MM,(z0+z1)/2*MM);m.castShadow=m.receiveShadow=true;q.add(m);};
  // the back's outline (m, x across from its middle, y up from its bottom): a trapezoid, its corners rounded (the top ones more),
  // drawn a bevel in, the bevel rounds its edges
  const bv=8,backGeo=(()=>{const sh=new THREE.Shape(),m=v=>v*MM,pts=[[-backB/2+bv,bv,12],[backB/2-bv,bv,12],[backTop/2-bv,hb-bv,45],[-backTop/2+bv,hb-bv,45]];
    pts.forEach(([x,y,r],i)=>{const [ax,ay]=pts[(i+3)%4],[bx,by]=pts[(i+1)%4],to=(px,py)=>{const d=Math.hypot(px-x,py-y);return [x+(px-x)*r/d,y+(py-y)*r/d];};
      const [x1,y1]=to(ax,ay),[x2,y2]=to(bx,by);if(i)sh.lineTo(m(x1),m(y1));else sh.moveTo(m(x1),m(y1));sh.quadraticCurveTo(m(x),m(y),m(x2),m(y2));});
    sh.closePath();return new THREE.ExtrudeGeometry(sh,{depth:(backT-2*bv)*MM,bevelEnabled:true,bevelThickness:bv*MM,bevelSize:bv*MM,bevelSegments:3,curveSegments:8});})();
  return list.map(({x,side,travel},i)=>{
    // the chair where it is pushed in: its front under the table by «under»; across the table it is turned round
    const c=new THREE.Group(),zt=side<0?TB.z+under-D:TB.z+TB.w-under+D;
    c.position.set((x+side*W/2)*MM,0,zt*MM);c.rotation.y=side<0?0:Math.PI;
    Object.assign(c.userData,{chair:true,info:INFO.chair,walkThrough:true});g.add(c);
    const q=new THREE.Group();c.add(q);   // what slides: all of it, so a click anywhere on it moves it
    // the legs: on the floor at the corners of 520 × 520; up under the seat's front corners, the rear ones into the back's bottom
    const f=legB/2,u=legT/2+2,zr=zp-backT/2;
    [[f,u],[W-f,W-u]].forEach(([x0,x1])=>{leg(q,x0,D-f,x1,D-u);leg(q,x0,f,x1,zr);});
    // the seat on its front top edge, sloping back, from under the back to its front
    const st=new THREE.Group();st.position.set(0,seat*MM,D*MM);st.rotation.x=-ts;q.add(st);
    const sm=new THREE.Mesh(metricUV(roundBoxGeo(W*MM,cush*MM,(depth+backT)*MM,25*MM),[W*MM,cush*MM,(depth+backT)*MM]),chairFabric);sm.position.set(W/2*MM,-cush/2*MM,-(depth+backT)/2*MM);sm.castShadow=sm.receiveShadow=true;st.add(sm);
    // the back: its front on the seat's back edge, leaning back
    const b=new THREE.Group();b.position.set(W/2*MM,yb*MM,zp*MM);b.rotation.x=-tb;q.add(b);
    const bk=new THREE.Mesh(backGeo,chairFabric);bk.position.z=-(backT-bv)*MM;bk.castShadow=bk.receiveShadow=true;b.add(bk);
    // pulled out: away from the table (its own −z); all start pushed in
    return applDoor(q,{key:'chair'+i,axis:'z',travel:-travel*MM},opts);
  });
}

