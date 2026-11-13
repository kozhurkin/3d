/* ---------- what every room view does the same way: roomKit(id, cfg) ----------
   A room module (rooms/*.js) keeps its own: sizes P, parts (computeParts), finishes FIN, appliances, dimension lines, camera
   presets, its own panel controls and texts. The kit does the rest: building the cabinets into the scene and every frame of
   them, the panel's common controls (cameras, frame slider, sizes, thickness, fronts, toggles, palette and own colour, edge
   contrast, cut list, settings to start with), the view itself (addView) and following the plan (modelHooks).
   Panel ids are '#'+px+'-…' (px: b, h, k). cfg:
     P, FIN, mats, px, panel, origin ()→[x,z] mm,
     fromModel ()→current — sizes from the plan, then the parts (also sets the module's T, TF),
     fromPlan  — keys of P that belong to the plan (left out of the saved settings),
     ids       — the sliders [data-p], onSyncIds() before their values are set (a range that moves),
     slider    {sel, key, max()} — how far the side wall shows (the view's frame),
     setCam(v), dims(dim) — dimension lines through dim(a,b,txt,tick), extra {name, build(g)} — appliances or sanitary ware,
     foot()    — extra footprint rects, walls(on) — walls in its own view (default: «Стена» toggles them),
     syncFlags(), onDoorMode(), panelText(),
     groups    — finish groups (default carcass, front), shown(g), matName(m) (null: the plain board), takeFin(sFIN, ok),
     finNowTail(), afterSyncFinish(),
     view      {frame(show), fade, sun, defaults} */

// a box mesh in group g, from its corner coordinates (m)
const boxIn=g=>(x0,x1,y0,y1,z0,z1,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.castShadow=m.receiveShadow=true;g.add(m);return m;};

const FIN_TAG={carcass:'К',front:'Ф',top:'С',apron:'А'};
const FIN_LABEL={carcass:'Корпус',front:'Фасады',top:'Столешница'};
const FIN_WORD={carcass:'корпус',front:'фасады',top:'столешница',apron:'фартук'};

