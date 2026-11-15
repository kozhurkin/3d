/* ---------- engine: renderer, scene, light, orbit camera, camera debug, render loop ----------
   One scene for every tab. Other modules hook into the loop through frameHooks (called after the camera moves). */
const MM=.001;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the apartment as built now (js/apartment.js) ----------
   Its sizes are edited on the plan: setModel() swaps the model, then modelHooks rebuild what depends on it
   (walls, doors, floors, dimensions…). The sizes remembered in this browser (apt-model-v1) are the ones to start with. */
let A,H,hLen,kZ0,kZ1,xL,xB1,zB0,zEnd,winX,zV0,bx,bz,WALLS,ROOMS,BOX,CX,CZ;
const MKEY='apt-model-v1';
const modelHooks=[];
function useModel(a){
  ({A,H,hLen,kZ0,kZ1,xL,xB1,zB0,zEnd,winX,zV0,bx,bz,WALLS,ROOMS,BOX}=apartment(a));
  CX=(BOX.x0+BOX.x1)/2*MM;CZ=(BOX.z0+BOX.z1)/2*MM;
}
function setModel(a){useModel(a);modelHooks.forEach(f=>f());}
// only the sizes that differ from the defaults, so a later change of a default still reaches the sizes nobody touched
const modelDiff=()=>Object.fromEntries(Object.entries(A).filter(([k,v])=>APT_A[k]!==v));
useModel((()=>{try{const a=JSON.parse(localStorage.getItem(MKEY)||'null');if(a&&!aptProblems(a).length)return a;}catch(e){}return {};})());

