// ==========================================================
// js/views/settings
// 「設定」分頁：帳號、兩人名字、分類、匯出。
// ==========================================================

/**
 * 分類編輯區：顯示目前的分類（× 刪除），下面可以新增。
 * @param {string} key   'expenseCats' 或 'incomeCats'
 * @param {string} title 區塊標題
 */
function catEditor(key,title){
  return `<section class="card pad"><h3>${title}</h3>
    <div class="tags">${state.settings[key].map((c,i)=>`<span class="tag">${esc(c)}<button type="button" data-delcat="${key}:${i}" aria-label="刪除 ${esc(c)}">×</button></span>`).join('')}</div>
    <form class="addcat" data-addcat="${key}"><input name="c" placeholder="新增分類" maxlength="10"><button class="btn small">加入</button></form></section>`;
}

/** 畫出「設定」分頁：帳號與試算表、兩人名字、支出／收入分類。 */
function viewSettings(){
  const st=state.settings;
  const acct=store.mode==='sheets'
    ?`<p>登入的 Google 帳號：<b>${esc(state.user||'')}</b></p>
      <p>資料存在 Google 試算表${store.sheetUrl?`：<a href="${esc(store.sheetUrl)}" target="_blank" rel="noopener">開啟試算表</a>`:''}</p>
      <p class="hint">想下載備份：打開試算表 → 檔案 → 下載（Excel 或 CSV）。</p>
      <div class="acct-btns"><button class="btn small" data-action="reload">重新讀取</button><button class="btn small" data-action="logout">登出</button></div>`
    :`<p class="hint">目前是「本機測試模式」，資料只存在這個瀏覽器。在 config.js 填好 Apps Script 的網址後，才會存到試算表（見 README.md）。</p>`;
  // 一個人的名字欄位
  const person=p=>`<label class="pfield"><span class="dot pa-${p}"></span><span class="pf-l">${p}</span>
      <input name="name${p}" value="${esc(st['name'+p])}" placeholder="${p==='A'?'例如：老公':'例如：老婆'}" maxlength="10"></label>`;
  return `<section class="card pad"><h3>帳號</h3>${acct}</section>
    <form class="card pad" id="peopleForm"><h3>兩個人的名字</h3>
      ${person('A')}${person('B')}
      <button class="btn primary">儲存</button></form>
    ${catEditor('expenseCats','支出分類')}
    ${catEditor('incomeCats','收入分類')}`;
}
