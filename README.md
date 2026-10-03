# accounting 家庭記帳

網址（上傳後）：https://yachin777.github.io/accounting/

兩個人用 Google 帳號登入，共用同一本帳；記錄每天收支，並自動算出「誰要給誰多少錢」。

## 分帳怎麼算

每筆支出記錄「誰付的」和「怎麼分」：

| 怎麼分 | 意思 | 例子 |
|---|---|---|
| 平分 | 兩人各一半 | 午餐 500 老婆付 → 老公要給老婆 250 |
| 各付各的（自訂） | 填兩人各吃多少 | 晚餐 600 老公付、老婆吃 200 → 老婆要給老公 200 |
| 自己的 | 付錢的人自己的花費，不用分 | |
| 幫對方付 | 全部是對方的 | |

所有紀錄加總後，「分帳」分頁會顯示目前誰要給誰多少（上例合計：老公要給老婆 50）。
實際還錢後按「記錄還款」，帳就會歸零。平分除不盡時，零頭算在付錢的人身上。

## 第一次設定

這個專案跟婚禮籌備**共用同一個 Firebase 專案**（`wedding-plan-dccca`），資料放在 `acc_entries`、`acc_meta` 兩個集合，不會跟婚禮資料混在一起。

1. GitHub 建立新的 repo：`yachin777/accounting`（Public、不要勾選建立 README）。
2. 雙擊 `upload.bat` 上傳。
3. GitHub repo → Settings → Pages → Branch 選 `main`、資料夾 `/ (root)` → Save。
4. Firebase 主控台 → Firestore Database → 規則，**在原本的規則裡加上**下面兩段（Email 換成你們兩個人的），按「發布」：

```
    match /acc_entries/{id} {
      allow read, write: if request.auth != null
        && request.auth.token.email in ['你的@gmail.com', '另一半的@gmail.com'];
    }
    match /acc_meta/{id} {
      allow read, write: if request.auth != null
        && request.auth.token.email in ['你的@gmail.com', '另一半的@gmail.com'];
    }
```

   這兩段要放在 `match /databases/{database}/documents { ... }` 的大括號裡面。
   如果原本的規則已經是 `match /{document=**}`（整個資料庫都允許你們兩人），就不用改。
5. 授權網域 `yachin777.github.io` 婚禮籌備已經加過，不用再加。
6. 打開網址 → 用 Google 登入 → 到「設定」填兩人的名字和 Google 帳號。

> 想改用獨立的 Firebase 專案：建立新專案、開啟 Google 登入與 Firestore，把設定值貼到 `firebase-config.js` 即可。

## 檔案結構

```
accounting/
├─ index.html            頁面骨架
├─ firebase-config.js    Firebase 設定值（不要刪）
├─ upload.bat            雙擊：同步＋上傳到 GitHub
├─ css/
│  ├─ base.css           顏色主題（淺色／深色）
│  └─ app.css            版面與元件樣式
└─ js/
   ├─ constants.js       分頁、分攤方式、預設分類
   ├─ utils.js           金額、日期小工具
   ├─ state.js           畫面狀態、名字
   ├─ calc.js            分帳計算（核心邏輯）
   ├─ store.js           資料存取（Firebase／瀏覽器）
   ├─ auth.js            Google 登入／登出
   ├─ views/
   │  ├─ records.js      明細
   │  ├─ settle.js       分帳
   │  ├─ stats.js        統計
   │  └─ settings.js     設定、匯出 CSV
   ├─ render.js          重畫畫面
   ├─ form.js            記一筆表單
   ├─ events.js          按鈕事件
   └─ main.js            程式進入點（最後載入）
```

## 想改什麼，去哪裡改

| 想改的東西 | 檔案 |
|---|---|
| 配色、兩人的代表色 | `css/base.css` 最上面的變數（`--pa`、`--pb`） |
| 預設分類 | `js/constants.js` 的 `DEFAULT_SETTINGS`（之後在「設定」分頁改就好） |
| 分攤方式的名稱 | `js/constants.js` 的 `SPLITS` |
| 平分的零頭規則 | `js/calc.js` 的 `computeShares()` |
| 統計顯示幾個月 | `js/constants.js` 的 `TREND_MONTHS` |

## 注意

- 上傳後網站最多要等約 10 分鐘才會更新，可按 `Ctrl + F5` 強制重新整理。
- 沒網路時也能記帳，恢復連線後會自動同步。
