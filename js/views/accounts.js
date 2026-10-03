// ==========================================================
// js/views/accounts
// 「帳戶」分頁：淨資產、總資產、負債，以及資產／負債帳戶清單。
// 金額是手動填的（點帳戶就能更新）。
// ==========================================================

/** 畫出「帳戶」分頁：淨資產、總資產、負債，以及資產／負債帳戶清單。 */
function viewAccounts(){
  const f=state.accFilter;
  const list=state.accounts.filter(a=>f==='all'||a.owner===f);
  // 某類別（asset／liability）的金額合計
  const sum=k=>r2(list.filter(a=>a.kind===k).reduce((t,a)=>t+(+a.balance||0),0));
  const assets=sum('asset'), debts=sum('liability'), net=r2(assets-debts);
  // 擁有者顯示名稱
  const ownerLabel=o=>o==='both'?'共同':nm(o);
  // 資產或負債的一區（標題、帳戶列表、新增按鈕）
  const section=(kind,title,total)=>{
    const rows=list.filter(a=>a.kind===kind).sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name));
    // 依種類分組小計
    return `<section class="acc-sec">
      <div class="acc-sec-h"><h3>${title}</h3><b class="num ${kind==='liability'?'exp':''}">${money(total)}</b></div>
      ${rows.length?`<div class="card list">${rows.map(a=>`<button class="row" data-acc="${esc(a.id)}">
        <span class="cat ${kind==='liability'?'exp':'acc'}">${esc(a.type[0])}</span>
        <span class="row-main"><span class="row-t"><b>${esc(a.name)}</b></span>
          <small>${esc(a.type)} · ${esc(ownerLabel(a.owner))}${a.note?' · '+esc(a.note):''}${a.updatedAt?` · 更新 ${+a.updatedAt.slice(5,7)}/${+a.updatedAt.slice(8,10)}`:''}</small></span>
        <span class="amt num ${kind==='liability'?'exp':''}">${money(a.balance)}</span></button>`).join('')}</div>`
        :`<div class="empty small">還沒有${title}帳戶</div>`}
      <button class="btn wide" data-addacc="${kind}">＋ 新增${title}</button>
    </section>`;
  };
  const chips=[['all','全部'],['A',nm('A')],['B',nm('B')],['both','共同']];
  return `<div class="chips">${chips.map(([id,l])=>`<button class="chip ${f===id?'on':''}" data-accfilter="${id}">${esc(l)}</button>`).join('')}</div>
    <div class="hero acc-hero"><small>淨資產${f==='all'?'':'（'+esc(chips.find(c=>c[0]===f)[1])+'）'}</small>
      <div class="hero-big num ${net<0?'exp':''}">${money(net)}</div>
      <div class="acc-2"><div><small>總資產</small><b class="num">${money(assets)}</b></div><div><small>負債</small><b class="num exp">${money(debts)}</b></div></div>
    </div>
    ${section('asset','資產',assets)}
    ${section('liability','負債',debts)}
    <p class="hint">淨資產 = 總資產 − 負債。帳戶金額要自己更新：點帳戶 → 改金額 → 儲存。</p>`;
}
