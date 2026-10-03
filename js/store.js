// ==========================================================
// js/store
// 資料存取：新增／修改／刪除都經過這裡，畫面不直接碰試算表。
//   sheets = config.js 有填 API_URL：資料存在 Google 試算表（透過 Apps Script 的「資料用」網址）
//   local  = 沒填：資料只存在這個瀏覽器（測試用）
// 存檔方式：先更新畫面（感覺比較快），再送到試算表；失敗就把畫面還原。
// 另一半新增的資料：每 30 秒、切回這個頁面時，會自動重新讀取。
// ==========================================================

const LOCAL_KEY='acc-local', REFRESH_MS=30000;
// 這些錯誤代表「要重新登入」
const LOGIN_ERRORS=['need_login','bad_token','not_allowed'];

const store={
  mode:'local',   // 'sheets' 或 'local'
  sheetUrl:'',    // 試算表網址（設定頁的「開啟試算表」）
  busy:0,         // 正在存檔的數量；存檔中不做背景更新，避免畫面跳回舊資料

  /** 網頁開啟時呼叫：判斷模式、讀取登入憑證與資料，並開始定時自動更新。 */
  async init(){
    if(window.API_URL){
      this.mode='sheets';
      auth.load();
      if(auth.token)await this.refresh(true);else{state.ready=true;render()}
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.refresh()});
      setInterval(()=>{if(!document.hidden)this.refresh()},REFRESH_MS);
      return;
    }
    try{const raw=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null');
      if(raw){state.entries=raw.entries||[];state.accounts=raw.accounts||[];state.budgets=raw.budgets||[];state.settings={...DEFAULT_SETTINGS,...raw.settings}}}catch{}
    state.ready=true;render();
  },

  /** 是否需要先登入（雲端模式而且還沒有登入憑證）。 */
  isLocked(){return this.mode==='sheets'&&!auth.token},

  /**
   * 呼叫 Apps Script（server/api.gs 裡的動作），附上登入憑證。
   * 例如 call('save', item)。憑證失效會自動登出並顯示登入畫面。
   */
  async call(action,data){
    let j;
    try{
      const r=await fetch(window.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({action,token:auth.token,data})});
      j=await r.json();
    }catch{throw {message:'無法連上 Google 試算表，請檢查網路'}}
    if(!j.ok){
      if(LOGIN_ERRORS.includes(j.code))this.logout(j.message);
      throw j;
    }
    return j.data;
  },

  /**
   * 重新讀取全部資料並重畫。
   * @param {boolean} first 第一次載入（或按「重新讀取」）時，失敗要顯示錯誤；背景更新失敗就安靜略過
   */
  async refresh(first){
    if(this.mode!=='sheets'||this.busy||this.isLocked())return;
    try{
      const j=await this.call('list');
      if(this.busy)return;
      state.entries=j.entries||[];
      state.accounts=j.accounts||[];
      state.budgets=j.budgets||[];
      state.settings={...DEFAULT_SETTINGS,...j.settings};
      state.user=j.user||'';this.sheetUrl=j.sheetUrl||'';state.authError='';
    }catch(e){
      if(!first||this.isLocked())return;
      state.authError=e.message||'讀取失敗';
    }
    state.ready=true;render();
  },

  /**
   * 登出：清掉登入憑證和畫面上的資料，回到登入畫面。
   * @param {string} msg 要顯示在登入畫面的原因（例如「登入已過期」）
   */
  logout(msg=''){
    auth.clear();
    state.entries=[];state.accounts=[];state.budgets=[];state.settings={...DEFAULT_SETTINGS};
    state.user='';state.authError=msg;state.ready=true;
    if(state.draft)closeForm();
    render();
  },

  /** 產生新資料的 id（時間＋亂數，不會重複）。 */
  newId(){return 'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)},

  /** 本機測試模式：把全部資料存進瀏覽器。 */
  persistLocal(){
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify({entries:state.entries,accounts:state.accounts,budgets:state.budgets,settings:state.settings}))}
    catch{toast('這個瀏覽器無法儲存資料')}
  },

  /**
   * 所有存檔的共同流程：先備份 → 改畫面 → 送到試算表 → 失敗就還原並把錯誤丟出去。
   * @param {Function} apply 修改 state 的動作
   * @param {string} action  要呼叫的動作（server/api.gs 的 API）
   * @param {*} data         傳給 Apps Script 的資料
   */
  async sync(apply,action,data){
    const backup={entries:state.entries.slice(),accounts:state.accounts.slice(),budgets:state.budgets.slice(),settings:{...state.settings}};
    apply();render();
    if(this.mode==='local'){this.persistLocal();return}
    this.busy++;
    try{await this.call(action,data)}
    catch(e){if(!this.isLocked()){Object.assign(state,backup);render()}throw e}
    finally{this.busy--}
  },

  /** 把一筆資料放進清單：已經有同 id 就取代，沒有就加在最後。 */
  upsert(list,item){
    const i=list.findIndex(x=>x.id===item.id);
    if(i>=0)list[i]=item;else list.push(item);
  },

  /** 新增或修改一筆記帳。 */
  save(item){return this.sync(()=>this.upsert(state.entries,item),'save',item)},
  /** 刪除一筆記帳。 */
  remove(id){return this.sync(()=>{state.entries=state.entries.filter(e=>e.id!==id)},'remove',id)},
  /** 新增或修改一個帳戶。 */
  saveAccount(a){return this.sync(()=>this.upsert(state.accounts,a),'saveAccount',a)},
  /** 刪除一個帳戶。 */
  removeAccount(id){return this.sync(()=>{state.accounts=state.accounts.filter(x=>x.id!==id)},'removeAccount',id)},
  /** 新增或修改一筆預算。 */
  saveBudget(b){return this.sync(()=>this.upsert(state.budgets,b),'saveBudget',b)},
  /** 刪除一筆預算。 */
  removeBudget(id){return this.sync(()=>{state.budgets=state.budgets.filter(x=>x.id!==id)},'removeBudget',id)},
  /** 儲存設定（只傳要改的項目，例如 {nameA:'老公'}）。 */
  saveSettings(next){return this.sync(()=>{state.settings={...state.settings,...next}},'saveSettings',{...state.settings,...next})}
};
