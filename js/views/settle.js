// ==========================================================
// js/views/settle.js
// 「分帳」分頁：目前誰要給誰多少錢、每一筆怎麼算出來的。
// ==========================================================

function viewSettle(){
  const {balance,rows,lastZero}=settlement(state.entries);
  const open=rows.slice(lastZero+1);            // 上次兩清之後的紀錄
  const list=(state.settleAll?rows:open).slice().reverse();
  // 未結清期間：各自幫對方墊了多少、已還多少
  let aForB=0,bForA=0,paid=0;
  for(const r of open){
    if(r.e.type==='transfer')paid+=r.e.amount;
    else if(r.v>0)aForB+=r.v;else bForA+=-r.v;
  }
  const debtor=balance>0?'B':'A', creditor=other(debtor), amt=Math.abs(balance);
  const hero=amt<0.005
    ?`<div class="hero even"><small>目前</small><div class="hero-big">兩清</div><p>沒有人欠誰錢</p></div>`
    :`<div class="hero"><small>目前</small>
        <div class="hero-who"><span class="pa-${debtor}">${esc(nm(debtor))}</span> 要給 <span class="pa-${creditor}">${esc(nm(creditor))}</span></div>
        <div class="hero-big num">${money(amt)}</div>
        <button class="btn primary" data-action="settleup">記錄還款</button>
      </div>`;
  const items=list.map(r=>entryRow(r.e,`<small class="run num">累計：${
    Math.abs(r.bal)<0.005?'兩清':`${esc(nm(r.bal>0?'B':'A'))} 欠 ${esc(nm(r.bal>0?'A':'B'))} ${money(Math.abs(r.bal))}`}　·　${dayLabel(r.e.date)}</small>`)).join('');
  return `${nameHint()}${hero}
    <div class="stats3">
      <div><small>${esc(nm('A'))} 幫 ${esc(nm('B'))} 墊</small><b class="num">${money(aForB)}</b></div>
      <div><small>${esc(nm('B'))} 幫 ${esc(nm('A'))} 墊</small><b class="num">${money(bForA)}</b></div>
      <div><small>已還款</small><b class="num">${money(paid)}</b></div>
    </div>
    <p class="hint">只有「平分」「自訂」「幫對方付」的支出會算進分帳；「自己的」花費不會。上方數字是上次兩清之後的累計。</p>
    <div class="chips">
      <button class="chip ${state.settleAll?'':'on'}" data-settle="open">未結清（${open.length}）</button>
      <button class="chip ${state.settleAll?'on':''}" data-settle="all">全部紀錄（${rows.length}）</button>
    </div>
    ${items?`<div class="card list">${items}</div>`:'<div class="empty">沒有需要分帳的紀錄。</div>'}`;
}
