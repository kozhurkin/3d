/* ---------- engine: renderer, scene, light, orbit camera, camera debug, render loop ----------
   One scene for every tab. Other modules hook into the loop through frameHooks (called after the camera moves). */
const MM=.001;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the room as built now (js/apartment.js) ----------
   Its sizes are edited on the plan: setModel() swaps the model, then modelHooks rebuild what depends on it
   (walls, doors, floors, dimensions…). The sizes remembered in this browser (eng-model-v1) are the ones to start with,
   the panel's choices (eng-choice-v1, remembered as they are made) over them. */
let A,H,dA,dB,dL,winX,WALLS,ROOMS,BOX,CX,CZ;
const MKEY='eng-model-v1';
const modelHooks=[];
function useModel(a){
  ({A,H,dA,dB,dL,winX,WALLS,ROOMS,BOX}=apartment(a));
  CX=(BOX.x0+BOX.x1)/2*MM;CZ=(BOX.z0+BOX.z1)/2*MM;
}
function setModel(a){useModel(a);modelHooks.forEach(f=>f());}
// only the sizes that differ from the defaults, so a later change of a default still reaches the sizes nobody touched
const modelDiff=()=>Object.fromEntries(Object.entries(A).filter(([k,v])=>k in APT_A&&APT_A[k]!==v));   // a size the model no longer has (an old save's) is dropped
/* the panel's choices: the photo wallpaper, the false decor, the wardrobe, the sofa, the skirting board (its colour and height), the
   chandelier — remembered whenever the model changes, all of them (a default picked again must win over the remembered sizes) */
const CKEY='eng-choice-v1';
const CHOICE=['muralWall','decor','wardWall','sofaWall','plColor','plH','lamp'];
const choiceOf=a=>Object.fromEntries(CHOICE.map(k=>[k,a[k]]));
const readStore=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v&&typeof v==='object'?v:null;}catch(e){return null;}};
// the remembered choices of the same kind as the defaults (a choice the model no longer has is dropped)
const choiceSaved=()=>Object.fromEntries(Object.entries(readStore(CKEY)||{}).filter(([k,v])=>CHOICE.includes(k)&&typeof v===typeof APT_A[k]));
// the sizes with the choices over them; what does not fit is left out: the choices, then the sizes
useModel([{...readStore(MKEY),...choiceSaved()},readStore(MKEY)||{},choiceSaved()].find(a=>!aptProblems(a).length)||{});
modelHooks.push(()=>{try{localStorage.setItem(CKEY,JSON.stringify(choiceOf(A)));}catch(e){}});

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
let touchDown=false;   // the press now down is a finger's (the first one down tells): the touch mark shows
const _r=new THREE.Vector3(),_u=new THREE.Vector3(),_ad=new THREE.Vector3();
/* the target onto the view's axis at the depth of P (the camera stays where it is and looks the same way), for the camera and
   for its goal: r is then how far the camera is from P along its view. So the pan carries P with the cursor, the wheel and a pinch
   stop 0.3 m before it. P behind or at the camera: nothing. */
function anchorAt(P){
  [[cam,cam.target],[goal,goalT]].forEach(([c,t])=>{
    const sp=Math.sin(c.phi);_ad.set(sp*Math.sin(c.theta),Math.cos(c.phi),sp*Math.cos(c.theta));   // from the target to the camera
    const D=c.r-(P.x-t.x)*_ad.x-(P.y-t.y)*_ad.y-(P.z-t.z)*_ad.z;
    if(D>.05){t.addScaledVector(_ad,c.r-D);c.r=D;}
  });
}
// the distance kept in 0.3–30 m; one already past a limit (the target anchored on something nearer) only goes back toward it
const clampR=(r,r0)=>Math.min(Math.max(30,r0),Math.max(Math.min(.3,r0),r));
function pan(dx,dy){
  const k=2*cam.r*Math.tan(camera.fov*Math.PI/360)/viewer.clientHeight;
  _r.setFromMatrixColumn(camera.matrixWorld,0);_u.setFromMatrixColumn(camera.matrixWorld,1);
  cam.target.addScaledVector(_r,-dx*k).addScaledVector(_u,dy*k);goalT.copy(cam.target);
}
// what the press grabbed: the surface under the button (the orbit turns about it, the pan carries it), or null; a finger grabs nothing
let grabP=null;
/* what a pinch comes nearer to: what was under the middle between the fingers when the second came down (the pan carries it
   with the middle, the zoom keeps it in place: it stays under the middle), found once */
