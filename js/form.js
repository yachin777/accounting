// ==========================================================
// js/form.js
// 記一筆／編輯表單。欄位會依「支出／收入／還款」切換。
// 表單內容放在 state.draft，按按鈕切換選項時重畫表單。
// ==========================================================

// 分段按鈕（例如：誰付的 A / B）
function seg(key,opts){
  return `<div class="seg">${opts.map(o=>`<button type="button" class="${String(state.draft[key])===String(o.id)?'on':''}" data-set="${key}:${o.id}">${esc(o.label??nm(o.id))}</button>`).join('')}</div>`;
}
const field=(label,inner,cls='')=>`<div class="field ${cls}"><span class="lbl">${label}</span>${inner}</div>`;

// 開啟表單：item = 要編輯的資料；preset = 新增時的預設值
function openForm(item,preset={}){
  if(!store.canWrite())return toast('請先登入');
  const d=item?{...item}:{type:'expense',date:today(),amount:'',category:'',note:'',payer:'',split:'equal',owner:'',from:'',to:'',...preset};
  if(d.type==='expense'&&d.split==='custom')d.customA=d.shareA;
  state.draft=d;
  $('#formTitle').textContent=item?'編輯':'記一筆';
  $('#delBtn').hidden=!item;
  renderForm();
  $('#scrim').hidden=false;document.body.classList.add('lock');
  if(!item)setTimeout(()=>$('#formBody [name=amount]')?.focus(),60);
}
function closeForm(){$('#scrim').hidden=true;document.body.classList.remove('lock');state.draft=null}

function renderForm(){
  const d=state.draft, st=state.settings;
  let h=field('類型',seg('type',TYPES));
  h+=`<div class="row2">${field('金額',`<input name="amount" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.amount)}" placeholder="0" class="big num" required>`)}
      ${field('日期',`<input name="date" type="date" value="${esc(d.date)}" required>`)}</div>`;
  if(d.type==='transfer'){
    h+=field('誰還給誰',`<div class="seg">
      <button type="button" class="${d.from==='A'?'on':''}" data-set="from:A">${esc(nm('A'))} → ${esc(nm('B'))}</button>
      <button type="button" class="${d.from==='B'?'on':''}" data-set="from:B">${esc(nm('B'))} → ${esc(nm('A'))}</button></div>`,d.from?'':'need');
  }else{
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
    h+=`<div class="preview" id="preview"></div>`;
  }
  if(d.type==='income')h+=field('誰的收入',seg('owner',INCOME_OWNERS),d.owner?'':'need');
  h+=field('備註',`<input name="note" value="${esc(d.note||'')}" placeholder="${d.type==='expense'?'例如：午餐、全聯':'選填'}" maxlength="40">`);
  $('#formBody').innerHTML=h;
  updatePreview();
}

// 表單下方即時顯示「誰要給誰多少」
function updatePreview(){
  const d=state.draft,p=$('#preview');if(!p||d.type!=='expense')return;
  const amt=+d.amount||0;
  if(!amt||!d.payer){p.innerHTML=`<small>${amt?'選「誰付的」後':'輸入金額後'}會顯示分帳結果</small>`;return}
  const s=computeShares(amt,d.payer,d.split,+d.customA||0);
  const e={type:'expense',payer:d.payer,...s};
  const t=effectText(e);
  p.innerHTML=`<span>${esc(nm('A'))} ${money(s.shareA)}　·　${esc(nm('B'))} ${money(s.shareB)}</span><b>${t?esc(t):'不用分帳'}</b>`;
}

// 把表單內容整理成要存的資料
function buildItem(){
  const d=state.draft, amount=r2(d.amount);
  const base={id:d.id||store.newId(),type:d.type,date:d.date,amount,note:(d.note||'').trim(),
    createdAt:d.createdAt||new Date().toISOString(),createdBy:d.createdBy||auth.user?.email||'',updatedAt:new Date().toISOString()};
  if(d.type==='expense'){
    if(d.split==='custom'&&(+d.customA<0||+d.customA>amount))throw '自訂金額不能超過總金額';
    return {...base,category:d.category,payer:d.payer,split:d.split,...computeShares(amount,d.payer,d.split,+d.customA||0)};
  }
  if(d.type==='income')return {...base,category:d.category,owner:d.owner};
  return {...base,from:d.from,to:other(d.from)};
}

async function submitForm(){
  const d=state.draft;
  if(!(+d.amount>0))return toast('請輸入金額');
  if(!d.date)return toast('請選日期');
  if(d.type==='expense'&&!d.payer)return toast('請選誰付的');
  if(d.type==='income'&&!d.owner)return toast('請選誰的收入');
  if(d.type==='transfer'&&!d.from)return toast('請選誰還給誰');
  let item;try{item=buildItem()}catch(m){return toast(m)}
  closeForm();
  try{await store.save(item);toast('已儲存')}
  catch(e){toast('儲存失敗：'+(e?.message||e?.code||e))}
}
async function deleteEntry(){
  const d=state.draft;if(!d?.id)return;
  if(!confirm('確定要刪除這筆紀錄嗎？'))return;
  closeForm();
  try{await store.remove(d.id);toast('已刪除')}catch(e){toast('刪除失敗：'+(e?.message||e?.code||e))}
}
