/* ---------- the rest of the kitchen room: what is not the kitchen ----------
   The room on the plan is one (ROOMS: kitchen). Along the kitchen wall stands the kitchen (rooms/kitchen/: its cabinets, its appliances,
   the dining table with its chairs, its lamp and the shelf over it); the rest of the room is here: the work place by the left wall
   (the desk with its add-on unit and the shelf over it, the MacBook, the desk chair, the display cabinet or the bookcase) and the living part by the
   right wall (the wardrobe with its mirror and coat rail, the mezzanine, the sofa and the shelf over it, the metal racks); under the window, the radiator.
   Kitchen coordinates (rooms/kitchen/), mm. The kitchen builds all of it with its own things (kitchen/view.js: extra) and gives it what it
   needs (attach): where the walls are (P: Rx, L), its appliances' doors (applDoor), their handles' grey (handleMat), its rebuild.
   None of it is in the kitchen tab: it stands in the apartment (the plan, the walk). Own scope, as the room modules'. */
let P=null,applDoor=null,handleMat=null,rebuild=null;   // the kitchen's: living.attach

// 0 below 0, 1 above 1, eased in and out between (what goes with a door: the laptop's screen, the desk chair's turn, the sofa's bed)
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};

/* what they are: the card under the «i» (engine.js), as the kitchen's INFO */
const cm=mm=>String(mm/10).replace('.',',');   // mm as the cards' cm, a comma for the decimal
