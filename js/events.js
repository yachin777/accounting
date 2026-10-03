// ==========================================================
// js/events.js
// 按鈕與輸入事件（全部集中在這裡）。
// ==========================================================

document.addEventListener('click',e=>{
  const b=e.target.closest('button,[data-edit]');if(!b)return;
  const ds=b.dataset;
  if(ds.view){state.view=ds.view;render();scrollTo(0,0);return}
  if(ds.month){state.month=ds.month==='now'?today().slice(0,7):shiftMonth(state.month,+ds.month);render();return}
  if(ds.filter){state.filter=ds.filter;render();return}
  if(ds.settle){state.settleAll=ds.settle==='all';render();return}
  if(ds.edit){const it=state.entries.find(x=>x.id===ds.edit);if(it)openForm(it);return}
  if(ds.set){   // 表單裡的分段按鈕
    const i=ds.set.indexOf(':'),k=ds.set.slice(0,i),v=ds.set.slice(i+1);
    state.draft[k]=v;
    if(k==='split'&&v==='custom'&&state.draft.customA===undefined)state.draft.customA=Math.floor((+state.draft.amount||0)/2);
    renderForm();return;
  }
  if(ds.delcat){
    const [k,i]=ds.delcat.split(':');
    if(state.settings[k].length<=1)return toast('至少要保留一個分類');
    store.saveSettings({[k]:state.settings[k].filter((_,j)=>j!==+i)}).catch(e=>toast('儲存失敗：'+(e?.message||e?.code)));return;
  }
  switch(ds.action){
    case 'new':openForm(null);break;
    case 'close':closeForm();break;
    case 'delete':deleteEntry();break;
    case 'logout':if(confirm('確定要登出嗎？'))store.logout();break;
    case 'reload':store.refresh(true).then(()=>toast('已更新'));break;
    case 'export':exportCsv();break;
    case 'settleup':{
      const {balance}=settlement(state.entries);
      const from=balance>0?'B':'A';
      openForm(null,{type:'transfer',from,to:other(from),amount:Math.abs(balance),note:'結清'});
      break;
    }
  }
});

// 表單輸入：即時更新 draft
$('#form').addEventListener('input',e=>{
  const t=e.target,d=state.draft;if(!d||!t.name)return;
  if(t.name==='customB'){   // 填 B 的部分 → 自動算 A 的部分
    d.customA=t.value===''?'':r2((+d.amount||0)-(+t.value||0));
    const a=$('#form [name=customA]');if(a)a.value=d.customA;
  }else{
    d[t.name]=t.value;
    if(t.name==='customA'||t.name==='amount'){
      const b=$('#form [name=customB]');
      if(b&&d.customA!==''&&d.customA!==undefined)b.value=r2((+d.amount||0)-(+d.customA||0));
    }
  }
  updatePreview();
});
$('#form').addEventListener('submit',e=>{e.preventDefault();submitForm()});
$('#scrim').addEventListener('click',e=>{if(e.target.id==='scrim')closeForm()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#scrim').hidden)closeForm()});

// 設定頁：儲存名字、新增分類
document.addEventListener('submit',e=>{
  const f=e.target;
  if(f.id==='peopleForm'){
    e.preventDefault();
    store.saveSettings({nameA:f.nameA.value.trim(),nameB:f.nameB.value.trim()}).then(()=>toast('已儲存')).catch(e=>toast('儲存失敗：'+(e?.message||e?.code)));
  }else if(f.dataset.addcat){
    e.preventDefault();
    const k=f.dataset.addcat,v=f.c.value.trim();
    if(!v)return;if(state.settings[k].includes(v))return toast('已經有這個分類');
    store.saveSettings({[k]:[...state.settings[k],v]}).catch(e=>toast('儲存失敗：'+(e?.message||e?.code)));
  }
});