let pinchP=null;
/* orbit (the left drag): as in SketchUp, about P, the point under the cursor where the drag began (nothing there — about the target,
   the centre of the screen). The target turns about P by the same turn as the view's direction (about the vertical, then about
   the camera's right axis), so P stays where it was on screen. */
function orbit(dx,dy,P){
  const t0=goal.theta,f0=goal.phi;
  goal.theta-=dx*.006;goal.phi=Math.min(1.62,Math.max(.0005,goal.phi-dy*.006));
  if(!P)return;
  const a=goal.theta-t0,b=goal.phi-f0,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
  let x=goalT.x-P.x,y=goalT.y-P.y,z=goalT.z-P.z;[x,z]=[x*ca+z*sa,z*ca-x*sa];
  // about the right axis k=(kx,0,kz) by b (Rodrigues): v cos b + (k × v) sin b + k (k·v)(1 − cos b)
  const kx=Math.cos(goal.theta),kz=-Math.sin(goal.theta),kv=kx*x+kz*z;
  goalT.set(P.x+x*cb-kz*y*sb+kx*kv*(1-cb),P.y+y*cb+(kz*x-kx*z)*sb,P.z+z*cb+kx*y*sb+kz*kv*(1-cb));
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
  if(ptrs.size===0)touchDown=e.pointerType==='touch';
  // a second finger grabs nothing: the pinch. A finger would hide what it turns: it turns about what is in the centre of the screen
  // (anchored there, that is the target: the orbit about the target turns about it), touched anywhere
  if(ptrs.size===0&&touchDown){
    const rc=canvas.getBoundingClientRect(),h=hitAt({clientX:rc.left+rc.width/2,clientY:rc.top+rc.height/2});grabP=null;if(h)anchorAt(h.point);
  }else{const h=ptrs.size===0?hitAt(e):null;grabP=h?h.point.clone():null;if(grabP)anchorAt(grabP);}
  canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:e.button===1||e.button===2});
  if(ptrs.size===2){
    const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);
    pinchP=pointAt({clientX:(a.x+b.x)/2,clientY:(a.y+b.y)/2},new THREE.Vector3());
  }
});
canvas.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId)||ownMouse())return;const pr=ptrs.get(e.pointerId),dx=e.clientX-pr.x,dy=e.clientY-pr.y;
  if(!held&&downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)>=6)clearTimeout(holdTimer);
  if(held){ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:pr.pan});return;}
  if(ptrs.size>=1)camDrive=null;   // the user takes the camera back from a flight between views
  if(ptrs.size===1){
    if(e.shiftKey||pr.pan)pan(dx,dy);else orbit(dx,dy,grabP);
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:pr.pan});
  }else if(ptrs.size===2){
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    pan(dx/2,dy/2);
    const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0&&pinchP)zoomAt(pinchP,pinch0/d);pinch0=d;
  }
});
const lost=e=>{ptrs.delete(e.pointerId);pinch0=0;pinchP=null;if(!ptrs.size)grabP=null;};
const furnDoors=[];   // the cabinet doors (js/wardrobe.js): a click or a hold works them as the room's door; they swing by themselves
// a click (no drag) on a door leaf opens or closes that door; on an item with a click of its own, it does that
// what is under the cursor: the nearest visible surface, or null (also while flying between views: nothing to point at);
// the ray is aimed through the cursor either way (the wheel's fallback uses it)
function hitAt(e){
  aimRay(e);
  return inTransition()?null:ray.intersectObjects(scene.children,true).find(hittable)||null;
}
function pickDoor(e,hit){
  const h=hit===undefined?hitAt(e):hit;
  if(!h)return null;
  // the room's door (the leaf, its handles; its frame d.frame works it too) or a cabinet door
  const fd=furnDoors;
  for(let o=h.object;o;o=o.parent){const d=doors.find(d=>d.g===o||d.frame===o)||fd.find(d=>d.g===o||d.frame===o);if(d)return d;}
  return null;
}
// an item that does something of its own on a click, not a door (userData.click: the chandelier puts the next one), under a hit
function clickOf(h){for(let o=h&&h.object;o;o=o.parent){const c=o.userData&&o.userData.click;if(typeof c==='function')return c;}return null;}
// a click at a point of the canvas (h: what is there, if already found): the door there (or a cabinet door) opens or closes, or the item
// there does what it does; true if something did
function clickAt(e,hit){
  const h=hit===undefined?hitAt(e):hit,d=pickDoor(e,h);if(d){d.t=d.t!==0?0:d.max;return true;}
  const c=clickOf(h);if(c){c();return true;}return false;
}
canvas.addEventListener('pointerup',e=>{
  if(ownMouse()&&!ptrs.has(e.pointerId))return;   // the walk's own press (a door it holds is its to let go)
  clearTimeout(holdTimer);
  if(held){held=null;canvas.style.cursor='';downAt=null;lost(e);return;}
  if(downAt&&ptrs.size===1&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<6){
    // a finger has no cursor to rest: a tap on a thing that does nothing on a click brings up its «i» there
    const h=hitAt(e);if(!clickAt(e,h)&&e.pointerType&&e.pointerType!=='mouse')tapItem(h,e);
  }
  downAt=null;lost(e);
});
canvas.addEventListener('pointermove',e=>{if(ptrs.size===0&&!ownMouse()){const h=hitAt(e);canvas.style.cursor=pickDoor(e,h)||clickOf(h)?'pointer':'';itemHover(h&&infoOf(h.object),e);}});
canvas.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')itemHover(null);});   // a finger lifted leaves too: its «i» stays
canvas.addEventListener('pointercancel',lost);canvas.addEventListener('lostpointercapture',lost);
canvas.addEventListener('mousedown',e=>{if(e.button===1)e.preventDefault();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
// wheel zooms toward the point under the cursor (surface hit, the target anchored at its depth; or the plane through the target)
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function aimRay(e){const rc=canvas.getBoundingClientRect();ndc.set((e.clientX-rc.left)/rc.width*2-1,-(e.clientY-rc.top)/rc.height*2+1);ray.setFromCamera(ndc,camera);}   // the ray through the cursor
const _zp=new THREE.Vector3(),_pl=new THREE.Plane(),_n=new THREE.Vector3();
// what is at a point of the screen: the surface there, or where its ray meets the plane across the view through the target
function pointAt(e,out){
  const h=hitAt(e);if(h)return out.copy(h.point);
  camera.getWorldDirection(_n);_pl.setFromNormalAndCoplanarPoint(_n,cam.target);if(!ray.ray.intersectPlane(_pl,out))out.copy(cam.target);return out;
}
/* the distance times k toward P (the wheel, a pinch): the camera moves along its ray through P, so P stays where it is on screen;
   the target anchored at P's depth first, so it stops 0.3 m before P */
function zoomAt(P,k){
  anchorAt(P);const r0=cam.r,r1=clampR(r0*k,r0);
  cam.target.lerp(P,1-r1/r0);goalT.copy(cam.target);cam.r=goal.r=r1;
}
const shown=o=>{while(o){if(!o.visible)return false;o=o.parent;}return true;};
// what the cursor can hit: a visible surface (not a line, a label, or a wall faded away in a flight)
const seeThrough=m=>Array.isArray(m)?m.every(seeThrough):!!m&&m.opacity===0;
const hittable=h=>!(h.object.isLine||h.object.isSprite)&&shown(h.object)&&!seeThrough(h.object.material);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();if(ownMouse())return;camDrive=null;
  zoomAt(pointAt(e,_zp),1+Math.max(-.5,Math.min(.5,e.deltaY*.0012)));
},{passive:false});

