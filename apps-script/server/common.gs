// ==========================================================
// server/common.gs
// 後端共用的小工具：其他 .gs 檔都會用到。
// （開啟試算表、錯誤、JSON 回傳、鎖定、建立工作表、找／新增／刪除某一列）
// ==========================================================

// 試算表裡顯示中文、程式裡用英文代號，這兩個對照表在多個工作表共用
const OWNER_ZH={both:'共同'};   // 擁有者／收入歸屬／預算對象：A、B、共同

// 這次執行中已經打開的試算表（避免重複打開）
let ss__=null;

/**
 * 產生一個帶有代號的錯誤（網頁會依 code 判斷要不要回到登入畫面）。
 * @param {string} code    例如 'need_login'、'not_allowed'
 * @param {string} message 顯示給使用者看的中文說明
 */
function fail_(code,message){
  const e=new Error(message);e.code=code;return e;
}

/**
 * 打開記帳用的試算表（ID 在 setup 時記在「指令碼屬性」的 SHEET_ID）。
 */
function ss_(){
  if(ss__)return ss__;
  const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!id)throw fail_('setup','還沒完成設定：請在 Apps Script 編輯器執行一次 setup');
  try{ss__=SpreadsheetApp.openById(id)}
  catch(e){throw fail_('not_allowed','這個 Google 帳號沒有這份試算表的權限。請試算表擁有者用「共用」把試算表分享給你（編輯者）。')}
  return ss__;
}

/**
 * 把資料轉成 JSON 回傳給網頁（GitHub 上的網頁用 fetch 讀取）。
 * @param {Object} o 要回傳的資料
 */
function json_(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 鎖定後再執行 fn：兩個人同時存檔時，一個一個來，避免資料互相覆蓋。
 * @param {Function} fn 要執行的動作
 */
function withLock_(fn){
  const l=LockService.getScriptLock();
  l.waitLock(15000);
  try{return fn()}finally{l.releaseLock()}
}

/**
 * 取得工作表；不存在就建立，並寫好第一列標題、設定欄位格式。
 * @param {string} name     工作表名稱
 * @param {string[]} head   第一列標題
 * @param {Object} formats  欄位格式，例如 {'A:C':'@'}（@ = 純文字，避免日期、id 被自動轉換）
 */
function sheet_(name,head,formats){
  const ss=ss_();
  let sh=ss.getSheetByName(name);
  if(!sh){
    sh=ss.insertSheet(name);
    sh.getRange(1,1,1,head.length).setValues([head]).setFontWeight('bold').setBackground('#DCEBE4');
    sh.setFrozenRows(1);
    for(const r in formats)sh.getRange(r).setNumberFormat(formats[r]);
  }
  return sh;
}

/**
 * 在工作表 A 欄找某個 id，回傳第幾列；找不到回傳 -1。
 * @param {Sheet} sh 工作表
 * @param {string} id 要找的 id
 */
function findRow_(sh,id){
  const n=sh.getLastRow()-1;if(n<1)return -1;
  const ids=sh.getRange(2,1,n,1).getValues();
  for(let i=0;i<ids.length;i++)if(String(ids[i][0])===String(id))return i+2;
  return -1;
}

/**
 * 新增或更新一列：id 已經存在就覆蓋那一列，不存在就加在最後面。
 * @param {Sheet} sh 工作表
 * @param {string} id 這筆資料的 id
 * @param {Array} row 整列的值（順序要跟標題一樣）
 */
function upsertRow_(sh,id,row){
  const r=findRow_(sh,id);
  if(r>0)sh.getRange(r,1,1,row.length).setValues([row]);
  else sh.appendRow(row);
}

/**
 * 依 id 刪除一列（找不到就什麼都不做）。
 * @param {Sheet} sh 工作表
 * @param {string} id 要刪除的 id
 */
function deleteRow_(sh,id){
  const r=findRow_(sh,id);
  if(r>0)sh.deleteRow(r);
}

/**
 * 讀出工作表第 2 列以後的所有資料（略過 id 空白的列）。
 * @param {Sheet} sh 工作表
 * @param {number} cols 要讀幾欄
 */
function readRows_(sh,cols){
  const n=sh.getLastRow()-1;if(n<1)return [];
  return sh.getRange(2,1,n,cols).getValues().filter(r=>r[0]!=='');
}

/**
 * 物件 → 一列的值：依 keys 的順序取出，undefined／null 變成空白。
 * @param {Object} o 資料
 * @param {string[]} keys 欄位順序
 */
function toRow_(o,keys){
  return keys.map(k=>o[k]===undefined||o[k]===null?'':o[k]);
}

/**
 * 中文 → 程式代號（例如 '支出' → 'expense'）；對照表裡找不到就原樣回傳。
 * @param {Object} map 對照表，例如 {expense:'支出'}
 * @param {string} v 試算表裡的值
 */
function fromZh_(map,v){
  for(const k in map)if(map[k]===v)return k;
  return v;
}
