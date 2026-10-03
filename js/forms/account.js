// ==========================================================
// js/forms/account
// 「帳戶」表單：新增／編輯資產（現金、股票、定存…）或負債（信用卡、貸款…）。
// ==========================================================

/**
 * 打開帳戶表單。
 * @param {Object|null} acc 要編輯的帳戶；null = 新增
 * @param {Object} preset   新增時的預設值（例如 {kind:'liability'}）
 */
function openAccountForm(acc,preset={}){
  const d=acc?{...acc}:{kind:'asset',type:'',name:'',owner:'',balance:'',note:'',...preset};
  openSheet('account',d,acc?'編輯帳戶':(d.kind==='liability'?'新增負債':'新增資產'),!!acc,acc?'':'name');
}

/** 畫出帳戶表單的欄位（類別、種類、名稱、金額、擁有者、備註）。 */
function renderAccountForm(){
  const d=state.draft, types=ACCOUNT_TYPES[d.kind];
  if(!types.includes(d.type))d.type=types[0];   // 切換資產／負債時，種類改成第一個
  let h=field('類別',seg('kind',ACCOUNT_KINDS));
  h+=field('種類',`<div class="chips cwrap">${types.map(t=>`<button type="button" class="chip ${d.type===t?'on':''}" data-set="type:${esc(t)}">${esc(t)}</button>`).join('')}</div>`);
  h+=field('名稱',`<input name="name" value="${esc(d.name)}" placeholder="${d.kind==='liability'?'例如：國泰信用卡、房貸':'例如：錢包、台新銀行、元大證券'}" maxlength="20">`);
  h+=field(d.kind==='liability'?'目前欠款':'目前餘額',`<input name="balance" type="number" inputmode="decimal" step="any" value="${esc(d.balance)}" placeholder="0" class="big num">`);
  h+=field('擁有者',seg('owner',ACCOUNT_OWNERS),d.owner?'':'need');
  h+=field('備註',`<input name="note" value="${esc(d.note||'')}" placeholder="選填，例如：利率 1.7%、到期日" maxlength="40">`);
  $('#formBody').innerHTML=h;
}

/** 按「儲存」：檢查必填 → 存到試算表。新帳戶會排在同類別的最後面。 */
async function submitAccount(){
  const d=state.draft;
  if(!d.name.trim())return toast('請輸入名稱');
  if(d.balance===''||isNaN(+d.balance))return toast('請輸入金額');
  if(!d.owner)return toast('請選擁有者');
  const same=state.accounts.filter(a=>a.kind===d.kind);
  const acc={id:d.id||store.newId(),kind:d.kind,type:d.type,name:d.name.trim(),owner:d.owner,balance:r2(d.balance),note:(d.note||'').trim(),
    order:d.order??(same.length?Math.max(...same.map(a=>a.order||0))+1:1),updatedAt:new Date().toISOString()};
  closeForm();
  try{await store.saveAccount(acc);toast('已儲存')}
  catch(e){toast('儲存失敗：'+(e?.message||e))}
}
