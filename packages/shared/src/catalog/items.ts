export interface ItemDefinition { key:string; name:string; stack:number; weight:number; usable:boolean; }
export const ITEM_CATALOG:Record<string,ItemDefinition>={
  'phone.basic':{key:'phone.basic',name:'Смартфон',stack:1,weight:.35,usable:true},
  'document.id':{key:'document.id',name:'ID-карта',stack:1,weight:.02,usable:true},
  'food.water':{key:'food.water',name:'Вода',stack:10,weight:.5,usable:true},
  'food.sandwich':{key:'food.sandwich',name:'Сэндвич',stack:10,weight:.35,usable:true},
  'tool.repairkit':{key:'tool.repairkit',name:'Ремкомплект',stack:3,weight:2.5,usable:true},
  'medical.bandage':{key:'medical.bandage',name:'Бинт',stack:10,weight:.1,usable:true}
};
