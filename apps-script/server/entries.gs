// ==========================================================
// server/entries.gs
// 「記帳」工作表：每一列是一筆支出、收入或還款。
// ==========================================================

// 第一列標題（試算表看到的）與程式用的欄位名稱，兩個陣列順序要一樣
const ENTRY_HEAD=['id','日期','類型','金額','分類','備註','付款人(A/B)','分攤方式','A的份額','B的份額','收入歸屬','還款人','收款人','記錄者','建立時間','更新時間','最後修改者'];
const ENTRY_KEYS=['id','date','type','amount','category','note','payer','split','shareA','shareB','owner','from','to','createdBy','createdAt','updatedAt','updatedBy'];
const ENTRY_NUM_KEYS=['amount','shareA','shareB'];   // 數字欄位
// 試算表裡顯示中文，比較好看懂
const TYPE_ZH={expense:'支出',income:'收入',transfer:'還款'};
const SPLIT_ZH={equal:'平分',custom:'自訂',mine:'自己的',other:'幫對方付'};

/** 取得「記帳」工作表（沒有就建立）。 */
function entriesSheet_(){
  return sheet_('記帳',ENTRY_HEAD,{'A:C':'@','E:Q':'@','D:D':'#,##0.##','I:J':'#,##0.##'});
}

/**
 * 讀出所有記帳，轉成網頁用的格式：
 * 日期轉成 yyyy-MM-dd、金額轉成數字、中文（支出、平分…）轉回程式代號。
 */
function readEntries_(){
  const tz=Session.getScriptTimeZone();
  return readRows_(entriesSheet_(),ENTRY_KEYS.length).map(r=>{
    const o={};
    ENTRY_KEYS.forEach((k,i)=>{
      let v=r[i];
      if(v instanceof Date)v=Utilities.formatDate(v,tz,k==='date'?'yyyy-MM-dd':"yyyy-MM-dd'T'HH:mm:ss");
      o[k]=ENTRY_NUM_KEYS.includes(k)?(v===''?0:Number(v)):String(v);
    });
    o.type=fromZh_(TYPE_ZH,o.type);
    o.split=fromZh_(SPLIT_ZH,o.split);
    o.owner=fromZh_(OWNER_ZH,o.owner);
    return o;
  });
}

/**
 * 新增或修改一筆記帳。
 * 「記錄者」「最後修改者」由這裡用登入的 Email 填寫，網頁沒辦法偽造。
 * @param {Object} item 網頁送來的資料
 * @param {string} email 目前登入者
 */
function saveEntry_(item,email){
  if(!item||!item.id)throw new Error('資料缺少 id');
  const sh=entriesSheet_(),r=findRow_(sh,item.id);
  item.createdBy=r>0?String(sh.getRange(r,ENTRY_KEYS.indexOf('createdBy')+1).getValue()||email):email;
  item.updatedBy=email;
  const o={...item,type:TYPE_ZH[item.type]||item.type,split:SPLIT_ZH[item.split]||item.split||'',owner:OWNER_ZH[item.owner]||item.owner||''};
  upsertRow_(sh,item.id,toRow_(o,ENTRY_KEYS));
}
