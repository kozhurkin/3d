/* ---------- the room, mm: one for every tab ----------
   Plain data and arithmetic only (no THREE, no DOM), so it also runs in Node for checks.
   x → right, z → from the door wall toward the window (top view: the door wall at the top, the window at the bottom).
   origin: the inner corner of the room between the door wall and the left wall, as seen from the room facing the door.
   Set here: what the building has (walls, ceiling) and where an opening stands in it, measured as in the room;
   what is left between them (the wall left of the door, the piers by the window) follows in apartment() */
const APT_A={
  H:3060,                           // ceiling height
  W:2710,                           // the short wall with the door, inner face to inner face (and the window wall opposite)
  L:4797,                           // the side walls, from the door wall to the window wall: 13 m² / 2710
  dR:1570,                          // the door: its right casing's outer edge from the right corner (seen from the room)
  dW:800,                           // the door: between the casings' inner edges
  dH:2000,                          // the doorway's height (the lining's head underside)
  winW:1200, winS:900, winT:2950,   // the window, centred in the wall opposite the door: width, sill and top from the floor
  tD:120, tS:120, tW:400,           // walls: the door wall, the side walls, the window wall (outer)
  cornH:110, plH:70,                // the cornice under the ceiling: its drop down the wall; the skirting board: its height
  plColor:'wood',                   // the skirting board's colour: 'wood' (as the door), 'white', 'beige', 'taupe' (walls.js: PLINTH_C)
  muralWall:'right', muralW:5000, muralH:2700,  // the photo wallpaper: on which wall ('right' is left of the way in; 'both': both side walls), its width and height,
                                                // from the skirting board's top up, glued from the left corner as one faces the wall (the rest cut off)
  wardC:964, wardAdd:400,           // the corner wardrobe ('corner', 'corner1'): its corner unit's legs, an add-on section (wardrobe.js: WC)
  wardWall:'right', wardW:1601, wardD:506, wardH:2600,   // the wardrobe: at the photo wallpaper's wall at its left end ('door': the door wall's
                                                          // right corner); its width, depth, height
  sofaWall:'left', sofaGap:100,     // the sofa (IKEA MANSTAD): its back to this side wall ('left': right of the way in), its chaise toward the window;
                                    // its back at the skirting board, the chaise's end this far off the window wall
  rosW:550, rosD:450,               // the ceiling rose, an oval in the middle of the ceiling: along the side walls, across them
  ropeH:11,                         // the twisted rope trim round the room right over the photo wallpaper's top: its height (6 deep);
                                    // the wallpaper up to its bottom, the wall over it up to the cornice white
  moldH:35,                         // the plain moulding in the rope's place, when chosen: its height (10 deep)
  decor:'plain'                     // «Фальш-декор» over the photo wallpaper, round the room: 'thin' the rope, 'plain' the moulding, both with
                                    // the white over them; 'none': the wallpaper up to the cornice, over the photo wallpaper the wall painted
                                    // as its sky (walls.js: MURAL_TOP)
};
// the false decor's height (mm): the rope's, the moulding's or none
/* the corner wardrobe: 'corner' with an add-on section along the door wall and one along the left wall (the photo wallpaper's),
   'corner1' without that one (wardrobe.js: wardCorner) */
const wardIsCorner=a=>a.wardWall==='corner'||a.wardWall==='corner1',wardAddLeft=a=>a.wardWall==='corner'?a.wardAdd:0;
const decorH=A=>A.decor==='thin'?A.ropeH:A.decor==='plain'?A.moldH:0;
const CW=70,CT=10,LT=10,PL_T_=16,SOFA_L_=2400;   // … ; PL_T_: the skirting board's thickness (walls.js: PL_T); SOFA_L_: the sofa's length (sofa.js: SF.L)   // door casings: width, thickness; the lining through the wall between them: thickness

/* Builds the whole model from the sizes; a: the sizes to change, the rest come from APT_A.
   Walls: rect r=[x0,x1,z0,z1]; ext: outer side of the wall (each wall of one room is an outer one of the model);
   holes along the long side: [from, to, top, sill]; face: where its room face is and which way it looks into the room ([+-][xz]);
   run: [from, to] along the room face; plinth: the runs of the skirting board (it stops at the door's casings); rope: the runs of the rope trim
   (it stops at the window). Room: floor rect r */
