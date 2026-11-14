/* ---------- «Обход»: the apartment from the eyes, walked through as in a game ----------
   W A S D or the arrows — walk, the mouse — look (a click on the scene takes the mouse, Esc or the right button gives it back; where the browser
   does not let the page take it, drag to look), Space — jump, Ctrl or C — crouch, Shift — a slow step, E or a click — the door or
   cabinet front in the middle of the screen (under the cursor while dragging). The panel sets the eye height, the walls' look, the
   doors, and has the common wall colour (with the outlines) and light.
   The camera is the orbit's, its centre a step (LOOK) in front of the eyes: a flight to the walk and from it, and the camera
   remembered for the view, work as in any view. Walls (however they look), closed doors, cabinets and appliances stop the walker;
   with «Без дверей» the doorways are free */
const walkPanel=document.querySelector('[data-panel="walk"]');
const LOOK=1;                       // m: the orbit's centre in front of the eyes
const BODY=.15;                     // m: the walker seen from above is a circle of this radius (a person turned sideways)
const STEP=.3;                      // m: what is lower than this above the feet is stepped over (plinths, a low sill)
const RUN=2.4,SLOW=1.2,LOW=.9;      // m/s: walking, with Shift, crouching
const JUMP=3.3,GRAV=12;             // m/s, m/s²: a jump of about 45 cm
const CROUCH_K=.32;                 // crouching lowers the eyes by this share
const OPEN_A=1;                     // rad: a door open this far lets the walker through
const SENS=.0025;                   // rad per pixel of the mouse
const FOV0=camera.fov,FOV_WALK=62;  // the walk sees wider, like a game

const keys=new Set();let jumpQ=false;
const pl={on:false,feet:0,vy:0,c:0,vx:0,vz:0};   // the walker: feet above the floor (m), vertical speed, crouch 0…1, speed (m/s)
const walking=()=>view==='walk'&&!inTransition();
const locked=()=>!!document.pointerLockElement&&document.pointerLockElement===canvas;

/* the eyes: where the orbit puts the camera (goal), and back */
const lookDir=()=>{const sp=Math.sin(goal.phi);return [sp*Math.sin(goal.theta),Math.cos(goal.phi),sp*Math.cos(goal.theta)];};
function eyeNow(){const d=lookDir();return [goalT.x+goal.r*d[0],goalT.y+goal.r*d[1],goalT.z+goal.r*d[2]];}
function setEye(x,y,z){const d=lookDir();goalT.set(x-goal.r*d[0],y-goal.r*d[1],z-goal.r*d[2]);}
// the eye height standing (m): as set, low enough for a jump under the ceiling
const eyeH=()=>Math.min(VS.walk.eye*MM,H*MM-.6);
function look(dx,dy){
  const e=eyeNow();
  goal.theta-=dx*SENS;goal.phi=Math.min(Math.PI-.08,Math.max(.08,goal.phi-dy*SENS));
  setEye(...e);
}
// the first visit: in the hall by the entrance, looking toward the kitchen
function walkHome(){goal.theta=Math.PI;goal.phi=Math.PI/2;goal.r=LOOK;setEye(A.hallW/2*MM,eyeH(),.45);shortWay();}

/* ---------- what is in the way, m: [x0,x1,z0,z1,y0,y1] ----------
   The walls without their openings (rebuilt with the sizes); a window is not a way through; a door opening is while its door
   is open; the cabinets of every room, their appliances and sanitary ware as they stand now */