function resize(){const w=viewer.clientWidth,h=viewer.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewer);

// the sun follows the view on screen (views.js: aimView)
let sunHalf=4.6;   // half the side of the square the shadows cover, m
function aimSun(x,y,z,half){
  sun.target.position.set(x,y,z);sunHalf=half;
  Object.assign(sun.shadow.camera,{left:-half,right:half,top:half,bottom:-half});sun.shadow.camera.updateProjectionMatrix();
  placeSun();
}
const infoBtn=document.getElementById('infoBtn');
// the «i» hint for the device in hand: a touch screen (no hover, a coarse pointer; or the last press a finger) or a mouse; for the view on screen
let touchDev=!!(window.matchMedia&&matchMedia('(hover: none) and (pointer: coarse)').matches);
function syncInfo(){const iv=view&&VIEWS[view].info||'orbit',dev=touchDev?'touch':'mouse';
  infoBtn.querySelectorAll('[data-info]').forEach(t=>{t.hidden=t.dataset.info!==iv||t.dataset.dev!==dev;});}
addEventListener('pointerdown',e=>{const t=e.pointerType==='touch'?true:e.pointerType==='mouse'?false:touchDev;if(t!==touchDev){touchDev=t;syncInfo();}},true);
infoBtn.addEventListener('click',()=>infoBtn.setAttribute('aria-expanded',infoBtn.getAttribute('aria-expanded')!=='true'));
document.addEventListener('keydown',e=>{if(e.key==='Escape')infoBtn.setAttribute('aria-expanded','false');});

