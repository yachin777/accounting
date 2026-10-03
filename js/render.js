// ==========================================================
// js/render.js
// 重畫畫面：分頁列、右上角使用者、目前分頁的內容。
// ==========================================================

function render(){
  // 分頁列
  $('#tabbar').innerHTML=VIEWS.map(v=>`<button class="tab ${state.view===v.id?'on':''}" data-view="${v.id}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v.icon}</svg><span>${v.label}</span></button>`).join('');
  const u=auth.user;
  $('#who').innerHTML=u?(u.picture?`<img class="avatar" src="${esc(u.picture)}" alt="" title="${esc(u.email)}" referrerpolicy="no-referrer">`:`<span class="avatar" title="${esc(u.email)}">${esc(u.name[0])}</span>`):'';
  const loginNeeded=store.isLocked();
  $('#fab').hidden=loginNeeded||!state.ready||state.view==='settings';
  $('#tabbar').hidden=loginNeeded;
  const v=$('#view');
  if(loginNeeded){v.innerHTML=loginView();auth.mountButton($('#gbtn'));return}
  if(!state.ready){v.innerHTML='<div class="empty">載入中…</div>';return}
  const err=state.authError?`<div class="notice err">${esc(state.authError)}</div>`:'';
  v.innerHTML=err+({records:viewRecords,settle:viewSettle,stats:viewStats,settings:viewSettings}[state.view])();
}

// 登入畫面
function loginView(){
  return `<div class="login card pad">
    <div class="logo big" aria-hidden="true">帳</div>
    <h2>家庭記帳</h2>
    <p>用 Google 帳號登入，兩個人看到的是同一本帳（存在 Google 試算表）。</p>
    ${state.authError?`<div class="notice err">${esc(state.authError)}</div>`:''}
    <div id="gbtn" class="gbtn">載入中…</div>
    <p class="hint">只有加進允許名單的 Google 帳號可以進入。</p>
  </div>`;
}
