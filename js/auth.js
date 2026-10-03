// ==========================================================
// js/auth.js
// Google 登入（Google Identity Services）。
//
// 登入後 Google 給一張「身分證明」（ID token，約 1 小時有效），
// 每次讀寫資料都附上它，試算表端（Code.gs）會向 Google 確認真假，
// 並檢查 Email 是否在允許名單裡。過期時會自動在背景重新取得。
// ==========================================================

const TOKEN_KEY='acc-idtoken';
const auth={
  token:'',exp:0,user:null,inited:false,waiters:[],

  // 解開 token 內容（Email、名字、大頭照、到期時間）
  parse(t){
    try{
      const b=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      const bytes=Uint8Array.from(atob(b),c=>c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    }catch{return null}
  },
  // 收下新的 token
  set(t){
    const p=this.parse(t);if(!p||!p.email)return false;
    this.token=t;this.exp=p.exp*1000;
    this.user={email:p.email,name:p.name||p.email,picture:p.picture||''};
    try{localStorage.setItem(TOKEN_KEY,t)}catch{}
    return true;
  },
  valid(){return !!this.token&&this.exp>Date.now()+2*60*1000},   // 剩不到 2 分鐘就當作過期
  // 開啟網頁時：讀回上次登入的 token
  load(){try{const t=localStorage.getItem(TOKEN_KEY);if(t)this.set(t)}catch{}},
  clear(){this.token='';this.exp=0;this.user=null;try{localStorage.removeItem(TOKEN_KEY)}catch{}},

  // 等 Google 的登入程式載入完成，並完成初始化
  async gis(){
    for(let i=0;i<100&&!window.google?.accounts?.id;i++)await new Promise(r=>setTimeout(r,100));
    const id=window.google?.accounts?.id;if(!id)throw {code:'gis',message:'無法載入 Google 登入，請檢查網路'};
    if(!this.inited){
      id.initialize({
        client_id:window.GOOGLE_CLIENT_ID,
        callback:r=>this.onCredential(r.credential),
        auto_select:true,                // 之前登入過就自動登入
        cancel_on_tap_outside:false,
        use_fedcm_for_prompt:true
      });
      this.inited=true;
    }
    return id;
  },
  // Google 回傳登入結果
  onCredential(t){
    const wasOut=!this.user;
    if(!this.set(t))return;
    const w=this.waiters;this.waiters=[];w.forEach(f=>f.ok(t));
    if(wasOut)store.onLogin();   // 從登入畫面登入 → 讀取資料（背景換新 token 則不用）
  },
  // 在 el 裡畫出「使用 Google 帳號登入」按鈕
  async mountButton(el){
    try{
      const id=await this.gis();
      if(!document.body.contains(el))return;
      id.renderButton(el,{theme:'filled_blue',size:'large',shape:'pill',text:'signin_with',locale:'zh-TW',width:260});
      id.prompt();   // 之前登入過的人會自動登入
    }catch(e){el.textContent=e.message||'無法載入 Google 登入'}
  },
  // 取得有效的 token（快過期時在背景重新取得；取得不到就要求重新登入）
  async ensure(){
    if(this.valid())return this.token;
    try{
      const id=await this.gis();
      const t=await new Promise((ok,fail)=>{
        this.waiters.push({ok,fail});
        id.prompt(n=>{if(n.isNotDisplayed?.()||n.isSkippedMoment?.())fail()});
        setTimeout(fail,15000);
      });
      return t;
    }catch{
      this.waiters=[];
      throw {code:'need_login',message:'登入已過期，請重新登入'};
    }
  },
  async logout(){
    try{window.google?.accounts?.id?.disableAutoSelect()}catch{}
    this.clear();
  }
};