/* ---------- what a thing is: the cursor resting on something that knows it (userData.info on it or up its parents, or on its
   part: {title, lines, and price (₽), url, shop if it is sold (or buy: a row for each product it is made of), next and variant if it has variants} or a function giving them) brings up an «i» by the cursor; a click on it opens a short card.
   With the mouse in the views that orbit (the walk keeps the mouse to itself), on a touch screen a tap brings it; the camera moving
   takes the «i» away ---------- */
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
// a tap (touch or pen) at e on hit h: the «i» of what is there, by the finger
function tapItem(h,e){
  clearTimeout(itemTimer);const info=h&&infoOf(h.object);if(!info)return;
  const rc=viewer.getBoundingClientRect();showItemDot(info,e.clientX-rc.left,e.clientY-rc.top);
}
itemDot.addEventListener('pointerenter',()=>{clearTimeout(itemHide);itemHide=null;});
itemDot.addEventListener('pointerleave',()=>{if(!itemDot.hidden)itemHide=setTimeout(hideItemDot,ITEM_GRACE);});
// the card: the title and a few lines, next to the «i», inside the scene
function openItemCard(info){
  itemCard.innerHTML='';
  const x=document.createElement('button');x.className='x';x.setAttribute('aria-label','Закрыть');x.textContent='×';x.addEventListener('click',closeItemCard);
  const h=document.createElement('h3');h.textContent=info.title;itemCard.appendChild(x);itemCard.appendChild(h);
  // a line: a paragraph, or [name, value, bold] — a row of a two-column block (props: the names under each other), the value bold if asked
  let props=null;
  (info.lines||[]).forEach(t=>{
    if(!Array.isArray(t)){props=null;const p=document.createElement('p');p.textContent=t;itemCard.appendChild(p);return;}
    if(!props){props=document.createElement('div');props.className='props';itemCard.appendChild(props);}
    const k=document.createElement('span');k.className='k';k.textContent=t[0];
    const v=document.createElement(t[2]?'b':'span');v.textContent=t[1];props.appendChild(k);props.appendChild(v);});
  // a thing with variants (info.next: hangs the next one, gives its card; info.variant: [which, how many]): a line under the others,
  // which of how many and a link to the next one; the card turns to it
  if(typeof info.next==='function'){const p=document.createElement('p');p.className='next';
    if(info.variant){const c=document.createElement('span');c.textContent=info.variant.join('/');p.appendChild(c);}
    const b=document.createElement('button');b.className='lnk';b.textContent='Следующий вариант →';b.addEventListener('click',()=>openItemCard(info.next()));
    p.appendChild(b);itemCard.appendChild(p);}
  // its price (₽) and where to buy it (url), if it has them: a row under the lines, the link in a new tab; a thing made of several
  // products has a row each (info.buy: [{name, price, url, shop, n — how many of it}]); more than one thing (rows, or n of one): the total under
  // them. All in one block (buys), its columns one grid — names, prices, links — so the prices stand under each other
  const rows=info.buy||(info.price||info.url?[info]:[]);
  if(rows.length){const buys=document.createElement('div');buys.className='buys';
    const row=(it,cls)=>{const r=document.createElement('div');r.className=cls;
      if(it.name){const n=document.createElement('span');n.className='nm';n.textContent=it.name;r.appendChild(n);}
      if(it.price){const b=document.createElement('b');b.textContent=(it.n>1?it.n+' × ':'')+it.price.toLocaleString('ru-RU')+' ₽';r.appendChild(b);}
      if(it.url){const l=document.createElement('a');l.href=it.url;l.target='_blank';l.rel='noopener';l.textContent=it.shop||info.shop||'Купить';r.appendChild(l);}
      buys.appendChild(r);};
    rows.forEach((it,i)=>row(it,'buy'+(i?' more':'')));
    if(rows.length>1||rows.some(it=>it.n>1))row({name:'Итого',price:rows.reduce((t,it)=>t+(it.n||1)*(it.price||0),0)},'buy total');
    itemCard.appendChild(buys);}
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
/* a touch's mark: while fingers are down, a dot where the camera turns (one finger: the target) or what a pinch comes nearer to,
   as the finger covers neither; the same size on screen, over everything, no ray finds it. The mouse has none: it turns about
   the cursor */
const MARK_PX=5;   // its radius on screen
const touchMark=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),
  new THREE.MeshBasicMaterial({color:0xff6a1a,depthTest:false,depthWrite:false,transparent:true,opacity:.9}));
