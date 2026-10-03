// ==========================================================
// js/views/settings.js
// 「設定」分頁：帳號、兩人名字、分類、匯出。
// ==========================================================

function catEditor(key,title){
  return `<section class="card pad"><h3>${title}</h3>
    <div class="tags">${state.settings[key].map((c,i)=>`<span class="tag">${esc(c)}<button type="button" data-delcat="${key}:${i}" aria-label="刪除 ${esc(c)}">×</button></span>`).join('')}</div>
    <form class="addcat" data-addcat="${key}"><input name="c" placeholder="新增分類" maxlength="10"><button class="btn small">加入</button></form></section>`;
}

function viewSettings(){
  const st=state.settings;
  const acct=store.mode==='sheets'
    ?`<p>已登入：<b>${esc(auth.user?.email||'')}</b></p>
      <p>資料存在 Google 試算表${store.sheetUrl?`：<a href="${esc(store.sheetUrl)}" target="_blank" rel="noopener">開啟試算表</a>`:''}</p>
      <div class="acct-btns"><button class="btn small" data-action="reload">重新讀取</button><button class="btn small" data-action="logout">登出</button></div>`
    :`<p class="hint">目前是「本機模式」，資料只存在這個瀏覽器。在 config.js 填好 Google 試算表的網址後，兩人就能共用（見 README.md）。</p>`;
  const person=p=>`<label class="pfield"><span class="dot pa-${p}"></span><span class="pf-l">${p}</span>
      <input name="name${p}" value="${esc(st['name'+p])}" placeholder="${p==='A'?'例如：老公':'例如：老婆'}" maxlength="10"></label>`;
  return `<section class="card pad"><h3>帳號</h3>${acct}</section>
    <form class="card pad" id="peopleForm"><h3>兩個人的名字</h3>
      ${person('A')}${person('B')}
      <button class="btn primary">儲存</button></form>
    ${catEditor('expenseCats','支出分類')}
    ${catEditor('incomeCats','收入分類')}
    <section class="card pad"><h3>匯出</h3><p class="hint">下載全部紀錄（CSV，可用 Excel 開啟）。</p><button class="btn small" data-action="export">下載 CSV</button></section>`;
}

// 匯出 CSV
function exportCsv(){
  const head=['日期','類型','分類','金額','備註','付款人／收入歸屬','分攤方式',nm('A')+'份額',nm('B')+'份額','分帳影響'];
  const rows=[...state.entries].sort(byDate).map(e=>[
    e.date,TYPES.find(t=>t.id===e.type)?.label,e.category||'',e.amount,e.note||'',
    e.type==='expense'?nm(e.payer):e.type==='income'?(e.owner==='both'?'共同':nm(e.owner)):`${nm(e.from)}→${nm(e.to)}`,
    e.type==='expense'?SPLITS.find(s=>s.id===e.split)?.label:'',e.shareA??'',e.shareB??'',effectText(e)]);
  const csv='﻿'+[head,...rows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`記帳_${today()}.csv`;a.click();
}
