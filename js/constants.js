// ==========================================================
// js/constants
// 固定設定：分頁、記帳類型、分攤方式、預設分類。
// ==========================================================

// 底部分頁（id 對應 js/views/ 裡的畫面）
const VIEWS=[
  {id:'records',label:'明細',icon:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'},
  {id:'calendar',label:'日曆',icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
  {id:'settle', label:'分帳',icon:'<path d="M7 7h11l-3-3M17 17H6l3 3"/>'},
  {id:'stats',  label:'統計',icon:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'},
  {id:'accounts',label:'帳戶',icon:'<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20M16 15h2M6 6V4h12v2"/>'},
  {id:'settings',label:'設定',icon:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'}
];

// 記帳類型
const TYPES=[
  {id:'expense', label:'支出'},
  {id:'income',  label:'收入'},
  {id:'transfer',label:'還款'}   // 兩人之間互相還錢（會抵銷分帳的欠款）
];

// 支出的分攤方式
//   equal  = 兩人平分
//   custom = 自己填兩人各吃多少
//   mine   = 付錢的人自己的花費（不用分）
//   other  = 全部是對方的（幫對方代墊）
const SPLITS=[
  {id:'equal', label:'平分'},
  {id:'custom',label:'各付各的（自訂）'},
  {id:'mine',  label:'自己的'},
  {id:'other', label:'幫對方付'}
];

// 帳戶的種類（名稱可以自己取，例如「台新銀行」「元大證券」）
const ACCOUNT_KINDS=[{id:'asset',label:'資產'},{id:'liability',label:'負債'}];
const ACCOUNT_TYPES={
  asset:['現金','銀行存款','股票','基金','定存','外幣','保險','其他資產'],
  liability:['信用卡','房貸','車貸','信用貸款','其他負債']
};
// 帳戶擁有者
const ACCOUNT_OWNERS=[{id:'A'},{id:'B'},{id:'both',label:'共同'}];

// 收入歸屬
const INCOME_OWNERS=[{id:'A'},{id:'B'},{id:'both',label:'共同'}];

// 預設設定（第一次使用時；之後在「設定」分頁修改，存在雲端）
const DEFAULT_SETTINGS={
  nameA:'', nameB:'',      // 兩人的名字
  expenseCats:['餐飲','日用品','交通','居家','水電瓦斯','娛樂','購物','醫療','孝親','旅遊','其他'],
  incomeCats:['薪水','獎金','投資','紅包','其他']
};

// 「統計」分頁的趨勢圖要顯示幾個月
const TREND_MONTHS=6;