touchMark.renderOrder=30;touchMark.raycast=()=>{};touchMark.visible=false;scene.add(touchMark);
frameHooks.push(()=>{
  touchMark.visible=touchDown&&ptrs.size>0&&!held&&!ownMouse();if(!touchMark.visible)return;
  touchMark.position.copy(pinchP||goalT);
  touchMark.scale.setScalar(camera.position.distanceTo(touchMark.position)*2*Math.tan(camera.fov*Math.PI/360)*MARK_PX/viewer.clientHeight);
});
let camDrive=null;     // while set, it places the camera instead of the easing toward the goal

/* ---------- dimension labels, the plan's and the rooms': a white plate with the text over everything (or, depth, hidden behind
   what stands in front). A label is h tall in the scene (m), but on screen no taller than LABEL_PX, and smaller than it can be
   read it fades out: near it stays readable, far it shrinks with the model instead of covering it. fitLabels, every frame ---------- */
const LABEL_PX=22,LABEL_FADE=[6,8];   // px: gone at the first, whole from the second
function dimLabel(text,h,depth=false){
  const c=document.createElement('canvas'),g=c.getContext('2d'),f=44;
  g.font=`500 ${f}px "JetBrains Mono", monospace`;const w=Math.ceil(g.measureText(text).width)+36;
  c.width=w;c.height=f+26;g.font=`500 ${f}px "JetBrains Mono", monospace`;
  g.fillStyle='rgba(255,255,255,.94)';const r=12;g.beginPath();g.moveTo(r,0);g.arcTo(w,0,w,c.height,r);g.arcTo(w,c.height,0,c.height,r);g.arcTo(0,c.height,0,0,r);g.arcTo(0,0,w,0,r);g.fill();
  g.fillStyle=text.includes('?')?'#9a4d16':'#1f4a3f';g.textBaseline='middle';g.fillText(text,18,c.height/2+2);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:depth,transparent:true}));
  s.renderOrder=20;s.userData.ar=w/c.height;s.userData.h=h;s.scale.set(h*s.userData.ar,h,1);return s;
}
const _lv=new THREE.Vector3();
function fitLabels(list){
  const k=2*Math.tan(camera.fov*Math.PI/360)/(viewer.clientHeight||1);   // m per px at 1 m
  list.forEach(s=>{const H=s.userData.h;if(typeof H!=='number')return;   // a label (the lines beside it are left alone)
    const px=H/Math.max(1e-9,s.getWorldPosition(_lv).distanceTo(camera.position)*k),h=H*Math.min(1,LABEL_PX/px);   // its own height on screen, px
    s.scale.set(h*s.userData.ar,h,1);s.material.opacity=Math.min(1,Math.max(0,(px-LABEL_FADE[0])/(LABEL_FADE[1]-LABEL_FADE[0])));});
}
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
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
