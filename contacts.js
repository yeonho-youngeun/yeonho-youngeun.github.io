// Fill in confirmed contacts only. Kakao requires a supplied profile/open-chat URL.
const invitationContacts = [
 {role:'신랑',name:'이연호',phone:'',kakao:''},
 {role:'신부',name:'김영은',phone:'',kakao:''},
 {role:'신랑 아버지',name:'이종일',phone:'',kakao:''},
 {role:'신부 아버지',name:'김종덕',phone:'',kakao:''},
 {role:'신랑 어머니',name:'김상금',phone:'',kakao:''},
 {role:'신부 어머니',name:'이을순',phone:'',kakao:''},
];
const contactIcons={phone:'<path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4c0 2-2 3-4 2A20 20 0 0 1 3 7c-1-2 0-4 2-4Z"/>',sms:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7" fill="none" stroke="white" stroke-width="1.8"/>',kakao:'<path d="M21 11c0 5-5 8-11 7l-5 3 1-5C0 11 4 3 12 3c5 0 9 3 9 8Z"/>'};
const contactDialog=document.getElementById('contactDialog');
let contactTrigger;
for(const person of invitationContacts){
 const card=document.createElement('article');card.className='family-card';
 const role=document.createElement('small');role.textContent=person.role;
 const name=document.createElement('h3');name.textContent=person.name;
 const actions=document.createElement('div');actions.className='family-actions';
 for(const [kind,label] of [['phone','전화'],['sms','문자'],['kakao','카카오톡']]){
  const phone=person.phone.replace(/[^\d+]/g,'');
  const url=kind==='kakao'?(/^https:\/\/(open\.kakao\.com|pf\.kakao\.com)\//.test(person.kakao)?person.kakao:''):(phone?`${kind==='phone'?'tel':'sms'}:${phone}`:'');
  const action=document.createElement(url?'a':'button');
  if(url){action.href=url;if(kind==='kakao'){action.target='_blank';action.rel='noopener noreferrer';}}else{action.type='button';action.disabled=true;}
  action.setAttribute('aria-label',`${person.role} ${label}${url?'':' 준비 중'}`);
  action.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${contactIcons[kind]}</svg>`;actions.append(action);
 }
 const note=document.createElement('p');note.className='pending';note.textContent=person.phone||person.kakao?'':'연락처 준비 중';card.append(role,name,actions,note);document.getElementById('familyGrid').append(card);
}
document.querySelectorAll('[data-open-contact]').forEach(button=>button.addEventListener('click',()=>{contactTrigger=button;contactDialog.showModal();}));
contactDialog.querySelector('.contact-close').addEventListener('click',()=>contactDialog.close());
contactDialog.addEventListener('click',event=>{if(event.target===contactDialog){const r=contactDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)contactDialog.close();}});
contactDialog.addEventListener('close',()=>contactTrigger?.focus());
