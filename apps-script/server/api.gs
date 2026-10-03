// ==========================================================
// server/api.gs
// 網頁可以呼叫的動作（網頁送 {action:'save', data:...}，這裡找對應的函式執行）。
// 能走到這裡代表登入憑證已經驗證過（Code.gs 的 doPost），email = 登入者。
// 會修改資料的動作都用 withLock_ 包起來，避免兩人同時存檔互相覆蓋。
// ==========================================================

const API={
  /** 讀回所有資料（網頁開啟時、每 30 秒自動更新時）。 */
  list:(data,email)=>({
    entries:readEntries_(),           // 記帳
    accounts:readAccounts_(),         // 帳戶
    budgets:readBudgets_(),           // 預算
    settings:readSettings_(),         // 名字、分類
    sheetUrl:ss_().getUrl(),          // 「開啟試算表」連結
    user:email                        // 登入的 Email
  }),

  /** 新增或修改一筆記帳。 */
  save:(item,email)=>withLock_(()=>{saveEntry_(item,email);return true}),
  /** 刪除一筆記帳。 */
  remove:(id)=>withLock_(()=>{deleteRow_(entriesSheet_(),id);return true}),

  /** 新增或修改一個帳戶（資產／負債）。 */
  saveAccount:(a,email)=>withLock_(()=>{saveAccount_(a,email);return true}),
  /** 刪除一個帳戶。 */
  removeAccount:(id)=>withLock_(()=>{deleteRow_(accountsSheet_(),id);return true}),

  /** 新增或修改一筆預算。 */
  saveBudget:(b)=>withLock_(()=>{saveBudget_(b);return true}),
  /** 刪除一筆預算。 */
  removeBudget:(id)=>withLock_(()=>{deleteRow_(budgetsSheet_(),id);return true}),

  /** 儲存設定（名字、分類）。 */
  saveSettings:(s)=>withLock_(()=>{saveSettings_(s||{});return true})
};