/* ---------- three setup ---------- */
const canvas=document.getElementById('c'), viewer=document.getElementById('viewer');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.localClippingEnabled=true;   // furniture is clipped at the floor and on the plan at the walls' height (furniture.js: furnClip)
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,1,0.01,200);
const hemi=new THREE.HemisphereLight(0xffffff,0x8a7f70,0.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0005;
Object.assign(sun.shadow.camera,{left:-4.6,right:4.6,top:4.6,bottom:-4.6,near:.5,far:30});   // covers the whole apartment from any direction
sun.target.position.set(CX,0,CZ);   // the view sets where the sun aims; the light settings are shared by all views
scene.add(sun);scene.add(sun.target);
// sun around its target: az — from +z (window side) toward +x, el — above the horizon.
// Defaults and 100 % match the room tabs, so the walls have the same tone there and here
const LIGHT0={az:-35,el:45,i:100,a:100};
function placeSun(){
  const L=S.light,a=L.az*Math.PI/180,e=L.el*Math.PI/180,R=10,c=sun.target.position;
  sun.position.set(c.x+R*Math.cos(e)*Math.sin(a),R*Math.sin(e),c.z+R*Math.cos(e)*Math.cos(a));
  sun.intensity=L.i/100;hemi.intensity=.75*L.a/100;
}

/* theme colors for the scene (applyTheme lives in walls.js, loaded later) */
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim();}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyTheme());
new MutationObserver(()=>applyTheme()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

/* ---------- orbit ---------- */
const cam={theta:-.5,phi:.9,r:8,target:new THREE.Vector3(CX,0,CZ)};
const goal={theta:-.5,phi:.9,r:8};
const goalT=new THREE.Vector3(CX,0,CZ);
// turn toward the goal angle the short way round
// where the camera stands once it reaches its goal (m)
function goalPosition(){const sp=Math.sin(goal.phi);return new THREE.Vector3(goalT.x+goal.r*sp*Math.sin(goal.theta),goalT.y+goal.r*Math.cos(goal.phi),goalT.z+goal.r*sp*Math.cos(goal.theta));}
function shortWay(){
  while(goal.theta-cam.theta>Math.PI)goal.theta-=2*Math.PI;
  while(cam.theta-goal.theta>Math.PI)goal.theta+=2*Math.PI;
}
const ptrs=new Map();let pinch0=0;
const _r=new THREE.Vector3(),_u=new THREE.Vector3();
function pan(dx,dy){
  const k=2*cam.r*Math.tan(camera.fov*Math.PI/360)/viewer.clientHeight;
  _r.setFromMatrixColumn(camera.matrixWorld,0);_u.setFromMatrixColumn(camera.matrixWorld,1);
  cam.target.addScaledVector(_r,-dx*k).addScaledVector(_u,dy*k);goalT.copy(cam.target);
}
let downAt=null;
// a view that takes the mouse itself (the walk, walk.js): no orbit, pan, zoom or door clicks of its own here
const ownMouse=()=>!!(VIEWS[view]&&VIEWS[view].mouse);
// long press on a door moves it gradually: closed → opens, fully open → closes, part-open → reverses the last direction
// (at 60°/s, or at the door's own holdRate per second if it has one)
const HOLD_MS=500,HOLD_RATE=60*Math.PI/180;let held=null,holdTimer=null;
function holdDoor(d){const dir=d.a<=.01?1:d.a>=d.max-.01?-1:-(d.last||-1);d.last=dir;held={d,dir};d.t=d.a;}
canvas.addEventListener('pointerdown',e=>{
  if(ownMouse())return;
  if(e.pointerType==='mouse'&&e.button!==0&&e.button!==1&&e.button!==2)return;
  downAt=e.button===0&&!e.shiftKey&&ptrs.size===0?{x:e.clientX,y:e.clientY}:null;
  clearTimeout(holdTimer);
  if(downAt){const d0=downAt;holdTimer=setTimeout(()=>{
    if(downAt!==d0||ptrs.size>1)return;
    const d=pickDoor({clientX:d0.x,clientY:d0.y});if(!d)return;
    holdDoor(d);canvas.style.cursor='grabbing';
  },HOLD_MS);}
  if(e.button===1)e.preventDefault();
  canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:e.button===1||e.button===2});
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);}
});
canvas.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId)||ownMouse())return;const pr=ptrs.get(e.pointerId),dx=e.clientX-pr.x,dy=e.clientY-pr.y;
  if(!held&&downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)>=6)clearTimeout(holdTimer);
  if(held){ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:pr.pan});return;}
  if(ptrs.size>=1)camDrive=null;   // the user takes the camera back from a flight between views
  if(ptrs.size===1){
    if(e.shiftKey||pr.pan)pan(dx,dy);
    else{goal.theta-=dx*.006;goal.phi=Math.min(1.62,Math.max(.0005,goal.phi-dy*.006));}
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:pr.pan});
  }else if(ptrs.size===2){
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    pan(dx/2,dy/2);
    const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0){goal.r=Math.min(30,Math.max(0.3,goal.r*pinch0/d));}pinch0=d;
  }
});
const lost=e=>{ptrs.delete(e.pointerId);pinch0=0;};
// a click (no drag) on a door leaf opens or closes that door; on an item with a click of its own, it does that
// what is under the cursor: the nearest visible surface, or null (also while flying between views: nothing to point at)
function hitAt(e){
  if(inTransition())return null;
  const rc=canvas.getBoundingClientRect();
  ndc.set((e.clientX-rc.left)/rc.width*2-1,-(e.clientY-rc.top)/rc.height*2+1);
  ray.setFromCamera(ndc,camera);
  return ray.intersectObjects(scene.children,true).find(hittable)||null;
}
function pickDoor(e,hit){
  const h=hit===undefined?hitAt(e):hit;
  if(!h)return null;
  // a door of the apartment (the leaf, its handles or the entrance frame) or a cabinet front of any room in the scene
  // (the plan shows them all; a hidden room is never hit)
  const fd=Object.values(VIEWS).flatMap(v=>v.furniture?v.furniture().doors:[]);
  // the door keeps where it was hit (d.hit, the scene's m): the washing machine's opens toward that side
  for(let o=h.object;o;o=o.parent){const d=doors.find(d=>d.g===o||d.frame===o)||fd.find(d=>d.g===o);if(d){d.hit=h.point;return d;}}
  return null;
}
// an item that does something of its own on a click, not a door (userData.click: the kitchen's pendant lamp changes its model), under a hit
function clickOf(h){for(let o=h&&h.object;o;o=o.parent){const c=o.userData&&o.userData.click;if(typeof c==='function')return c;}return null;}
// a click at a point of the canvas: the door there opens or closes, or the item there does what it does
function clickAt(e){const h=hitAt(e),d=pickDoor(e,h);if(d){d.t=d.t!==0?0:d.max;doorsChanged();return;}const c=clickOf(h);if(c)c();}
canvas.addEventListener('pointerup',e=>{
  if(ownMouse()&&!ptrs.has(e.pointerId))return;   // the walk's own press (a door it holds is its to let go)
  clearTimeout(holdTimer);
  if(held){held=null;canvas.style.cursor='';doorsChanged();downAt=null;lost(e);return;}
  if(downAt&&ptrs.size===1&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<6){
    clickAt(e);
  }
  downAt=null;lost(e);
});
canvas.addEventListener('pointermove',e=>{if(ptrs.size===0&&!ownMouse()){const h=hitAt(e);canvas.style.cursor=pickDoor(e,h)||clickOf(h)?'pointer':'';itemHover(h&&infoOf(h.object),e);}});
canvas.addEventListener('pointerleave',()=>itemHover(null));canvas.addEventListener('pointercancel',lost);canvas.addEventListener('lostpointercapture',lost);
canvas.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
// wheel zooms toward the point under the cursor (surface hit, or the plane through the pivot)
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
const _zp=new THREE.Vector3(),_pl=new THREE.Plane(),_n=new THREE.Vector3();
const shown=o=>{while(o){if(!o.visible)return false;o=o.parent;}return true;};
// what the cursor can hit: a visible surface (not a line, a label, or a wall turned see-through in the skeleton mode)
const seeThrough=m=>Array.isArray(m)?m.every(seeThrough):!!m&&m.opacity===0;
const hittable=h=>!(h.object.isLine||h.object.isSprite)&&shown(h.object)&&!seeThrough(h.object.material);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();if(ownMouse())return;camDrive=null;
  const r0=cam.r,r1=Math.min(30,Math.max(.3,r0*(1+Math.max(-.5,Math.min(.5,e.deltaY*.0012)))));
  const rc=canvas.getBoundingClientRect();
  ndc.set((e.clientX-rc.left)/rc.width*2-1,-(e.clientY-rc.top)/rc.height*2+1);
  ray.setFromCamera(ndc,camera);
  const hit=ray.intersectObjects(scene.children,true).find(hittable);
  if(hit)_zp.copy(hit.point);
  else{camera.getWorldDirection(_n);_pl.setFromNormalAndCoplanarPoint(_n,cam.target);if(!ray.ray.intersectPlane(_pl,_zp))_zp.copy(cam.target);}
  cam.target.lerp(_zp,1-r1/r0);goalT.copy(cam.target);
  cam.r=goal.r=r1;
},{passive:false});

