/* ---------- views: each tab is a view of the one room ----------
   A view names the walls it shows (rooms), which walls hide in the cut mode and from which side (fade),
   its own settings (remembered per view) and its panel. Light and wall colour are shared by all views:
   their block (#shared) moves into the panel of the view on screen. */
const VIEWS={};     // id → {rooms, fade, frame(), sun(), anchor(), defaults, panel, home(), sync(), onDoors(),
                   //       mouse: the view takes the mouse itself (no orbit), info: its hint under «i» (data-info)}
const VS={};        // id → the view's own settings
let view=null;      // the view on screen
const vs=()=>VS[view];

/* remembered in this browser */
const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}};
const writeJSON=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const viewKey=id=>`eng-view-${id}-v1`;
function saveView(id=view){writeJSON(viewKey(id),VS[id]);}

/* shared settings: light and wall colour */
const SKEY='eng-shared-v1';
const S={wc:'white',light:{...LIGHT0},edge:true,fly:true};   // edge: the walls' and doors' outlines; fly: the animated flight between tabs
{ const s=readJSON(SKEY);if(s){if(WALLC[s.wc])S.wc=s.wc;S.light={...LIGHT0,...(s.light||{})};if(s.edge===false)S.edge=false;if(s.fly===false)S.fly=false;} }
const saveShared=()=>writeJSON(SKEY,S);
const sharedEl=document.getElementById('shared');
// wall colour swatches
const wcs=document.getElementById('wcs');
wcs.innerHTML=Object.entries(WALLC).map(([k,w])=>`<button class="wc" data-wc="${k}" aria-pressed="false"><i style="background:${w.p||w.c}"></i>${w.n}</button>`).join('');
const syncWc=()=>wcs.querySelectorAll('[data-wc]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wc===S.wc));
wcs.querySelectorAll('[data-wc]').forEach(b=>b.addEventListener('click',()=>{S.wc=b.dataset.wc;syncWc();applyTheme();saveShared();}));
syncWc();
// the walls' and doors' outlines (walls.js: edgeOp), the same in every view
const edgeBox=document.getElementById('wEdge');edgeBox.checked=S.edge;
edgeBox.addEventListener('change',e=>{S.edge=e.target.checked;saveShared();});
// the animated flight between tabs; without it the new view's walls are there at once and the camera glides to it
const flyBox=document.getElementById('wFly');flyBox.checked=S.fly;
flyBox.addEventListener('change',e=>{S.fly=e.target.checked;saveShared();});
// light
const lmap={Laz:'az',Lel:'el',Li:'i',La:'a'},lunit={az:'°',el:'°',i:'%',a:'%'};
function syncLight(){Object.entries(lmap).forEach(([id,k])=>{document.getElementById(id).value=S.light[k];document.getElementById('o'+id).textContent=Math.round(S.light[k])+lunit[k];});placeSun();}
Object.entries(lmap).forEach(([id,k])=>document.getElementById(id).addEventListener('input',e=>{S.light[k]=+e.target.value;syncLight();saveShared();}));
let spin=false;const spinBtn=document.getElementById('lightSpin');
spinBtn.addEventListener('click',()=>{spin=!spin;spinBtn.setAttribute('aria-pressed',spin);spinBtn.textContent=spin?'Остановить':'Вращать свет';if(!spin){syncLight();saveShared();}});
document.getElementById('lightReset').addEventListener('click',()=>{S.light={...LIGHT0};syncLight();saveShared();});
syncLight();
frameHooks.push(dt=>{if(spin){const L=S.light;L.az+=30*dt;if(L.az>180)L.az-=360;syncLight();}});   // one turn in 12 s

/* walls segment and height slider: a view has them in its panel ([data-wm], [data-wh], [data-wh-out]) or keeps its walls as set */
function syncWallCtl(id){
  const p=VIEWS[id].panel,V=VS[id],wh=p.querySelector('[data-wh]');
  if(!wh)return;
  wh.value=V.Wh;p.querySelector('[data-wh-out]').textContent=(V.Wm==='row'?10:V.Wh)+'%';
  wh.disabled=V.Wm==='row'||V.Wm==='feet';wh.parentElement.style.opacity=wh.disabled?.45:1;
  p.querySelectorAll('[data-wm]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.wm===V.Wm));
}
/* doors segment ([data-dm]) of a view: the apartment's doors all closed, all open (nothing pressed when they differ),
   or no doors at all in this view. The doors are one for every view: a view with the segment follows them */
function syncDoorCtl(id){
  const bs=VIEWS[id].panel.querySelectorAll('[data-dm]'),V=VS[id];
  if(!bs.length)return;
  let st=V.dm;
  if(st!=='none'){const open=doors.filter(d=>d.t!==0).length;st=open===doors.length?'open':open===0?'closed':'mixed';if(st!=='mixed')V.dm=st;}
  bs.forEach(x=>x.setAttribute('aria-pressed',x.dataset.dm===st));
}

/* a view joins the app: its settings come from this browser, its panel gets the common controls */
function addView(id,def){
  VIEWS[id]=def;
  VS[id]=Object.assign(JSON.parse(JSON.stringify(def.defaults)),readJSON(viewKey(id))||{});
  const p=def.panel;
  if(!p.querySelector(`[data-wm="${VS[id].Wm}"]`))VS[id].Wm=def.defaults.Wm;   // a walls' mode this view has no button for (a saved one renamed since) — its default
  p.querySelectorAll('[data-wm]').forEach(b=>b.addEventListener('click',()=>{VS[id].Wm=b.dataset.wm;syncWallCtl(id);saveView(id);}));
  const wh=p.querySelector('[data-wh]');if(wh)wh.addEventListener('input',e=>{VS[id].Wh=+e.target.value;syncWallCtl(id);saveView(id);});
  p.querySelectorAll('[data-dm]').forEach(b=>b.addEventListener('click',()=>{
    const dm=VS[id].dm=b.dataset.dm;if(dm!=='none')doors.forEach(d=>d.t=dm==='open'?d.max:0);
    saveView(id);doorsChanged();}));
}

/* a door was clicked or held:
   every view updates its door controls from the doors as they are and remembers */
function doorsChanged(){Object.keys(VIEWS).forEach(id=>{const v=VIEWS[id],seg=!!v.panel.querySelector('[data-dm]');
  if(seg)syncDoorCtl(id);if(v.onDoors)v.onDoors();if(seg||v.onDoors)saveView(id);});}

/* the sun aims at the middle of the view and its shadows cover the view (tighter in a room: sharper shadows);
   the camera mini view frames the view's frame, or the whole apartment */
function aimView(){const vw=VIEWS[view],s=vw.sun();aimSun(s.x,s.y,s.z,s.half);frameInset(insetFrame(vw));}
// the part of the apartment the mini view keeps in its shot: the view's frame or the whole apartment (mm: x0 x1 z0 z1)
const insetFrame=vw=>vw.frame?vw.frame():[BOX.x0,BOX.x1,BOX.z0,BOX.z1];
const insetNow=()=>[apt.min.x,apt.max.x,apt.min.z,apt.max.z].map(v=>v/MM);
function frameInset(f){apt.min.set(f[0]*MM,0,f[2]*MM);apt.max.set(f[1]*MM,H*MM,f[3]*MM);}
modelHooks.push(()=>{if(tr){tr=null;camDrive=null;}if(view)aimView();});   // the walls were just built anew for the view: a flight is over

/* ---------- a flight between views ----------
   One progress p (eased: e) moves everything together: the camera from where it was to the new view's goal,
   the walls (walls.js: morph), the sun and its shadows,
   the part of the apartment the mini view shows.
   A click on another tab in the middle starts a new flight from what is on screen. Orbiting, panning or zooming
   takes the camera back from the flight; the rest finishes */
const FLY=.85;   // seconds
let tr=null;     // {p, e, cam0, sun0, sunT, box0, boxT, pres0: how much of each view was on screen at the start}
const inTransition=()=>!!tr;
// how much of a view is on screen: 1 or 0, in between while flying (the room's names, the walk's wide angle)
function presence(id){const t=view===id?1:0;return tr?tr.pres0[id]+(t-tr.pres0[id])*tr.e:t;}
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
  frameInset(tr.box0.map((v,i)=>l(v,tr.boxT[i])));
  if(tr.p>=1)endTransition();
});

