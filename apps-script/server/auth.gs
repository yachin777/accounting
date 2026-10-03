// ==========================================================
// server/auth.gs
// 登入與權限：
//   誰能用 = 這份試算表的擁有者＋被「共用」為編輯者的 Google 帳號。
//   登入成功後發一張「登入憑證」（token）給網頁，網頁存在瀏覽器，之後每次讀寫都附上。
//   憑證內容 = Email＋到期時間，再用只有 Apps Script 知道的密鑰簽名，網頁沒辦法偽造。
// ==========================================================

const TOKEN_DAYS=30;   // 登入憑證有效天數（到期要重新登入）

/** 取得簽名用的密鑰（setup 時產生，存在「指令碼屬性」SECRET）。 */
function secret_(){
  const props=PropertiesService.getScriptProperties();
  let s=props.getProperty('SECRET');
  if(!s){s=Utilities.getUuid()+Utilities.getUuid();props.setProperty('SECRET',s)}
  return s;
}

/** 對一段文字簽名（HMAC-SHA256），回傳網址安全的 base64。 */
function sign_(text){
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(text,secret_()));
}

/**
 * 產生登入憑證：「內容.簽名」。內容是 {e: Email, x: 到期時間}。
 * @param {string} email 登入者
 */
function makeToken_(email){
  const body=Utilities.base64EncodeWebSafe(JSON.stringify({e:email,x:Date.now()+TOKEN_DAYS*864e5}));
  return body+'.'+sign_(body);
}

/**
 * 驗證登入憑證，回傳 Email；簽名不對、過期、或已經沒有權限就丟出錯誤。
 * @param {string} token 網頁送來的憑證
 */
function verifyToken_(token){
  if(!token)throw fail_('need_login','請先登入');
  const [body,sig]=String(token).split('.');
  if(!body||sig!==sign_(body))throw fail_('bad_token','登入資訊無效，請重新登入');
  const o=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(body)).getDataAsString());
  if(!(o.x>Date.now()))throw fail_('bad_token','登入已過期，請重新登入');
  if(!allowedEmails_().includes(o.e))throw fail_('not_allowed','這個帳號（'+o.e+'）已經沒有權限，請試算表擁有者重新共用給你。');
  return o.e;
}

/**
 * 可以使用的 Email 清單：試算表擁有者＋編輯者。
 * 記住 10 分鐘，不用每次都問 Google（比較快）；取消共用最多 10 分鐘後生效。
 */
function allowedEmails_(){
  const cache=CacheService.getScriptCache();
  const hit=cache.get('allowed');
  if(hit)return JSON.parse(hit);
  const ss=ss_();
  const list=[ss.getOwner(),...ss.getEditors()].filter(Boolean).map(u=>u.getEmail().toLowerCase());
  cache.put('allowed',JSON.stringify(list),600);
  return list;
}

/**
 * 登入頁（打開「① 登入用」網址時顯示）：
 * 取得登入者 Email → 確認有權限 → 產生憑證 → 帶著憑證跳回 GitHub 上的網頁。
 */
function loginPage_(){
  const email=(Session.getActiveUser().getEmail()||'').toLowerCase();
  let title,msg,url='';
  try{
    if(!email)throw fail_('no_email','拿不到你的 Google 帳號。請確認「登入用」部署的執行身分是「存取網頁應用程式的使用者」。');
    if(!allowedEmails_().includes(email))throw fail_('not_allowed','這個帳號（'+email+'）沒有權限。請試算表擁有者用「共用」把試算表分享給你（編輯者）。');
    url=APP_URL+'#token='+encodeURIComponent(makeToken_(email));
    title='登入成功';msg=email+'，正在回到家庭記帳…';
  }catch(err){
    title='無法登入';msg=err.message;
  }
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const html=`<div style="font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;max-width:420px;margin:60px auto;padding:0 16px;text-align:center;color:#1F2421">
    <div style="width:56px;height:56px;border-radius:16px;background:#2F6B57;color:#fff;display:grid;place-items:center;font-size:26px;font-weight:700;margin:0 auto 12px">帳</div>
    <h2>${esc(title)}</h2><p style="color:#5B625D">${esc(msg)}</p>
    ${url?`<a href="${esc(url)}" target="_top" style="display:inline-block;margin-top:8px;padding:12px 28px;border-radius:12px;background:#2F6B57;color:#fff;text-decoration:none;font-weight:700">回到家庭記帳</a>
      <script>try{window.top.location.href=${JSON.stringify(url)}}catch(e){}</script>`:''}
  </div>`;
  return HtmlService.createHtmlOutput(html).setTitle('家庭記帳 登入')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}
