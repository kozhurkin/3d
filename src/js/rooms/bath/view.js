// every frame (before the room turns its doors): the bath view hides the niche, the shower tray, its rack and curtain unless its frame shows it whole
frameHooks.push(()=>{
  const v=VIEWS.bath,sani=v&&v.furniture?v.furniture().extra:null;if(!sani)return;   // the items by their keys (extra.items below)
  const one=k=>sani.children.find(o=>o.userData[k]===true),wash=one('wash'),tray=one('tray'),curtain=one('curtain');
  if(wash)wash.visible=view!=='bath';
  if(tray)tray.visible=view!=='bath'||VS.bath.L>=trayRect()[3];   // the bath view: only when its frame takes the whole tray in
  sani.children.forEach(o=>{if(o.userData.rack)o.visible=!tray||tray.visible;});   // the rack (its two groups) with it
  // and the curtain; in the bath view's cut mode it hides with the wall at the niche end, along which it runs
  if(curtain){const w=WALLS.find(v=>v.id==='nicheEnd'),vw=VIEWS.bath;
    curtain.visible=(!tray||tray.visible)&&(view!=='bath'||VS.bath.Wm!=='auto'||sideVisible(fadeSide(w,vw),fadeWall(w,vw).r.map(v=>v*MM),camera.position));}
});

/* ---------- dimension lines of the bathroom (bath axes; they belong to the bathroom and move with it) ---------- */
function buildDims(dim,gaps){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
  const zf=current.zf,yb=current.yb,z1=zf+P.Lt,xe=Math.max(P.Du,P.Di)+80;
  { const wc=Math.min(P.Wc,P.W-P.Rx),xa=P.W-wc,yd=P.H+120;
    dim(V(0,yd,0),V(P.Rx,yd,0),`${P.Rx}`,Y);
    if(xa>P.Rx)dim(V(P.Rx,yd,0),V(xa,yd,0),`${xa-P.Rx}`,Y);
    dim(V(xa,yd,0),V(P.W,yd,0),`${wc}`,Y);
    dim(V(0,yd+160,0),V(P.W,yd+160,0),`${P.W}`,Y); }
  dim(V(P.W,P.H+120,0),V(P.W,P.H+120,zf),`${zf}`,Y);
  dim(V(0,P.H+120,0),V(0,P.H+120,P.Rz),`${P.Rz}`,Y);
  if(zf>P.Rz)dim(V(0,P.H+120,P.Rz),V(0,P.H+120,zf),`${zf-P.Rz}`,Y);
  dim(V(0,P.H+120,zf),V(0,P.H+120,z1),`${P.Lt}`,Y);
  dim(V(0,P.H+280,0),V(0,P.H+280,P.L),`${P.L}`,Y);
  dim(V(P.W-60,0,zf+60),V(P.W-60,P.H,zf+60),`${P.H}`,X);
  dim(V(xe,0,z1-60),V(xe,P.Hi,z1-60),`${P.Hi}`,X);
  if(yb>P.Hi)dim(V(xe,P.Hi,z1-60),V(xe,yb,z1-60),`${yb-P.Hi}`,X);
  dim(V(0,yb-80,z1+40),V(P.Du,yb-80,z1+40),`${P.Du}`,Y);
  // between the shelves: each carcass of the tall cabinet that has them, the upper cabinet, the section at the riser box (the tall cabinet's 2 and 3)
  const by=nms=>current.parts.filter(q=>q.mat==='carcass'&&nms.includes(q.name));
  const box=nm=>by(['Дно','Полка','Крышка'].map(w=>w+' '+nm));
  if(P.Nb)gaps(box('нижнего корпуса пенала'));
  if(P.Nh)gaps(box('верхнего корпуса пенала'));
  if(P.Nu)gaps(by(['Дно верхнего шкафа','Полка верхнего шкафа','Крышка верхнего шкафа']));
  // the section at the riser box, when there is one; its lower carcass without a top (layout 2) is closed by the upper one's bottom
  const lo=box('нижнего корпуса секции у короба');
  gaps(lo.some(q=>q.name.startsWith('Крышка'))?lo:[...lo,...by(['Дно верхнего корпуса секции у короба'])]);gaps(box('верхнего корпуса секции у короба'));
}

/* camera presets of the bath tab, moved to where the bathroom lies on the plan */
function setCam(v){
  const base=Math.max(P.H,P.W*1.6)*MM*1.9*Math.max(1,Math.pow(1/(camera.aspect||1),.95));   // pull back on tall, narrow screens
  const views={persp:[.75,1.25,base],front:[Math.PI/2,1.5,base*.9],top:[.6,.42,base*1.2],tall:[.25,1.4,base*.95],upper:[1.35,1.3,base*.8],riser:[.45,1.2,base*.85]};
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];
  const zf=current.zf*MM,[ox,oz]=O().map(u=>u*MM),at=(x,y,z)=>goalT.set(ox+x,y,oz+z);
  if(v==='tall')at((P.Rx+P.W)/2*MM,P.H*MM*.5,zf*.5);
  else if(v==='upper')at(P.Du*MM*.5,(current.yb+(P.H-current.yb)/2)*MM,zf+P.Lt*MM/2);
  else if(v==='riser')at(P.Rx*MM*.5,P.H*MM*.55,zf);
  else if(v==='front')at(P.W/2*MM,P.H*MM*.45,zf+P.Lt*MM/2);
  else at(P.W/2*MM,P.H/2*MM,.55);
  shortWay();
}

