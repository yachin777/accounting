// ==========================================================
// server/budgets.gs
// 「預算」工作表：每一列是一筆每月預算。
//   對象：A、B、共同
//   分類：支出分類，或「全部」（= 這個對象的每月總預算）
// ==========================================================

const BUD_HEAD=['id','對象','分類','每月預算'];
const BUD_KEYS=['id','scope','category','amount'];

/** 取得「預算」工作表（沒有就建立）。 */
function budgetsSheet_(){
  return sheet_('預算',BUD_HEAD,{'A:C':'@','D:D':'#,##0.##'});
}

/** 讀出所有預算（金額轉成數字；「共同」轉回 both）。 */
function readBudgets_(){
  return readRows_(budgetsSheet_(),BUD_KEYS.length).map(r=>{
    const o={};
    BUD_KEYS.forEach((k,i)=>o[k]=k==='amount'?(r[i]===''?0:Number(r[i])):String(r[i]));
    o.scope=fromZh_(OWNER_ZH,o.scope);
    return o;
  });
}

/**
 * 新增或修改一筆預算。
 * @param {Object} b 預算資料 {id, scope, category, amount}
 */
function saveBudget_(b){
  if(!b||!b.id)throw new Error('資料缺少 id');
  const o={...b,scope:OWNER_ZH[b.scope]||b.scope};
  upsertRow_(budgetsSheet_(),b.id,toRow_(o,BUD_KEYS));
}
