/* ---------- views: each tab is a view of the one apartment ----------
   A view names the walls it shows (rooms), which walls hide in the cut mode and from which side (fade),
   its own settings (remembered per view) and its panel. Light and wall colour are shared by all views:
   their block (#shared) moves into the panel of the view on screen. */
const VIEWS={};     // id → {rooms, fade, frame(), sun(), anchor(), furniture(), defaults, panel, home(), sync(), onDoors()}
const VS={};        // id → the view's own settings
let view=null;      // the view on screen
const vs=()=>VS[view];

/* remembered in this browser */
const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}};
const writeJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const viewKey=id=>`apt-view-${id}-v1`;
function saveView(id=view){writeJSON(viewKey(id),VS[id]);}

/* shared settings: light and wall colour */
const SKEY='apt-shared-v1';
const S={wc:'white',light:{...LIGHT0},poche:true};   // poche: dark cut tops of the walls
{ const s=readJSON(SKEY);if(s){if(WALLC[s.wc])S.wc=s.wc;S.light={...LIGHT0,...(s.light||{})};if(s.poche===false)S.poche=false;} }
const saveShared=()=>writeJSON(SKEY,S);
const sharedEl=document.getElementById('shared');
// wall colour swatches
const wcs=document.getElementById('wcs');
wcs.innerHTML=Object.entries(WALLC).map(([k,w])=>`<button class="wc" data-wc="${k}" aria-pressed="false"><i style="background:${w.p||w.c}"></i>${w.n}</button>`).join('');
const syncWc=()=>wcs.querySelectorAll('[data-wc]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wc===S.wc));
wcs.querySelectorAll('[data-wc]').forEach(b=>b.addEventListener('click',()=>{S.wc=b.dataset.wc;syncWc();applyTheme();saveShared();}));
syncWc();
// the cut tops of the walls: dark or the wall colour, the same in every view
const pocheBox=document.getElementById('wPoche');pocheBox.checked=S.poche;
pocheBox.addEventListener('change',e=>{S.poche=e.target.checked;applyTheme();saveShared();});
// light
const lmap={Laz:'az',Lel:'el',Li:'i',La:'a'},lunit={az:'°',el:'°',i:'%',a:'%'};
function syncLight(){Object.entries(lmap).forEach(([id,k])=>{document.getElementById(id).value=S.light[k];document.getElementById('o'+id).textContent=Math.round(S.light[k])+lunit[k];});placeSun();}
Object.entries(lmap).forEach(([id,k])=>document.getElementById(id).addEventListener('input',e=>{S.light[k]=+e.target.value;syncLight();saveShared();}));
let spin=false;const spinBtn=document.getElementById('lightSpin');
spinBtn.addEventListener('click',()=>{spin=!spin;spinBtn.setAttribute('aria-pressed',spin);spinBtn.textContent=spin?'Остановить':'Вращать свет';if(!spin){syncLight();saveShared();}});
document.getElementById('lightReset').addEventListener('click',()=>{S.light={...LIGHT0};syncLight();saveShared();});
syncLight();
frameHooks.push(dt=>{if(spin){const L=S.light;L.az+=30*dt;if(L.az>180)L.az-=360;syncLight();}});   // one turn in 12 s

/* walls segment and height slider: every view has them in its panel ([data-wm], [data-wh], [data-wh-out]) */
function syncWallCtl(id){
  const p=VIEWS[id].panel,V=VS[id],wh=p.querySelector('[data-wh]');
  wh.value=V.Wh;p.querySelector('[data-wh-out]').textContent=(V.Wm==='row'?10:V.Wh)+'%';
  wh.disabled=V.Wm==='row'||V.Wm==='outline';wh.parentElement.style.opacity=wh.disabled?.45:1;
  p.querySelectorAll('[data-wm]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.wm===V.Wm));
}

/* a view joins the app: its settings come from this browser, its panel gets the common controls */
function addView(id,def){
  VIEWS[id]=def;
  VS[id]=Object.assign(JSON.parse(JSON.stringify(def.defaults)),readJSON(viewKey(id))||{});
  const p=def.panel;
  p.querySelectorAll('[data-wm]').forEach(b=>b.addEventListener('click',()=>{VS[id].Wm=b.dataset.wm;syncWallCtl(id);saveView(id);}));
  p.querySelector('[data-wh]').addEventListener('input',e=>{VS[id].Wh=+e.target.value;syncWallCtl(id);saveView(id);});
}

/* a door was clicked or held: the view updates its door controls and remembers */
function doorsChanged(){const vw=VIEWS[view];if(vw.onDoors)vw.onDoors();saveView();}

/* the sun aims at the middle of the view and its shadows cover the view (tighter in a room: sharper shadows);
   the camera mini view frames the view's frame, or the whole apartment */
function aimView(){const vw=VIEWS[view],s=vw.sun();aimSun(s.x,s.y,s.z,s.half);frameInset(vw);}
function frameInset(vw){
  const f=vw.frame?vw.frame():[BOX.x0,BOX.x1,BOX.z0,BOX.z1];
  apt.min.set(f[0]*MM,0,f[2]*MM);apt.max.set(f[1]*MM,H*MM,f[3]*MM);
}
modelHooks.push(()=>{if(tr){tr=null;camDrive=null;}if(view)aimView();});   // the walls were just built anew for the view: a flight is over

/* ---------- a flight between views ----------
   One progress p (eased: e) moves everything together: the camera from where it was to the new view's goal,
   the walls (walls.js: morph), each room's furniture into the floor or out of it (presence), the sun and its shadows.
   A click on another tab in the middle starts a new flight from what is on screen. Orbiting, panning or zooming
   takes the camera back from the flight; the rest finishes */
const FLY=.85;   // seconds
let tr=null;     // {p, e, cam0, sun0, sunT, pres0}
const inTransition=()=>!!tr;
// how much of a view's furniture is in the scene: 1 in its view, 0 elsewhere, in between while flying
function presence(id){return tr?tr.pres0[id]+((view===id?1:0)-tr.pres0[id])*tr.e:(view===id?1:0);}
function driveCam(){const c=tr.cam0,e=tr.e;
  cam.theta=c.theta+(goal.theta-c.theta)*e;cam.phi=c.phi+(goal.phi-c.phi)*e;cam.r=c.r+(goal.r-c.r)*e;cam.target.copy(c.t).lerp(goalT,e);}
function endTransition(){
  tr=null;
  if(camDrive===driveCam){camDrive=null;cam.theta=goal.theta;cam.phi=goal.phi;cam.r=goal.r;cam.target.copy(goalT);}
  buildWalls(VIEWS[view]);aimView();
}
preHooks.push(dt=>{
  if(!tr)return;
  tr.p=Math.min(1,tr.p+dt/FLY);const e=tr.e=tr.p*tr.p*(3-2*tr.p);
  if(morph)morph.e=e;
  const a=tr.sun0,b=tr.sunT,l=(u,v)=>u+(v-u)*e;
  aimSun(l(a.x,b.x),l(a.y,b.y),l(a.z,b.z),l(a.half,b.half));
  if(tr.p>=1)endTransition();
});

/* show a view: its panel, its walls, its camera — where it was left, or the view's home on the first visit.
   animate=false puts everything there at once (first load); otherwise it is a flight (or a jump with reduced motion) */
// the camera of each view, its target kept from the view's anchor (a room's origin): when the plan moves the room, the camera goes with it
const camMem={};
const anchorOf=id=>{const a=VIEWS[id].anchor?VIEWS[id].anchor():[0,0];return new THREE.Vector3(a[0]*MM,0,a[1]*MM);};
function showView(id,animate=true){
  if(!VIEWS[id])id='plan';
  if(id===view)return;
  // what is on screen now: the flight starts from here
  const fly=animate&&!reduce&&view!==null;
  let start=null;
  if(fly){const pres0={};Object.keys(VIEWS).forEach(k=>{pres0[k]=presence(k);});const s=sun.target.position;
    start={walls:wallsNow(),pres0,cam0:{theta:cam.theta,phi:cam.phi,r:cam.r,t:cam.target.clone()},sun0:{x:s.x,y:s.y,z:s.z,half:sunHalf}};}
  if(view)camMem[view]={theta:goal.theta,phi:goal.phi,r:goal.r,t:goalT.clone().sub(anchorOf(view))};
  view=id;const vw=VIEWS[id];
  Object.values(VIEWS).forEach(v=>{v.panel.hidden=v!==vw;});
  vw.panel.querySelector('[data-shared-slot]').appendChild(sharedEl);sharedEl.hidden=false;
  const m=camMem[id];
  if(m){goal.theta=m.theta;goal.phi=m.phi;goal.r=m.r;goalT.copy(m.t).add(anchorOf(id));shortWay();}else vw.home();
  if(fly){
    startWallMorph(start.walls,id,goalPosition());frameInset(vw);
    tr={p:0,e:0,cam0:start.cam0,sun0:start.sun0,sunT:vw.sun(),pres0:start.pres0};camDrive=driveCam;
  }else{
    tr=null;if(camDrive===driveCam)camDrive=null;buildWalls(vw);aimView();
    if(!animate||reduce){cam.theta=goal.theta;cam.phi=goal.phi;cam.r=goal.r;cam.target.copy(goalT);}
  }
  syncWallCtl(id);if(vw.sync)vw.sync();applyTheme();
}
