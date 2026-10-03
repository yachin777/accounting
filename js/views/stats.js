// ==========================================================
// js/views/stats.js
// 「統計」分頁：分類占比、兩人花費、近幾個月趨勢。
// ==========================================================

// 橫條圖（分類）
function hbars(obj,cls){
  const arr=Object.entries(obj).sort((a,b)=>b[1]-a[1]);
  const total=arr.reduce((a,[,v])=>a+v,0);
  if(!arr.length)return '<div class="empty small">沒有資料</div>';
  const max=arr[0][1];
  return `<div class="hbars">${arr.map(([k,v])=>`<div class="hbar">
    <span class="hb-k">${esc(k)}</span>
    <span class="hb-track"><span class="hb-fill ${cls}" style="width:${(v/max*100).toFixed(1)}%"></span></span>
    <span class="hb-v num">${money(v)}<small>${Math.round(v/total*100)}%</small></span></div>`).join('')}</div>`;
}

function viewStats(){
  const list=state.entries.filter(e=>(e.date||'').startsWith(state.month));
  const s=summarize(list);
  // 近幾個月趨勢
  const months=[];for(let i=TREND_MONTHS-1;i>=0;i--)months.push(shiftMonth(state.month,-i));
  const ms=months.map(m=>({m,...summarize(state.entries.filter(e=>(e.date||'').startsWith(m)))}));
  const max=Math.max(1,...ms.map(x=>Math.max(x.income,x.expense)));
  const trend=`<div class="trend">${ms.map(x=>`<div class="tcol ${x.m===state.month?'cur':''}" title="${monthLabel(x.m)}　收入 ${money(x.income)}　支出 ${money(x.expense)}">
      <div class="tbars"><span class="tb inc" style="height:${x.income/max*100}%"></span><span class="tb exp" style="height:${x.expense/max*100}%"></span></div>
      <small>${+x.m.slice(5)}月</small></div>`).join('')}</div>
    <div class="legend"><span><i class="inc"></i>收入</span><span><i class="exp"></i>支出</span></div>`;
  const person=p=>`<tr><th><span class="dot pa-${p}"></span>${esc(nm(p))}</th><td class="num">${money(s['paid'+p])}</td><td class="num">${money(s['use'+p])}</td></tr>`;
  return `${monthBar()}${sumBoxes(s)}
    <section class="card pad"><h3>支出分類</h3>${hbars(s.cats,'exp')}</section>
    <section class="card pad"><h3>兩人花費</h3>
      <table class="tbl"><thead><tr><th></th><th>實際掏錢</th><th>自己花掉</th></tr></thead><tbody>${person('A')}${person('B')}</tbody></table>
      <p class="hint">「實際掏錢」是誰付的帳；「自己花掉」是依分攤方式算出各自吃了多少。</p></section>
    <section class="card pad"><h3>收入分類</h3>${hbars(s.incomeCats,'inc')}</section>
    <section class="card pad"><h3>近 ${TREND_MONTHS} 個月收支</h3>${trend}</section>`;
}
