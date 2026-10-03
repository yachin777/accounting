// ==========================================================
// server/settings.gs
// 「設定」工作表：兩人的名字、支出／收入分類。
// 每一列是「key、值、說明」，分類用逗號分隔。
// ==========================================================

// 「設定」工作表有哪些項目（key、說明）
const SETTING_ROWS=[
  ['nameA','A 的名字'],['nameB','B 的名字'],
  ['expenseCats','支出分類（用逗號分隔）'],['incomeCats','收入分類（用逗號分隔）']
];

/** 取得「設定」工作表（沒有就建立，並先放好每個項目）。 */
function settingsSheet_(){
  const ss=ss_();
  let sh=ss.getSheetByName('設定');
  if(!sh){
    sh=sheet_('設定',['key','值','說明'],{'B:B':'@'});
    sh.getRange(2,1,SETTING_ROWS.length,3).setValues(SETTING_ROWS.map(([k,d])=>[k,'',d]));
  }
  return sh;
}

/** 讀出設定：分類（key 結尾是 Cats）會拆成陣列，空白的項目略過（網頁會用預設值）。 */
function readSettings_(){
  const o={};
  readRows_(settingsSheet_(),2).forEach(([k,v])=>{
    if(v==='')return;
    o[k]=/Cats$/.test(k)?String(v).split(/[,，]/).map(s=>s.trim()).filter(Boolean):String(v);
  });
  return o;
}

/**
 * 儲存設定：只更新有傳來的項目，陣列會用逗號串起來。
 * @param {Object} s 例如 {nameA:'老公', expenseCats:['餐飲','交通']}
 */
function saveSettings_(s){
  const sh=settingsSheet_();
  SETTING_ROWS.forEach(([k,d])=>{
    if(!(k in s))return;
    const v=Array.isArray(s[k])?s[k].join(','):String(s[k]??'');
    const r=findRow_(sh,k);
    if(r>0)sh.getRange(r,2).setValue(v);else sh.appendRow([k,v,d]);
  });
}
