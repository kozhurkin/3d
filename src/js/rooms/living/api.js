const living={
  attach(k){({P,applDoor,handleMat,rebuild}=k);},
  // the work place toward the dining table: its desk's gap from the window wall (GAP, or none), the desk and the display cabinet as deep
  // along the left wall as they stand (back); the kitchen sets the gap (kitchen/dining.js: placeDining)
  GAP,back:DK.W+VT.D,vitName:()=>VTC[vitPick].of,   // what stands at the desk's end, for the table's card
  setGap(g){DK.gap=g;},
  // the builders of all of it, in this order: the kitchen builds them among its own (kitchen/view.js: extra.items), loose
  items:[buildDesk,buildDeskChair,buildVitrine,buildSofa,buildWardrobe,buildMezzanine,buildSofaShelf,buildRack,buildRadiator],
  // what the walker cannot pass ([x0, x1, z0, z1], kitchen mm): the desk, the display cabinet, the sofa, the wardrobe, the racks, the radiator
  foot:()=>[[0,DK.D,P.L-DK.gap-DK.W,P.L-DK.gap],[0,VT.W,vitAt()-VT.D,vitAt()],
    [P.Rx-SF.D,P.Rx,sofaAt(),sofaAt()+SF.W],[P.Rx-SF.Dc,P.Rx,sofaAt()+SF.W-SF.arm-SF.chaise,sofaAt()+SF.W],
    [P.Rx-wardLeg(),P.Rx,wardBody()-WR.d,wardAt()],[P.Rx-WR.d,P.Rx,wardEnd(),wardBody()-WR.d]].concat(rackW()>=300?[[P.Rx-RK.D,P.Rx,rackAt(0),rackAt(1)+rackW()]]:[])
    .concat(radOn()?[[P.Rx/2-radW()/2,P.Rx/2+radW()/2,P.L-RD.out,P.L]]:[]),
  // the userData keys its groups in g have
  keys:['desk','deskChair','vitrine','sofa','sofaShelf','wardrobe','mezzanine','rack','radiator']
};
