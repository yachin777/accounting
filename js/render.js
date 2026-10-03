// ==========================================================
// js/render.js
// 重畫畫面：分頁列、右上角使用者、目前分頁的內容。
// ==========================================================

function render(){
  // 分頁列
  $('#tabbar').innerHTML=VIEWS.map(v=>`<button class="tab ${state.view===v.id?'on':''}" data-view="${v.id}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v.icon}</svg><span>${v.label}</span></button>`).join('');
  $('#who').innerHTML=state.user?`<span class="avatar" title="${esc(state.user.email)}">${esc((me()?nm(me()):state.user.name||state.user.email||'?')[0])}</span>`:'';
  const loginNeeded=store.mode==='cloud'&&!state.user;
  $('#fab').hidden=loginNeeded||!state.ready||state.view==='settings';
  $('#tabbar').hidden=loginNeeded;
  const v=$('#view');
  if(state.authError&&!state.user||loginNeeded){v.innerHTML=loginView();return}
  if(!state.ready){v.innerHTML='<div class="empty">載入中…</div>';return}
  const err=state.authError?`<div class="notice err">${esc(state.authError)}</div>`:'';
  v.innerHTML=err+({records:viewRecords,settle:viewSettle,stats:viewStats,settings:viewSettings}[state.view])();
}

function loginView(){
  return `<div class="login card pad">
    <div class="logo big" aria-hidden="true">帳</div>
    <h2>家庭記帳</h2>
    <p>用 Google 帳號登入，兩個人看到的是同一本帳。</p>
    ${state.authError?`<div class="notice err">${esc(state.authError)}</div>`:''}
    ${state.ready?'<button class="btn primary" data-action="login">使用 Google 登入</button>':'<p class="hint">載入中…</p>'}
  </div>`;
}
