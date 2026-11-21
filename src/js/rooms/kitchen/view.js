/* ---------- dimension lines of the kitchen (kitchen axes; they belong to the kitchen and move with it) ---------- */
function buildDims(dim,gaps,group){
  const V=(x,y,z)=>new THREE.Vector3(x*MM,y*MM,z*MM),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0);
  const c=current,zf=P.Db+40;let x=0;
  [P.B1,P.B2,P.B3].forEach(w=>{dim(V(x,P.Ct+60,zf),V(x+w,P.Ct+60,zf),`${w}`,Y);x+=w;});
  dim(V(c.xr,P.Fh+60,P.Fd+40),V(c.xF,P.Fh+60,P.Fd+40),`${P.Fr}`,Y);
  dim(V(0,P.H+120,0),V(P.W,P.H+120,0),`${P.W}`,Y);
  dim(V(-60,0,zf),V(-60,P.Ct,zf),`${P.Ct}`,X);
  dim(V(-60,P.Ct,P.Dw+40),V(-60,c.yW,P.Dw+40),`${c.yW-P.Ct}`,X);
  if(P.Ant!==false)dim(V(P.W+80,c.yAnt,P.Dw+40),V(P.W+80,P.H,P.Dw+40),`${P.Ha}`,X);
  dim(V(P.W+80,0,0),V(P.W+80,0,P.Db),`${P.Db}`,Y);
  // the table: how far from the kitchen wall, its sides, its height (shown with the table: see frame below)
  const tz1=TB.z+TB.w,tx=TB.l+60,n0=group.children.length;
  dim(V(40,TB.h,0),V(40,TB.h,TB.z),`${TB.z}`,Y);
  dim(V(tx,TB.h,TB.z),V(tx,TB.h,tz1),`${TB.w}`,Y);
  dim(V(0,TB.h,tz1+60),V(TB.l,TB.h,tz1+60),`${TB.l}`,Y);
  dim(V(tx,0,tz1+60),V(tx,TB.h,tz1+60),`${TB.h}`,X);
  group.children.slice(n0).forEach(o=>{o.userData.table=true;});
  // between the shelves of each wall cabinet
  if(P.Nw){const b=c.parts.filter(q=>/^(Дно|Полка|Крышка) навесного шкафа/.test(q.name));
    [...new Set(b.map(q=>q.x0))].forEach(x=>gaps(b.filter(q=>q.x0===x)));}
}

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