/* show a view: its panel, its walls, its camera — where it was left, or the view's home on the first visit.
   animate=false puts everything there at once (first load); otherwise it is a flight, or without the animated flight
   (the shared setting) the new view's walls at once and the camera gliding there (a jump with reduced motion) */
// the camera of each view, its target kept from the view's anchor (a room's origin): when the plan moves the room, the camera goes with it
const camMem={};
const anchorOf=id=>{const a=VIEWS[id].anchor?VIEWS[id].anchor():[0,0];return new THREE.Vector3(a[0]*MM,0,a[1]*MM);};
function showView(id,animate=true){
  if(!VIEWS[id])id='plan';
  if(id===view)return;
  // what is on screen now: the flight starts from here
  const fly=animate&&!reduce&&S.fly&&view!==null;
  let start=null;
  if(fly){const pres0={};Object.keys(VIEWS).forEach(k=>{pres0[k]=presence(k);});const s=sun.target.position;
    start={walls:wallsNow(),pres0,cam0:{theta:cam.theta,phi:cam.phi,r:cam.r,t:cam.target.clone()},sun0:{x:s.x,y:s.y,z:s.z,half:sunHalf},box0:insetNow()};}
  if(view)camMem[view]={theta:goal.theta,phi:goal.phi,r:goal.r,t:goalT.clone().sub(anchorOf(view))};
  view=id;const vw=VIEWS[id];
  Object.values(VIEWS).forEach(v=>{v.panel.hidden=v!==vw;});
  // light and wall colour in its panel, if it has a place for them; the hint under «i» of the view
  const slot=vw.panel.querySelector('[data-shared-slot]');if(slot)slot.appendChild(sharedEl);sharedEl.hidden=!slot;
  document.querySelectorAll('#infoBtn [data-info]').forEach(t=>{t.hidden=t.dataset.info!==(vw.info||'orbit');});
  const m=camMem[id];
  if(m){goal.theta=m.theta;goal.phi=m.phi;goal.r=m.r;goalT.copy(m.t).add(anchorOf(id));shortWay();}else vw.home();
  if(fly){
    startWallMorph(start.walls,id,goalPosition());
    tr={p:0,e:0,cam0:start.cam0,sun0:start.sun0,sunT:vw.sun(),box0:start.box0,boxT:insetFrame(vw),pres0:start.pres0};camDrive=driveCam;
  }else{
    tr=null;if(camDrive===driveCam)camDrive=null;buildWalls(vw);aimView();
    if(!animate||reduce){cam.theta=goal.theta;cam.phi=goal.phi;cam.r=goal.r;cam.target.copy(goalT);}
  }
  syncWallCtl(id);syncDoorCtl(id);if(vw.sync)vw.sync();applyTheme();
}
