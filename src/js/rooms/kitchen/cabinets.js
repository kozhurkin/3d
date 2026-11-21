/* ---------- parts (mm) ---------- */
function computeParts(p){
  // axes: x along the kitchen wall from the left wall, y up, z from the wall into the room
  const [parts,add]=partList(),W=p.W,H=p.H,RB=100,FL=0;
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
    // the front rail lies flat under the worktop; under the sink it stands on edge by the front: lying flat it would go through the bowl
    { const edge=b.k==='sink';add('Царга передняя'+nm,'carcass',x0+T,x1-T,ytop-(edge?RB:T),ytop,zcB-(edge?T:RB),zcB); }
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
  // mezzanine row up to the ceiling: three equal boxes over the worktop and one over the fridge; bottoms are overlaid.
  // Their fronts open to the sides in turn, or up (AntUp)
  if(p.Ant!==false&&p.Ha>2*T+40){
    const aw=xr/3,boxes=[[0,aw],[aw,2*aw],[2*aw,xr],[xr,xF]];
    boxes.forEach(([x0,x1],i)=>{
      const nm=' — '+(i<3?(i+1):'над холодильником');
      add('Дно антресоли'+nm,'carcass',x0,x1,yAnt,yAnt+T,0,zcA);
      add('Бок антресоли'+nm,'carcass',x0,x0+T,yAnt+T,H,0,zcA);
      add('Бок антресоли'+nm,'carcass',x1-T,x1,yAnt+T,H,0,zcA);
      add('Крышка антресоли'+nm,'carcass',x0+T,x1-T,H-T,H,0,zcA);
      add('Ребро жёсткости антресоли'+nm,'carcass',x0+T,x1-T,yAnt+T,yAnt+T+Math.min(80,(p.Ha-2*T)/3),0,T);
      add('Фасад антресоли','front',x0+G/2,x1-G/2,yAnt+G/2,H-G/2,zcA,zfA,{hinge:p.AntUp?'U':i%2?'R':'L'});
    });
  }
  const feet=[];
  return {parts,FL,feet,ovY,xr,xF,ytop,yW,yAnt,zfB,zfW,Hb:p.Ct};
}

const O=()=>ROOMS.find(r=>r.id==='kitchen').origin;   // the kitchen's (0,0) on the plan, mm
// the hob (300 mm wide) stays inside its cabinet, 20 mm clear of the right edge (fridge side); not used when it is turned along
function clamp(w){const hm=Math.max(0,(P.B3-300)/2);P.Hx=Math.max(-hm,Math.min(hm-20,w.Hx));}
// sizes that belong to the walls come from the plan; a run longer than the wall is left as it is, the panel says so
function fromModel(w){P.W=kW;P.H=A.H;P.L=A.kL;P.Rx=A.hallW-A.kOver+kW;P.WinS=A.winS;P.DeskWall=!!A.deskWall;P.WardBack=!!A.wardBack;clamp(w);T=P.T||16;TF=P.TF||16;current=computeParts(P);placeDining();
  // the worktop's cut-out for the sink's bowl, under its rim (not in the cut list's parts: they stay as the old kitchen's)
  const top=current.parts.find(q=>q.name==='Столешница'),x=P.B1/2;
  if(top)top.hole=[x-SK.w/2,x+SK.w/2,SK.z-SK.d/2,SK.z+SK.d/2];
  return current;}

/* ---------- finishes and materials ---------- */
// finish per part group: wood decor or plain colour
const FIN={carcass:{type:'uni',color:'#F1F0EA',name:'Белый премиум W1000 ST9'},front:{type:'uni',color:'#C2B8AA',name:'Серый кашемир U702 ST9'},top:{type:'wood',decor:'C1385'},apron:null};
const mats=makeMats();
applyMaterials(mats,FIN,P.Ec);

