// ==========================================================
// Code.gs
// 家庭記帳的程式：放在 Google 試算表的 Apps Script 裡（設定方式見 README.md）。
// 網頁（index.html）也由這裡提供，不需要 Google Cloud、也不用另外架站。
//
// 誰能使用：部署時選「以存取網頁應用程式的使用者身分執行」，
// 所以只有「這份試算表有分享編輯權限」的 Google 帳號能讀寫資料。
// 要讓另一半使用，把試算表「共用」給他／她（編輯者）即可。
// ==========================================================

// 「記帳」工作表的欄位（第一列標題）。KEYS 是程式用的名稱，順序要一樣。
const HEAD=['id','日期','類型','金額','分類','備註','付款人(A/B)','分攤方式','A的份額','B的份額','收入歸屬','還款人','收款人','記錄者','建立時間','更新時間','最後修改者'];
const KEYS=['id','date','type','amount','category','note','payer','split','shareA','shareB','owner','from','to','createdBy','createdAt','updatedAt','updatedBy'];
const NUM_KEYS=['amount','shareA','shareB'];
// 在試算表裡顯示中文，比較好看懂
const TYPE_ZH={expense:'支出',income:'收入',transfer:'還款'};
const SPLIT_ZH={equal:'平分',custom:'自訂',mine:'自己的',other:'幫對方付'};
const OWNER_ZH={both:'共同'};
const SHEET_ENTRIES='記帳', SHEET_SETTINGS='設定';
// 「設定」工作表的項目
const SETTING_ROWS=[
  ['nameA','A 的名字'],['nameB','B 的名字'],
  ['expenseCats','支出分類（用逗號分隔）'],['incomeCats','收入分類（用逗號分隔）']
];

// 第一次使用：在編輯器上方選「setup」→ 執行。會建立工作表，並記住這份試算表
function setup(){
  const ss=SpreadsheetApp.getActive();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID',ss.getId());
  ss__=ss;
  entriesSheet_();settingsSheet_();
  Logger.log('完成！接下來請「部署 → 新增部署作業 → 網頁應用程式」。');
}

// 打開網址時，回傳記帳網頁
function doGet(){
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('家庭記帳')
    .addMetaTag('viewport','width=device-width, initial-scale=1, viewport-fit=cover');
}

// ---------------- 網頁呼叫的函式（google.script.run） ----------------
function apiList(){
  const ss=ss_();
  return {entries:readEntries_(),settings:readSettings_(),sheetUrl:ss.getUrl(),user:me_()};
}
function apiSave(item){return withLock_(()=>{saveEntry_(item,me_());return true})}
function apiRemove(id){return withLock_(()=>{removeEntry_(id);return true})}
function apiSaveSettings(s){return withLock_(()=>{saveSettings_(s||{});return true})}

// 打開試算表（沒有權限的帳號在這裡會被擋下）
let ss__=null;
function ss_(){
  if(ss__)return ss__;
  const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!id)throw new Error('還沒完成設定：請在 Apps Script 編輯器執行一次 setup');
  try{ss__=SpreadsheetApp.openById(id)}
  catch(e){throw new Error('這個 Google 帳號（'+me_()+'）沒有權限。請試算表擁有者用「共用」把試算表分享給你（編輯者）。')}
  return ss__;
}
// 目前登入的 Google 帳號
function me_(){return (Session.getActiveUser().getEmail()||'').toLowerCase()}

