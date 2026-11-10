/* ---------- «Прихожая» view: the portal cabinet around the entrance door ----------
   Hall coordinates as in the hall tab, mm: x along the bearing wall from the left wall, y up, z from the bearing wall into the room;
   the hall's (0,0) is its origin on the plan. The walls make the entrance opening, the cabinet follows it: its width is the hall
   (A.hallW), the false panel and the shelf column reach the opening's sides, the mezzanine sits on its top (A.eD0, A.eD1, A.eDH),
   the reveal cladding is as deep as the door frame sits in the wall (A.eRv). How far the side walls show is the view's frame (VS.hall.Sd).
   Own scope: the room modules share names. */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W, Lw, Rw, Ht, Rv come from the plan's hall and entrance opening
const P={W:1200,H:2600,D:400,Ht:600,Lw:100,Rw:240,N:5,Pl:80,plinth:true,Rv:100,reveal:true,Ec:30,T:16,TF:16,Feet:false};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  const parts=[], W=p.W, Dc=p.D-TF, Hb=p.H-p.Ht, FL=p.Feet?10:0;   // FL: floor-standing parts sit on 10 mm feet
  const add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  // left column
  // left column is a false panel: inner side + fixed front, no outer side, no back
  add('Бок левой фальш-панели (со стороны проёма)','carcass',p.Lw-T,p.Lw,FL,Hb,0,Dc);
  add('Дно / крышка левой фальш-панели','carcass',0,p.Lw-T,FL,FL+T,0,Dc);
  add('Дно / крышка левой фальш-панели','carcass',0,p.Lw-T,Hb-T,Hb,0,Dc);
  add('Левая фальш-панель (лицевая, глухая)','front',0,p.Lw-G/2,FL,Hb-G/2,Dc,Dc+TF);
  // right column
  const rx=W-p.Rw;
  add('Бок правой колонны','carcass',W-T,W,FL,Hb,0,Dc);
  add('Задняя стенка правой колонны','carcass',rx,W-T,FL,Hb,0,T);
  const pl=p.plinth?p.Pl:0;
  add('Лицевая панель правой колонны','front',rx+G/2,W-G/2,FL,Hb-G/2,Dc,Dc+TF);
  if(pl){
    add('Цоколь правой колонны (со стороны проёма)','carcass',rx,rx+T,FL,FL+pl,T,Dc);
  }
  const step=(Hb-T-pl-FL)/(p.N+1);
  for(let i=0;i<=p.N+1;i++){
    const y=i===p.N+1?Hb-T:FL+pl+i*step;
    add(i===0?'Дно правой колонны':i===p.N+1?'Крышка правой колонны':'Полка правой колонны','carcass',rx,W-T,y,y+T,T,Dc);
  }
  // top: two separate carcasses for easier installation
  const ym=Hb+p.Ht/2-T/2;
  const topBox=(nm,x0,x1)=>{
    // no back panel: two 100 mm rails at the back (top and bottom) keep the box square and take the wall fixings
    const RB=100;
    add('Бок антресоли — '+nm,'carcass',x0,x0+T,Hb,p.H,0,Dc);
    add('Бок антресоли — '+nm,'carcass',x1-T,x1,Hb,p.H,0,Dc);
    add('Дно антресоли — '+nm,'carcass',x0+T,x1-T,Hb,Hb+T,0,Dc);
    add('Крышка антресоли — '+nm,'carcass',x0+T,x1-T,p.H-T,p.H,0,Dc);
    add('Ребро жёсткости антресоли — '+nm,'carcass',x0+T,x1-T,Hb+T,Hb+T+RB,0,T);
    add('Ребро жёсткости антресоли — '+nm,'carcass',x0+T,x1-T,p.H-T-RB,p.H-T,0,T);
    add('Полка антресоли — '+nm,'carcass',x0+T,x1-T,ym,ym+T,0,Dc-20);
  };
  topBox('центральный корпус',0,rx);
  topBox('правый корпус',rx,W);
  if(p.reveal){
    const z0=-p.Rv;
    add('Обрамление откоса левое','carcass',p.Lw-T,p.Lw,0,Hb,z0,0);
    add('Обрамление откоса правое','carcass',rx,rx+T,0,Hb,z0,0);
    add('Обрамление откоса верхнее','carcass',p.Lw-T,rx+T,Hb,Hb+T,z0,0);
  }
  const mid=(p.Lw+rx)/2;
  add('Фальш-панель антресоли (под петли, глухая)','front',0,p.Lw-G/2,Hb+G/2,p.H,Dc,Dc+TF);
  add('Фасад антресоли','front',p.Lw+G/2,mid-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'L'});
  add('Фасад антресоли','front',mid+G/2,rx-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'R'});
  add('Фасад антресоли правый','front',rx+G/2,W-G/2,Hb+G/2,p.H,Dc,Dc+TF,{hinge:'R'});
  // every board that reaches the floor is lifted onto the feet
  if(FL)parts.forEach(q=>{if(q.y0<FL)q.y0=FL;});
  // feet at the corners of each floor-standing unit (8 mm in from the outer faces)
  const cnr=(x0,x1,z0,z1)=>[[x0+8,z0+8],[x1-8,z0+8],[x0+8,z1-8],[x1-8,z1-8]];
  const feet=[...cnr(0,p.Lw,0,Dc+TF),...cnr(rx,W,0,Dc+TF)];
  return {parts,Dc,Hb,FL,feet};
}

