// ==========================================================
// js/store.js
// 資料存取：新增／修改／刪除都經過這裡。
//   sheets = Google 試算表（config.js 有填 SHEETS_API_URL 時；需用 Google 登入）
//   local  = 只存在這個瀏覽器（沒有設定網址時，用來測試）
//
// 試算表那一端的程式在 apps-script/Code.gs。
// 另一半新增的資料：每 30 秒、切回這個分頁時，會自動重新讀取。
// ==========================================================

const LOCAL_KEY='acc-local', REFRESH_MS=30000;
const store={
  mode:'local',url:'',sheetUrl:'',timer:null,busy:0,
  async init(){
    this.url=(window.SHEETS_API_URL||'').trim();
    if(this.url){
      this.mode='sheets';
      if(!window.GOOGLE_CLIENT_ID){state.authError='config.js 還沒填 GOOGLE_CLIENT_ID';state.ready=true;render();return}
      auth.load();
      if(auth.user)await this.refresh(true);else{state.ready=true;render()}
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.refresh()});
      this.timer=setInterval(()=>{if(!document.hidden)this.refresh()},REFRESH_MS);
      return;
    }
    try{const raw=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null');
      if(raw){state.entries=raw.entries||[];state.settings={...DEFAULT_SETTINGS,...raw.settings}}}catch{}
    state.ready=true;render();
  },
  // 呼叫試算表的 API
  async call(action,data={}){
    let idToken;
    try{idToken=await auth.ensure()}catch(e){this.logout(e.message);throw e}
    let j;
    try{
      const r=await fetch(this.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,idToken,...data})});
      j=await r.json();
    }catch{throw {code:'network',message:'無法連上 Google 試算表，請檢查網路'}}
    if(!j.ok){if(j.code==='bad_token'||j.code==='not_allowed'||j.code==='need_login')this.logout(j.message);throw j}
    return j;
  },
  // 重新讀取全部資料（first = 第一次載入，失敗時要顯示錯誤）
  async refresh(first){
    if(this.mode!=='sheets'||!auth.user||this.busy)return;
    try{
      const j=await this.call('list');
      if(this.busy)return;   // 讀取途中有人在存檔，等下次再更新，避免畫面跳回舊資料
      state.entries=j.entries||[];
      state.settings={...DEFAULT_SETTINGS,...j.settings};
      this.sheetUrl=j.sheetUrl||'';state.authError='';
    }catch(e){
      if(first)state.authError=e.message||'讀取失敗';
      else if(this.isLocked()){render();return}
      else return;   // 背景更新失敗就算了，下次再試
    }
    state.ready=true;render();
  },
  // Google 登入成功（auth.js 呼叫）
  onLogin(){
    if(this.mode!=='sheets')return;
    state.ready=false;state.authError='';render();
    this.refresh(true).then(()=>{
      let item=null;try{item=JSON.parse(localStorage.getItem('acc-pending')||'null');localStorage.removeItem('acc-pending')}catch{}
      if(item&&!this.isLocked())this.save(item).then(()=>toast('已補存登入過期時的那筆紀錄')).catch(()=>{});
    });
  },
  // 登出（msg = 要顯示在登入畫面的原因）
  logout(msg=''){
    auth.logout();
    state.entries=[];state.settings={...DEFAULT_SETTINGS};state.authError=msg;state.ready=true;
    if(typeof closeForm==='function')closeForm();render();
  },
  isLocked(){return this.mode==='sheets'&&!auth.user},
  canWrite(){return !this.isLocked()},
  newId(){return 'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)},
  persistLocal(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify({entries:state.entries,settings:state.settings}))}catch{toast('這個瀏覽器無法儲存資料')}},
  // 先改畫面，再送到試算表；失敗就還原
  async sync(apply,action,data){
    const backup={entries:state.entries.slice(),settings:{...state.settings}};
    apply();render();
    if(this.mode==='local'){this.persistLocal();return}
    this.busy++;
    try{await this.call(action,data)}
    catch(e){
      state.entries=backup.entries;state.settings=backup.settings;
      // 登入過期導致沒存到：先記在這台裝置，重新登入後自動補存
      if(action==='save'&&this.isLocked()){try{localStorage.setItem('acc-pending',JSON.stringify(data.item))}catch{};e={...e,message:'登入已過期，重新登入後會自動補存這筆'}}
      render();throw e;
    }
    finally{this.busy--}
  },
  async save(item){
    return this.sync(()=>{
      const i=state.entries.findIndex(e=>e.id===item.id);
      if(i>=0)state.entries[i]=item;else state.entries.push(item);
    },'save',{item});
  },
  async remove(id){
    return this.sync(()=>{state.entries=state.entries.filter(e=>e.id!==id)},'remove',{id});
  },
  async saveSettings(next){
    return this.sync(()=>{state.settings={...state.settings,...next}},'saveSettings',{settings:{...state.settings,...next}});
  }
};
