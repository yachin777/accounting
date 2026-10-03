// ==========================================================
// js/utils.js
// 小工具：文字跳脫、金額、日期、提示訊息。
// ==========================================================

const $=s=>document.querySelector(s);
// 把文字裡的特殊符號轉掉，避免破壞畫面
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// 金額：1234.5 → $1,234.5
function money(n){n=Math.round((+n||0)*100)/100;return (n<0?'-$':'$')+Math.abs(n).toLocaleString('zh-TW',{maximumFractionDigits:2})}
// 四捨五入到小數兩位（避免 0.1+0.2 這種誤差）
function r2(n){return Math.round((+n||0)*100)/100}
// 今天：YYYY-MM-DD（台灣時間）
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
// 月份往前／往後：shiftMonth('2026-01',-1) → '2025-12'
function shiftMonth(m,n){let [y,mo]=m.split('-').map(Number);mo+=n;while(mo<1){mo+=12;y--}while(mo>12){mo-=12;y++}return `${y}-${String(mo).padStart(2,'0')}`}
// '2026-10' → '2026 年 10 月'
function monthLabel(m){const [y,mo]=m.split('-');return `${y} 年 ${+mo} 月`}
// '2026-10-03' → '10/3（六）'
function dayLabel(d){const t=new Date(d+'T00:00:00');return `${t.getMonth()+1}/${t.getDate()}（${'日一二三四五六'[t.getDay()]}）`}
// 顯示提示訊息幾秒
let toastTimer;
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,2600)}
