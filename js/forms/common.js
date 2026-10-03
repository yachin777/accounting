// ==========================================================
// js/forms/common
// 表單共用的部分：彈出視窗的開關、按鈕元件、儲存／刪除時依表單種類分派。
// 三種表單都用同一個彈出視窗（index.html 的 #form）：
//   entry   = 記一筆（js/forms/entry）
//   account = 帳戶（js/forms/account）
//   budget  = 預算（js/forms/budget）
// 正在編輯的內容放在 state.draft，種類放在 state.formKind。
// ==========================================================

// 每種表單：怎麼畫、怎麼存、怎麼刪（用到時才查，所以可以放在後面的檔案定義）
const FORM_TYPES={
  entry:  {render:()=>renderEntryForm(),   submit:()=>submitEntry(),   remove:id=>store.remove(id)},
  account:{render:()=>renderAccountForm(), submit:()=>submitAccount(), remove:id=>store.removeAccount(id)},
  budget: {render:()=>renderBudgetForm(),  submit:()=>submitBudget(),  remove:id=>store.removeBudget(id)}
};

/**
 * 分段按鈕（例如「誰付的：老公｜老婆」）。點了會觸發 data-set，把值寫進 state.draft[key]。
 * @param {string} key  寫進 draft 的欄位名稱
 * @param {Array} opts  選項 [{id, label}]；沒有 label 就顯示成員名字
 */
function seg(key,opts){
  return `<div class="seg">${opts.map(o=>`<button type="button" class="${String(state.draft[key])===String(o.id)?'on':''}" data-set="${key}:${o.id}">${esc(o.label??nm(o.id))}</button>`).join('')}</div>`;
}

/**
 * 一個表單欄位（上面標題、下面內容）。
 * @param {string} label 標題
 * @param {string} inner 欄位內容 HTML
 * @param {string} cls   額外 class；'need' = 還沒選，標題旁會顯示「（請選擇）」
 */
function field(label,inner,cls=''){
  return `<div class="field ${cls}"><span class="lbl">${label}</span>${inner}</div>`;
}

/**
 * 打開彈出視窗。
 * @param {string} kind     表單種類 entry / account / budget
 * @param {Object} draft    要編輯的內容
 * @param {string} title    視窗標題
 * @param {boolean} canDelete 是否顯示「刪除」按鈕（編輯既有資料時才有）
 * @param {string} focus    打開後游標要放在哪個欄位（name）
 */
function openSheet(kind,draft,title,canDelete,focus){
  state.draft=draft;state.formKind=kind;
  $('#formTitle').textContent=title;
  const del=$('#delBtn');del.hidden=!canDelete;delete del.dataset.armed;del.textContent='刪除';
  renderForm();
  $('#scrim').hidden=false;document.body.classList.add('lock');
  if(focus)setTimeout(()=>$(`#formBody [name=${focus}]`)?.focus(),60);
}

/** 關閉彈出視窗，清掉正在編輯的內容。 */
function closeForm(){
  $('#scrim').hidden=true;document.body.classList.remove('lock');state.draft=null;
}

/** 依目前的表單種類，重畫表單內容（切換選項時會呼叫）。 */
function renderForm(){
  FORM_TYPES[state.formKind].render();
}

/** 按「儲存」：交給對應種類的儲存函式。 */
function submitForm(){
  return FORM_TYPES[state.formKind].submit();
}

/**
 * 按「刪除」：第一次按會變成「確定刪除？」，再按一次才真的刪除（避免誤刪）。
 */
async function deleteCurrent(){
  const d=state.draft;if(!d?.id)return;
  const b=$('#delBtn');
  if(!b.dataset.armed){b.dataset.armed='1';b.textContent='確定刪除？';return}
  const remove=FORM_TYPES[state.formKind].remove;
  closeForm();
  try{await remove(d.id);toast('已刪除')}
  catch(e){toast('刪除失敗：'+(e?.message||e))}
}
