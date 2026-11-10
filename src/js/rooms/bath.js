/* ---------- «Санузел» view: the toilet niche — the tall cabinet against the back wall, the installation along the left wall ----------
   Bathroom coordinates as in the bath tab, mm: x along the back wall from the left wall, y up, z from the back wall into the room;
   the bathroom's (0,0) is its origin on the plan. The niche, the ceiling and the riser box come from the plan
   (A.bNiche, A.bL, A.H, A.rX, A.rZ), how far the left wall shows is the view's frame (VS.bath.L). Own scope: the room modules share names. */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W, L, H, Rx, Rz are the plan's niche, ceiling and riser box
const P={W:1200,H:2600,Rx:250,Rz:250,Hi:1200,Di:200,Gap:300,Du:200,Nu:2,Dt:300,L:1100,Lt:800,Wc:800,Dm:200,Pl:80,Sp:1500,Nb:2,Nh:3,Ec:30,T:16,TF:16};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  // axes: x along the back wall (left wall at x=0), y up, z from the back wall into the room
  const parts=[],W=p.W,H=p.H,RB=100,FL=p.Feet?10:0;   // FL: the tall cabinet sits on 10 mm feet
  const add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  const zf=Math.max(p.Dt,p.Rz+TF), zc=zf-TF;   // front plane of the back run (tall cabinet + riser cladding)
  const xb=W, xa=W-Math.min(p.Wc,W-p.Rx);     // carcass at the right; cladding covers riser + filler on the left
  const pl=p.Pl, sp=p.Hi;   // door split follows the installation height
  // tall cabinet, floor to ceiling, against the back wall, standing on a plinth
  add('Бок пенала','carcass',xa,xa+T,FL,H,0,zc);
  add('Бок пенала','carcass',xb-T,xb,FL,H,0,zc);
  add('Дно пенала','carcass',xa+T,xb-T,FL+pl,FL+pl+T,0,zc);
  add('Крышка пенала','carcass',xa+T,xb-T,H-T,H,0,zc);
  add('Полка-разделитель пенала','carcass',xa+T,xb-T,sp-T/2,sp+T/2,0,zc);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,FL+pl+T,FL+pl+T+RB,0,T);
  add('Ребро жёсткости пенала','carcass',xa+T,xb-T,H-T-RB,H-T,0,T);
  const sb=(sp-T/2-FL-pl-T)/(p.Nb+1);
  for(let i=1;i<=p.Nb;i++){const y=FL+pl+T+i*sb-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  const sh=(H-T-sp-T/2)/(p.Nh+1);
  for(let i=1;i<=p.Nh;i++){const y=sp+T/2+i*sh-T/2;add('Полка пенала','carcass',xa+T,xb-T,y,y+T,T,zc-20);}
  if(pl>0)add('Цоколь пенала и короба (заподлицо с фасадами)','front',G/2,W-G/2,FL,FL+pl-G/2,zc,zf);
  // fronts: riser cladding (fixed, two panels) + 4 doors, split at the same height
  const xm=(xa+xb)/2;
  [[FL+pl+G/2,sp-G/2,'нижняя'],[sp+G/2,H-G/2,'верхняя']].forEach(([y0,y1,nm])=>{
    add('Облицовка короба, '+nm+' (фасад, глухой)','front',0,xa-G/2,y0,y1,zc,zf);
    add('Фасад пенала','front',xa+G/2,xm-G/2,y0,y1,zc,zf,{hinge:'L'});
    add('Фасад пенала','front',xm+G/2,xb-G/2,y0,y1,zc,zf,{hinge:'R'});
  });
  // upper cabinet above the installation, along the left wall
  p.Lt=Math.max(200,p.L-zf);   // installation run fills the rest of the left wall
  const yb=p.Hi+p.Gap,dc=p.Du-TF,z0=zf,z1=zf+p.Lt;
  // separate product: open niche box in the gap between the installation and the upper cabinet, with its own LDSP back
  if(p.Mid!==false&&p.Gap>2*T+20){
    const dm=p.Dm||200;
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z0,z0+T);
    add('Бок ниши над инсталляцией','carcass',0,dm,p.Hi,yb,z1-T,z1);
    add('Дно ниши над инсталляцией','carcass',T,dm,p.Hi,p.Hi+T,z0+T,z1-T);
    add('Крышка ниши над инсталляцией','carcass',T,dm,yb-T,yb,z0+T,z1-T);
    add('Задняя стенка ниши над инсталляцией','carcass',0,T,p.Hi,yb,z0+T,z1-T);
  }
  if(H-yb>2*T+60){
    add('Бок верхнего шкафа','carcass',0,dc,yb,H,z0,z0+T);
    add('Бок верхнего шкафа','carcass',0,dc,yb,H,z1-T,z1);
    add('Дно верхнего шкафа','carcass',0,dc,yb,yb+T,z0+T,z1-T);
    add('Крышка верхнего шкафа','carcass',0,dc,H-T,H,z0+T,z1-T);
    const rb=Math.min(RB,(H-yb-2*T)/3);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,yb+T,yb+T+rb,z0+T,z1-T);
    add('Ребро жёсткости верхнего шкафа','carcass',0,T,H-T-rb,H-T,z0+T,z1-T);
    const su=(H-yb-T)/(p.Nu+1);
    for(let i=1;i<=p.Nu;i++){const y=yb+i*su;add('Полка верхнего шкафа','carcass',T,dc-10,y,y+T,z0+T,z1-T);}
    const zm=(z0+z1)/2;
    add('Фасад верхнего шкафа','front',dc,p.Du,yb,H-G/2,z0+G/2,zm-G/2,{pivot:{x:p.Du,z:z0+G/2,s:1}});
    add('Фасад верхнего шкафа','front',dc,p.Du,yb,H-G/2,zm+G/2,z1-G/2,{pivot:{x:p.Du,z:z1-G/2,s:-1}});
  }
  // every board that reaches the floor is lifted onto the feet
  if(FL)parts.forEach(q=>{if(q.y0<FL)q.y0=FL;});
  // feet at the corners of each floor-standing unit (8 mm in from the outer faces): tall cabinet, and the riser cladding front
  const cnr=(x0,x1,z0,z1)=>[[x0+8,z0+8],[x1-8,z0+8],[x0+8,z1-8],[x1-8,z1-8]];
  const feet=[...cnr(xa,xb,0,zf),[8,zf-8],[xa-8,zf-8]];
  return {parts,zf,yb,Hb:p.Hi,FL,feet};
}

