// ==========================================================
// Code.gs（主程式）
// 家庭記帳的「後端」：只負責 Google 帳號登入、讀寫試算表。
// 所有網頁畫面與功能都在 GitHub（yachin777/accounting）。
//
// 這個專案要部署「兩次」（設定方式見 README.md）：
//   ① 登入用：執行身分「存取網頁應用程式的使用者」、存取權「任何擁有 Google 帳戶的使用者」
//      → 網頁按「用 Google 登入」會打開它，這裡確認是誰、有沒有權限，發一張登入憑證帶回網頁。
//   ② 資料用：執行身分「我」、存取權「所有人」
//      → 網頁讀寫資料都呼叫它，每次都要附上登入憑證，沒有憑證或憑證無效一律拒絕。
//
// 後端其他檔案：
//   server/auth.gs      登入憑證（產生、驗證）、誰有權限
//   server/api.gs       網頁可以呼叫的動作（讀取全部、儲存、刪除…）
//   server/common.gs    共用小工具
//   server/entries.gs   「記帳」工作表
//   server/accounts.gs  「帳戶」工作表
//   server/budgets.gs   「預算」工作表
//   server/settings.gs  「設定」工作表
// ==========================================================

// 網頁的網址：登入完成後會帶著憑證回到這裡
const APP_URL='https://yachin777.github.io/accounting/';

/**
 * 第一次使用時執行一次（編輯器上方選「setup」→ 執行）。
 * 記住這份試算表、建立所有工作表、產生簽發憑證用的密鑰。
 */
function setup(){
  const ss=SpreadsheetApp.getActive();
  const props=PropertiesService.getScriptProperties();
  props.setProperty('SHEET_ID',ss.getId());
  if(!props.getProperty('SECRET'))props.setProperty('SECRET',Utilities.getUuid()+Utilities.getUuid());
  ss__=ss;
  entriesSheet_();accountsSheet_();budgetsSheet_();settingsSheet_();
  Logger.log('完成！接下來請部署兩次（登入用、資料用），見 README.md。');
}

/**
 * 想讓所有裝置都登出時執行（例如手機遺失）：換一把新的密鑰，舊的憑證全部失效。
 */
function resetLogins(){
  PropertiesService.getScriptProperties().setProperty('SECRET',Utilities.getUuid()+Utilities.getUuid());
  Logger.log('已讓所有裝置登出，兩人都需要重新登入。');
}

/**
 * 打開部署網址時（GET）：顯示登入頁。
 * 只有在「① 登入用」部署（以使用者身分執行）才拿得到登入者的 Email。
 */
function doGet(){
  return loginPage_();
}

/**
 * 網頁送來的讀寫請求（POST）：驗證憑證 → 執行動作 → 回傳 JSON。
 * 請求格式：{action:'save', token:'登入憑證', data:{...}}
 */
function doPost(e){
  try{
    const req=JSON.parse(e.postData.contents);
    const email=verifyToken_(req.token);
    const fn=API[req.action];
    if(!fn)throw fail_('bad_action','不支援的動作：'+req.action);
    return json_({ok:true,data:fn(req.data,email)});
  }catch(err){
    return json_({ok:false,code:err.code||'error',message:err.message||String(err)});
  }
}