/* ---------- panel: what the bathroom has (each cabinet's layout, feet under the tall cabinet) and its texts ---------- */
const panel=document.querySelector('[data-panel="bath"]'),bq=s=>panel.querySelector(s);
bq('#b-tFeet').addEventListener('change',e=>{P.Feet=e.target.checked;k.build();k.keep();});
// each cabinet's layout (data-for: its key in P): the upper one on the installation with inset doors, no niche (LayU);
// a section between the riser box and the tall cabinet (LayT): open (2), its upper carcass behind a door (3)
const lays=[...panel.querySelectorAll('[data-lay]')];
lays.forEach(b=>b.addEventListener('click',()=>{P[b.dataset.for]=+b.dataset.lay;k.syncThick();k.build();k.keep();}));
// the niche, the ceiling and the riser box (from the plan), the space between the shelves
function panelText(){
  bq('#b-W').textContent=P.W+' мм';bq('#b-L').textContent=P.L+' мм';bq('#b-H').textContent=P.H+' мм';bq('#b-R').textContent=`${P.Rx} × ${P.Rz} мм`;
  bq('#bSub').textContent=`ниша ${P.W} × ${P.L} мм · потолок ${P.H} мм · `+k.finDesc();
  const t=P.T||16,f=v=>v.toFixed(1).replace('.',',').replace(',0',''),fl=P.Feet?10:0;
  // free height between neighbouring shelves (from the top of one shelf to the underside of the next)
  const sb=(P.Hi-t-P.Pl-fl-t)/(P.Nb+1),sh=(P.H-t-P.Hi-t)/(P.Nh+1);
  const L2=P.LayU===2,yb=L2?P.Hi:P.Hi+P.Gap,su=(P.H-yb-t)/(P.Nu+1);
  const gap=(n,v)=>(n?`между полками ${f(v-t)} мм`:`без полок: высота отделения ${f(v-t)} мм`);
  bq('#b-gapB').textContent=`Высота дверей ${P.Hi-P.Pl-fl} мм · `+gap(P.Nb,sb);
  bq('#b-gapH').textContent=`Высота дверей ${P.H-P.Hi} мм · `+gap(P.Nh,sh);
  // the upper cabinet on the installation: no niche, its depth and the gap over the installation are off
  ['Dm','Gap'].forEach(j=>{bq('#b-'+j).disabled=L2;bq('#b-f'+j).style.opacity=L2?.45:1;});
  bq('#b-gapM').textContent=L2?'Ниши нет: шкаф стоит на инсталляции':`Высота ниши ${P.Gap} мм · внутри ${Math.max(0,P.Gap-2*t)} мм`;
  bq('#b-gapM').style.opacity=L2?.45:1;
  bq('#b-gapU').textContent=`Высота шкафа ${P.H-yb} мм · `+gap(P.Nu,su);
}

const k=roomKit('bath',{
  P,FIN,mats,px:'b',panel,origin:O,fromModel,setCam,panelText,
  keepFin:true,keepP:['LayU','LayT','Feet'],   // the finish, the layouts and the feet stay through a reload
  fromPlan:['W','L','H','Rx','Rz','Lt'],
  ids:['Hi','Di','Gap','Du','Nu','Dm','Dt','Wc','Pl','Nh','Nb'],
  wish:['Wc','Gap'],
  slider:{sel:'#bFrameL',key:'L',max:()=>hLen,min:()=>A.bL+A.wt},   // how far from the back wall the left wall shows: from the niche end's far face up to the kitchen wall
  dims:buildDims,
  // the installation and the toilet, the washing machine with the sink, the shower tray, its rack and curtain: with the walls in the bathroom's view
  extra:{name:'sani',items:[buildInstallation,buildWash,buildTray,buildShowerRack,buildCurtain]},
  // its footprint: the installation box, the toilet (as buildInstallation has them) and the washing machine besides the tall cabinet
  foot:()=>{const zf=current.zf,cz=zf+P.Lt/2;return [[0,P.Di,zf,zf+P.Lt],[P.Di,P.Di+WC.L,cz-WC.W/2,cz+WC.W/2,true],washRect()];},
  syncFlags:()=>{bq('#b-tFeet').checked=!!P.Feet;
    lays.forEach(b=>b.setAttribute('aria-pressed',+b.dataset.lay===(P[b.dataset.for]||1)));},
  view:{
    // the niche: the back wall up to the outer face of the partition next to the tall cabinet, the left wall up to L from the back wall
    frame:L=>{const [ox,oz]=O();return [ox-A.bear,ox+A.bNiche+A.wt,oz-A.bear,oz+L];},
    // the walls at the open side of the niche hide as in the bath tab: the partition while the camera is right of its inner face,
    // the wall at the niche end, the shower partition and the step between them while the camera is past the niche end;
    // the vent shaft wall (it comes in past 1400) has no rule of its own: it hides with the wall at the niche end
    fade:{bathStub:'+x',nicheEnd:'+z',shower:'+z',showerStep:'+z',shaft:'nicheEnd'},
    // as in the bath tab: the sun aims at the middle of the back wall, shadows cover 6 × 6 m
    sun:()=>{const [ox,oz]=O();return {x:(ox+A.bNiche/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
    defaults:{Wm:'auto',Wh:100,L:1400,sizes:true,fronts:'closed',dims:true,walls:true}
  }
});
