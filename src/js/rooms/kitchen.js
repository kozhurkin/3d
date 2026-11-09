/* ---------- «Кухня» view: the kitchen wall with its left wall, and the cabinets along it ----------
   Kitchen coordinates as in the kitchen tab, mm: x along the kitchen wall from the left wall, y up, z from the wall into the room;
   the kitchen's (0,0) is its origin on the plan. The wall width and the ceiling come from the plan (A.kW, A.H),
   how far the left wall shows is the view's frame (VS.kitchen.L). Own scope: the room modules share names (P, T, computeParts…). */
(function(){
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W and H are the plan's kitchen wall and ceiling
const P={W:2200,H:2600,B1:450,B2:450,B3:600,Fr:600,Fh:2000,Fd:665,Ct:900,Db:600,Pl:100,Dw:350,Gw:550,Gh:650,Ha:400,Da:600,Hx:-150,Nw:1,Ant:true,Dish:true,Apron:true,OvDr:false,Hob:'built',HobAlong:false,Plinth:true,Ec:30,T:16,TF:16,Tt:38};
let current=null;

/* ---------- parts (mm) ---------- */
function computeParts(p){
  // axes: x along the kitchen wall from the left wall, y up, z from the wall into the room
  const parts=[],W=p.W,H=p.H,RB=100,FL=0;
  const add=(name,mat,x0,x1,y0,y1,z0,z1,extra)=>{const o=Object.assign({name,mat,x0,x1,y0,y1,z0,z1},extra||{});parts.push(o);return o;};
  const pl=p.Plinth!==false?p.Pl:0, ytop=p.Ct-p.Tt;          // base carcass from the plinth to the underside of the worktop
  const zfB=p.Db-20, zcB=zfB-TF;                              // base fronts sit 20 mm behind the worktop edge
  const base=[{w:p.B1,k:'sink',nm:'под мойку'},{w:p.B2,k:'door',nm:'средний'},{w:p.B3,k:'oven',nm:'под духовку'}];
  let x=0,ovY=0;const runs=[];
  if(p.Dish!==false)base[1]={w:p.B2,k:'dish',nm:'посудомоечная машина'};
  base.forEach((b,i)=>{
    const x0=x,x1=x+b.w;runs.push({x0,x1,k:b.k});x=x1;
    const nm=' — '+b.nm;
    if(b.k==='dish'){   // built-in dishwasher: no carcass, only a front hung on its door
      add('Фасад посудомоечной машины','front',x0+G/2,x1-G/2,pl+G/2,ytop-G/2,zcB,zfB,{hinge:'B'});return;}
    add('Бок нижнего шкафа'+nm,'carcass',x0,x0+T,pl,ytop,0,zcB);
    add('Бок нижнего шкафа'+nm,'carcass',x1-T,x1,pl,ytop,0,zcB);
    add('Дно нижнего шкафа'+nm,'carcass',x0+T,x1-T,pl,pl+T,0,zcB);
    add('Царга передняя'+nm,'carcass',x0+T,x1-T,ytop-T,ytop,zcB-RB,zcB);
    add('Царга задняя'+nm,'carcass',x0+T,x1-T,ytop-RB,ytop,0,T);
    if(b.k==='door')add('Полка нижнего шкафа'+nm,'carcass',x0+T,x1-T,(pl+ytop)/2,(pl+ytop)/2+T,T,zcB-20);
    if(b.k==='oven'){
      const OG=G/2+3;   // oven-to-front gap: the oven is drawn 3 mm in from the cabinet sides, so top/bottom match its side gaps
      if(p.OvDr){   // oven down on the plinth, pull-out drawer between the oven and the worktop
        ovY=pl;const oy1=pl+595;
        add('Полка над духовкой','carcass',x0+T,x1-T,oy1,oy1+T,0,zcB);
        const fy0=oy1+OG,fy1=ytop-G/2;   // overlay front covers the shelf edge
        add('Фасад ящика над духовкой','front',x0+G/2,x1-G/2,fy0,fy1,zcB,zfB,{hinge:'S',slide:'ov',travel:zcB-80});
        const dy0=oy1+T+G/2+8,dh=Math.max(50,fy1-dy0-22),dx0=x0+T+13,dx1=x1-T-13,dz0=40;   // the drawer box stays on top of the shelf
        add('Бок ящика','carcass',dx0,dx0+T,dy0,dy0+dh,dz0,zcB,{inSlide:'ov'});
        add('Бок ящика','carcass',dx1-T,dx1,dy0,dy0+dh,dz0,zcB,{inSlide:'ov'});
        add('Задняя стенка ящика','carcass',dx0+T,dx1-T,dy0,dy0+dh,dz0,dz0+T,{inSlide:'ov'});
        add('Дно ящика','back',dx0,dx1,dy0-4,dy0,dz0,zcB,{inSlide:'ov'});
      }else{        // oven right under the hob, tilting flap below it
        const oy=ytop-595;ovY=oy;
        add('Полка под духовку','carcass',x0+T,x1-T,oy-T,oy,0,zcB);
        add('Фасад откидной под духовкой','front',x0+G/2,x1-G/2,pl+G/2,oy-OG,zcB,zfB,{hinge:'F'});   // overlay front covers the shelf edge
      }
    }else{
      add('Фасад нижнего шкафа','front',x0+G/2,x1-G/2,pl+G/2,ytop-G/2,zcB,zfB,{hinge:i===0?'L':'R'});
    }
  });
  const xr=x, xF=xr+p.Fr;   // end of the base run, end of the fridge niche
  // one continuous plinth; it also covers the dishwasher feet, the dishwasher door opens above it
  if(pl>0)add('Цоколь кухни','front',0,xr,0,pl-G/2,zcB-40-T,zcB-40);
  add('Столешница','top',0,xr,ytop,p.Ct,0,p.Db);
  if(p.Apron)add('Фартук','apron',0,xr,p.Ct,Math.min(p.Ct+p.Gw,H-p.Ha-200),0,6);   // one 6 mm wall panel from the worktop to the wall cabinets
  // wall cabinets over the base run; the one over the hob starts higher and carries the cooker hood
  const zfW=p.Dw, zcW=zfW-TF, yAnt=H-p.Ha, yW=Math.min(p.Ct+p.Gw,yAnt-200);   // the mezzanine line stays fixed even with mezzanines off
  const zfA=p.Da, zcA=zfA-TF;
  runs.forEach((r,i)=>{
    const y0=r.k==='oven'?Math.max(yW,p.Ct+p.Gh):yW, nm=r.k==='oven'?' — над варкой':' — '+(i+1);
    if(yAnt-y0<2*T+60)return;
    add('Бок навесного шкафа'+nm,'carcass',r.x0,r.x0+T,y0,yAnt,0,zcW);
    add('Бок навесного шкафа'+nm,'carcass',r.x1-T,r.x1,y0,yAnt,0,zcW);
    add('Дно навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,y0,y0+T,0,zcW);
    add('Крышка навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,yAnt-T,yAnt,0,zcW);
    const rb=Math.min(80,(yAnt-y0-2*T)/3);
    add('Ребро жёсткости навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,y0+T,y0+T+rb,0,T);
    add('Ребро жёсткости навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,yAnt-T-rb,yAnt-T,0,T);
    const st=(yAnt-y0-T)/(p.Nw+1);
    for(let j=1;j<=p.Nw;j++){const y=y0+j*st;add('Полка навесного шкафа'+nm,'carcass',r.x0+T,r.x1-T,y-T/2,y+T/2,T,zcW-10);}
    add('Фасад навесного шкафа','front',r.x0+G/2,r.x1-G/2,y0,yAnt-G/2,zcW,zfW,{hinge:i===0?'L':'R'});
  });
  // mezzanine row up to the ceiling: three equal boxes over the worktop and one over the fridge; bottoms are overlaid
  if(p.Ant!==false&&p.Ha>2*T+40){
    const aw=xr/3,boxes=[[0,aw],[aw,2*aw],[2*aw,xr],[xr,xF]];
    boxes.forEach(([x0,x1],i)=>{
      const nm=' — '+(i<3?(i+1):'над холодильником');
      add('Дно антресоли'+nm,'carcass',x0,x1,yAnt,yAnt+T,0,zcA);
      add('Бок антресоли'+nm,'carcass',x0,x0+T,yAnt+T,H,0,zcA);
      add('Бок антресоли'+nm,'carcass',x1-T,x1,yAnt+T,H,0,zcA);
      add('Крышка антресоли'+nm,'carcass',x0+T,x1-T,H-T,H,0,zcA);
      add('Ребро жёсткости антресоли'+nm,'carcass',x0+T,x1-T,yAnt+T,yAnt+T+Math.min(80,(p.Ha-2*T)/3),0,T);
      add('Фасад антресоли','front',x0+G/2,x1-G/2,yAnt+G/2,H-G/2,zcA,zfA,{hinge:i%2?'R':'L'});
    });
  }
  const feet=[];
  return {parts,FL,feet,ovY,xr,xF,ytop,yW,yAnt,zfB,zfW,Hb:p.Ct};
}

const O=()=>ROOMS.find(r=>r.id==='kitchen').origin;   // the kitchen's (0,0) on the plan, mm
// sizes that belong to the walls come from the plan
function fromModel(){P.W=A.kW;P.H=A.H;T=P.T||16;TF=P.TF||16;current=computeParts(P);}
fromModel();

/* camera presets of the kitchen (as in the kitchen tab), moved to where the kitchen lies on the plan */
function setCam(v){
  const base=Math.max(P.H,P.W*1.15)*MM*1.75*Math.max(1,Math.pow(1/(camera.aspect||1),.95));
  const c=current,b1=P.B1*MM,b2=P.B2*MM,b3=P.B3*MM,[ox,oz]=O().map(u=>u*MM);
  const views={persp:[-.55,1.3,base*1.1],front:[0,1.5,base],side:[-1.25,1.45,base*.85],perspR:[.55,1.3,base*1.2],sink:[.25,1.05,base*.4],hob:[-.25,1.15,base*.55],back:[Math.PI+.4,1.3,base*1.18],upper:[.5,1.2,3.5]};
  const s=views[v];goal.theta=s[0];goal.phi=s[1];goal.r=s[2];
  const at=(x,y,z)=>goalT.set(ox+x,y,oz+z);
  if(v==='sink')at(b1/2,P.Ct*MM,.3);
  else if(v==='hob')at(b1+b2+b3/2+(P.HobAlong?0:P.Hx*MM),(P.Ct+Math.max(c.yW,P.Ct+P.Gh))/2*MM,.3);   // between the hob and the cooker hood
  else if(v==='upper')at(P.W/2*MM,c.yAnt*MM-.15,.3);
  else if(v==='persp')at(P.W/2*MM-.25,P.H/2*MM,.45);   // a little left of the wall centre, so the kitchen sits in the middle of the frame
  else at(P.W/2*MM,P.H/2*MM,.45);
  shortWay();
}

/* ---------- panel ---------- */
const panel=document.querySelector('[data-panel="kitchen"]'),kq=s=>panel.querySelector(s);
kq('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>setCam(b.dataset.cam)));
// how far from the kitchen wall the left wall shows: the view's frame, up to the window wall
const frameL=kq('#kFrameL');
const showL=()=>Math.min(VS.kitchen.L,A.kL);
function syncKitchen(){
  frameL.max=A.kL;frameL.value=showL();kq('#kFrameLOut').textContent=showL();
  kq('#kSub').textContent=`стена ${A.kW} · потолок ${A.H} мм — с «Планировки»`;
}
frameL.addEventListener('input',e=>{VS.kitchen.L=+e.target.value;saveView('kitchen');syncKitchen();
  if(view==='kitchen'){buildWalls(VIEWS.kitchen);aimView();}});

addView('kitchen',{
  rooms:['kitchen'],
  // the kitchen wall whole and the left wall up to L from it, as the kitchen tab showed them
  frame:()=>{const [ox,oz]=O();return [ox-A.bear,ox+A.kW,kZ0,oz+showL()];},
  // as in the kitchen tab: the sun aims at the middle of the wall, shadows cover 6 × 6 m
  sun:()=>{const [ox,oz]=O();return {x:(ox+A.kW/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
  anchor:O,   // the remembered camera moves with the kitchen
  defaults:{Wm:'auto',Wh:100,L:1350},
  panel,
  home:()=>setCam('persp'),
  sync:syncKitchen
});
modelHooks.push(()=>{fromModel();syncKitchen();});
})();
