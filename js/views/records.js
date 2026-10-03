// ==========================================================
// js/views/records.js
// 「明細」分頁：每月收支總覽＋每天的記帳列表。
// ==========================================================

// 月份切換列（明細、統計共用）
function monthBar(){
  return `<div class="monthbar">
    <button class="icon-btn" data-month="-1" aria-label="上個月">‹</button>
    <b>${monthLabel(state.month)}</b>
    <button class="icon-btn" data-month="1" aria-label="下個月">›</button>
    ${state.month!==today().slice(0,7)?'<button class="chip" data-month="now">回本月</button>':''}
  </div>`;
}

// 收入／支出／結餘三格
function sumBoxes(s){
  const net=r2(s.income-s.expense);
  return `<div class="stats3">
    <div><small>收入</small><b class="num inc">${money(s.income)}</b></div>
    <div><small>支出</small><b class="num exp">${money(s.expense)}</b></div>
    <div><small>結餘</small><b class="num ${net<0?'exp':''}">${money(net)}</b></div>
  </div>`;
}

// 名字還沒設定時的提醒
function nameHint(){
  if(state.settings.nameA&&state.settings.nameB)return '';
  return `<div class="notice">第一次使用？先到「設定」填上兩人的名字。<button class="btn small primary" data-view="settings">去設定</button></div>`;
}

// 一筆記帳的列（明細、分帳共用）
function entryRow(e,extra=''){
  let icon,title,sub,amt,cls;
  if(e.type==='transfer'){
    icon='還';title='還款';sub=`${nm(e.from)} → ${nm(e.to)}`;amt=money(e.amount);cls='tr';
  }else if(e.type==='income'){
    icon=(e.category||'收')[0];title=e.category||'收入';
    sub=e.owner==='both'?'共同收入':`${nm(e.owner)}的收入`;amt='+'+money(e.amount);cls='inc';
  }else{
    icon=(e.category||'支')[0];title=e.category||'支出';
    const sp=SPLITS.find(s=>s.id===e.split)?.label||'';
    sub=`${nm(e.payer)}付 · ${sp}`;
    const t=effectText(e);if(t)sub+=` · <span class="owe">${esc(t)}</span>`;
    amt=money(e.amount);cls='exp';
  }
  return `<button class="row" data-edit="${esc(e.id)}">
    <span class="cat ${cls}">${esc(icon)}</span>
    <span class="row-main"><span class="row-t"><b>${esc(title)}</b>${e.note?`<span class="note">${esc(e.note)}</span>`:''}</span><small>${sub}</small>${extra}</span>
    <span class="amt num ${cls}">${amt}</span>
  </button>`;
}

function viewRecords(){
  const list=state.entries.filter(e=>(e.date||'').startsWith(state.month));
  const s=summarize(list);
  const shown=list.filter(e=>state.filter==='all'||e.type===state.filter).sort((a,b)=>-byDate(a,b));
  // 依日期分組
  const days={};for(const e of shown)(days[e.date]??=[]).push(e);
  const groups=Object.keys(days).map(d=>{
    const ds=summarize(days[d]);
    return `<section class="day"><div class="day-h"><b>${dayLabel(d)}</b><small class="num">${ds.expense?'支出 '+money(ds.expense):''}${ds.income?'　收入 '+money(ds.income):''}</small></div>
      <div class="card list">${days[d].map(e=>entryRow(e)).join('')}</div></section>`;
  }).join('');
  const f=[['all','全部'],['expense','支出'],['income','收入'],['transfer','還款']];
  return `${nameHint()}${monthBar()}${sumBoxes(s)}
    <div class="chips">${f.map(([id,l])=>`<button class="chip ${state.filter===id?'on':''}" data-filter="${id}">${l}</button>`).join('')}</div>
    ${groups||'<div class="empty">這個月還沒有紀錄，按右下角「記一筆」開始。</div>'}`;
}