// ---------------- 記帳資料 ----------------
function entriesSheet_(){
  const ss=ss_();
  let sh=ss.getSheetByName(SHEET_ENTRIES);
  if(!sh){
    sh=ss.insertSheet(SHEET_ENTRIES,0);
    sh.getRange(1,1,1,HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground('#DCEBE4');
    sh.setFrozenRows(1);
    // 文字格式：避免試算表把日期、id 自動轉成別的東西
    sh.getRange('A:C').setNumberFormat('@');sh.getRange('E:Q').setNumberFormat('@');
    sh.getRange('D:D').setNumberFormat('#,##0.##');sh.getRange('I:J').setNumberFormat('#,##0.##');
  }
  return sh;
}
function readEntries_(){
  const sh=entriesSheet_(),n=sh.getLastRow()-1;if(n<1)return [];
  const tz=Session.getScriptTimeZone();
  return sh.getRange(2,1,n,KEYS.length).getValues().filter(r=>r[0]!=='').map(r=>{
    const o={};
    KEYS.forEach((k,i)=>{
      let v=r[i];
      if(v instanceof Date)v=Utilities.formatDate(v,tz,k==='date'?'yyyy-MM-dd':"yyyy-MM-dd'T'HH:mm:ss");
      if(NUM_KEYS.includes(k))v=v===''?0:Number(v);
      else v=String(v);
      o[k]=v;
    });
    o.type=fromZh_(TYPE_ZH,o.type);o.split=fromZh_(SPLIT_ZH,o.split);o.owner=fromZh_(OWNER_ZH,o.owner);
    return o;
  });
}
function rowOf_(item){
  const o={...item,type:TYPE_ZH[item.type]||item.type,split:SPLIT_ZH[item.split]||item.split||'',owner:OWNER_ZH[item.owner]||item.owner||''};
  return KEYS.map(k=>o[k]===undefined||o[k]===null?'':o[k]);
}
function findRow_(sh,id){
  const n=sh.getLastRow()-1;if(n<1)return -1;
  const ids=sh.getRange(2,1,n,1).getValues();
  for(let i=0;i<ids.length;i++)if(String(ids[i][0])===String(id))return i+2;
  return -1;
}
function saveEntry_(item,email){
  if(!item||!item.id)throw new Error('資料缺少 id');
  const sh=entriesSheet_(),r=findRow_(sh,item.id);
  // 記錄者、最後修改者由這裡填（用驗證過的 Email，不能偽造）
  if(r>0)item.createdBy=String(sh.getRange(r,KEYS.indexOf('createdBy')+1).getValue()||email);
  else item.createdBy=email;
  item.updatedBy=email;
  const row=rowOf_(item);
  if(r>0)sh.getRange(r,1,1,row.length).setValues([row]);
  else sh.appendRow(row);
}
function removeEntry_(id){
  const sh=entriesSheet_(),r=findRow_(sh,id);
  if(r>0)sh.deleteRow(r);
}

// ---------------- 設定 ----------------
function settingsSheet_(){
  const ss=ss_();
  let sh=ss.getSheetByName(SHEET_SETTINGS);
  if(!sh){
    sh=ss.insertSheet(SHEET_SETTINGS);
    sh.getRange(1,1,1,3).setValues([['key','值','說明']]).setFontWeight('bold').setBackground('#DCEBE4');
    sh.getRange(2,1,SETTING_ROWS.length,3).setValues(SETTING_ROWS.map(([k,d])=>[k,'',d]));
    sh.getRange('B:B').setNumberFormat('@');sh.setFrozenRows(1);
  }
  return sh;
}
function readSettings_(){
  const sh=settingsSheet_(),n=sh.getLastRow()-1,o={};if(n<1)return o;
  sh.getRange(2,1,n,2).getValues().forEach(([k,v])=>{
    if(!k||v==='')return;
    o[k]=/Cats$/.test(k)?String(v).split(/[,，]/).map(s=>s.trim()).filter(Boolean):String(v);
  });
  return o;
}
function saveSettings_(s){
  const sh=settingsSheet_();
  SETTING_ROWS.forEach(([k,d])=>{
    if(!(k in s))return;
    const v=Array.isArray(s[k])?s[k].join(','):String(s[k]??'');
    const r=findRow_(sh,k);
    if(r>0)sh.getRange(r,2).setValue(v);else sh.appendRow([k,v,d]);
  });
}

// ---------------- 小工具 ----------------
function fromZh_(map,v){for(const k in map)if(map[k]===v)return k;return v}
function withLock_(fn){const l=LockService.getScriptLock();l.waitLock(15000);try{return fn()}finally{l.releaseLock()}}
