// ==========================================================
// js/forms/budget
// 「預算」表單：新增／編輯每月預算（對象：共同／A／B；分類或「全部」總預算）。
// ==========================================================

/**
 * 打開預算表單。
 * @param {Object|null} b 要編輯的預算；null = 新增
 * @param {Object} preset 新增時的預設值（例如 {scope:'A'}）
 */
function openBudgetForm(b,preset={}){
  const d=b?{...b}:{scope:'both',category:BUDGET_ALL,amount:'',...preset};
  openSheet('budget',d,b?'編輯預算':'新增預算',!!b,'');
}

/** 畫出預算表單的欄位（對象、分類、每月金額），並顯示這個月已經花了多少。 */
function renderBudgetForm(){
  const d=state.draft, cats=[BUDGET_ALL,...state.settings.expenseCats];
  let h=field('對象',seg('scope',[{id:'both',label:'共同'},{id:'A'},{id:'B'}]));
  h+=field('分類',`<div class="chips cwrap">${cats.map(c=>`<button type="button" class="chip ${d.category===c?'on':''}" data-set="category:${esc(c)}">${c===BUDGET_ALL?'全部（總預算）':esc(c)}</button>`).join('')}</div>`);
  h+=field('每月預算',`<input name="amount" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.amount)}" placeholder="0" class="big num">`);
  const spent=budgetSpent(d.scope,d.category,state.month);
  h+=`<p class="hint">${esc(scopeName(d.scope))}・${d.category===BUDGET_ALL?'全部分類':esc(d.category)}：${monthLabel(state.month)}已花 ${money(spent)}</p>`;
  $('#formBody').innerHTML=h;
}

/**
 * 按「儲存」：同一個對象＋分類只能有一筆，已經有的話就更新那一筆（不會重複）。
 */
async function submitBudget(){
  const d=state.draft;
  if(!(+d.amount>0))return toast('請輸入預算金額');
  const dup=state.budgets.find(b=>b.scope===d.scope&&b.category===d.category&&b.id!==d.id);
  const b={id:dup?.id||d.id||store.newId(),scope:d.scope,category:d.category,amount:r2(d.amount)};
  closeForm();
  try{
    if(dup&&d.id)await store.removeBudget(d.id);   // 編輯時改成跟另一筆一樣 → 合併成那一筆
    await store.saveBudget(b);toast('已儲存');
  }catch(e){toast('儲存失敗：'+(e?.message||e))}
}
