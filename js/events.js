// ==========================================================
// js/events
// 所有按鈕、輸入、送出事件都集中在這裡。
// 畫面上的按鈕用 data-xxx 屬性標示要做什麼（例如 data-view="stats"），
// 這裡依屬性決定動作，所以畫面重畫後按鈕也不用重新綁定。
// ==========================================================

/** 點擊：依按鈕上的 data-xxx 屬性決定要做什麼。 */
document.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-edit],[data-member]');if(!b)return;
  const ds=b.dataset;

  // ---- 切換畫面 ----
  if(ds.view){state.view=ds.view;render();scrollTo(0,0);return}                     // 底部分頁、返回按鈕
  if(ds.member){state.member=ds.member;state.view='member';render();scrollTo(0,0);return}   // 統計 → 成員統計
  if(ds.month){state.month=ds.month==='now'?today().slice(0,7):shiftMonth(state.month,+ds.month);render();return}   // ‹ › 換月份

  // ---- 各畫面裡的篩選、選擇 ----
  if(ds.day){state.calDay=ds.day;render();return}                    // 日曆：選某一天
  if(ds.filter){state.filter=ds.filter;render();return}              // 明細：全部／支出／收入／還款
  if(ds.settle){state.settleAll=ds.settle==='all';render();return}   // 分帳：未結清／全部
  if(ds.accfilter){state.accFilter=ds.accfilter;render();return}     // 帳戶：全部／A／B／共同

  // ---- 打開表單 ----
  if(ds.edit){const it=state.entries.find(x=>x.id===ds.edit);if(it)openForm(it);return}           // 點一筆記帳 → 編輯
  if(ds.acc){const a=state.accounts.find(x=>x.id===ds.acc);if(a)openAccountForm(a);return}        // 點帳戶 → 編輯
  if(ds.addacc){openAccountForm(null,{kind:ds.addacc});return}                                     // 新增資產／負債
  if(ds.bud){const x=state.budgets.find(y=>y.id===ds.bud);if(x)openBudgetForm(x);return}         // 點預算 → 編輯
  if(ds.addbud){openBudgetForm(null,{scope:ds.addbud});return}                                     // 新增預算

  // ---- 表單裡的選項按鈕（data-set="欄位:值"）：寫進 draft 後重畫表單 ----
  if(ds.set){
    const i=ds.set.indexOf(':'),k=ds.set.slice(0,i),v=ds.set.slice(i+1);
    state.draft[k]=v;
    // 第一次切到「自訂」分攤時，先幫忙填一半
    if(k==='split'&&v==='custom'&&state.draft.customA===undefined)state.draft.customA=Math.floor((+state.draft.amount||0)/2);
    renderForm();return;
  }

  // ---- 設定頁：刪除分類 ----
  if(ds.delcat){
    const [k,i]=ds.delcat.split(':');
    if(state.settings[k].length<=1)return toast('至少要保留一個分類');
    store.saveSettings({[k]:state.settings[k].filter((_,j)=>j!==+i)}).catch(e=>toast('儲存失敗：'+(e?.message||e)));return;
  }

  // ---- 其他動作（data-action） ----
  switch(ds.action){
    case 'new':openForm(null,state.view==='calendar'?{date:calDay()}:{});break;   // 記一筆（在日曆上會帶入選的日期）
    case 'close':closeForm();break;                                                 // 關閉表單
    case 'delete':deleteCurrent();break;                                            // 刪除（要按兩次）
    case 'reload':store.refresh(true).then(()=>toast('已更新'));break;              // 重新讀取
    case 'login':auth.login();break;                                                // 前往 Google 登入
    case 'logout':{                                                                 // 登出（要按兩次）
      if(!b.dataset.armed){b.dataset.armed='1';b.textContent='確定登出？';return}
      store.logout();break;
    }
    case 'settleup':{                                                               // 分帳：記錄還款（自動帶入金額）
      const {balance}=settlement(state.entries);
      const from=balance>0?'B':'A';
      openForm(null,{type:'transfer',from,to:other(from),amount:Math.abs(balance),note:'結清'});
      break;
    }
  }
});

/** 表單輸入：打字時即時寫進 draft，並更新分帳結果、預算提示。 */
$('#form').addEventListener('input',e=>{
  const t=e.target,d=state.draft;if(!d||!t.name)return;
  if(t.name==='customB'){
    // 自訂分攤：填 B 的部分 → 自動算出 A 的部分
    d.customA=t.value===''?'':r2((+d.amount||0)-(+t.value||0));
    const a=$('#form [name=customA]');if(a)a.value=d.customA;
  }else{
    d[t.name]=t.value;
    // 改了總金額或 A 的部分 → 自動更新 B 的部分
    if(t.name==='customA'||t.name==='amount'){
      const b=$('#form [name=customB]');
      if(b&&d.customA!==''&&d.customA!==undefined)b.value=r2((+d.amount||0)-(+d.customA||0));
    }
  }
  if(state.formKind==='entry')updatePreview();
});

/** 表單送出（按「儲存」或在欄位裡按 Enter）。 */
$('#form').addEventListener('submit',e=>{e.preventDefault();submitForm()});

/** 點表單外面的灰色區域、或按 Esc → 關閉表單。 */
$('#scrim').addEventListener('click',e=>{if(e.target.id==='scrim')closeForm()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#scrim').hidden)closeForm()});

/** 設定頁的表單：儲存兩人名字、新增分類。 */
document.addEventListener('submit',e=>{
  const f=e.target;
  if(f.id==='peopleForm'){
    e.preventDefault();
    store.saveSettings({nameA:f.nameA.value.trim(),nameB:f.nameB.value.trim()}).then(()=>toast('已儲存')).catch(e=>toast('儲存失敗：'+(e?.message||e)));
  }else if(f.dataset.addcat){
    e.preventDefault();
    const k=f.dataset.addcat,v=f.c.value.trim();
    if(!v)return;
    if(state.settings[k].includes(v))return toast('已經有這個分類');
    store.saveSettings({[k]:[...state.settings[k],v]}).catch(e=>toast('儲存失敗：'+(e?.message||e)));
  }
});
