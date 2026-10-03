// ==========================================================
// js/store.js
// 資料存取：新增／修改／刪除都經過這裡。
//   cloud = Firebase 雲端（firebase-config.js 有設定值時；需 Google 登入，兩人即時同步）
//   local = 只存在這個瀏覽器（沒有設定 Firebase 時，用來測試）
//
// Firestore 裡的位置（跟婚禮籌備共用同一個 Firebase 專案，用 acc_ 開頭區分）：
//   acc_entries/{id}     每一筆記帳
//   acc_meta/settings    名字、Email、分類
// ==========================================================

const COL='acc_entries', SETTINGS_DOC='acc_meta/settings', LOCAL_KEY='acc-local';
const store={
  db:null,mode:'local',unsubs:[],
  async init(){
    const cfg=window.FIREBASE_CONFIG;
    if(cfg&&cfg.apiKey&&window.firebase){
      this.mode='cloud';
      try{
        firebase.initializeApp(cfg);
        const fs=firebase.firestore();
        fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});   // 離線也能看、恢復網路後自動上傳
        const auth=firebase.auth();
        auth.getRedirectResult().catch(e=>{state.authError=authMsg(e);render()});
        auth.onAuthStateChanged(u=>{
          this.detach();state.entries=[];state.settings={...DEFAULT_SETTINGS};
          state.user=u?{email:u.email||'',name:u.displayName||''}:null;state.authError='';
          if(u){state.ready=false;this.attach(fs)}else state.ready=true;
          render();
        });
      }catch(e){state.authError='Firebase 設定有誤：'+e.message;state.ready=true;render()}
      return;
    }
    try{const raw=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null');
      if(raw){state.entries=raw.entries||[];state.settings={...DEFAULT_SETTINGS,...raw.settings}}}catch{}
    state.ready=true;render();
  },
  // 即時監聽：另一半記了一筆，畫面會自動更新
  attach(db){
    this.db=db;
    const fail=e=>{
      if(e&&e.code==='permission-denied')state.authError=`這個帳號（${state.user?.email||''}）沒有權限。請確認已把這個 Email 加進 Firebase 的安全規則（見 README.md）。`;
      else toast('與資料庫的連線中斷，請重新整理頁面');
      state.ready=true;render();
    };
    this.unsubs.push(db.collection(COL).onSnapshot(snap=>{
      state.entries=snap.docs.map(d=>({id:d.id,...d.data()}));state.ready=true;render();
    },fail));
    this.unsubs.push(db.doc(SETTINGS_DOC).onSnapshot(s=>{
      if(s.exists){state.settings={...DEFAULT_SETTINGS,...s.data()};render()}
    },()=>{}));
  },
  detach(){this.unsubs.forEach(f=>{try{f()}catch{}});this.unsubs=[];this.db=null},
  canWrite(){return this.mode==='local'||!!this.db},
  newId(){return this.db?this.db.collection(COL).doc().id:'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)},
  persistLocal(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify({entries:state.entries,settings:state.settings}))}catch{toast('這個瀏覽器無法儲存資料')}},
  // 新增或修改一筆
  async save(item){
    const {id,...body}=item;
    if(this.db){await this.db.collection(COL).doc(id).set(body);return}
    if(this.mode!=='local')throw {code:'permission-denied'};
    const i=state.entries.findIndex(e=>e.id===id);
    if(i>=0)state.entries[i]=item;else state.entries.push(item);
    this.persistLocal();render();
  },
  async remove(id){
    if(this.db){await this.db.collection(COL).doc(id).delete();return}
    state.entries=state.entries.filter(e=>e.id!==id);this.persistLocal();render();
  },
  async saveSettings(){
    if(this.db){await this.db.doc(SETTINGS_DOC).set({...state.settings});return}
    this.persistLocal();render();
  }
};