let wallBoxes=[],doorways=[];
function walkWalls(){
  wallBoxes=[];doorways=[];
  WALLS.forEach(w0=>{
    const w=clipWall(w0,null),[x0,x1,z0,z1]=w.r;
    const box=(a,b,y0,y1)=>(w.along?[a,b,z0,z1]:[x0,x1,a,b]).map(v=>v*MM).concat([y0*MM,y1*MM]);
    let cur=w.along?x0:z0;const end=w.along?x1:z1;
    w.holes.forEach(([a,b,h,sill=0],i)=>{
      if(a>cur)wallBoxes.push(box(cur,a,0,H));
      if(sill>0)wallBoxes.push(box(a,b,0,H));
      else{wallBoxes.push(box(a,b,h,H));doorways.push({hole:w.id+':'+i,b:box(a,b,0,h)});}
      cur=b;});
    if(end>cur)wallBoxes.push(box(cur,end,0,H));
  });
}
walkWalls();modelHooks.push(walkWalls);
const _bx=THREE.Box3?new THREE.Box3():null;
function furnBoxes(){
  const out=[];
  ROOMS.forEach(r=>{
    const v=VIEWS[r.id];if(!v||!v.furniture)return;const f=v.furniture();if(!f.model||!f.model.visible)return;
    const [ox,oz]=v.anchor(),y=f.model.position.y;
    f.current.parts.forEach(p=>out.push([(ox+p.x0)*MM,(ox+p.x1)*MM,(oz+p.z0)*MM,(oz+p.z1)*MM,p.y0*MM+y,p.y1*MM+y]));
    // appliances and sanitary ware: their boxes in the scene (where the browser's THREE can tell them)
    if(f.extra&&f.extra.visible&&_bx&&_bx.setFromObject)f.extra.children.forEach(o=>{
      _bx.setFromObject(o);if(!_bx.isEmpty())out.push([_bx.min.x,_bx.max.x,_bx.min.z,_bx.max.z,_bx.min.y,_bx.max.y]);});
  });
  return out;
}
function walkObstacles(){
  const shut=new Set(VS.walk.dm==='none'?[]:doors.filter(d=>d.a<OPEN_A).map(d=>d.hole));
  return wallBoxes.concat(doorways.filter(w=>shut.has(w.hole)).map(w=>w.b),furnBoxes());
}
// how far the circle's centre at u is from the box b along axis i (0: x, 1: z); 0 inside its span
const gap=(b,i,u)=>Math.max(b[2*i]-u,0,u-b[2*i+1]);
const hits=(b,x,z,lo,hi)=>hi>b[4]&&lo<b[5]&&gap(b,0,x)**2+gap(b,1,z)**2<BODY*BODY;
/* a move from x,z by dx,dz for a body from lo to hi (m above the floor): along each axis on its own, so the walker slides
   along a wall; a move into something ends where the body touches it. What the walker already stands in (a door closed on
   them, a wall moved by the plan) does not hold them. Returns the new x, z and whether each axis went all the way */
function walkSlide(x,z,dx,dz,lo,hi,boxes=walkObstacles()){
  const inside=new Set(boxes.filter(b=>hits(b,x,z,lo,hi)));
  const inWay=(x,z)=>boxes.filter(b=>!inside.has(b)&&hits(b,x,z,lo,hi));
  // one axis (0: x, 1: z): from v by d, the other coordinate at o; up to the nearest face in the way
  const axis=(i,v,d,o)=>{
    const at=t=>i?inWay(o,t):inWay(t,o),bs=at(v+d);if(!bs.length)return [v+d,true];
    // the circle touches a box at its face, or at its corner when the other coordinate is past its span
    const reach=b=>Math.sqrt(Math.max(0,BODY*BODY-gap(b,1-i,o)**2));
    const t=d>0?Math.max(v,Math.min(...bs.map(b=>b[2*i]-reach(b)))-1e-6):Math.min(v,Math.max(...bs.map(b=>b[2*i+1]+reach(b)))+1e-6);
    return [at(t).length?v:t,false];
  };
  const [nx,fx]=axis(0,x,dx,z),[nz,fz]=axis(1,z,dz,nx);
  return [nx,nz,fx,fz];
}