function resize(){const w=viewer.clientWidth,h=viewer.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewer);

/* ---------- camera debug: pivot gizmo + overview inset (as in the room tabs) ---------- */
let showDebug=false;
const noRay=o=>{o.traverse(c=>{c.raycast=()=>{};});return o;};
const dbg=new THREE.Group();dbg.visible=false;scene.add(dbg);
// pivot gizmo (visible in the main view): XYZ axes + sphere, always on top
const pivot=new THREE.Group();
[[0xd9483b,[1,0,0]],[0x3f9b4f,[0,1,0]],[0x3b6fd9,[0,0,1]]].forEach(([c,v])=>{
  const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(...v).multiplyScalar(.25)]);
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:c,depthTest:false}));l.renderOrder=30;pivot.add(l);
});
const pivDot=new THREE.Mesh(new THREE.SphereGeometry(.022,16,12),new THREE.MeshBasicMaterial({color:0xffb300,depthTest:false}));pivDot.renderOrder=31;pivot.add(pivDot);
dbg.add(noRay(pivot));
// camera body, view frustum and view vector (only in the inset, layer 1)
const DBG_COL=0xff6a00;
const camBody=new THREE.Mesh(new THREE.ConeGeometry(.09,.22,4),new THREE.MeshBasicMaterial({color:DBG_COL}));
camBody.geometry.rotateX(-Math.PI/2);
const viewLine=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,10),new THREE.MeshBasicMaterial({color:DBG_COL,depthTest:false}));viewLine.renderOrder=40;
const frus=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Array(16*3).fill(0),3)),new THREE.LineBasicMaterial({color:DBG_COL,depthTest:false}));frus.renderOrder=41;
const frusFill=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Array(12*3).fill(0),3)),new THREE.MeshBasicMaterial({color:DBG_COL,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false,depthTest:false}));frusFill.renderOrder=39;
[camBody,viewLine,frus,frusFill].forEach(o=>{o.layers.set(1);o.frustumCulled=false;dbg.add(noRay(o));});
const ovCam=new THREE.PerspectiveCamera(36,1.4,.05,200);ovCam.layers.enableAll();
// the overview looks at the apartment from above, from the window side (like the «Весь план» view)
const _oc=new THREE.Vector3(),_od=new THREE.Vector3(.25,1.5,1).normalize(),_ov=new THREE.Vector3(),_oup=new THREE.Vector3(0,1,0),_oq=new THREE.Quaternion();
const apt=new THREE.Box3(new THREE.Vector3(BOX.x0*MM,0,BOX.z0*MM),new THREE.Vector3(BOX.x1*MM,H*MM,BOX.z1*MM)),_osz=new THREE.Vector3();
function updateDebug(){
  pivot.position.copy(cam.target);
  const ps=Math.max(.4,cam.r*.25);pivot.children.forEach(c=>c.scale.setScalar(ps));
  // mini view frames the apartment itself, not the camera
  apt.getCenter(_oc);apt.getSize(_osz);
  let rad=Math.max(.6,_osz.length()/2);
  // include the main camera when it is reasonably close; if it is far, keep the plan large and show an arrow instead
  _ov.subVectors(camera.position,_oc);const cd=_ov.length(),reach=Math.min(cd,rad*2.2);
  if(reach>rad){_oc.addScaledVector(_ov.normalize(),(reach-rad)/2);rad=(reach+rad)/2+.15;}
  const dist=rad/Math.sin(ovCam.fov*Math.PI/360)*1.02;
  ovCam.position.copy(_oc).addScaledVector(_od,dist);ovCam.lookAt(_oc);
  // camera body sized to the plan, so it is always readable
  const k=rad*.32;
  camBody.position.copy(camera.position);camBody.lookAt(cam.target);camBody.scale.setScalar(k);
  // thick view vector: a thin cylinder from the camera to the pivot
  _ov.subVectors(cam.target,camera.position);const len=_ov.length();
  viewLine.position.copy(camera.position).addScaledVector(_ov,.5);
  _oq.setFromUnitVectors(_oup,_ov.clone().normalize());viewLine.quaternion.copy(_oq);
  viewLine.scale.set(rad*.012,len,rad*.012);
  // view frustum: what the main camera sees, drawn out to the pivot distance
  const fd=Math.min(len,rad*.5),hh=Math.tan(camera.fov*Math.PI/360)*fd,hw=hh*camera.aspect;
  const corn=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>new THREE.Vector3(x*hw,y*hh,-fd).applyMatrix4(camera.matrixWorld));
  const o=camera.position,fp=frus.geometry.attributes.position;let i=0;
  const put=v=>{fp.setXYZ(i++,v.x,v.y,v.z);};
  corn.forEach(c=>{put(o);put(c);});corn.forEach((c,j)=>{put(c);put(corn[(j+1)%4]);});fp.needsUpdate=true;
  const ff=frusFill.geometry.attributes.position;i=0;
  corn.forEach((c,j)=>{const n=corn[(j+1)%4];[o,c,n].forEach(v=>{ff.setXYZ(i++,v.x,v.y,v.z);});});ff.needsUpdate=true;
  // arrow at the edge of the mini view when the camera is outside its frame
  ovCam.updateMatrixWorld();_ov.copy(camera.position).project(ovCam);
  const behind=_ov.z>1,out=behind||Math.abs(_ov.x)>.92||Math.abs(_ov.y)>.92;
  camArrow.hidden=!out;
  if(out){let x=_ov.x,y=_ov.y;if(behind){x=-x;y=-y;}const m=Math.max(Math.abs(x),Math.abs(y))||1;x/=m;y/=m;
    camArrow.style.left=(50+x*44)+'%';camArrow.style.top=Math.min(74,Math.max(8,50-y*44))+'%';
    camArrow.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(-y,x)}rad)`;}
  const f=v=>v.toFixed(2).replace('.',',')+' м';
  const t=`<i>До точки</i><em>${f(cam.r)}</em><i>· Высота</i><em>${f(camera.position.y)}</em>`;
  if(t!==distTxt){distTxt=t;distEl.innerHTML=t;}
}
const inset=document.createElement('div');inset.className='inset';inset.hidden=true;inset.innerHTML='<canvas class="inset-cv"></canvas><b class="dist"></b><i class="cam-arrow" hidden title="Камера за пределами мини-вида"></i>';viewer.appendChild(inset);
const camArrow=inset.querySelector('.cam-arrow');
const insetCv=inset.querySelector('.inset-cv');
const insetR=new THREE.WebGLRenderer({canvas:insetCv,antialias:true});
insetR.setPixelRatio(Math.min(devicePixelRatio,2));insetR.outputEncoding=renderer.outputEncoding;insetR.toneMapping=renderer.toneMapping;insetR.toneMappingExposure=renderer.toneMappingExposure;insetR.shadowMap.enabled=true;
const distEl=inset.querySelector('.dist');let distTxt='';
// the sun and the mini view follow the view on screen (views.js: aimView)
let sunHalf=4.6;   // half the side of the square the shadows cover, m
function aimSun(x,y,z,half){
  sun.target.position.set(x,y,z);sunHalf=half;
  Object.assign(sun.shadow.camera,{left:-half,right:half,top:half,bottom:-half});sun.shadow.camera.updateProjectionMatrix();
  placeSun();
}
const camBtn=document.getElementById('camBtn');
camBtn.addEventListener('click',()=>{showDebug=!showDebug;camBtn.setAttribute('aria-expanded',showDebug);dbg.visible=showDebug;inset.hidden=!showDebug;viewer.classList.toggle('dbg-on',showDebug);});

const infoBtn=document.getElementById('infoBtn');
infoBtn.addEventListener('click',()=>infoBtn.setAttribute('aria-expanded',infoBtn.getAttribute('aria-expanded')!=='true'));
document.addEventListener('keydown',e=>{if(e.key==='Escape')infoBtn.setAttribute('aria-expanded','false');});

/* ---------- what a thing is: the cursor resting on something that knows it (userData.info on it or up its parents, or on its
   part: {title, lines} or a function giving them) brings up an «i» by the cursor; a click on it opens a short card.
   With the mouse in the views that orbit (the walk keeps the mouse to itself); the camera moving takes the «i» away ---------- */
const ITEM_REST=700,ITEM_GRACE=600;
const itemDot=document.getElementById('itemDot'),itemCard=document.getElementById('itemCard');
let itemTimer=null,itemHide=null,itemInfo=null,itemCam=null;
function infoOf(o){
  for(let n=0;o&&n<40;o=o.parent,n++){const u=o.userData;if(!u)continue;
    for(const v of [u.info,u.part&&u.part.info]){const i=typeof v==='function'?v():v;if(i&&typeof i.title==='string')return i;}}
  return null;
}
function hideItemDot(){clearTimeout(itemHide);itemHide=null;itemDot.hidden=true;itemInfo=null;}
function closeItemCard(){itemCard.hidden=true;}
// the «i» for info at x, y (px in the scene), a little up and right of the cursor, inside the scene
function showItemDot(info,x,y){
  clearTimeout(itemHide);itemHide=null;itemInfo=info;itemCam=camera.position.clone();
  itemDot.style.left=Math.max(4,Math.min(viewer.clientWidth-28,x+10))+'px';itemDot.style.top=Math.max(4,Math.min(viewer.clientHeight-28,y-30))+'px';
  itemDot.title=info.title;itemDot.hidden=false;
}
function itemHover(info,e){
  clearTimeout(itemTimer);
  if(info&&itemInfo&&info.title===itemInfo.title){clearTimeout(itemHide);itemHide=null;return;}   // still on it: the «i» stays where it came up
  if(itemInfo&&!itemHide)itemHide=setTimeout(hideItemDot,ITEM_GRACE);   // time to reach the «i»
  if(!info||!e)return;
  const rc=viewer.getBoundingClientRect(),x=e.clientX-rc.left,y=e.clientY-rc.top;
  itemTimer=setTimeout(()=>showItemDot(info,x,y),ITEM_REST);   // every move starts the wait again: it comes when the cursor rests
}
itemDot.addEventListener('pointerenter',()=>{clearTimeout(itemHide);itemHide=null;});
itemDot.addEventListener('pointerleave',()=>{if(!itemDot.hidden)itemHide=setTimeout(hideItemDot,ITEM_GRACE);});
// the card: the title and a few lines, next to the «i», inside the scene
function openItemCard(info){
  itemCard.innerHTML='';
  const x=document.createElement('button');x.className='x';x.setAttribute('aria-label','Закрыть');x.textContent='×';x.addEventListener('click',closeItemCard);
  const h=document.createElement('h3');h.textContent=info.title;itemCard.appendChild(x);itemCard.appendChild(h);
  (info.lines||[]).forEach(t=>{const p=document.createElement('p');p.textContent=t;itemCard.appendChild(p);});
  itemCard.hidden=false;
  const dx=parseFloat(itemDot.style.left)||0,dy=parseFloat(itemDot.style.top)||0,w=itemCard.offsetWidth||280,hh=itemCard.offsetHeight||120;
  itemCard.style.left=Math.max(8,Math.min(viewer.clientWidth-w-8,dx))+'px';
  itemCard.style.top=(dy+32+hh<viewer.clientHeight-8?dy+32:Math.max(8,dy-hh-8))+'px';
  hideItemDot();
}
itemDot.addEventListener('click',()=>{if(itemInfo)openItemCard(itemInfo);});
canvas.addEventListener('pointerdown',()=>{clearTimeout(itemTimer);hideItemDot();closeItemCard();});
canvas.addEventListener('wheel',()=>{clearTimeout(itemTimer);hideItemDot();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){hideItemDot();closeItemCard();}});

/* ---------- render loop ---------- */
const preHooks=[];     // (dt) => void: before the camera moves (a flight between views advances here)
const frameHooks=[];   // (dt, ease) => void: walls, doors, labels… — called every frame after the camera has moved
// the «i» belongs to where the cursor rested: the camera moving takes it away; another view takes the card away too
let itemView=null;
frameHooks.push(()=>{
  if(!itemDot.hidden&&itemCam&&camera.position.distanceTo(itemCam)>1e-4)hideItemDot();
  if(view!==itemView){itemView=view;hideItemDot();closeItemCard();}
});
let camDrive=null;     // while set, it places the camera instead of the easing toward the goal
const insetHide=[];    // objects kept out of the mini view (dimension labels are sized for the main camera)
const _d=new THREE.Vector3();
let lastT=performance.now();
function loop(){
  const now=performance.now(),dt=Math.min(.1,(now-lastT)/1000);lastT=now;
  // easing per second, not per frame: the same speed at 60 and 120 Hz (factors are per 1/120 s)
  const ease=f=>reduce?1:1-Math.pow(1-f,dt*120);
  preHooks.forEach(f=>f(dt));
  if(camDrive)camDrive();
  else{ const k=ease(.14);
    cam.theta+=(goal.theta-cam.theta)*k;cam.phi+=(goal.phi-cam.phi)*k;cam.r+=(goal.r-cam.r)*k;
    cam.target.lerp(goalT,k); }
  const sp=Math.sin(cam.phi);
  _d.set(sp*Math.sin(cam.theta),Math.cos(cam.phi),sp*Math.cos(cam.theta));
  camera.position.copy(cam.target).addScaledVector(_d,cam.r);camera.lookAt(cam.target);camera.updateMatrixWorld();
  frameHooks.forEach(f=>f(dt,ease));
  if(showDebug)updateDebug();
  renderer.render(scene,camera);
  if(showDebug){
    // the mini view has its own small canvas, so the frame can have properly rounded, clipped corners
    const w=insetCv.clientWidth,h=insetCv.clientHeight;
    if(w&&h){if(insetCv.width!==Math.round(w*insetR.getPixelRatio()))insetR.setSize(w,h,false);
      ovCam.aspect=w/h;ovCam.updateProjectionMatrix();
      const was=insetHide.map(o=>o.visible);insetHide.forEach(o=>o.visible=false);
      insetR.render(scene,ovCam);
      insetHide.forEach((o,i)=>o.visible=was[i]);}
  }
  requestAnimationFrame(loop);
}
