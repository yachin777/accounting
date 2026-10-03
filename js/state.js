// ==========================================================
// js/state.js
// 畫面狀態與資料（全部都放在 state 裡，改完呼叫 render() 重畫）。
// ==========================================================

const state={
  view:'records',            // 目前分頁
  month:today().slice(0,7),  // 「明細」「統計」看的月份
  filter:'all',              // 明細篩選：all / expense / income / transfer
  settleAll:false,           // 分帳：false = 只看上次結清後；true = 全部
  entries:[],                // 所有記帳資料
  settings:{...DEFAULT_SETTINGS},
  user:null,                 // 登入的 Google 帳號
  ready:false,               // 資料是否載入完成
  authError:'',
  draft:null                 // 表單正在編輯的資料
};

// 取得名字：nm('A') → 設定裡的名字，沒填就顯示「成員A」
function nm(p){return (p==='A'?state.settings.nameA:state.settings.nameB)||('成員'+p)}
// 另一個人
function other(p){return p==='A'?'B':'A'}
// 目前登入的是哪一位（依設定裡的 Email 判斷；判斷不出來回傳 null）
function me(){
  const e=(state.user?.email||'').toLowerCase();if(!e)return null;
  if(e===(state.settings.emailA||'').toLowerCase())return 'A';
  if(e===(state.settings.emailB||'').toLowerCase())return 'B';
  return null;
}
