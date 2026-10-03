// ==========================================================
// config.js
// 兩個設定值，設定方式見 README.md。這兩個值公開沒關係：
// 誰能讀寫資料，是由 Apps Script 的允許名單（ALLOWED_EMAILS）決定。
// 兩個都留空 = 本機模式（資料只存在這個瀏覽器，用來測試）。
// ==========================================================

// Google 試算表的 API 網址（Apps Script「部署 → 網頁應用程式」的網址）
window.SHEETS_API_URL = "";

// Google 登入的用戶端 ID（Google Cloud「憑證 → OAuth 用戶端 ID」，結尾是 .apps.googleusercontent.com）
window.GOOGLE_CLIENT_ID = "";
