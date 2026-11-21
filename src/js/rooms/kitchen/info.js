/* what the things that are not cabinets are: the card under the «i» that comes up when the cursor rests on one (engine.js) */
const INFO={
  olive:()=>({title:'Настенная полка с ящиками',lines:['Массив сосны, покраска оливковая; ручки керамические.',`${OL.W/10} × ${OL.D/10} см, высота ${OL.H/10} см.`,`Низ на ${SPICE_Y/10} см от пола, в ${(SPICE_Y-TB.h)/10} см над столешницей.`],price:16000,url:'https://ozon.ru/t/EIGVFHm',shop:'Ozon'}),
  tiered:()=>({title:'Настенная полка, 3 яруса',lines:['Дерево, тонировка тёплая коричневая.',`${SQ.W/10} × ${SQ.D/10} см, высота ${SQ.H/10} см.`,`Низ на ${SPICE_Y/10} см от пола, в ${(SPICE_Y-TB.h)/10} см над столешницей.`],price:13000,url:'https://ozon.ru/t/EIGVFHm',shop:'Ozon'}),
  table:()=>{const [k,w]=tableRoom();return {title:'Обеденный стол',lines:[`${TB.l/10} × ${TB.w/10} см, высота ${TB.h/10} см, торцом к левой стене.`,`Столешница ${TB.t} мм — ${finName(FIN.top)}, как у кухни.`,`Четыре стальные ножки ${TB.leg} × ${TB.leg} мм.`,
    `Свободно по бокам: ${Math.round(k/10)} см до столешницы кухни, ${Math.round(w/10)} см до ${living.vitName()}.`]};},
  chair:{title:'Стул BERGMUND (IKEA)',lines:['Чёрный, массив дерева; мягкое сиденье и спинка в чехле из тёмно-серой рогожки.','52 × 52 см, высота 95 см; сиденье 52 × 41 см на высоте 51 см.','Спинка 48 см, сужается кверху до 37 см; угол к сиденью 104°.','Задвинут под стол; нажатие выдвигает его и обратно.']},
};

