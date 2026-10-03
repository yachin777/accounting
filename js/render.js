// ==========================================================
// js/render
// 重畫畫面：分頁列、右上角使用者、目前畫面的內容。
// 資料一有變動就呼叫 render()，整個畫面依 state 重新產生。
// ==========================================================

// 每個畫面（state.view）對應哪個函式（在 js/views/ 裡）
const VIEW_RENDERERS={
  records:()=>viewRecords(), calendar:()=>viewCalendar(), settle:()=>viewSettle(),
  stats:()=>viewStats(), member:()=>viewMember(), budget:()=>viewBudget(),
  accounts:()=>viewAccounts(), settings:()=>viewSettings()
};
// 子畫面在底部分頁列要亮哪一個（成員統計、預算都屬於「統計」）
const VIEW_PARENT={member:'stats',budget:'stats'};

/** 重畫整個畫面。 */
function render(){
  // 底部分頁列
  $('#tabbar').innerHTML=VIEWS.map(v=>`<button class="tab ${(VIEW_PARENT[state.view]||state.view)===v.id?'on':''}" data-view="${v.id}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v.icon}</svg><span>${v.label}</span></button>`).join('');
  // 右上角：登入帳號的第一個字
  const u=state.user;
  $('#who').innerHTML=u?`<span class="avatar" title="${esc(u)}">${esc(u[0].toUpperCase())}</span>`:'';
  // 右下角「記一筆」：設定、帳戶、預算畫面不顯示
  $('#fab').hidden=!state.ready||['settings','accounts','budget'].includes(state.view);
  const v=$('#view');
  // 還沒登入：只顯示登入畫面，隱藏分頁列和記一筆按鈕
  const locked=store.isLocked();
  $('#tabbar').hidden=locked;
  if(locked){$('#fab').hidden=true;v.innerHTML=loginView();return}
  if(!state.ready){v.innerHTML='<div class="empty">載入中…</div>';return}
  // 有錯誤（例如沒有權限）就顯示在最上面
  const err=state.authError?`<div class="notice err">${esc(state.authError)}</div>`:'';
  v.innerHTML=err+VIEW_RENDERERS[state.view]();
}

/** 登入畫面：按鈕會前往 Apps Script 登入頁，登入後自動回來。 */
function loginView(){
  return `<div class="login card pad">
    <div class="logo big" aria-hidden="true">帳</div>
    <h2>家庭記帳</h2>
    <p>用 Google 帳號登入，兩個人看到的是同一本帳（存在 Google 試算表）。</p>
    ${state.authError?`<div class="notice err">${esc(state.authError)}</div>`:''}
    <button class="btn primary" data-action="login">用 Google 登入</button>
    <p class="hint">只有被分享記帳試算表的 Google 帳號可以進入。登入後這台裝置會記住 30 天。</p>
  </div>`;
}
