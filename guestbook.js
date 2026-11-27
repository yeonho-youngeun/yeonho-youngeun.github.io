(() => {
 const endpoint=window.guestbookConfig.url;
 const apiHeaders={'Authorization':'Bearer '+window.guestbookConfig.anonKey,'apikey':window.guestbookConfig.anonKey};
 const form=document.getElementById('kakaoInputForm'),list=document.getElementById('kakaoChatList');
 const name=document.getElementById('guestNameInput'),message=document.getElementById('guestMsgInput');
 const status=document.createElement('p');status.className='guestbook-status';status.setAttribute('role','status');form.after(status);
 name.maxLength=30;message.maxLength=500;
 const confirmDialog=document.createElement('dialog');confirmDialog.className='guestbook-confirm';
 confirmDialog.innerHTML='<form method="dialog"><p>등록하시겠습니까?</p><div><button value="no" autofocus>아니오</button><button value="yes">예</button></div></form>';
 confirmDialog.setAttribute('aria-label','방명록 등록 확인');document.body.append(confirmDialog);
 let confirming=false;
 function confirmRegistration(){return new Promise(resolve=>{confirmDialog.returnValue='no';confirmDialog.addEventListener('close',()=>resolve(confirmDialog.returnValue==='yes'),{once:true});confirmDialog.showModal();});}
 let requestId=crypto.randomUUID();
 function render(entries){
  list.replaceChildren();
  for(const entry of entries){
   const row=document.createElement('div');row.className='chat-row incoming';
   const avatar=document.createElement('div');avatar.className='kakao-avatar '+(entry.gender==='female'?'female':'male');avatar.setAttribute('aria-hidden','true');
   avatar.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0 1 14 0v1Z"/></svg>';
   row.append(avatar);
   const column=document.createElement('div');column.className='chat-content-col';
   const sender=document.createElement('span');sender.className='chat-sender-name';sender.textContent=entry.name;
   const bubble=document.createElement('div');bubble.className='bubble-in';bubble.textContent=entry.message;
   column.append(sender,bubble);row.append(column);list.append(row);
  }
  if(!entries.length){const p=document.createElement('p');p.textContent='첫 축하 메시지를 남겨주세요 ♥';list.append(p);}
  document.getElementById('participantCount').textContent=String(entries.length);
 }
 async function load(){const response=await fetch(endpoint,{headers:apiHeaders});if(!response.ok)throw Error('방명록을 불러오지 못했습니다.');render((await response.json()).entries);}
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(confirming)return;
  if(!name.value.trim()||!message.value.trim()){status.textContent='이름과 축하 메시지를 입력해주세요.';return;}
  confirming=true;const approved=await confirmRegistration();confirming=false;
  if(!approved)return;
  const button=form.querySelector('[type=submit]');button.disabled=true;status.textContent='저장 중…';
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{...apiHeaders,'Content-Type':'application/json'},body:JSON.stringify({request_id:requestId,name:name.value.trim(),message:message.value.trim(),gender:document.querySelector('.gender-btn.active-female')?'female':'male'})});
   const data=await response.json();if(!response.ok)throw Error(data.error);
   requestId=crypto.randomUUID();message.value='';status.textContent='축하 메시지를 저장했습니다.';await load();
  }catch(error){status.textContent=error.message||'연결에 실패했습니다.';}finally{button.disabled=false;}
 });
 load().catch(error=>{list.replaceChildren();status.textContent=error.message;});
})();
