// ==========================================================
// js/calc
// 分帳計算（最重要的邏輯都在這裡）。
//
// 每筆支出都記錄：誰付的（payer）、兩人各自的份額（shareA、shareB）。
//   付錢的人幫對方墊了「對方的份額」→ 對方欠付錢的人這麼多。
// 每筆還款記錄：誰給誰（from → to）多少錢 → 抵銷欠款。
//
// 統一用一個數字表示兩人的帳：
//   正數 = B 欠 A；負數 = A 欠 B；0 = 兩清
//
// 例：午餐 500 由 B 付、平分 → A 欠 B 250 → -250
//     晚餐 600 由 A 付、B 吃 200 → B 欠 A 200 → +200
//     合計 -50 → A 要給 B 50
// ==========================================================

/**
 * 依分攤方式算出兩人的份額。
 * @param {number} amount  總金額
 * @param {string} payer   誰付的 'A'/'B'
 * @param {string} split   equal 平分／custom 自訂／mine 自己的／other 幫對方付
 * @param {number} customA 自訂時 A 的部分
 */
function computeShares(amount,payer,split,customA){
  amount=r2(amount);
  if(split==='mine')  return payer==='A'?{shareA:amount,shareB:0}:{shareA:0,shareB:amount};
  if(split==='other') return payer==='A'?{shareA:0,shareB:amount}:{shareA:amount,shareB:0};
  if(split==='custom'){const a=Math.min(Math.max(r2(customA),0),amount);return {shareA:a,shareB:r2(amount-a)}}
  // 平分：除不盡時，多出的零頭算在付錢的人身上（對方只要給整數）
  const half=Math.floor(amount/2), rest=r2(amount-half);
  return payer==='A'?{shareA:rest,shareB:half}:{shareA:half,shareB:rest};
}

/** 一筆資料對兩人帳的影響（正數 = B 欠 A 增加，負數 = A 欠 B 增加）。 */
function effect(e){
  if(e.type==='expense')  return e.payer==='A'?r2(e.shareB):-r2(e.shareA);
  if(e.type==='transfer') return e.from==='A'?r2(e.amount):-r2(e.amount);   // A 還給 B → A 欠 B 減少
  return 0;
}

// 用一句話說明這筆資料的影響
function effectText(e){
  const v=effect(e);if(!v)return '';
  if(e.type==='transfer')return `${nm(e.from)} 還給 ${nm(e.to)} ${money(e.amount)}`;
  const debtor=v>0?'B':'A';
  return `${nm(debtor)} 要給 ${nm(other(debtor))} ${money(Math.abs(v))}`;
}

// 依日期排序（舊 → 新；同一天依建立時間）
function byDate(a,b){return a.date<b.date?-1:a.date>b.date?1:(a.createdAt||'')<(b.createdAt||'')?-1:1}

// 計算目前兩人的帳，並列出每一筆的變化
//   balance：目前結餘（正數 = B 欠 A）
//   rows：每筆會影響帳的資料與當時累計
//   lastZero：最後一次兩清是在第幾筆之後（用來只顯示「未結清」的部分）
function settlement(entries){
  const rows=[];let bal=0,lastZero=-1;
  for(const e of [...entries].sort(byDate)){
    const v=effect(e);if(!v)continue;
    bal=r2(bal+v);rows.push({e,v,bal});
    if(Math.abs(bal)<0.005)lastZero=rows.length-1;
  }
  return {balance:bal,rows,lastZero};
}

// 某段期間的統計（entries 已先篩選好期間）
function summarize(list){
  const s={income:0,expense:0,cats:{},incomeCats:{},paidA:0,paidB:0,useA:0,useB:0};
  for(const e of list){
    if(e.type==='expense'){
      s.expense+=e.amount;s.cats[e.category||'其他']=(s.cats[e.category||'其他']||0)+e.amount;
      if(e.payer==='A')s.paidA+=e.amount;else s.paidB+=e.amount;
      s.useA+=e.shareA||0;s.useB+=e.shareB||0;
    }else if(e.type==='income'){
      s.income+=e.amount;s.incomeCats[e.category||'其他']=(s.incomeCats[e.category||'其他']||0)+e.amount;
    }
  }
  for(const k of ['income','expense','paidA','paidB','useA','useB'])s[k]=r2(s[k]);
  return s;
}

// ==========================================================
// 預算
// 每筆支出算進哪一份預算：
//   分攤「自己的」   → 付錢那個人的個人預算
//   分攤「幫對方付」 → 對方的個人預算
//   分攤「平分」「自訂」→ 共同預算
// 分類「全部」= 這個對象的每月總預算（所有分類加起來）
// ==========================================================
const BUDGET_ALL='全部';
/** 這筆支出算進誰的預算：'A'、'B'、'both'（共同）；不是支出回傳 null。 */
function budgetScope(e){
  if(e.type!=='expense'||!e.payer)return null;
  if(e.split==='mine')return e.payer;
  if(e.split==='other')return other(e.payer);
  return 'both';
}
// 某對象、某分類、某月份已經花了多少（excludeId：編輯中的那筆不算）
function budgetSpent(scope,cat,month,excludeId){
  let t=0;
  for(const e of state.entries){
    if(e.id===excludeId||!(e.date||'').startsWith(month)||budgetScope(e)!==scope)continue;
    if(cat===BUDGET_ALL||e.category===cat)t+=e.amount;
  }
  return r2(t);
}
// 這筆支出相關的預算（分類預算＋總預算）
function budgetsFor(scope,cat){
  return state.budgets.filter(b=>b.scope===scope&&(b.category===cat||b.category===BUDGET_ALL))
    .sort((a,b)=>(a.category===BUDGET_ALL)-(b.category===BUDGET_ALL));
}
/** 預算對象的顯示名稱：both → 共同，A/B → 名字。 */
function scopeName(s){return s==='both'?'共同':nm(s)}