function roomKit(id,cfg){
  const {P,FIN,mats,px,panel}=cfg,q=s=>panel.querySelector(s),pq=s=>q('#'+px+'-'+s);
  const groups=cfg.groups||['carcass','front'],shown=cfg.shown||(()=>true);
  let cur=cfg.fromModel();

  /* ---------- the room in the scene: built when it is on screen and something changed ---------- */
  let model=null,doors=[],extra=null,dimsGroup=null,foot=null,dirty=true;
  const clip=furnClip();   // the room's floor and top planes
  const dim=(a,b,txt,tick)=>roomDim(dimsGroup,a,b,txt,tick);
  function build(){
    cur=cfg.fromModel();
    const prev=doors;disposeGroup(model);
    ({model,doors}=buildParts(cur,mats,{prev,open:VS[id].fronts==='open'}));
    if(cfg.extra){extra=new THREE.Group();cfg.extra.build(extra);model.add(extra);}
    dimsGroup=new THREE.Group();cfg.dims(dim);model.add(dimsGroup);
    clipToFloor(model,clip);
    // its footprint for «Контуры» on the plan
    foot=furnFoot(cur,cfg.foot&&cfg.foot());if(foot){foot.material.clippingPlanes=[clip[0]];model.add(foot);}
    place();scene.add(model);dirty=false;applyVisibility();updatePanel();
  }
  // the room where it lies on the plan
  function place(){if(!model)return;const [ox,oz]=cfg.origin();model.position.x=ox*MM;model.position.z=oz*MM;}
  // what it shows wherever it is seen: fronts (the extras and the dimensions: every frame, below)
  function applyVisibility(){
    if(!model)return;const V=VS[id];
    model.children.forEach(o=>{if(o.userData.front)o.visible=V.fronts!=='hidden';});
  }
  // every frame: built when in the scene (its view, or the plan with «Шкафы») and changed; in a flight it sinks into the floor
  // or rises out of it; the doors swing wherever they are seen
  frameHooks.push((dt,ease)=>{
    const on=view===id,s=presence(id),V=VS[id];
    if(dirty&&(on||s>.001))build();
    if(!model)return;
    model.visible=s>.001;model.position.y=-(1-s)*(P.H*MM+.1);
    // on the plan it is cut at the walls' height (its top plane goes down with it in a flight), in «Контуры» its footprint shows
    const fc=furnCut(id);clip[1].constant=fc.c+model.position.y;
    if(foot){const o=fc.f*s;foot.visible=o>.01;foot.material.opacity=o;foot.position.y=.003-model.position.y;}   // the footprint stays on the floor, fading with the room
    // its dimension lines only in its own view, once it is reached; the extras go with the walls there, elsewhere the walls are there
    dimsGroup.visible=on&&V.dims!==false&&!inTransition();
    if(extra)extra.visible=!on||V.walls!==false;
    if(cfg.walls)cfg.walls(on);else if(on&&wallGroup)wallGroup.visible=V.walls!==false;
    if(model.visible)doors.forEach(d=>{
      if(held&&held.d===d){d.t=Math.min(DMAX,Math.max(0,d.t+held.dir*HOLD_RATE*dt));d.a=d.t;}
      else d.a+=(d.t-d.a)*ease(.09);
      turnDoor(d);});
  });

  /* ---------- panel ---------- */
  q('[data-cams]').querySelectorAll('[data-cam]').forEach(b=>b.addEventListener('click',()=>cfg.setCam(b.dataset.cam)));
  // how far the side wall shows: the view's frame
  const sl=cfg.slider,frameEl=q(sl.sel),show=()=>Math.min(VS[id][sl.key],sl.max());
  frameEl.addEventListener('input',e=>{VS[id][sl.key]=+e.target.value;saveView(id);sync();
    if(view===id){buildWalls(VIEWS[id]);aimView();}});
  // panel thickness and what the room has
  function syncThick(){if(cfg.syncFlags)cfg.syncFlags();panel.querySelectorAll('[data-thick]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.thick===(P[x.dataset.for]||16)));}
  panel.querySelectorAll('[data-thick]').forEach(b=>b.addEventListener('click',()=>{P[b.dataset.for]=+b.dataset.thick;syncThick();build();syncIds();}));
  // cabinet sizes
  const syncIds=()=>{if(cfg.onSyncIds)cfg.onSyncIds();cfg.ids.forEach(j=>{q(`[data-p="${j}"]`).value=P[j];});};
  cfg.ids.forEach(j=>q(`[data-p="${j}"]`).addEventListener('input',e=>{P[j]=+e.target.value;build();syncIds();}));
  // fronts: all open, all closed (or nothing pressed when they differ), or taken off
  function syncDoorMode(){
    const V=VS[id];let st=V.fronts;
    if(st!=='hidden'&&doors.length){const n=doors.filter(d=>d.t>=DMAX-.01).length,z=doors.filter(d=>d.t<=.01).length;
      st=n===doors.length?'open':z===doors.length?'closed':'mixed';if(st!=='mixed')V.fronts=st;}
    panel.querySelectorAll('[data-door]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.door===st));
    if(cfg.onDoorMode)cfg.onDoorMode();
  }
  panel.querySelectorAll('[data-door]').forEach(b=>b.addEventListener('click',()=>{
    const V=VS[id];V.fronts=b.dataset.door;if(V.fronts!=='hidden')doors.forEach(d=>d.t=V.fronts==='open'?DMAX:0);
    syncDoorMode();applyVisibility();saveView(id);}));
  // dimensions, walls (with the room's extras)
  const toggles={dims:pq('tDims'),walls:pq('tWall')};
  Object.entries(toggles).forEach(([k,el])=>el.addEventListener('change',e=>{VS[id][k]=e.target.checked;applyVisibility();saveView(id);}));

  /* ---------- finishes: a swatch paints the carcass and the fronts; its menu paints one group ---------- */
  fillPalette(panel);
  const palette=[...panel.querySelectorAll('[data-decor],[data-uc]')];
  palette.forEach(b=>{const t=document.createElement('span');t.className='tags';b.appendChild(t);});
  const sameFin=(b,f)=>f.type==='wood'?b.dataset.decor===f.decor:(b.dataset.uc||'').toLowerCase()===(f.color||'').toLowerCase();
  const custom=f=>f.type==='uni'&&!palette.some(b=>sameFin(b,f));
  const tags=pick=>groups.filter(g=>shown(g)&&pick(finOf(FIN,g))).map(g=>`<b>${FIN_TAG[g]}</b>`).join('');
  function syncFinish(){
    palette.forEach(b=>{
      const t=tags(f=>sameFin(b,f));
      b.setAttribute('aria-pressed',!!t);
      b.querySelector('.tags').innerHTML=t;
    });
    const cf=custom(FIN.front)?FIN.front:custom(FIN.carcass)?FIN.carcass:null;
    pq('uniColor').value=cf?cf.color:'#C2B8AA';
    pq('ccCard').classList.toggle('on',!!cf);
    pq('ccCode').textContent=cf?cf.color.toUpperCase():'палитра';
    pq('ccTags').innerHTML=tags(custom);
    pq('finNow').innerHTML=groups.filter(g=>FIN_LABEL[g]).map(g=>`<span>${FIN_LABEL[g]}</span><span>${finName(FIN[g])}</span>`).join('')+(cfg.finNowTail?cfg.finNowTail():'');
    if(cfg.afterSyncFinish)cfg.afterSyncFinish();
  }
  // a plain click paints the carcass and the fronts; other groups change only through the menu
  function setFinish(f,where){
    if(where==='both'){FIN.carcass=Object.assign({},f);FIN.front=Object.assign({},f);}else FIN[where]=Object.assign({},f);
    applyMaterials(mats,FIN,P.Ec);syncFinish();updatePanel();
  }
  const words=groups.map(g=>FIN_WORD[g]);
  const pickFor=b=>b.dataset.decor?{type:'wood',decor:b.dataset.decor}:{type:'uni',color:b.dataset.uc,name:b.dataset.un};
  palette.forEach(b=>{
    b.addEventListener('click',()=>setFinish(pickFor(b),'both'));
    b.title=`Клик — весь шкаф. Правая кнопка или долгое нажатие — только ${words.slice(0,-1).join(', ')} или ${words[words.length-1]}`;
    b.addEventListener('contextmenu',e=>{e.preventDefault();openCtx(e.clientX,e.clientY,w=>setFinish(pickFor(b),w),groups);});
    longPress(b,(x,y)=>openCtx(x,y,w=>setFinish(pickFor(b),w),groups));
  });
  // own colour: the picker paints the whole cabinet, or the group chosen in its menu
  let ccWhere='both';
  const ccInput=pq('uniColor');
  ccInput.addEventListener('click',()=>{if(!ccInput.dataset.keep)ccWhere='both';delete ccInput.dataset.keep;});
  pq('ccCard').addEventListener('contextmenu',e=>{e.preventDefault();openCtx(e.clientX,e.clientY,w=>{ccWhere=w;ccInput.dataset.keep='1';ccInput.click();},groups);});
  ccInput.addEventListener('input',e=>setFinish({type:'uni',color:e.target.value,name:'Свой цвет '+e.target.value.toUpperCase()},ccWhere));
  // contrast of the end faces and joint lines
  const syncEc=()=>{pq('Ec').value=P.Ec;pq('oEc').textContent=P.Ec+'%';};
  pq('Ec').addEventListener('input',e=>{P.Ec=+e.target.value;applyContrast(mats,FIN,P.Ec);syncEc();});

  /* ---------- cut list ---------- */
  const matName=m=>(cfg.matName&&cfg.matName(m))||(m==='back'?'ХДФ 4':`ЛДСП ${m==='front'?(P.TF||16):(P.T||16)} · `+finName(finOf(FIN,m)));
  function cutList(){
    const map=new Map();
    cur.parts.forEach(p=>{
      const d=[p.x1-p.x0,p.y1-p.y0,p.z1-p.z0].map(v=>Math.round(v)).sort((a,b)=>b-a);
      const key=p.name+'|'+d[0]+'|'+d[1];
      if(!map.has(key))map.set(key,{name:p.name,mat:p.mat,L:d[0],B:d[1],t:d[2],n:0});map.get(key).n++;
    });
    return [...map.values()];
  }
  function updateCut(){
    // group by material so each sheet decor can be ordered separately
    const rows=cutList().sort((a,b)=>matName(a.mat).localeCompare(matName(b.mat)));const area={};
    let last='';
    pq('cut').innerHTML=rows.map(r=>{const mn=matName(r.mat);area[mn]=(area[mn]||0)+r.L*r.B*r.n/1e6;
      const head=mn!==last?`<tr><th colspan="3" class="mh">${mn}</th></tr>`:'';last=mn;
      return head+`<tr><td>${r.name}</td><td class="n">${r.L} × ${r.B}</td><td class="n">${r.n}</td></tr>`;}).join('');
    const total=rows.reduce((s,r)=>s+r.n,0);
    pq('tot').innerHTML=`<span>${total} деталей</span>`+Object.entries(area).map(([k,v])=>`<span>${k}: ${v.toFixed(2)} м²</span>`).join('')+(cur.FL>0?`<span>Опоры регулируемые М6, шайба Ø15×5: ${cur.feet.length} шт</span>`:'');
    pq('csv').value='Деталь;Материал;Длина;Ширина;Толщина;Кол-во\n'+rows.map(r=>[r.name,matName(r.mat),r.L,r.B,r.t,r.n].join(';')).join('\n');
  }
  pq('copy').addEventListener('click',()=>{const ta=pq('csv');copyText(ta,ta.value,pq('copied'),'Скопировано');});

  /* ---------- settings to start with: in this browser, or as a code for the chat ----------
     the cabinets and their finishes; the sizes of the plan are left out, the view settings are remembered by themselves */
  const KEY='apt-'+id+'-v2';
  const getState=()=>{const p=Object.assign({},P);cfg.fromPlan.forEach(k=>delete p[k]);return {P:p,FIN:JSON.parse(JSON.stringify(FIN))};};
  const FACTORY=JSON.stringify(getState());
  function applyState(s){
    if(s.P)Object.assign(P,s.P);
    const okF=f=>f&&(f.type==='uni'||(f.type==='wood'&&DECORS[f.decor]));
    if(s.FIN&&okF(s.FIN.carcass)&&okF(s.FIN.front)){FIN.carcass=s.FIN.carcass;FIN.front=s.FIN.front;if(cfg.takeFin)cfg.takeFin(s.FIN,okF);}
    cur=cfg.fromModel();applyMaterials(mats,FIN,P.Ec);dirty=true;
  }
  { const s=readJSON(KEY);if(s)applyState(s); }
  const defMsg=pq('defMsg');
  pq('saveDef').addEventListener('click',()=>{try{localStorage.setItem(KEY,JSON.stringify(getState()));defMsg.textContent='Сохранено в этом браузере';}catch(e){defMsg.textContent='Браузер не дал сохранить. Скопируйте код и пришлите в чат';}});
  pq('resetDef').addEventListener('click',()=>{try{localStorage.removeItem(KEY);}catch(e){}applyState(JSON.parse(FACTORY));sync();defMsg.textContent='Исходные настройки возвращены';});
  pq('copyDef').addEventListener('click',()=>copyText(pq('defCode'),JSON.stringify(getState()),defMsg,'Код скопирован'));

  // the sliders' values, the room's own texts, the cut list
  function updatePanel(){
    cfg.ids.forEach(j=>{q(`[data-p-out="${j}"]`).textContent=/^N/.test(j)?P[j]:P[j]+' мм';});
    cfg.panelText();
    updateCut();
  }
  // the sizes block stays open or closed as it was left
  const sizesBox=pq('sizesBox');
  sizesBox.addEventListener('toggle',()=>{if(VS[id].sizes!==sizesBox.open){VS[id].sizes=sizesBox.open;saveView(id);}});
  function sync(){
    frameEl.max=sl.max();frameEl.value=show();q(sl.sel+'Out').textContent=show();
    sizesBox.open=VS[id].sizes!==false;
    Object.entries(toggles).forEach(([k,el])=>{el.checked=VS[id][k]!==false;});
    syncIds();syncThick();syncDoorMode();syncFinish();syncEc();updatePanel();applyVisibility();
  }

  const {frame,...viewDef}=cfg.view;
  addView(id,Object.assign({
    rooms:[id],
    frame:()=>frame(show()),
    anchor:cfg.origin,   // the remembered camera moves with the room
    // the built room: for clicks on its fronts and the checks
    furniture:()=>Object.assign({model,doors,P,current:cur,dims:dimsGroup,clip,foot},cfg.extra?{[cfg.extra.name]:extra}:{}),
    panel,
    home:()=>cfg.setCam('persp'),
    sync,
    onDoors:syncDoorMode
  },viewDef));
  // the plan changed the sizes: they come along. The room is rebuilt (when next in the scene) only if its own sizes changed;
  // otherwise it only moves — on the plan a slider moves every room at once
  modelHooks.push(()=>{const was=JSON.stringify(P);cur=cfg.fromModel();if(JSON.stringify(P)!==was)dirty=true;else place();sync();});

  const finDesc=()=>{const fc=finName(FIN.carcass),ff=finName(FIN.front);return fc===ff?fc:`корпус — ${fc}; фасады — ${ff}`;};
  return {build,syncThick,syncIds,syncFinish,updatePanel,finDesc};
}
