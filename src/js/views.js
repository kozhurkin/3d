/* ---------- views: each tab is a view of the one apartment ----------
   A view names the walls it shows (rooms), which walls hide in the cut mode and from which side (fade),
   its own settings (remembered per view) and its panel. Light and wall colour are shared by all views:
   their block (#shared) moves into the panel of the view on screen. */
const VIEWS={};     // id → {rooms, fade, defaults, panel, home(), sync(), onDoors()}
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
const S={wc:'white',light:{...LIGHT0}};
{ const s=readJSON(SKEY);if(s){if(WALLC[s.wc])S.wc=s.wc;S.light={...LIGHT0,...(s.light||{})};} }
const saveShared=()=>writeJSON(SKEY,S);
const sharedEl=document.getElementById('shared');
// wall colour swatches
const wcs=document.getElementById('wcs');
wcs.innerHTML=Object.entries(WALLC).map(([k,w])=>`<button class="wc" data-wc="${k}" aria-pressed="false"><i style="background:${w.p||w.c}"></i>${w.n}</button>`).join('');
const syncWc=()=>wcs.querySelectorAll('[data-wc]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wc===S.wc));
wcs.querySelectorAll('[data-wc]').forEach(b=>b.addEventListener('click',()=>{S.wc=b.dataset.wc;syncWc();applyTheme();saveShared();}));
syncWc();
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

/* show a view: its panel, its walls, its camera — where it was left, or the view's home on the first visit.
   animate=false puts the camera there at once (first load); otherwise the camera flies there */
const camMem={};
function showView(id,animate=true){
  if(!VIEWS[id])id='plan';
  if(id===view)return;
  if(view)camMem[view]={theta:goal.theta,phi:goal.phi,r:goal.r,t:goalT.clone()};
  view=id;const vw=VIEWS[id];
  Object.values(VIEWS).forEach(v=>{v.panel.hidden=v!==vw;});
  vw.panel.querySelector('[data-shared-slot]').appendChild(sharedEl);sharedEl.hidden=false;
  buildWalls(vw);
  const m=camMem[id];
  if(m){goal.theta=m.theta;goal.phi=m.phi;goal.r=m.r;goalT.copy(m.t);shortWay();}else vw.home();
  if(!animate){cam.theta=goal.theta;cam.phi=goal.phi;cam.r=goal.r;cam.target.copy(goalT);}
  syncWallCtl(id);if(vw.sync)vw.sync();applyTheme();
}
