/* the display cabinet (or the bookcase in its place: VTC) as IKEA HEMNES glass-door cabinet with 3 drawers, black-brown/light brown: 900 × 370, 1970 high, solid pine.
   45 mm corner posts, two glass doors over three adjustable shelves, three drawers under them; all of it dark, as the desk.
   Its back against the desk's end by the kitchen wall, its side against the left wall, its fronts toward the kitchen wall.
   Own axes (mm): x across its front from the left wall's far side as seen from the front, y up, z from its back to its front;
   turned onto the kitchen's: its x along −x, its z along −z */
const VT={W:900,D:370,H:1970,post:45,top:22};
const vitAt=()=>P.L-DK.gap-DK.W;   // kitchen z of its back: the desk's end
function vitrineParts(){
  const [parts,add]=partList();
  const {W,D,H,post:l,top}=VT,yt=H-top,zF=D-15,t=16,fz1=zF-3,fz0=fz1-20,rz0=zF-25,rz1=zF-5,nm=' витрины';
  const xa=10,xb=W-10,ia=xa+l,ib=xb-l,sa=xa+(l+t)/2,sb=xb-(l+t)/2,zb=27;   // posts' outer x; between the posts; inner faces of the sides; back panel's front
  add('Столешница'+nm,'top',0,W,yt,H,0,D);
  [xa,xb-l].forEach(x=>[5,zF-l].forEach(z=>add('Стойка'+nm,'carcass',x,x+l,0,yt,z,z+l)));
  [xa,xb-l].forEach(x=>add('Боковина'+nm,'carcass',x+(l-t)/2,x+(l+t)/2,90,yt,5+l,zF-l));
  add('Задняя стенка'+nm,'carcass',ia,ib,90,yt,zb-8,zb);
  add('Нижняя царга'+nm,'carcass',ia,ib,70,100,rz0,rz1);
  add('Дно'+nm,'carcass',sa,sb,100-t,100,zb,rz0);
  add('Царга между ящиками и дверцами'+nm,'carcass',ia,ib,756,778,rz0,rz1);
  add('Дно отделения за стеклом'+nm,'carcass',sa,sb,756,778,zb,rz0);
  add('Верхняя царга'+nm,'carcass',ia,ib,1920,yt,rz0,rz1);
  [1050,1330,1610].forEach(y=>add('Полка'+nm,'carcass',sa,sb,y,y+18,zb,zF-l-5));
  const fx0=ia+2,fx1=ib-2,xm=(fx0+fx1)/2;
  add('Стеклянная дверца'+nm,'front',fx0,xm-2,780,1918,fz0,fz1,{hinge:'L',glass:50,knobs:[[xm-2-30,1320]]});
  add('Стеклянная дверца'+nm,'front',xm+2,fx1,780,1918,fz0,fz1,{hinge:'R',glass:50,knobs:[[xm+2+30,1320]]});
  const kx=[fx0+(fx1-fx0)*.2,fx0+(fx1-fx0)*.8];
  [[102,370,'v3','нижний'],[374,586,'v2','средний'],[590,752,'v1','верхний']].forEach(([f0,f1,k,w])=>{
    const n=' — '+w+' ящик'+nm;
    add('Фасад ящика'+n,'front',fx0,fx1,f0,f1,fz0,fz1,{hinge:'S',slide:k,travel:270,knobs:kx.map(x=>[x,(f0+f1)/2])});
    const bx0=ia+7,bx1=ib-7,by0=f0+12,by1=f1-30,bz0=fz0-290;
    add('Бок ящика'+n,'carcass',bx0,bx0+12,by0,by1,bz0,fz0,{inSlide:k});
    add('Бок ящика'+n,'carcass',bx1-12,bx1,by0,by1,bz0,fz0,{inSlide:k});
    add('Задняя стенка ящика'+n,'carcass',bx0+12,bx1-12,by0,by1,bz0,bz0+12,{inSlide:k});
    add('Дно ящика'+n,'back',bx0,bx1,by0-4,by0,bz0,fz0,{inSlide:k});
  });
  return parts;
}
/* or IKEA HEMNES bookcase, black-brown, solid pine: as big (900 × 370, 1970 high), in its place. 45 mm posts at the corners, the
   carcass 890 × 340 (the top 5 proud of it at the ends, 15 in front and behind); sides between the posts and the back in their
   grooves from 110 up (the legs under them), a rail 80 under the bottom in front and 60 under the top; five shelves evenly between
   them, 800 between the front posts, 290 deep from the back. Its own axes as the display cabinet's */
