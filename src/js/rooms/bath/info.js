/* what the things that are not cabinets are: the card under the «i» that comes up when the cursor rests on one (engine.js), as in the kitchen */
const INFO={
  toilet:()=>({title:'Унитаз подвесной AZARIO Allegro AZ-3105B',lines:[
      `${WC.L/10} × ${WC.W/10} см, высота ${WC.H/10} см с сиденьем.`,
      'Фаянс, белый глянцевый; безободковый, антивсплеск. Сиденье с микролифтом в комплекте.',
      'Со встроенным гигиеническим душем (биде): смеситель на правом боку.',
      `Без бачка, на инсталляции; край чаши в ${WC.rim/10} см от пола.`,
      'Нажатие на крышку или сиденье поднимает и опускает крышку.'],
    price:11500,url:'https://ozon.ru/t/DtLQ3zf',shop:'Ozon'}),
  tray:()=>{const [x0,x1,z0,z1]=trayRect(),cm=v=>Math.round(v/10);   // its sizes as the plan has them now
    return {title:'Душевой поддон',lines:[`${cm(x1-x0)} × ${cm(z1-z0)} см, высота ${cm(TRAY.H)} см: во всю душевую, от левой стены до перегородки.`,
      'Литьевой мрамор, белый; верх под сланец, четыре ската к трапу.',
      `Квадратный хромированный трап ${cm(TRAY.drain)} × ${cm(TRAY.drain)} см, в четверти длины от левой стены.`]};},
  washer:()=>({title:'Стирально-сушильная машина Haier HWD80-BP14959A',lines:[
      `${WASH.W/10} × ${(WASH.D+WD.ring+WD.dome)/10} см с дверцей, высота ${WASH.H/10} см.`,
      'Стирка до 8 кг, сушка до 5 кг.',
      `Дверца Ø${WD.R/5} см, загрузочный люк Ø${WD.hatch/10} см; петли слева, открывается на ${Math.round(washerMax()*180/Math.PI)}°.`,
      `Передом заподлицо с раковиной, в ${WASH.back/10} см от стены; раковина в ${(WASH.sinkY-WASH.H)/10} см над ней.`,
      'Нажатие открывает и закрывает дверцу.'],
    url:'https://www.dns-shop.ru/product/de9f444231d3ed20/stiralno-susilnaa-masina-haier-hwd80-bp14959a-belyj/',shop:'DNS'}),
  sinkCab:()=>{const n=washNiche(),S=SINK_CAB,y0=WASH.sinkT+S.Gap,y1=Math.min(y0+S.H,A.H),cm=v=>Math.round(v/10);   // its width is the niche's
    return {title:'Зеркальный шкафчик над раковиной',lines:[`${cm(n.w)} × ${cm(S.D)} см, высота ${cm(y1-y0)} см: во всю ширину ниши.`,
      `Корпус — ЛДСП ${finName(finOf(FIN,'carcass'))}, фасады — ${finName(finOf(FIN,'front'))}; на дверях зеркало 4 мм.`,
      `Две распашные двери, ${S.N} полки внутри.`,
      `Низ в ${cm(y0)} см от пола, на ${cm(S.Gap)} см выше раковины; на крыше светильник 45 см.`,
      'Нажатие открывает и закрывает двери.']};},
  curtain:()=>{const cm=v=>Math.round(v/10),C=CURT,r=curtRod();
    return {title:'Шторка для душа',lines:[`${cm(C.w)} × ${cm(C.h)} см, клеёнка (PEVA), полупрозрачная, матовая; люверсы и кольца — хром.`,
      `Штанга прямая, ${cm(r.x1-r.xb)} см: слева в перегородку, справа заходит за стенку у ниши и упирается в шар кронштейна на её задней стороне; нержавеющая сталь, хром, Ø 2 см; в ${cm(curtRodY())} см от пола.`,
      `Низ шторки в ${cm(C.gap)} см над поддоном.`,
      'Нажатие задёргивает шторку или отодвигает её за стенку.']};},
  rack:()=>{const cm=v=>Math.round(v/10),R=RACK;
    return {title:'Душевая система AM.PM Chic 2.0 с термостатом',lines:[`Высота ${cm(R.top+10-(R.y-R.r))} см (штанга выдвигается, 88–127 см), верхний душ Ø ${cm(R.head)} см в ${cm(R.reach)} см от стены; ручная лейка Ø ${cm(R.hand)} см, шланг 1,75 м.`,
      'Латунь, хром; межосевое расстояние 150 мм.',
      `Термостат в ${cm(R.y)} см от пола (${cm(R.y-TRAY.H)} см над поддоном), верхний душ в ${cm(R.top-45)} см; на левой стене посередине душевой.`],price:21000,url:'https://ozon.ru/t/RhrtHZA',shop:'Ozon'};}
};

