// ==========================================================
// js/views/member
// 「成員統計」畫面：從「統計」點某個人進來，只看這個人的收入與支出
//   收入：歸屬給他的收入，「共同」收入算一半
//   支出：依分攤方式算出他自己花掉的部分（不是誰付的錢）
// ==========================================================
/**
 * 算出某個人在這些紀錄裡的收入、支出（自己花掉）、實際掏錢、各分類金額。
 * @param {Array} list 紀錄（通常是某個月的）
 * @param {string} p   'A' 或 'B'
 */
function memberSummary(list,p){
  const o={income:0,use:0,paid:0,cats:{},incomeCats:{}};
  for(const e of list){
    if(e.type==='expense'){
      const mine=+(p==='A'?e.shareA:e.shareB)||0;
      if(mine){o.use+=mine;o.cats[e.category||'其他']=(o.cats[e.category||'其他']||0)+mine}
      if(e.payer===p)o.paid+=e.amount;
    }else if(e.type==='income'&&(e.owner===p||e.owner==='both')){
      const v=e.owner==='both'?e.amount/2:e.amount;
      o.income+=v;o.incomeCats[e.category||'其他']=(o.incomeCats[e.category||'其他']||0)+v;
    }
  }
  for(const k of ['income','use','paid'])o[k]=r2(o[k]);
  return o;
}
/** 畫出成員統計畫面：本月收支、分類、近幾個月趨勢、相關紀錄。 */
function viewMember(){
  const p=state.member, monthOf=m=>state.entries.filter(e=>(e.date||'').startsWith(m));
  const list=monthOf(state.month), s=memberSummary(list,p), net=r2(s.income-s.use);
  const months=[];for(let i=TREND_MONTHS-1;i>=0;i--)months.push(shiftMonth(state.month,-i));
  const ms=months.map(m=>({m,...memberSummary(monthOf(m),p)}));
  const max=Math.max(1,...ms.map(x=>Math.max(x.income,x.use)));
  const trend=`<div class="trend">${ms.map(x=>`<div class="tcol ${x.m===state.month?'cur':''}" title="${monthLabel(x.m)}　收入 ${money(x.income)}　支出 ${money(x.use)}">
      <div class="tbars"><span class="tb inc" style="height:${x.income/max*100}%"></span><span class="tb exp" style="height:${x.use/max*100}%"></span></div>
      <small>${+x.m.slice(5)}月</small></div>`).join('')}</div>
    <div class="legend"><span><i class="inc"></i>收入</span><span><i class="exp"></i>支出</span></div>`;
  // 這個月跟他有關的紀錄：他有份額或他付錢的支出、他的（或共同）收入、他參與的還款
  const mine=list.filter(e=>e.type==='expense'?((p==='A'?e.shareA:e.shareB)>0||e.payer===p)
    :e.type==='income'?(e.owner===p||e.owner==='both'):(e.from===p||e.to===p)).sort((a,b)=>-byDate(a,b));
  const rows=mine.map(e=>entryRow(e,e.type==='expense'?`<small class="run num">${esc(nm(p))}的部分：${money(p==='A'?e.shareA:e.shareB)}　·　${dayLabel(e.date)}</small>`
    :`<small class="run num">${dayLabel(e.date)}${e.owner==='both'?'　·　共同收入，算一半 '+money(e.amount/2):''}</small>`)).join('');
  return `<div class="subhead"><button class="icon-btn" data-view="stats" aria-label="回統計">‹</button>
      <span class="dot pa-${p}"></span><h2>${esc(nm(p))} 的收支</h2>
      <button class="chip" data-member="${other(p)}">看 ${esc(nm(other(p)))}</button></div>
    ${monthBar()}
    <div class="stats3">
      <div><small>收入</small><b class="num inc">${money(s.income)}</b></div>
      <div><small>支出</small><b class="num exp">${money(s.use)}</b></div>
      <div><small>結餘</small><b class="num ${net<0?'exp':''}">${money(net)}</b></div>
    </div>
    <p class="hint">這個月 ${esc(nm(p))} 實際掏錢 ${money(s.paid)}。支出是依分攤方式算出「自己花掉」的部分，共同收入算一半。</p>
    <section class="card pad"><h3>支出分類</h3>${hbars(s.cats,'exp')}</section>
    <section class="card pad"><h3>收入分類</h3>${hbars(s.incomeCats,'inc')}</section>
    <section class="card pad"><h3>近 ${TREND_MONTHS} 個月收支</h3>${trend}</section>
    <h3 class="list-title">這個月的紀錄（${mine.length}）</h3>
    ${rows?`<div class="card list">${rows}</div>`:'<div class="empty small">這個月沒有紀錄</div>'}`;
}
