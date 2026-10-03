// ==========================================================
// server/accounts.gs
// 「帳戶」工作表：資產（現金、股票、定存…）與負債（信用卡、貸款…）。
// ==========================================================

const ACC_HEAD=['id','名稱','類別','種類','擁有者','餘額','備註','排序','更新時間','最後修改者'];
const ACC_KEYS=['id','name','kind','type','owner','balance','note','order','updatedAt','updatedBy'];
const KIND_ZH={asset:'資產',liability:'負債'};

/** 取得「帳戶」工作表（沒有就建立）。 */
function accountsSheet_(){
  return sheet_('帳戶',ACC_HEAD,{'A:E':'@','G:G':'@','I:J':'@','F:F':'#,##0.##'});
}

/** 讀出所有帳戶（餘額、排序轉成數字；類別、擁有者轉回程式代號）。 */
function readAccounts_(){
  return readRows_(accountsSheet_(),ACC_KEYS.length).map(r=>{
    const o={};
    ACC_KEYS.forEach((k,i)=>{
      const v=r[i];
      o[k]=(k==='balance'||k==='order')?(v===''?0:Number(v)):(v instanceof Date?v.toISOString():String(v));
    });
    o.kind=fromZh_(KIND_ZH,o.kind);
    o.owner=fromZh_(OWNER_ZH,o.owner);
    return o;
  });
}

/**
 * 新增或修改一個帳戶，並記下最後修改者。
 * @param {Object} a 帳戶資料
 * @param {string} email 目前登入者
 */
function saveAccount_(a,email){
  if(!a||!a.id)throw new Error('資料缺少 id');
  a.updatedBy=email;
  const o={...a,kind:KIND_ZH[a.kind]||a.kind,owner:OWNER_ZH[a.owner]||a.owner||''};
  upsertRow_(accountsSheet_(),a.id,toRow_(o,ACC_KEYS));
}
