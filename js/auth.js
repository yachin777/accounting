// ==========================================================
// js/auth
// 登入：按「用 Google 登入」→ 跳到 Apps Script 的登入網址（LOGIN_URL）→
// Google 確認是誰 → 帶著「登入憑證」跳回這個網頁（網址後面的 #token=...）。
// 憑證存在這個瀏覽器，之後讀寫資料都附上它（js/store）。
// ==========================================================

const TOKEN_KEY='acc-token';
const auth={
  token:'',   // 登入憑證
  email:'',   // 憑證裡的 Email

  /**
   * 網頁開啟時呼叫：
   * 網址有 #token=... 就是剛登入回來 → 存起來並把網址清乾淨；否則讀出上次存的憑證。
   */
  load(){
    const m=location.hash.match(/token=([^&]+)/);
    if(m){
      this.token=decodeURIComponent(m[1]);
      try{localStorage.setItem(TOKEN_KEY,this.token)}catch{}
      history.replaceState(null,'',location.pathname+location.search);
    }else{
      try{this.token=localStorage.getItem(TOKEN_KEY)||''}catch{}
    }
    const p=this.parse();
    if(!p||!(p.x>Date.now()))this.clear();   // 看不懂或已過期 → 當作沒登入
    else this.email=p.e;
  },

  /** 解開憑證前半段，取得 {e: Email, x: 到期時間}（只是讀取，真正的驗證在 Apps Script）。 */
  parse(){
    try{return JSON.parse(atob(this.token.split('.')[0].replace(/-/g,'+').replace(/_/g,'/')))}
    catch{return null}
  },

  /** 前往 Apps Script 登入頁。 */
  login(){
    if(!window.LOGIN_URL)return toast('config.js 還沒填 LOGIN_URL');
    location.href=window.LOGIN_URL;
  },

  /** 清掉這個瀏覽器的登入憑證（登出）。 */
  clear(){
    this.token='';this.email='';
    try{localStorage.removeItem(TOKEN_KEY)}catch{}
  }
};