/* ---------- every frame in the walk: the keys move the walker, the camera follows exactly ---------- */
const walkCam=()=>{cam.theta=goal.theta;cam.phi=goal.phi;cam.r=goal.r;cam.target.copy(goalT);};
const keyOn=c=>keys.has(c)?1:0;
function walkStep(dt){
  const [ex,,ez]=eyeNow();goal.r=LOOK;
  if(!pl.on)Object.assign(pl,{on:true,feet:0,vy:0,c:0,vx:0,vz:0});
  pl.c+=(Math.max(keyOn('KeyC'),keyOn('ControlLeft'),keyOn('ControlRight'))-pl.c)*Math.min(1,dt*10);
  const eye=eyeH()*(1-CROUCH_K*pl.c),ground=pl.feet<=0;
  // where the keys lead, at the speed of the gait; on the ground the speed follows at once, in the air hardly
  const f=Math.max(keyOn('KeyW'),keyOn('ArrowUp'))-Math.max(keyOn('KeyS'),keyOn('ArrowDown')),s=Math.max(keyOn('KeyD'),keyOn('ArrowRight'))-Math.max(keyOn('KeyA'),keyOn('ArrowLeft'));
  const th=goal.theta;let wx=-Math.sin(th)*f+Math.cos(th)*s,wz=-Math.cos(th)*f-Math.sin(th)*s;
  const n=Math.hypot(wx,wz),top=pl.c>.5?LOW:keys.has('ShiftLeft')||keys.has('ShiftRight')?SLOW:RUN;
  if(n){wx*=top/n;wz*=top/n;}
  const a=Math.min(1,dt*(ground?20:2));pl.vx+=(wx-pl.vx)*a;pl.vz+=(wz-pl.vz)*a;
  if(ground&&jumpQ){pl.vy=JUMP;jumpQ=false;}
  pl.vy-=GRAV*dt;pl.feet=Math.max(0,pl.feet+pl.vy*dt);if(pl.feet===0&&pl.vy<0)pl.vy=0;
  const [x,z,fx,fz]=walkSlide(ex,ez,pl.vx*dt,pl.vz*dt,pl.feet+STEP,pl.feet+eye+.1);
  if(!fx)pl.vx=0;if(!fz)pl.vz=0;
  setEye(x,pl.feet+eye,z);
}
preHooks.push(dt=>{
  if(!walking()){pl.on=false;if(view!=='walk'){keys.clear();jumpQ=false;}if(camDrive===walkCam)camDrive=null;return;}
  walkStep(dt);camDrive=walkCam;
});