const O=()=>ROOMS.find(r=>r.id==='bath').origin;   // the bathroom's (0,0) on the plan, mm
function clamp(){
  P.Wc=Math.min(P.Wc,P.W-P.Rx);
  P.Gap=Math.min(P.Gap,Math.max(0,P.H-P.Hi-200));
}
// sizes that belong to the walls come from the plan; the tall cabinet and the gap over the installation have to fit
function fromModel(){P.W=A.bNiche;P.L=A.bL;P.H=A.H;P.Rx=A.rX;P.Rz=A.rZ;clamp();T=P.T||16;TF=P.TF||16;current=computeParts(P);}
fromModel();

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

/* ---------- panel ---------- */
const panel=document.querySelector('[data-panel="bath"]'),bq=s=>panel.querySelector(s);
bq('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
// how far from the back wall the left wall shows: the view's frame, up to the kitchen wall
const frameL=bq('#bFrameL');
const showL=()=>Math.min(VS.bath.L,hLen);
frameL.addEventListener('input',e=>{VS.bath.L=+e.target.value;saveView('bath');syncBath();
  if(view==='bath'){buildWalls(VIEWS.bath);aimView();}});
function syncBath(){
  frameL.max=hLen;frameL.value=showL();bq('#bFrameLOut').textContent=showL();
  bq('#bSub').textContent=`ниша ${P.W} × ${P.L} мм · потолок ${P.H} мм · короб ${P.Rx} × ${P.Rz} мм`;
}

addView('bath',{
  rooms:['bath'],
  // the niche: the back wall up to the outer face of the partition next to the tall cabinet, the left wall up to L from the back wall
  frame:()=>{const [ox,oz]=O();return [ox-A.bear,ox+A.bNiche+A.wt,oz-A.bear,oz+showL()];},
  // the walls at the open side of the niche hide as in the bath tab: the partition while the camera is right of its inner face,
  // the wall at the niche end and the shower partition while the camera is past the niche end
  fade:{bathStub:'+x',nicheEnd:'+z',shower:'+z'},
  // as in the bath tab: the sun aims at the middle of the back wall, shadows cover 6 × 6 m
  sun:()=>{const [ox,oz]=O();return {x:(ox+A.bNiche/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
  anchor:O,   // the remembered camera moves with the bathroom
  furniture:()=>({model:null,doors:[],P,current}),   // the cabinets come in the next step
  defaults:{Wm:'auto',Wh:100,L:1400},
  panel,
  home:()=>setCam('persp'),
  sync:syncBath
});
// the plan changed the sizes: the niche, the ceiling, the riser box and the bathroom's place come along
modelHooks.push(()=>{fromModel();syncBath();});
})();
