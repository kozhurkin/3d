/* ---------- the shower rack: a thermostat, its riser with the overhead shower on an arm, the hand shower in a holder ----------
   On the left wall half way along the tray, its water sprays toward the partition, not out of the opening. The thermostat bar
   1150 from the floor on two elbows 150 apart, its knobs at the ends; the riser up to 2100, held to the wall under its top,
   turning in a round bend into the arm out to the Ø220 head 442 from the wall, the arm turning down to it the same way
   (as AM.PM Chic 2.0, F0782A500: its rack 880–1270 high, the hose 1750); the hand shower Ø110 in a holder on the riser,
   its hose hanging from the thermostat's outlet. A product of its own, not in the cut list; shown with the tray. Two groups: what is on the wall stops
   the walker, the arm with the head is over the head (walkThrough), else the walk takes the whole rack for one box. Bath axes, mm */
const RACK={y:1150,len:300,r:30,out:70,top:2100,reach:442,head:220,hand:110,holder:1550};
let rack=null;
function buildRack(sani){
  const wall=new THREE.Group(),over=new THREE.Group();
  [wall,over].forEach((o,i)=>{o.userData.rack=i?'over':'wall';o.userData.info=INFO.rack;sani.add(o);});over.userData.walkThrough=true;
  let g=wall;
  const R=RACK,[,,z0,z1]=trayRect(),c=(z0+z1)/2*MM,x=R.out*MM,y=R.y*MM,r=R.r*MM,top=R.top*MM,ax=R.reach*MM;
  // a cylinder along y, or along z / x (turn 'z' / 'x'), into g or another group (to)
  const cyl=(r0,r1,h,mat,px,py,pz,turn,to=g)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,32),mat);m.position.set(px,py,pz);
    if(turn==='z')m.rotation.x=Math.PI/2;else if(turn==='x')m.rotation.z=Math.PI/2;m.castShadow=true;to.add(m);return m;};
  // the thermostat: the bar along the wall, the knobs at its ends, the elbows into the wall
  cyl(r,r,R.len*MM,chromeMat,x,y,c,'z').userData.rackPart='thermostat';
  [-1,1].forEach(s=>{cyl(.028,.028,.05,chromeMat,x,y,c+s*(R.len/2+25)*MM,'z');                       // knob
    cyl(.026,.026,.004,darkMat,x,y,c+s*(R.len/2+51)*MM,'z');                                           // its cap
    cyl(.012,.012,x-r/2,chromeMat,(x-r/2)/2,y,c+s*.075,'x');                                           // elbow
    cyl(.032,.032,.008,chromeMat,.004,y,c+s*.075,'x');});                                              // its wall rose
  // the riser, its wall bracket; over the head: the arm and the overhead shower
  const bend=.06,drop=.03;   // the bends' radii: the riser into the arm, the arm down to the head
  cyl(.011,.011,top-bend-y-r,chromeMat,x,(y+r+top-bend)/2,c).userData.rackPart='riser';
  cyl(.008,.008,x,chromeMat,x/2,top-.25,c,'x');cyl(.025,.025,.008,chromeMat,.004,top-.25,c,'x');cyl(.016,.016,.04,chromeMat,x,top-.25,c);
  g=over;
  // a quarter of a pipe ring about (cx, cy) in the wall's normal plane, from the angle a (rad) on
  const arc=(rad,cx,cy,a)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(rad,.011,16,24,Math.PI/2),chromeMat);m.position.set(cx,cy,c);m.rotation.z=a;
    m.castShadow=true;m.userData.rackPart='bend';g.add(m);};
  arc(bend,x+bend,top-bend,Math.PI/2);                                                                 // the riser turns out into the arm
  cyl(.011,.011,ax-drop-x-bend,chromeMat,(x+bend+ax-drop)/2,top,c,'x');
  arc(drop,ax-drop,top-drop,0);                                                                        // the arm turns down to the head
  cyl(.014,.014,.008,chromeMat,ax,top-.026,c);                                                         // the head's ball joint nut
  cyl(R.head/2*MM,R.head/2*MM,.01,chromeMat,ax,top-.035,c).userData.rackPart='head';
  cyl(R.head/2*MM-.012,R.head/2*MM-.012,.002,darkMat,ax,top-.041,c);                                   // its nozzle plate
  // the hand shower in its holder: the handle a little out of plumb, its top leaning out; the head on the handle's end
  // by its rim (the handle goes into its side), its face turned off the handle's line a little down, into the shower
  g=wall;
  cyl(.016,.016,.04,chromeMat,x,R.holder*MM,c);
  const boxH=boxIn(g);boxH(x+.01,x+.04,R.holder*MM-.015,R.holder*MM+.015,c-.012,c+.012,chromeMat);
  const hand=new THREE.Group(),tilt=-.15;hand.position.set(x+.05,R.holder*MM,c);hand.rotation.z=tilt;hand.userData.rackPart='hand';g.add(hand);
  cyl(.014,.012,.22,chromeMat,0,-.06,0,null,hand);                                                    // handle, its end 50 over the holder
  const hr=R.hand/2*MM,fa=-.2,n=[Math.cos(fa),Math.sin(fa)],u=[-n[1],n[0]];                              // the face's normal; up the head's plane
  const hc=[u[0]*(hr-.012),.05+u[1]*(hr-.012)];                                                         // the head's centre: the handle 12 into its rim
  const hd=cyl(hr,hr,.028,chromeMat,hc[0],hc[1],0,null,hand);hd.rotation.z=fa-Math.PI/2;hd.userData.rackPart='handHead';   // head
  const hf=cyl(hr-.008,hr-.008,.002,darkMat,hc[0]+n[0]*.015,hc[1]+n[1]*.015,0,null,hand);hf.rotation.z=fa-Math.PI/2;   // its face
  // the hose, in the wall's normal plane: from a nut under the thermostat straight down, round a loop and straight up in front
  // of the thermostat, then in a smooth bend into the handle's end along its line; 1750 long
  const hb=[x+.05+.17*Math.sin(tilt),R.holder*MM-.17*Math.cos(tilt)],dd=[Math.sin(tilt),-Math.cos(tilt)];   // the handle's end; down its line
  cyl(.012,.012,.018,chromeMat,x,y-r-.007,c);                                                           // the outlet's nut
  const Ru=.06,yU=.41+Ru,x2=x+2*Ru,y1=1,path=[];
  for(let v=y-r-.016;v>yU;v-=.01)path.push([x,v]);
  for(let i=0;i<=16;i++){const a=Math.PI*(1+i/16);path.push([x+Ru+Ru*Math.cos(a),yU+Ru*Math.sin(a)]);}
  for(let v=yU+.01;v<y1;v+=.01)path.push([x2,v]);
  const B=[[x2,y1],[x2,y1+.14],[hb[0]+dd[0]*.1,hb[1]+dd[1]*.1],hb];
  for(let i=1;i<=24;i++){const t=i/24,s=1-t,w=[s*s*s,3*s*s*t,3*s*t*t,t*t*t];path.push([0,1].map(j=>w.reduce((a,wi,q)=>a+wi*B[q][j],0)));}
  const hose=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.map(([px,py])=>new THREE.Vector3(px,py,c))),path.length*2,.008,12,false),chromeMat);
  hose.castShadow=true;hose.userData.rackPart='hose';hose.userData.path=path;g.add(hose);
  return [wall,over];
}

