/* ---------- «Обход»: the room from the eyes, walked through as in a game ----------
   W A S D or the arrows — walk (two fingers on a trackpad too: up — forward, down — back, to the sides — sideways, any angle
   between; the mouse's wheel — forward and back), the mouse — look (a click on the scene takes the mouse, Esc or the right button gives it back; where the browser
   does not let the page take it, drag to look), Space — jump, Ctrl or C — crouch, Shift — a slow step, E or a click — the door or
   cabinet front in the middle of the screen (under the cursor while dragging); the mouse taken, the button held HOLD_MS moves it
   gradually, as a long press in the other views, a shorter press opens or closes it on release. On a touch screen a finger in the lower left corner of
   the scene (a square of STICK_ZONE of its width) holds a stick (the circle comes under it): the farther from its centre, the
   faster the walk; elsewhere a finger looks; a tap is the door under the finger. The panel sets the eye height, the walls' look, the doors, and has the common wall colour (with
   the outlines) and light.
   The camera is the orbit's, its centre a step (LOOK) in front of the eyes: a flight to the walk and from it, and the camera
   remembered for the view, work as in any view. Walls (however they look) and the closed door stop the walker;
   with «Без двери» the doorway is free */
const walkPanel=document.querySelector('[data-panel="walk"]');
const LOOK=1;                       // m: the orbit's centre in front of the eyes
const BODY=.15;                     // m: the walker seen from above is a circle of this radius (a person turned sideways)
const STEP=.3;                      // m: what is lower than this above the feet is stepped over (plinths, a low sill)
const RUN=2.4,SLOW=1.2,LOW=.9;      // m/s: walking, with Shift, crouching
const JUMP=3.3,GRAV=12;             // m/s, m/s²: a jump of about 45 cm
const CROUCH_K=.32;                 // crouching lowers the eyes by this share
const OPEN_A=1;                     // rad: a door open this far lets the walker through
const SENS=.0025;                   // rad per pixel of the mouse
const SENS_TOUCH=2;                 // a finger turns the eyes this many times more: a phone's screen is small
const FOV0=camera.fov,FOV_WALK=62;  // the walk sees wider, like a game
/* the trackpad: what two fingers moved (the wheel's delta) is a way to go in the eyes' frame, PAD m per pixel, gone at the gait's
   speed and no more than PAD_LAG s of it behind (the rest of a fast swipe and of the system's glide is dropped) */
const PAD=.004,PAD_LAG=.15;
const pad={f:0,s:0};                // m still to go: forward, to the right

const keys=new Set();let jumpQ=false;
/* the stick of a touch screen: the finger's offset from where it came down, a share of STICK_R; a little of it (STICK_DEAD) is
   no step yet, so a tap does not walk */
const STICK_R=48,STICK_DEAD=.15;    // px (the circle's radius in the page), share
const STICK_ZONE=.33;               // the stick's corner: a square this share of the scene's width (no taller than the scene)
let stick=null;                     // {id, x0, y0: where the finger came down, x, y: where it is} (client px)
let touchUI=!!(window.matchMedia&&matchMedia('(hover: none) and (pointer: coarse)').matches),stickUsed=false;
function stickOff(){   // the knob's offset, px, no farther than the circle
  if(!stick)return [0,0];
  const dx=stick.x-stick.x0,dy=stick.y-stick.y0,m=Math.hypot(dx,dy),k=m>STICK_R?STICK_R/m:1;
  return [dx*k,dy*k];
}
function stickVec(){   // right, down: 0…1 together
  const [dx,dy]=stickOff(),m=Math.hypot(dx,dy)/STICK_R;
  if(m<STICK_DEAD)return [0,0];
  const k=(m-STICK_DEAD)/(1-STICK_DEAD)/m/STICK_R;
  return [dx*k,dy*k];
}
const pl={on:false,feet:0,vy:0,c:0,vx:0,vz:0};   // the walker: feet above the floor (m), vertical speed, crouch 0…1, speed (m/s)
const walking=()=>view==='walk'&&!inTransition();
const locked=()=>!!document.pointerLockElement&&document.pointerLockElement===canvas;

