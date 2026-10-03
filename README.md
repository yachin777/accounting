# accounting 家庭記帳

網址：https://yachin777.github.io/accounting/

兩個人用各自的 Google 帳號登入，共用同一本帳：記錄每天收支、自動算出「誰要給誰多少錢」，
還有日曆、統計、成員統計、每月預算、帳戶（資產／負債）。

## 架構

| 放在哪裡 | 負責什麼 | 檔案 |
|---|---|---|
| **GitHub**（這個 repo） | 所有網頁畫面與功能 | `index.html`、`config.js`、`css/`、`js/` |
| **Google Apps Script** | 只負責 Google 帳號登入、讀寫試算表 | `apps-script/` 裡的 `.gs` 檔 |
| **Google 試算表** | 存資料（記帳、帳戶、預算、設定四個工作表） | — |

不需要 Google Cloud。

### 為什麼 Apps Script 要部署兩次
Apps Script 一個部署只能選一種「執行身分」：
- **① 登入用**（以「存取的使用者」執行）：才拿得到是誰在登入。網頁按「用 Google 登入」會打開它，
  確認這個帳號有被分享試算表後，發一張「登入憑證」帶回網頁（有效 30 天）。
- **② 資料用**（以「我」執行）：網頁從 GitHub 讀寫資料要用這個。每次都要附上登入憑證，
  憑證是用只有 Apps Script 知道的密鑰簽名的，沒辦法偽造；沒有憑證一律拒絕。

**誰能使用** = 試算表的擁有者＋被「共用」為編輯者的帳號。取消共用後最多 10 分鐘就無法再讀寫。

## 第一次設定

### 1. 試算表與 Apps Script
1. Google 雲端硬碟 → 新增 → Google 試算表（已經有就用原本那份）。
2. 試算表上方：**擴充功能 → Apps Script**。
3. 建立下面這些「指令碼」檔（＋ → 指令碼，名稱照打，不用打 .gs），把 `apps-script` 資料夾裡對應檔案的內容全部貼上：

   | Apps Script 名稱 | 本機檔案 | 內容 |
   |---|---|---|
   | `Code` | `apps-script/Code.gs` | 主程式：setup、登入頁（doGet）、資料請求（doPost） |
   | `server/auth` | `apps-script/server/auth.gs` | 登入憑證、誰有權限 |
   | `server/api` | `apps-script/server/api.gs` | 網頁可以呼叫的動作 |
   | `server/common` | `apps-script/server/common.gs` | 共用小工具 |
   | `server/entries` | `apps-script/server/entries.gs` | 「記帳」工作表 |
   | `server/accounts` | `apps-script/server/accounts.gs` | 「帳戶」工作表 |
   | `server/budgets` | `apps-script/server/budgets.gs` | 「預算」工作表 |
   | `server/settings` | `apps-script/server/settings.gs` | 「設定」工作表 |

   > 之前版本建立的 **HTML 檔**（`index`、`css/…`、`js/…`）都用不到了，請在 Apps Script 裡刪除。
4. 上方函式選 `setup` → **執行** → 授權（「進階」→「前往（不安全）」→ 允許）。

### 2. 部署兩次
**部署 → 新增部署作業 → 齒輪選「網頁應用程式」**，做兩次：

| | 說明（自己取，方便辨認） | 執行身分 | 誰可以存取 | 網址貼到 config.js 的 |
|---|---|---|---|---|
| ① | `登入` | **存取網頁應用程式的使用者** | **任何擁有 Google 帳戶的使用者** | `LOGIN_URL` |
| ② | `資料` | **我** | **所有人** | `API_URL` |

### 3. 上傳到 GitHub
1. 雙擊 `upload.bat`。
2. GitHub repo → Settings → Pages → Branch 選 `main`、`/ (root)`（已經設過就不用）。
3. 等幾分鐘打開 https://yachin777.github.io/accounting/ → 用 Google 登入 → 到「設定」填兩人的名字。

### 4. 分享給另一半
試算表右上角 **共用** → 輸入另一半的 Gmail → **編輯者**。
另一半打開網址按「用 Google 登入」，第一次會要求授權（一樣按「進階」→「前往」→ 允許）。

## 之後要修改時

- **只改網頁**（`index.html`、`css/`、`js/`）：改完雙擊 `upload.bat` 就好，Apps Script 不用動。
- **改了 `apps-script/` 的檔案**：貼到 Apps Script 對應的檔案 → 儲存 →
  **部署 → 管理部署作業 → 兩個部署都要：鉛筆 → 版本選「新版本」→ 部署**（網址不會變）。
- **想讓所有裝置登出**（例如手機遺失）：Apps Script 編輯器執行 `resetLogins`。

## 檔案結構

```
accounting/
├─ index.html          網頁骨架
├─ config.js           Apps Script 的兩個網址
├─ css/                樣式：base（顏色）、layout（版面）、views（各分頁）、form（表單）
├─ js/
│  ├─ constants.js     分頁、分攤方式、帳戶種類、預設分類
│  ├─ utils.js         金額、日期小工具
│  ├─ state.js         畫面狀態、名字
│  ├─ calc.js          分帳、統計、預算計算
│  ├─ auth.js          登入（前往 Apps Script、保存登入憑證）
│  ├─ store.js         讀寫資料（呼叫 Apps Script）
│  ├─ views/           每個畫面一個檔：明細、日曆、分帳、統計、成員統計、預算、帳戶、設定
│  ├─ render.js        重畫畫面、登入畫面
│  ├─ forms/           表單：common（共用）、entry（記一筆）、account（帳戶）、budget（預算）
│  ├─ events.js        按鈕與輸入事件
│  └─ main.js          程式進入點
├─ apps-script/        後端（貼到 Apps Script，不會在網頁上執行）
│  ├─ Code.gs
│  └─ server/
├─ upload.bat          雙擊：上傳到 GitHub
└─ README.md
```

## 想改什麼，去哪裡改

| 想改的東西 | 檔案 |
|---|---|
| 配色、兩人的代表色 | `css/base.css`（`--accent`、`--pa`、`--pb`） |
| 預設分類 | `js/constants.js` 的 `DEFAULT_SETTINGS`（之後在「設定」分頁改就好） |
| 分攤方式的名稱 | `js/constants.js` 的 `SPLITS` |
| 帳戶種類 | `js/constants.js` 的 `ACCOUNT_TYPES` |
| 平分的零頭規則 | `js/calc.js` 的 `computeShares` |
| 支出算進哪一份預算 | `js/calc.js` 的 `budgetScope` |
| 統計顯示幾個月 | `js/constants.js` 的 `TREND_MONTHS` |
| 自動更新的間隔 | `js/store.js` 的 `REFRESH_MS` |
| 登入可以維持幾天 | `apps-script/server/auth.gs` 的 `TOKEN_DAYS` |
| 試算表的欄位 | `apps-script/server/` 裡對應的檔案 |

## 試算表欄位
- 「記帳」：付款人、收入歸屬、還款人用 `A`／`B` 表示，對應「設定」裡的名字；「記錄者」「最後修改者」自動填 Gmail。
- 「帳戶」：資產、負債帳戶，餘額可以直接改。
- 「預算」：對象（A／B／共同）、分類（「全部」= 總預算）、每月預算。
- 「設定」：名字、分類（逗號分隔）。
- **不要改 id 欄、也不要改第一列標題。** 備份：試算表 → 檔案 → 下載。
