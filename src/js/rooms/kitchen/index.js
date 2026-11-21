/* ---------- «Кухня» view: the kitchen wall with its left wall, the cabinets and the appliances along it ----------
   Kitchen coordinates as in the kitchen tab, mm: x along the kitchen wall from the left wall, y up, z from the wall into the room;
   the kitchen's (0,0) is its origin on the plan. The wall width and the ceiling come from the plan (kW, A.H),
   how far the left wall shows is the view's frame (VS.kitchen.L). The rest of the room (the desk, the sofa, the wardrobe…) is
   living's (rooms/living/), built here with the kitchen. Own scope: the room modules share names (P, T, computeParts…). */
let T=16, TF=16; const HDF=4, G=2;
// cabinet sizes; W and H are the plan's kitchen wall and ceiling, L and Rx where the window wall and the right wall are (kitchen axes): from the plan too,
// as is DeskWall (the writing desk against the window wall: placeDining), WardBack (the wardrobe's LDSP backs at the sofa: living/wardrobe.js), WinS (the window sill's height: the radiator under it, living/radiator.js)
const P={W:2200,H:2600,B1:450,B2:450,B3:600,Fr:600,Fh:2000,Fd:665,Ct:900,Db:600,Pl:100,Dw:350,Gw:550,Gh:650,Ha:400,Da:600,Hx:-150,Nw:1,Ant:true,AntUp:false,Dish:true,Apron:true,OvDr:false,Hob:'built',HobAlong:false,Plinth:true,Ec:30,T:16,TF:16,Tt:38,L:4600,Rx:3250,WinS:800,DeskWall:false,WardBack:false};
let current=null;
// dining table by the left wall: from the kitchen wall z (placeDining), along the wall w (its short side, the end against the wall), into the room l, top t thick, h high
const TB={z:0,w:700,l:1300,t:30,h:750,leg:40,in:50};