/* ---------- the mouse and the keys ---------- */
// the door or cabinet front at a point of the canvas (the middle of the screen while the mouse is taken)
function useDoor(cx,cy){
  if(cx===undefined){const rc=canvas.getBoundingClientRect();cx=rc.left+rc.width/2;cy=rc.top+rc.height/2;}
  const d=pickDoor({clientX:cx,clientY:cy});if(d){d.t=d.t!==0?0:d.max;doorsChanged();}
}
let drag=null;
canvas.addEventListener('pointerdown',e=>{
  if(!walking())return;
  // the right button gives the mouse back, as Esc does
  if(e.button===2){drag=null;if(locked()&&document.exitPointerLock)document.exitPointerLock();return;}
  if(e.button!==undefined&&e.button!==0)return;
  if(locked()){useDoor();return;}
  drag={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);
  if(e.pointerType!=='touch'&&canvas.requestPointerLock){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(err){}}
});
canvas.addEventListener('pointermove',e=>{
  if(!walking())return;
  if(locked())look(e.movementX||0,e.movementY||0);
  else if(drag&&drag.id===e.pointerId){look(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;}
});
canvas.addEventListener('pointerup',e=>{
  const d=drag;drag=null;
  // a click without a drag, the mouse not taken: the door under the cursor
  if(d&&walking()&&!locked()&&Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<6)useDoor(e.clientX,e.clientY);
});
canvas.addEventListener('pointercancel',()=>{drag=null;});
const GAME=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyC','ControlLeft','ControlRight','KeyE','ShiftLeft','ShiftRight']);
// the keys are the game's in the walk, unless typing or a slider has them. With Ctrl held the browser keeps its own shortcuts
// that a page cannot take (Ctrl+W closes the tab, Ctrl+T, Ctrl+N); the others with a game key (Ctrl+D, Ctrl+S…) are the game's
const forUs=e=>view==='walk'&&GAME.has(e.code)&&!/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test((e.target&&e.target.tagName)||'');
document.addEventListener('keydown',e=>{
  if(!forUs(e))return;e.preventDefault();
  if(!e.repeat){if(e.code==='Space')jumpQ=true;if(e.code==='KeyE'&&walking())useDoor();}
  keys.add(e.code);
});
document.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space')jumpQ=false;});
addEventListener('blur',()=>{keys.clear();jumpQ=false;});

/* ---------- what the walk shows: a ceiling (over solid walls up to it), the aim, the hint; the camera's wider angle comes and
   goes with the flight ---------- */
const ceilMat=new THREE.MeshStandardMaterial({roughness:.95,...BEHIND});   // the walls' top outlines lie on it
const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(1,1),ceilMat);
ceiling.rotation.x=Math.PI/2;ceiling.visible=false;scene.add(ceiling);   // faces down: seen from the rooms only, it casts no shadow
function placeCeiling(){ceiling.scale.set((BOX.x1-BOX.x0)*MM,(BOX.z1-BOX.z0)*MM,1);ceiling.position.set(CX,H*MM,CZ);}
placeCeiling();modelHooks.push(placeCeiling);
// the ceiling closes solid walls up to it; in the cut mode, only while the eyes are in the apartment (outside, its walls open)
function ceilingOver(){
  const V=VS.walk;if(V.Wh<100||(V.Wm!=='show'&&V.Wm!=='auto'))return false;
  if(V.Wm==='show')return true;
  const [x,,z]=eyeNow();return x>BOX.x0*MM&&x<BOX.x1*MM&&z>BOX.z0*MM&&z<BOX.z1*MM;
}
const aimEl=document.getElementById('walkAim'),hintEl=document.getElementById('walkHint');
let ownCursor=false;
frameHooks.push(()=>{
  const on=walking(),lk=locked();
  ceiling.visible=on&&ceilingOver();
  if(on){ceilMat.color.copy(wallMat.color);ceilMat.emissive.copy(wallMat.color).multiplyScalar(.3);}
  aimEl.hidden=!on;hintEl.hidden=!on||lk;
  if(!on&&lk&&document.exitPointerLock)document.exitPointerLock();
  if(on){canvas.style.cursor=lk?'none':'crosshair';ownCursor=true;}else if(ownCursor){canvas.style.cursor='';ownCursor=false;}
  const fov=FOV0+(FOV_WALK-FOV0)*presence('walk');
  if(Math.abs(camera.fov-fov)>1e-4){camera.fov=fov;camera.updateProjectionMatrix();}
});

/* ---------- the panel: the eye height (the walls and the doors are the common controls: views.js) ---------- */
const eyeIn=walkPanel.querySelector('#walkEye'),eyeOut=walkPanel.querySelector('#walkEyeOut');
function syncWalk(){eyeIn.value=VS.walk.eye;eyeOut.textContent=VS.walk.eye+' мм';}
eyeIn.addEventListener('input',e=>{VS.walk.eye=+e.target.value;syncWalk();saveView('walk');});

addView('walk',{
  rooms:'all',
  // the cut mode: as on the plan, an outer wall of the apartment hides while the eyes are outside it
  fade:Object.fromEntries(WALLS.filter(w=>w.ext).map(w=>[w.id,w.ext])),
  mouse:true,info:'walk',
  defaults:{Wm:'auto',Wh:100,dm:'closed',arcs:false,eye:1650},
  sun:()=>({x:CX,y:0,z:CZ,half:4.6}),
  panel:walkPanel,
  home:walkHome,
  sync:syncWalk
});
