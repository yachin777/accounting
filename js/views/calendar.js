// ==========================================================
// js/views/calendar
// 「日曆」分頁：一個月的月曆，每天顯示支出／收入；點某一天看當天明細。
// ==========================================================

/** 月曆格子裡的簡短金額：12345 → 1.2萬、980 → 980。 */
function shortMoney(n){
  n=Math.round(n);
  if(n>=10000)return (Math.round(n/1000)/10)+'萬';
  return n.toLocaleString('zh-TW');
}

/** 目前選的那一天（切換月份後不在這個月，就改選今天或 1 號）。 */
function calDay(){
  if(state.calDay&&state.calDay.startsWith(state.month))return state.calDay;
  return today().startsWith(state.month)?today():state.month+'-01';
}

/** 畫出「日曆」分頁：月曆（每天支出／收入，花越多底色越深）＋選到那天的明細。 */
function viewCalendar(){
  const m=state.month, sel=calDay(), td=today();
  const list=state.entries.filter(e=>(e.date||'').startsWith(m));
  // 每天的支出、收入
  const days={};
  for(const e of list){
    const d=days[e.date]??={exp:0,inc:0,n:0};d.n++;
    if(e.type==='expense')d.exp+=e.amount;else if(e.type==='income')d.inc+=e.amount;
  }
  const max=Math.max(1,...Object.values(days).map(d=>d.exp));
  const [y,mo]=m.split('-').map(Number);
  const first=new Date(y,mo-1,1).getDay(), count=new Date(y,mo,0).getDate();
  let cells='';
  for(let i=0;i<first;i++)cells+='<span class="cday blank"></span>';
  for(let d=1;d<=count;d++){
    const ds=`${m}-${String(d).padStart(2,'0')}`, x=days[ds];
    // 支出越多，底色越深
    const heat=x&&x.exp?Math.max(.12,x.exp/max*.55):0;
    cells+=`<button class="cday ${ds===sel?'sel':''} ${ds===td?'today':''}" data-day="${ds}" style="--heat:${heat}" aria-label="${dayLabel(ds)}${x?`，支出 ${money(x.exp)}，收入 ${money(x.inc)}`:''}">
      <span class="cd-n">${d}</span>
      ${x&&x.exp?`<span class="cd-e num">${shortMoney(x.exp)}</span>`:''}
      ${x&&x.inc?`<span class="cd-i num">+${shortMoney(x.inc)}</span>`:''}
      ${x&&!x.exp&&!x.inc?'<span class="cd-dot"></span>':''}
    </button>`;
  }
  // 選到那天的明細
  const dayList=list.filter(e=>e.date===sel).sort((a,b)=>-byDate(a,b));
  const ds=summarize(dayList);
  return `${monthBar()}${sumBoxes(summarize(list))}
    <section class="card cal">
      <div class="cal-h">${'日一二三四五六'.split('').map(w=>`<span>${w}</span>`).join('')}</div>
      <div class="cal-g">${cells}</div>
    </section>
    <div class="day-h"><b>${dayLabel(sel)}</b><small class="num">${ds.expense?'支出 '+money(ds.expense):''}${ds.income?'　收入 '+money(ds.income):''}</small></div>
    ${dayList.length?`<div class="card list">${dayList.map(e=>entryRow(e)).join('')}</div>`:'<div class="empty small">這天沒有紀錄</div>'}
    <button class="btn wide" data-action="new">＋ 在 ${dayLabel(sel)} 記一筆</button>`;
}
