// ==========================================================
// js/forms/entry
// 「記一筆」表單：支出、收入、還款。欄位會依類型切換。
// 支出會即時顯示「分帳結果」和「預算剩餘額度」。
// ==========================================================

/**
 * 打開記一筆表單。
 * @param {Object|null} item 要編輯的紀錄；null = 新增
 * @param {Object} preset    新增時的預設值（例如日曆帶入的日期、記錄還款帶入的金額）
 */
function openForm(item,preset={}){
  const d=item?{...item}:{type:'expense',date:today(),amount:'',category:'',note:'',payer:'',split:'equal',owner:'',from:'',to:'',...preset};
  if(d.type==='expense'&&d.split==='custom')d.customA=d.shareA;   // 自訂分攤：帶回原本 A 的份額
  openSheet('entry',d,item?'編輯':'記一筆',!!item,item?'':'amount');
}

/** 畫出記一筆表單的欄位（類型、金額、日期、分類、誰付的、怎麼分…）。 */
function renderEntryForm(){
  const d=state.draft, st=state.settings;
  let h=field('類型',seg('type',TYPES));
  h+=`<div class="row2">${field('金額',`<input name="amount" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.amount)}" placeholder="0" class="big num" required>`)}
      ${field('日期',`<input name="date" type="date" value="${esc(d.date)}" required>`)}</div>`;
  if(d.type==='transfer'){
    // 還款：誰還給誰
    h+=field('誰還給誰',`<div class="seg">
      <button type="button" class="${d.from==='A'?'on':''}" data-set="from:A">${esc(nm('A'))} → ${esc(nm('B'))}</button>
      <button type="button" class="${d.from==='B'?'on':''}" data-set="from:B">${esc(nm('B'))} → ${esc(nm('A'))}</button></div>`,d.from?'':'need');
  }else{
    // 支出／收入：分類（切換類型時，分類不在清單裡就改成第一個）
    const cats=d.type==='income'?st.incomeCats:st.expenseCats;
    if(!cats.includes(d.category))d.category=cats[0]||'';
    h+=field('分類',`<div class="chips cwrap">${cats.map(c=>`<button type="button" class="chip ${d.category===c?'on':''}" data-set="category:${esc(c)}">${esc(c)}</button>`).join('')}</div>`);
  }
  if(d.type==='expense'){
    h+=field('誰付的',seg('payer',[{id:'A'},{id:'B'}]),d.payer?'':'need');
    h+=field('怎麼分',seg('split',SPLITS));
    if(d.split==='custom')h+=`<div class="row2">
      ${field(esc(nm('A'))+' 的部分',`<input name="customA" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.customA??'')}" class="num">`)}
      ${field(esc(nm('B'))+' 的部分',`<input name="customB" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.customA!==undefined&&d.customA!==''?r2((+d.amount||0)-d.customA):'')}" class="num">`)}</div>`;
    h+=`<div class="preview" id="preview"></div><div class="bhint" id="bhint"></div>`;
  }
  if(d.type==='income')h+=field('誰的收入',seg('owner',INCOME_OWNERS),d.owner?'':'need');
  h+=field('備註',`<input name="note" value="${esc(d.note||'')}" placeholder="${d.type==='expense'?'例如：午餐、全聯':'選填'}" maxlength="40">`);
  $('#formBody').innerHTML=h;
  updatePreview();
}

/** 表單下方即時顯示「兩人各多少、誰要給誰多少」（輸入金額或切換選項時更新）。 */
function updatePreview(){
  updateBudgetHint();
  const d=state.draft,p=$('#preview');if(!p||d.type!=='expense')return;
  const amt=+d.amount||0;
  if(!amt||!d.payer){p.innerHTML=`<small>${amt?'選「誰付的」後':'輸入金額後'}會顯示分帳結果</small>`;return}
  const s=computeShares(amt,d.payer,d.split,+d.customA||0);
  const t=effectText({type:'expense',payer:d.payer,...s});
  p.innerHTML=`<span>${esc(nm('A'))} ${money(s.shareA)}　·　${esc(nm('B'))} ${money(s.shareB)}</span><b>${t?esc(t):'不用分帳'}</b>`;
}

/**
 * 依分類顯示預算剩餘額度：本月還剩多少、記這筆之後剩多少（超支會變紅）。
 * 算進哪一份預算：平分／自訂 → 共同；自己的 → 付錢的人；幫對方付 → 對方。
 */
function updateBudgetHint(){
  const d=state.draft,el=$('#bhint');if(!el||d.type!=='expense')return;
  const scope=(d.split==='equal'||d.split==='custom')?'both':d.payer?(d.split==='mine'?d.payer:other(d.payer)):null;
  if(!scope){el.innerHTML='';return}   // 還沒選誰付的，不知道算誰的預算
  const list=budgetsFor(scope,d.category);
  if(!list.length){el.innerHTML=`<small>${esc(scopeName(scope))}・${esc(d.category)} 沒有設定預算</small>`;return}
  const month=(d.date||today()).slice(0,7), amt=+d.amount||0;
  el.innerHTML=list.map(b=>{
    const spent=budgetSpent(scope,b.category,month,d.id), left=r2(b.amount-spent), after=r2(left-amt);
    const label=`${scopeName(scope)}・${b.category===BUDGET_ALL?'總預算':b.category}`;
    return `<div class="bh-row ${after<0?'over':after<b.amount*.2?'warn':''}">
      <span>${esc(label)}</span>
      <span class="num">${left<0?'本月已超支 '+money(-left):'本月剩 '+money(left)}${amt?`　→　記這筆後 <b>${after<0?'超支 '+money(-after):'剩 '+money(after)}</b>`:''}</span>
      ${budgetBar(spent+amt,b.amount)}</div>`;
  }).join('');
}

/** 把表單內容整理成要存的資料（只留這個類型需要的欄位，支出會算好兩人份額）。 */
function buildItem(){
  const d=state.draft, amount=r2(d.amount);
  const base={id:d.id||store.newId(),type:d.type,date:d.date,amount,note:(d.note||'').trim(),
    createdAt:d.createdAt||new Date().toISOString(),createdBy:d.createdBy||'',updatedAt:new Date().toISOString()};
  if(d.type==='expense'){
    if(d.split==='custom'&&(+d.customA<0||+d.customA>amount))throw '自訂金額不能超過總金額';
    return {...base,category:d.category,payer:d.payer,split:d.split,...computeShares(amount,d.payer,d.split,+d.customA||0)};
  }
  if(d.type==='income')return {...base,category:d.category,owner:d.owner};
  return {...base,from:d.from,to:other(d.from)};
}

/** 按「儲存」：檢查必填欄位 → 關閉表單 → 存到試算表（失敗會提示並還原）。 */
async function submitEntry(){
  const d=state.draft;
  if(!(+d.amount>0))return toast('請輸入金額');
  if(!d.date)return toast('請選日期');
  if(d.type==='expense'&&!d.payer)return toast('請選誰付的');
  if(d.type==='income'&&!d.owner)return toast('請選誰的收入');
  if(d.type==='transfer'&&!d.from)return toast('請選誰還給誰');
  let item;try{item=buildItem()}catch(m){return toast(m)}
  closeForm();
  try{await store.save(item);toast('已儲存')}
  catch(e){toast('儲存失敗：'+(e?.message||e))}
}