const BC={y0:110,low:80,head:60,shelves:5,sd:290};
function bookcaseParts(){
  const [parts,add]=partList();
  const {W,D,H,post:l,top}=VT,yt=H-top,zF=D-15,z0=15,t=16,st=18,nm=' стеллажа';
  const xa=5,xb=W-5,ia=xa+l,ib=xb-l,zb=z0+23,yb=BC.y0+BC.low,yh=yt-BC.head;   // the back's front face; the bottom's top; the head rail's underside
  add('Столешница'+nm,'top',0,W,yt,H,0,D);
  [xa,xb-l].forEach(x=>[z0,zF-l].forEach(z=>add('Стойка'+nm,'carcass',x,x+l,0,yt,z,z+l)));
  [xa,xb-l].forEach(x=>add('Боковина'+nm,'carcass',x+(l-t)/2,x+(l+t)/2,BC.y0,yt,z0+l,zF-l));
  add('Задняя стенка'+nm,'carcass',ia,ib,BC.y0,yt,zb-8,zb);
  add('Нижняя царга'+nm,'carcass',ia,ib,BC.y0,yb,zF-20,zF);
  add('Дно'+nm,'carcass',ia,ib,yb-st,yb,zb,zF-20);
  add('Верхняя царга'+nm,'carcass',ia,ib,yh,yt,zF-20,zF);
  const n=BC.shelves,gap=(yh-yb-n*st)/(n+1);
  for(let i=0;i<n;i++){const y=Math.round(yb+(i+1)*gap+i*st);add('Полка'+nm,'carcass',ia,ib,y,y+st,zb,zb+BC.sd);}
  return parts;
}
/* the two in its place (VTC): the display cabinet at first, the bookcase. A click on its body (a door's click opens the door) or its
   card's «Следующий вариант →» shows the other: the kitchen built again; the one shown stays through the rebuilds. Its name in the
   others' cards: of (genitive), with (with its preposition) */
const VTC=[{parts:vitrineParts,of:'витрины',with:'с витриной',card:{title:'Витрина HEMNES с 3 ящиками (IKEA)',price:31000,url:'https://ozon.ru/t/sZF7R6J',shop:'Ozon',lines:['Чёрно-коричневая, массив сосны, закалённое стекло.','90 × 37 см, высота 197 см.','Две стеклянные дверцы, три переставные полки, три ящика.']}},
  {parts:bookcaseParts,of:'стеллажа',with:'со стеллажом',card:{title:'Стеллаж книжный HEMNES (IKEA)',price:17500,url:'https://ozon.ru/t/1NWYtIl',shop:'Ozon',lines:['Чёрно-коричневый, массив сосны.','90 × 37 см, высота 197 см.','Пять переставных полок; внутри 80 × 29 см.']}}];
let vitPick=0;
const nextVitrine=()=>{vitPick=(vitPick+1)%VTC.length;rebuild();};
function buildVitrine(g,opts){
  const d=buildParts({parts:VTC[vitPick].parts()},deskMats,opts);
  hemnesFronts(d.doors,deskMats);
  d.model.rotation.y=Math.PI;d.model.position.set(VT.W*MM,0,vitAt()*MM);
  Object.assign(d.model.userData,{vitrine:true,info:INFO.vitrine});
  d.model.children.forEach(o=>{o.userData.click=nextVitrine;});   // its body: the other one (a door's click opens it)
  g.add(d.model);
  return d.doors;
}