/* ---------- panel: what the kitchen has, the apron's finish and its texts ---------- */
const panel=document.querySelector('[data-panel="kitchen"]'),kq=s=>panel.querySelector(s);
function syncHob(){panel.querySelectorAll('[data-hob]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.hob===(P.Hob||'built')));}
panel.querySelectorAll('[data-hob]').forEach(b=>b.addEventListener('click',()=>{P.Hob=b.dataset.hob;syncHob();k.build();}));
kq('#k-tOvDr').addEventListener('change',e=>{P.OvDr=e.target.checked;k.build();});
kq('#k-tHobAlong').addEventListener('change',e=>{P.HobAlong=e.target.checked;k.syncThick();k.build();});
kq('#k-tApron').addEventListener('change',e=>{P.Apron=e.target.checked;k.build();});
kq('#k-tDish').addEventListener('change',e=>{P.Dish=e.target.checked;k.build();});
kq('#k-tAnt').addEventListener('change',e=>{P.Ant=e.target.checked;k.syncThick();k.build();});   // without them «вверх» is greyed out
kq('#k-tAntUp').addEventListener('change',e=>{P.AntUp=e.target.checked;k.build();});
// the wall and the ceiling (from the plan), what the finishes are, what is left between the cabinets
function panelText(){
  kq('#k-W').textContent=P.W+' мм';kq('#k-H').textContent=P.H+' мм';
  kq('#kSub').textContent=`стена ${P.W} мм · потолок ${P.H} мм · ${k.finDesc()}; столешница — ${finName(FIN.top)}`;
  { const t=P.T||16,f=v=>v.toFixed(1).replace('.',',').replace(',0',''),c=current;
    const pl=P.Plinth!==false?P.Pl:0,hb=P.Ct-P.Tt-pl;
    const free=P.W-(P.B1+P.B2+P.B3+P.Fr);
    kq('#k-gapBase').textContent=`Высота корпуса ${hb} мм · фасады ${hb-2} мм`+(free>0?` · справа свободно ${free} мм`:'');
    const over=kq('#k-runOver');over.hidden=free>=0;over.textContent=free<0?`Тумбы и ниша холодильника длиннее стены на ${-free} мм`:'';
    const hw=c.yAnt-c.yW,st=(hw-t)/(P.Nw+1);
    kq('#k-gapWall').textContent=`Высота навесных ${hw} мм`+(P.Nw?` · между полками ${f(st-t)} мм`:'')+` · вытяжка ${Math.max(c.yW,P.Ct+P.Gh)-P.Ct} мм над столешницей`; }
}

// the rest of the room (rooms/living/) is built with the kitchen: what it needs of it
living.attach({P,applDoor,handleMat,rebuild:()=>k.build()});
const k=roomKit('kitchen',{
  P,FIN,mats,px:'k',panel,origin:O,fromModel,setCam,panelText,
  fromPlan:['W','H','L','Rx','WinS','DeskWall','WardBack'],
  ids:['B1','B2','B3','Hx','Ct','Db','Pl','Fr','Fh','Fd','Dw','Gw','Gh','Ha','Da','Nw'],
  wish:['Hx'],
  slider:{sel:'#kFrameL',key:'L',max:()=>Math.min(A.kL,2650)},   // how far from the kitchen wall the left wall shows: up to 2650 (the window wall if nearer)
  dims:buildDims,
  // the appliances (the oven's and the fridge's doors open), the dining table, the lamp and the wall shelf over it, the dining chairs, and the rest
  // of the room (rooms/living/: the desk, its chair, the display cabinet, the sofa, the wardrobe…) go with the walls in the kitchen's view. None of their doors is a cabinet front: «Фасады»
  // leaves them (loose), and they are built as they were (prev), never opened with the fronts
  extra:{name:'appl',loose:true,items:[buildAppliances,buildTable,buildPendant,buildSpiceShelf,buildChairs,...living.items]},
  // its own view shows the cabinets and the dining table with its chairs, its lamp and the shelf over it — the table only once the frame shows the left wall past it; the rest of the room
  // (rooms/living/) stands in the apartment (the plan, the walk), not in the kitchen tab
  frame:(on,{extra,dims,show})=>{
    const fits=show>=TB.z+TB.w,has=(u,ks)=>ks.some(k=>u[k]===true);
    if(extra)extra.children.forEach(o=>{const u=o.userData;if(has(u,living.keys))o.visible=!on;else if(has(u,['table','chair','pendant','spice']))o.visible=!on||fits;});
    if(dims)dims.children.forEach(o=>{if(o.userData.table===true)o.visible=fits;});
  },
  foot:()=>[[current.xr+10,current.xF-10,20,P.Fd-10],[0,TB.l,TB.z,TB.z+TB.w]].concat(living.foot()),   // its footprint: the fridge besides the base run, the table; the rest of the room's (living/api.js)
  syncFlags:()=>{kq('#k-tAnt').checked=P.Ant!==false;kq('#k-tAntUp').checked=!!P.AntUp;kq('#k-tAntUp').disabled=P.Ant===false;kq('#k-fAntUp').style.opacity=P.Ant===false?.45:1;kq('#k-tDish').checked=P.Dish!==false;kq('#k-tApron').checked=!!P.Apron;kq('#k-tOvDr').checked=!!P.OvDr;kq('#k-tHobAlong').checked=!!P.HobAlong;kq('#k-fHx').hidden=!!P.HobAlong;syncHob();},
  // finishes: the worktop and the apron (as the worktop unless it has its own) besides the carcass and the fronts
  groups:['carcass','front','top','apron'],
  shown:g=>g!=='apron'||!!P.Apron,
  matName:m=>m==='apron'?'Фартук 6 мм · '+finName(finOf(FIN,'apron')):m==='top'?`Столешница ${P.Tt} мм · `+finName(finOf(FIN,'top')):null,
  takeFin:(f,ok)=>{if(ok(f.top))FIN.top=f.top;FIN.apron=ok(f.apron)?f.apron:null;},
  finNowTail:()=>P.Apron?`<span>Фартук</span><span>${FIN.apron?finName(FIN.apron)+' <button class="lnk" id="k-apronReset">как столешница</button>':'как столешница'}</span>`:'',
  afterSyncFinish:()=>{const ar=kq('#k-apronReset');if(ar)ar.addEventListener('click',()=>{FIN.apron=null;applyMaterials(mats,FIN,P.Ec);k.syncFinish();k.updatePanel();});},
  view:{
    // the kitchen wall whole and the left wall up to L from it, as the kitchen tab showed them
    frame:L=>{const [ox,oz]=O();return [ox-A.bear,ox+kW,kZ0,oz+L];},
    // as in the kitchen tab: the sun aims at the middle of the wall, shadows cover 6 × 6 m
    sun:()=>{const [ox,oz]=O();return {x:(ox+kW/2)*MM,y:A.H/2*MM,z:oz*MM,half:3};},
    defaults:{Wm:'auto',Wh:100,L:1350,sizes:true,fronts:'closed',dims:true,walls:true}
  }
});