const O=()=>ROOMS.find(r=>r.id==='hall').origin;   // the hall's (0,0) on the plan, mm
/* sizes that belong to the walls come from the plan: the false panel and the column reach the opening's sides, the mezzanine
   starts at its top; with the reveal cladding on, each is one board bigger and the board lines the opening. The cabinet is no
   higher than the ceiling */
function fromModel(){
  T=P.T||16;TF=P.TF||16;const rv=P.reveal?T:0;
  P.W=A.hallW;P.Rv=A.eRv;P.H=Math.min(P.H,A.H);
  P.Lw=A.eD0+rv;P.Rw=A.hallW-A.eD1+rv;P.Ht=P.H-(A.eDH-rv);
  current=computeParts(P);
}
fromModel();

/* camera presets of the hall tab, moved to where the hall lies on the plan */
function setCam(v){
  const base=Math.max(P.H,P.W*1.6)*MM*2.15*Math.max(1,Math.pow(1/(camera.aspect||1),.95));   // pull back on tall, narrow screens
  const views={persp:[-.6,1.32,base*.9],front:[0,1.52,base],side:[-1.35,1.56,base*.75],back:[Math.PI+.35,1.12,base*.8],low:[-.85,1.47,base*.42],shelves:[-.75,1.42,base*.65],fake:[.75,1.38,base*.8],mezz:[.35,1.38,base*.55]};
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];
  const [ox,oz]=O().map(u=>u*MM),at=(x,y,z)=>goalT.set(ox+x,y,oz+z);
  if(v==='mezz')at(P.W/2*MM,(current.Hb+P.Ht/2)*MM,P.D*MM*.5);
  else if(v==='fake')at(P.Lw*MM,current.Hb*MM*.5,P.D*MM*.5);
  else if(v==='low')at(P.W*.45*MM,.3,P.D*MM*.5);   // bottom of the cabinet and its floor junction
  else if(v==='side')at(P.W/2*MM,P.H*MM*.32,P.D*MM*.4);   // low, so the floor junction is in view
  else if(v==='shelves')at((P.W-P.Rw)*MM,current.Hb*MM*.5,P.D*MM*.5);
  else at(P.W/2*MM,P.H/2*MM,P.D*MM*.4);
  shortWay();
}

/* ---------- panel ---------- */
const panel=document.querySelector('[data-panel="hall"]'),hq=s=>panel.querySelector(s);
hq('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
// how far from the bearing wall the side walls show: the view's frame, up to the kitchen wall
const frameSd=hq('#hFrameSd');
const showSd=()=>Math.min(VS.hall.Sd,hLen);
frameSd.addEventListener('input',e=>{VS.hall.Sd=+e.target.value;saveView('hall');syncHall();
  if(view==='hall'){buildWalls(VIEWS.hall);aimView();}});
function syncHall(){
  frameSd.max=hLen;frameSd.value=showSd();hq('#hFrameSdOut').textContent=showSd();
  hq('#hSub').textContent=`${P.W} × ${P.H} × ${P.D} мм · проём ${A.eD1-A.eD0} × ${A.eDH} мм`;
}

addView('hall',{
  rooms:['hall'],
  // the bearing wall from the outer face of the left wall to the outer face of the right one, the side walls up to Sd from it
  frame:()=>{const [ox,oz]=O();return [ox-A.wt,ox+A.hallW+A.bear,oz-A.bear,oz+showSd()];},
  // as in the hall tab: the sun aims at the middle of the cabinet, shadows cover 6 × 6 m
  sun:()=>{const [ox,oz]=O();return {x:(ox+A.hallW/2)*MM,y:P.H/2*MM,z:oz*MM,half:3};},
  anchor:O,   // the remembered camera moves with the hall
  furniture:()=>({model:null,doors:[],P,current}),   // the cabinet comes in the next step
  defaults:{Wm:'auto',Wh:100,Sd:650},
  panel,
  home:()=>setCam('persp'),
  sync:syncHall
});
// the plan changed the sizes: the hall, the entrance opening and the ceiling come along
modelHooks.push(()=>{fromModel();syncHall();});
})();
