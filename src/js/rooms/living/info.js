const INFO={
  desk:{title:'Письменный стол HEMNES (IKEA)',lines:['Чёрно-коричневый, массив сосны.','155 × 65 см, высота 74 см, под столом 67 см.','Слева тумба с дверцей и полкой, справа два ящика.']},
  addon:{title:'Надстройка HEMNES для стола (IKEA)',lines:['Чёрно-коричневая, массив сосны.','152 × 25 см, высота 63 см; стол с ней — 137 см.','По краям две секции с ящиком и полками, посередине открытая полка.']},
  macbook:{title:'MacBook Pro 16″ (Apple)',lines:['Серебристый, алюминиевый корпус.','35,57 × 24,81 см, толщина 1,68 см; 2,1 кг.','Экран Liquid Retina XDR 16,2″, 3456 × 2234; крышка открывается до 110°.']},
  // which of the four (SHC) and a link to the next one (paged)
  shelf:()=>{const c=SHC[shelfPick];
    return paged(c.hemnes?{title:'Полка навесная HEMNES (IKEA)',price:8000,url:'https://ozon.ru/t/GIfrq0T',shop:'Ozon',lines:['Чёрно-коричневая, массив сосны.',
        `${cm(HM.W)} × ${cm(HM.D)} см, высота ${cm(HM.H)} см.`,
        `Над надстройкой стола, в ${cm(hemnesY0()-DK.H-AU.H)} см над ней; верх вровень ${VTC[vitPick].with}: от ${cm(hemnesY0())} до ${cm(VT.H)} см от пола.`]}
      :{title:'Настенная полка',lines:[`${c.desc}; на двух ${c.brName} стальных кронштейнах с косынкой.`,'150 × 25 см, толщина 3 см.',
        'Кронштейны из стальной полосы 4 мм шириной 25 мм, в 15 см от краёв полки: плечо 20 см под полкой, стойка 15 см по стене вниз, косынка между ними.',
        'Над надстройкой стола, в 30 см над ней: низ на 167 см от пола.']},shelfPick,SHC.length,nextShelf,INFO.shelf);},
  deskChair:{title:'Офисное кресло MILLBERGET (IKEA)',lines:['Бумстад золотисто-коричневый (кожа); подлокотники и крестовина на колёсиках чёрные.','65 × 65 см, высота 118–128 см; сиденье 52 × 49 см на высоте 46–56 см.','Выдвинуто от письменного стола; нажатие задвигает его под стол и обратно.']},
  // which of the two (VTC) and a link to the next one, as the shelf's
  vitrine:()=>paged(Object.assign({},VTC[vitPick].card),vitPick,VTC.length,nextVitrine,INFO.vitrine),
  wardrobe:()=>wardColor.card(INFO.wardrobe,ozon({title:'Угловой шкаф «Уютная логика» (OZON)',lines:['Распашные двери без ручек (открываются нажатием).',
    wardExt()?'Угловой 96,4 × 96,4 см и две доп. секции 40 × 50 см — вдоль стены и на торце, высота 220 см, глубина 50 см.':'Угловой 96,4 × 96,4 см и доп. секция 40 × 50 см, высота 220 см, глубина 50 см.',
    `В угловом слева четыре полки, справа — полка и две штанги для вешалок; в ${wardExt()?'доп. секциях по':'доп. секции'} четыре полки.`],
    buy:WARD_PRODUCTS.map((b,i)=>i&&wardExt()?Object.assign({n:2},b):b)})),
  // its backs at the sofa (wardBack): HDF as bought, or LDSP white or grey — cut from one more add-on section, bought for it; the panels over it
  // (backPanels), bought too, their strips. What is bought is in its rows (ozon), not in the lines. Which of them and a link to the next one (paged)
  wardBack:()=>{const t='Задняя стенка шкафа со стороны дивана',k='Нажатие на стенку — следующий вариант.',at=wardBack.at();
    const page=c=>paged(c,wardBack.i,WARD_BACKS.length,wardBack.click,INFO.wardBack);
    if(!ldspBack())return page({title:t,lines:[`ХДФ ${HDF.t} мм, из комплекта шкафа.`,k]});
    const bp=backPanels(),lay=bp&&panelLay(),row=(p,W,n)=>({name:`${p.name} ${bp.L} × ${dec(W)} × ${bp.t}`,n,price:p.price,url:p.url});
    const lines=[`ЛДСП 16 мм, ${finName(WARD_COLORS[at.c])} — из ${wardExt()?'боковин и фасада':'боковин'} ещё одной доп. секции.`]
      .concat(wardExt()?['Фасад — у стены, он ниже боковин: недостача внизу за диваном.']:[],
        bp?[`Поверх — реечные панели на всю высоту шкафа${lay.cut?', последняя обрезана по ширине':''}.`]:[],k);
    const buy=[WARD_PRODUCTS[1]].concat(bp?[row(bp,bp.W,lay.pieces.length)].concat([bp.tail,bp.head].filter(Boolean).map(s=>row(s,s.W))):[]);   // the starter strip's row first
    return page(ozon({title:t,lines,buy}));},
  mezzanine:()=>mzColor.card(INFO.mezzanine,ozon({title:'Антресоль «Уютная логика» (OZON)',lines:['Распашные двери без ручек (открываются нажатием).',`${MZ.n} секции по ${MZ.L/10} см, глубина ${MZ.d/10} см, высота ${(MZ.y1-MZ.y0)/10} см; по две двери в каждой.`,'На стене над диваном, от 170 до 220 см от пола — вровень со шкафом.'],
    buy:[{name:'Антресоль 100 × 50 × 50',n:MZ.n,price:MZ.price,url:MZ.url}]})),
  mirror:()=>({title:'Зеркало',lines:[`40 × 40 см, в чёрной рамке ${WR.mirror.frame} мм.`,`На торце ${wardEndName()}, от 130 до 170 см от пола.`]}),
  rack:()=>({title:'Металлический стеллаж',lines:[`${Math.round(rackW()/10)} × ${RK.D/10} см, высота ${RK.H/10} см.`,`Светло-серый, порошковая окраска; стойки — перфорированный уголок ${RK.post} × ${RK.post} мм, полки на болтах.`,`${RK.n} полок, нижняя у пола.`,'Два одинаковых рядом на правой стене, между проходом на кухню и угловым шкафом.',`Место под оба — ${cm(wardEnd())} см вдоль стены, от угла до шкафа; зазоры по ${cm(RK.gap)} см с краёв и между ними.`]}),
  hanger:()=>({title:'Настенная вешалка',lines:['Чёрная планка 38 × 3 см, четыре крючка с деревянными шариками.',`На торце ${wardEndName()}${wardExt()?",":""} под зеркалом, на высоте 117 см.`]}),
  sofaShelf:()=>({title:'Полка над диваном',lines:['Белый премиум W1000 ST9, как корпуса кухни; на трёх белых стальных L-образных кронштейнах.',`${cm(SS.L)} × ${cm(SS.D)} см, толщина ${cm(SS.t)} см.`,`Кронштейны из стальной полосы ${SHB.t} мм шириной ${SHB.w} мм, в ${cm(SHB.end)} см от краёв и посередине: плечо ${cm(SHB.arm)} см под полкой, стойка ${cm(SHB.leg)} см по стене вверх, крепится над полкой.`,`Низ на ${cm(SS.y0)} см от пола, в ${cm(SS.y0-SF.H)} см над спинкой дивана; до антресоли ${cm(MZ.y0-SS.y0-SS.t)} см.`]}),
  sofa:{title:'Угловой диван-кровать «Слим» (Hoff)',price:29999,url:'https://hoff.ru/catalog/gostinaya/divany/uglovye/uglovoy_divan_krovat_slim_id9558189/?articul=80593875',shop:'Hoff',lines:['Механизм «дельфин», угол универсальный (здесь оттоманка справа, у окна).','206 × 153 см, высота 91 см; сиденье на высоте 45 см.','Спальное место 142 × 195 см; в оттоманке ящик для белья 145 × 23 × 61 см.','Велюр, бежево-серый; три приспинные подушки 65 × 46 см, две декоративные 48 × 36 см.']}
};
// a card of what is bought on Ozon as products (c.buy: [{name, n, price, url}], a row each in the card, the total under them: engine.js)
const ozon=c=>Object.assign(c,{shop:'Ozon'});
// the two OZON products it is made of (its card has a row for each)
const WARD_PRODUCTS=[
  {name:'Угловой 96,4 × 96,4 × 220',price:12000,url:'https://ozon.ru/t/8LOFiwQ'},
  {name:'Доп. секция 40 × 50 × 220',price:5500,url:'https://ozon.ru/t/BSIni7B'}];
INFO.radiator=()=>({title:'Радиатор отопления',lines:[`Секционный, ${RD.n} секций по ${cm(RD.sec)} см; белая глянцевая эмаль.`,
  `${cm(radW())} × ${cm(RD.H)} см, глубина ${cm(RD.D)} см; от стены ${cm(RD.out)} см.`,
  `Под подоконником, по центру окна: низ на ${cm(radTop()-RD.H)} см от пола, до подоконника ${cm(RD.sill)} см.`]});

