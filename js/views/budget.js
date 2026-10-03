// ==========================================================
// js/views/budget
// 「預算」畫面（從「統計」進入）：共同、兩個人各自的每月預算與使用狀況。
// ==========================================================

const BUDGET_SCOPES=['both','A','B'];

/**
 * 預算進度條：用了幾 %；超過 80% 變橘色、超過 100% 變紅色。
 * @param {number} spent  已花
 * @param {number} amount 預算
 */
function budgetBar(spent,amount){
  const pct=amount>0?spent/amount*100:0;
  const cls=pct>100?'over':pct>=80?'warn':'';
  return `<span class="bbar"><span class="bbar-f ${cls}" style="width:${Math.min(100,pct).toFixed(1)}%"></span></span>`;
}
/** 「剩 $1,200」或紅色的「超支 $300」。 */
function leftText(spent,amount){
  const left=r2(amount-spent);
  return left>=0?`剩 <b class="num">${money(left)}</b>`:`<b class="num exp">超支 ${money(-left)}</b>`;
}

/**
 * 某個對象（共同／A／B）這個月的預算總覽。
 * 有設「全部」總預算就用它；沒有就把各分類預算加起來。沒有任何預算回傳 null。
 */
function scopeTotal(scope,month){
  const list=state.budgets.filter(b=>b.scope===scope);if(!list.length)return null;
  const all=list.find(b=>b.category===BUDGET_ALL);
  if(all)return {amount:all.amount,spent:budgetSpent(scope,BUDGET_ALL,month)};
  return {amount:r2(list.reduce((t,b)=>t+b.amount,0)),spent:r2(list.reduce((t,b)=>t+budgetSpent(scope,b.category,month),0))};
}

/** 「統計」分頁最上面的預算小卡（點了進入預算畫面）。 */
function budgetCard(){
  const rows=BUDGET_SCOPES.map(s=>({s,t:scopeTotal(s,state.month)})).filter(x=>x.t);
  return `<button class="card pad bcard" data-view="budget">
    <div class="bcard-h"><h3>本月預算</h3><span class="link">${rows.length?'查看全部':'設定預算'} ›</span></div>
    ${rows.length?rows.map(({s,t})=>`<div class="brow">
      <span class="brow-k">${s==='both'?'':`<span class="dot pa-${s}"></span>`}${esc(scopeName(s))}</span>
      ${budgetBar(t.spent,t.amount)}
      <span class="brow-v">${leftText(t.spent,t.amount)}</span></div>`).join('')
      :'<p class="hint" style="margin:0">還沒有設定預算。可以分「共同」和兩個人各自設定，每個分類一筆，或設一個「全部」總預算。</p>'}
  </button>`;
}

/** 畫出「每月預算」畫面：共同、兩個人各一區，每筆預算有進度條。 */
function viewBudget(){
  const m=state.month;
  // 一個對象的一區（標題、預算列表、新增按鈕）
  const section=s=>{
    const list=state.budgets.filter(b=>b.scope===s)
      .sort((a,b)=>(b.category===BUDGET_ALL)-(a.category===BUDGET_ALL)||state.settings.expenseCats.indexOf(a.category)-state.settings.expenseCats.indexOf(b.category));
    const t=scopeTotal(s,m);
    return `<section class="acc-sec">
      <div class="acc-sec-h"><h3>${s==='both'?'':`<span class="dot pa-${s}"></span>`}${esc(scopeName(s))}${s==='both'?'預算':' 個人預算'}</h3>
        ${t?`<small class="num">${money(t.spent)} / ${money(t.amount)}</small>`:''}</div>
      ${list.length?`<div class="card list">${list.map(b=>{
        const spent=budgetSpent(s,b.category,m);
        return `<button class="row brow-item" data-bud="${esc(b.id)}">
          <span class="row-main"><span class="row-t"><b>${b.category===BUDGET_ALL?'總預算（全部分類）':esc(b.category)}</b></span>
            ${budgetBar(spent,b.amount)}
            <small class="num">已用 ${money(spent)} / 預算 ${money(b.amount)}</small></span>
          <span class="amt">${leftText(spent,b.amount)}</span></button>`;}).join('')}</div>`
        :'<div class="empty small">還沒有預算</div>'}
      <button class="btn wide" data-addbud="${s}">＋ 新增${esc(scopeName(s))}預算</button>
    </section>`;
  };
  return `<div class="subhead"><button class="icon-btn" data-view="stats" aria-label="回統計">‹</button><h2>每月預算</h2></div>
    ${monthBar()}
    ${BUDGET_SCOPES.map(section).join('')}
    <p class="hint">支出算進哪一份預算：分攤選「平分」「自訂」→ 共同預算；「自己的」→ 付錢那個人的個人預算；「幫對方付」→ 對方的個人預算。<br>預算每個月自動重新計算，金額設定一次就好。</p>`;
}