function apartment(a){
  const A=Object.assign({},APT_A,a);
  if(typeof A.decor==='boolean')A.decor=A.decor?'thin':'none';   // remembered as a yes / no before the choice of three
  const dB=A.W-A.dR-CW+LT;             // the doorway's right edge: its lining is under the casing's inner edge
  const dA=dB-A.dW-2*LT;               // … its left edge
  const dL=dA+LT-CW;                   // the left casing's outer edge from the left corner (what is left of the wall)
  const winX=A.W/2;                    // window centre
  const xR=dB-LT+CW;                   // the right casing's outer edge
  const WALLS=[
    {id:'door',name:'Стена с дверью',r:[-A.tS,A.W+A.tS,-A.tD,0],ext:'-z',rooms:['room'],holes:[[dA,dB,A.dH]],
      face:[0,'+z'],run:[0,A.W],plinth:[[0,dL],[xR,A.W]],rope:[[0,A.W]]},
    {id:'right',name:'Правая стена',r:[A.W,A.W+A.tS,0,A.L],ext:'+x',rooms:['room'],face:[A.W,'-x'],run:[0,A.L],plinth:[[0,A.L]],rope:[[0,A.L]]},
    {id:'left',name:'Левая стена',r:[-A.tS,0,0,A.L],ext:'-x',rooms:['room'],face:[0,'+x'],run:[0,A.L],plinth:[[0,A.L]],rope:[[0,A.L]]},
    {id:'window',name:'Стена с окном',r:[-A.tS,A.W+A.tS,A.L,A.L+A.tW],ext:'+z',rooms:['room'],holes:[[winX-A.winW/2,winX+A.winW/2,A.winT,A.winS]],
      face:[A.L,'-z'],run:[0,A.W],plinth:[[0,A.W]],rope:[[0,winX-A.winW/2],[winX+A.winW/2,A.W]]}
  ];
  const ROOMS=[{id:'room',name:'Комната',r:[0,A.W,0,A.L],origin:[0,0],col:'--fl-kit',tex:'laminate',at:[A.W/2,A.L/2]}];   // tex: its floor laminate (walls.js)
  const BOX={x0:-A.tS,x1:A.W+A.tS,z0:-A.tD,z1:A.L+A.tW};
  return {A,H:A.H,dA,dB,dL,winX,WALLS,ROOMS,BOX};
}

/* What does not fit with these sizes: [] when everything does. The plan's size sliders stop at the last value that fits */
function aptProblems(a){
  const m=apartment(a),A=m.A,dB=m.dB,out=[];
  m.WALLS.forEach(w=>{if(w.r[1]<w.r[0]||w.r[3]<w.r[2])out.push(`«${w.name}» не помещается`);});
  if(m.dL<0)out.push('Левый наличник двери заходит за левый угол');
  if(A.dR<0)out.push('Правый наличник двери заходит за правый угол');
  if(A.winW>A.W-200)out.push('Окно шире стены (нужно хотя бы по 100 мм до боковых стен)');
  if(A.winT-A.winS<300)out.push('Окно ниже 300 мм');
  if(A.dH+CW>A.H-A.cornH)out.push('Наличник над дверью заходит под лепнину');
  if(A.winT>A.H-A.cornH)out.push('Окно заходит под лепнину');
  if(A.plH>A.winS&&A.winS>0)out.push('Плинтус выше подоконника');
  if(A.wardWall==='door'&&A.W-PL_T_-A.wardW<dB)out.push('Шкаф у стены с дверью заходит на проём');
  if(wardIsCorner(A)&&A.W-PL_T_-A.wardC-A.wardAdd<dB)out.push('Угловой шкаф заходит на проём');
  // the wardrobe from the door's end of the left wall, the sofa from its window end
  const wardOnLeft=A.wardWall==='right'?A.wardW:wardIsCorner(A)?A.wardC+wardAddLeft(A):0;   // how far the wardrobe runs along the left wall
  if(wardOnLeft&&A.sofaWall==='right'&&PL_T_+wardOnLeft>A.L-A.sofaGap-SOFA_L_)out.push('Шкаф и диван у одной стены не помещаются');
  if(A.plH+A.muralH+decorH(A)>A.H-A.cornH)out.push(decorH(A)?'Фотообои с декором над ними заходят под лепнину':'Фотообои заходят под лепнину');
  return out;
}