/* the eyes: where the orbit puts the camera (goal), and back */
const lookDir=()=>{const sp=Math.sin(goal.phi);return [sp*Math.sin(goal.theta),Math.cos(goal.phi),sp*Math.cos(goal.theta)];};
function eyeNow(){const d=lookDir();return [goalT.x+goal.r*d[0],goalT.y+goal.r*d[1],goalT.z+goal.r*d[2]];}
function setEye(x,y,z){const d=lookDir();goalT.set(x-goal.r*d[0],y-goal.r*d[1],z-goal.r*d[2]);}
// the eye height standing (m): as set, low enough for a jump under the ceiling
const eyeH=()=>Math.min(VS.walk.eye*MM,H*MM-.6);
function look(dx,dy,k=1){
  const e=eyeNow();
  goal.theta-=dx*SENS*k;goal.phi=Math.min(Math.PI-.08,Math.max(.08,goal.phi-dy*SENS*k));
  setEye(...e);
}
/* the first visit: in the room a step from the door, in the middle of the doorway, looking toward the window */
function walkHome(){goal.theta=Math.PI;goal.phi=Math.PI/2;goal.r=LOOK;setEye((dA+dB)/2*MM,eyeH(),.6);shortWay();}

/* ---------- what is in the way, m: [x0,x1,z0,z1,y0,y1] ----------
   The walls without their openings (rebuilt with the sizes); a window is not a way through; a door opening is while its door
   is open; the wardrobe, the sofa */
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
    if(end>cur)wallBoxes.push(box(cur,end,0,w.h||H));   // a low wall (the shower step) is lower than STEP: stepped over
  });
}
walkWalls();modelHooks.push(walkWalls);
function walkObstacles(){
  const shut=new Set(VS.walk.dm==='none'?[]:doors.filter(d=>d.a<OPEN_A).map(d=>d.hole));
  return wallBoxes.concat(doorways.filter(w=>shut.has(w.hole)).map(w=>w.b),wardrobeBoxes(),sofaBoxes());
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
const gait=()=>pl.c>.5?LOW:keys.has('ShiftLeft')||keys.has('ShiftRight')?SLOW:RUN;   // m/s
function walkStep(dt){
  const [ex,,ez]=eyeNow();goal.r=LOOK;
  if(!pl.on){Object.assign(pl,{on:true,feet:0,vy:0,c:0,vx:0,vz:0});pad.f=pad.s=0;}
  pl.c+=(Math.max(keyOn('KeyC'),keyOn('ControlLeft'),keyOn('ControlRight'))-pl.c)*Math.min(1,dt*10);
  const eye=eyeH()*(1-CROUCH_K*pl.c),ground=pl.feet<=0;
  // where the keys and the stick lead, at the speed of the gait (the stick: its share of it); on the ground the speed follows at
  // once, in the air hardly
  const [sx,sy]=stickVec();
  const f=Math.max(keyOn('KeyW'),keyOn('ArrowUp'))-Math.max(keyOn('KeyS'),keyOn('ArrowDown'))-sy,s=Math.max(keyOn('KeyD'),keyOn('ArrowRight'))-Math.max(keyOn('KeyA'),keyOn('ArrowLeft'))+sx;
  const th=goal.theta;let wx=-Math.sin(th)*f+Math.cos(th)*s,wz=-Math.cos(th)*f-Math.sin(th)*s;
  const n=Math.hypot(wx,wz),top=gait()*Math.min(1,n);
  if(n){wx*=top/n;wz*=top/n;}
  const a=Math.min(1,dt*(ground?20:2));pl.vx+=(wx-pl.vx)*a;pl.vz+=(wz-pl.vz)*a;
  if(ground&&jumpQ){pl.vy=JUMP;jumpQ=false;}
  pl.vy-=GRAV*dt;pl.feet=Math.max(0,pl.feet+pl.vy*dt);if(pl.feet===0&&pl.vy<0)pl.vy=0;
  // the trackpad's way: a step of it at the gait's speed, on top of the keys'
  let px=0,pz=0;const pm=Math.hypot(pad.f,pad.s);
  if(pm>1e-9){
    const g=gait(),lag=Math.min(pm,g*PAD_LAG),k=Math.min(lag,g*dt)/pm,f=pad.f*k,s=pad.s*k;
    pad.f=pad.f*lag/pm-f;pad.s=pad.s*lag/pm-s;
    px=-Math.sin(th)*f+Math.cos(th)*s;pz=-Math.cos(th)*f-Math.sin(th)*s;
  }
  const [x,z,fx,fz]=walkSlide(ex,ez,pl.vx*dt+px,pl.vz*dt+pz,pl.feet+STEP,pl.feet+eye+.1);
  if(!fx)pl.vx=0;if(!fz)pl.vz=0;if(!fx||!fz)pad.f=pad.s=0;   // into something: what is left of the swipe does not push on
  setEye(x,pl.feet+eye,z);
}
preHooks.push(dt=>{
  if(!walking()){letGo();pl.on=false;pad.f=pad.s=0;if(view!=='walk'){keys.clear();jumpQ=false;stick=null;}if(camDrive===walkCam)camDrive=null;return;}
  // the button held long enough takes the door in the aim (none there: nothing, till the button is up)
  if(press&&!press.long&&(press.s+=dt)>=HOLD_MS/1000){
    press.long=true;const rc=canvas.getBoundingClientRect();
    press.d=pickDoor({clientX:rc.left+rc.width/2,clientY:rc.top+rc.height/2});if(press.d)holdDoor(press.d);
  }
  walkStep(dt);camDrive=walkCam;
});

/* ---------- the mouse and the keys ---------- */
// the door or cabinet front at a point of the canvas (the middle of the screen while the mouse is taken), or an item with a click of its own
function useDoor(cx,cy){
  if(cx===undefined){const rc=canvas.getBoundingClientRect();cx=rc.left+rc.width/2;cy=rc.top+rc.height/2;}
  clickAt({clientX:cx,clientY:cy});
}
let drag=null;
let press=null;   // the left button down while the mouse is taken: {s: seconds down, long: held HOLD_MS, d: the door in the aim then}
function letGo(){const p=press;press=null;if(p&&p.d){if(held&&held.d===p.d)held=null;doorsChanged();}}
canvas.addEventListener('pointerdown',e=>{
  if(!walking())return;
  // a finger in the lower left corner holds the stick (one at a time); elsewhere it looks, as the mouse drags
  if(e.pointerType==='touch'){
    touchUI=true;const rc=canvas.getBoundingClientRect(),side=Math.min(rc.width*STICK_ZONE,rc.height);
    if(!stick&&e.clientX<rc.left+side&&e.clientY>rc.top+rc.height-side){stick={id:e.pointerId,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);return;}
  }else if(e.pointerType==='mouse')touchUI=false;
  // the right button gives the mouse back, as Esc does
  if(e.button===2){drag=null;if(locked()&&document.exitPointerLock)document.exitPointerLock();return;}
  if(e.button!==undefined&&e.button!==0)return;
  if(locked()){letGo();press={s:0,long:false,d:null};return;}
  drag={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,id:e.pointerId,k:e.pointerType==='touch'?SENS_TOUCH:1};canvas.setPointerCapture(e.pointerId);
  if(e.pointerType!=='touch'&&canvas.requestPointerLock){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(err){}}
});
canvas.addEventListener('pointermove',e=>{
  if(!walking())return;
  if(stick&&stick.id===e.pointerId){stick.x=e.clientX;stick.y=e.clientY;if(Math.hypot(stick.x-stick.x0,stick.y-stick.y0)>=6)stickUsed=true;return;}
  if(locked())look(e.movementX||0,e.movementY||0);
  else if(drag&&drag.id===e.pointerId){look(e.clientX-drag.x,e.clientY-drag.y,drag.k);drag.x=e.clientX;drag.y=e.clientY;}
});
// each finger ends its own: the stick's going leaves the look going on, and back
canvas.addEventListener('pointerup',e=>{
  // the button down while the mouse was taken: a held door is let go, a short press is a click (unless Esc gave the mouse back)
  if(press&&(e.button===undefined||e.button===0)){const short=!press.long;letGo();if(short&&locked())useDoor();return;}
  // a click or a tap without a move, the mouse not taken: the door under the cursor or the finger
  const tap=d=>d&&walking()&&!locked()&&Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<6&&useDoor(e.clientX,e.clientY);
  if(stick&&stick.id===e.pointerId){const d=stick;stick=null;tap(d);return;}
  if(drag&&drag.id!==e.pointerId)return;
  const d=drag;drag=null;tap(d);
});
canvas.addEventListener('pointercancel',e=>{
  letGo();
  if(stick&&stick.id===e.pointerId)stick=null;else if(!drag||drag.id===e.pointerId)drag=null;
});
const GAME=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyC','ControlLeft','ControlRight','KeyE','ShiftLeft','ShiftRight']);
// the keys are the game's in the walk, unless typing or a slider has them. With Ctrl held the browser keeps its own shortcuts
// that a page cannot take (Ctrl+W closes the tab, Ctrl+T, Ctrl+N); the others with a game key (Ctrl+D, Ctrl+S…) are the game's
const forUs=e=>view==='walk'&&GAME.has(e.code)&&!/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test((e.target&&e.target.tagName)||'');
document.addEventListener('keydown',e=>{
  if(!forUs(e))return;e.preventDefault();
  if(!e.repeat){if(e.code==='Space')jumpQ=true;if(e.code==='KeyE'&&walking())useDoor();}
  keys.add(e.code);
});
/* two fingers on a trackpad (the wheel): with natural scrolling fingers up give deltaY > 0 — forward, fingers to the right give
   deltaX < 0 — to the right. A pinch comes as the wheel with Ctrl: nothing. The page's scroll and the swipe back in the history
   are held off (engine.js) */
canvas.addEventListener('wheel',e=>{
  if(!walking()||e.ctrlKey)return;
  const k=PAD*(e.deltaMode===1?16:e.deltaMode===2?400:1);
  pad.f+=(e.deltaY||0)*k;pad.s-=(e.deltaX||0)*k;
},{passive:false});
document.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space')jumpQ=false;});
addEventListener('blur',()=>{keys.clear();jumpQ=false;});

/* ---------- what the walk shows: a ceiling (over solid walls up to it), the aim, the hint; the camera's wider angle comes and
   goes with the flight ---------- */
const ceilMat=new THREE.MeshStandardMaterial({roughness:.95,...BEHIND});   // the walls' top outlines lie on it
const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(1,1),ceilMat);
ceiling.rotation.x=Math.PI/2;ceiling.visible=false;scene.add(ceiling);   // faces down: seen from the rooms only, it casts no shadow
function placeCeiling(){ceiling.scale.set((BOX.x1-BOX.x0)*MM,(BOX.z1-BOX.z0)*MM,1);ceiling.position.set(CX,H*MM,CZ);}
placeCeiling();modelHooks.push(placeCeiling);
// the ceiling closes solid walls up to it; in the cut mode, only while the eyes are in the room (outside, its walls open)
function ceilingOver(){
  const V=VS.walk;if(V.Wh<100||(V.Wm!=='show'&&V.Wm!=='auto'))return false;
  if(V.Wm==='show')return true;
  const [x,,z]=eyeNow();return x>BOX.x0*MM&&x<BOX.x1*MM&&z>BOX.z0*MM&&z<BOX.z1*MM;
}
const aimEl=document.getElementById('walkAim'),hintEl=document.getElementById('walkHint');
const stickEl=document.getElementById('walkStick'),knobEl=stickEl.querySelector('i');
const HINT={mouse:hintEl.textContent,touch:hintEl.dataset.touch};
let ownCursor=false,hintFor='mouse';
// the stick: on a touch screen only; under the finger while held, else faint at its home in the lower left (the «i» hides there)
function showStick(on){
  stickEl.hidden=!on||!touchUI;if(stickEl.hidden)return;
  const rc=canvas.getBoundingClientRect(),[dx,dy]=stickOff();
  const x=stick?stick.x0-rc.left:20+STICK_R,y=stick?stick.y0-rc.top:rc.height-20-STICK_R;
  stickEl.style.left=x+'px';stickEl.style.top=y+'px';knobEl.style.transform=`translate(${dx}px,${dy}px)`;
  stickEl.className=stick?'stick on':'stick';
}
frameHooks.push(()=>{
  const on=walking(),lk=locked();
  ceiling.visible=on&&ceilingOver();
  if(on){ceilMat.color.copy(ceilColor);ceilMat.emissive.copy(ceilColor).multiplyScalar(.3);}   // white, whatever the walls' paint
  // the hint: how to take the mouse, or on a touch screen how to walk, till the stick has once walked
  const hf=touchUI?'touch':'mouse';if(hf!==hintFor){hintFor=hf;hintEl.textContent=HINT[hf];}
  aimEl.hidden=!on;hintEl.hidden=!on||lk||touchUI&&stickUsed;showStick(on);
  // the walk on a touch screen: no «i» (its hint is the keys' and the mouse's; the stick has its place) and no mini view
  const bare=view==='walk'&&touchUI;infoBtn.hidden=camBtn.hidden=bare;if(bare&&showDebug)camBtn.click();
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
  // the cut mode: as on the plan, a wall hides while the eyes are outside it
  fade:Object.fromEntries(WALLS.filter(w=>w.ext).map(w=>[w.id,w.ext])),
  mouse:true,info:'walk',
  defaults:{Wm:'auto',Wh:100,dm:'closed',arcs:false,eye:1650},
  sun:()=>({x:CX,y:0,z:CZ,half:4.6}),
  panel:walkPanel,
  home:walkHome,
  sync:syncWalk
});
