const noticeContents = {
 walk: '<img class="notice-image" src="assets/notice-walk.png" alt="신도림역 3번 출구에서 밖으로 나가지 않고 테크노마트로 직진한 뒤 스타벅스 옆 통로를 통해 저층부 엘리베이터를 이용해 주세요.">',
 parking: '<div class="notice-parking-copy"><p><strong>지하 저층부, 11번 기둥</strong> 쪽에 주차하시면 비교적 짧은 동선으로 이동이 가능합니다.</p><p><strong>8층 연회장</strong>에서 식사를 마친 후,<br><mark>키오스크에서 주차정산</mark>을 하시면<br>3시간 무료 주차가 가능합니다.</p></div><img class="notice-image" src="assets/notice-parking-kiosk.png" alt="8층 주차정산 키오스크">',
 atm: '<div class="notice-atm-copy"><p>ATM기 위치 안내</p><ul><li>지하 2층 : 이마트 엘리베이터 옆</li><li>지하 1층 : 에스컬레이터 옆</li><li>지상 10층 : 에스컬레이터 옆</li></ul></div><div class="notice-atm-photo"><img src="assets/notice-atm.png" alt="국민은행, 하나은행, NH농협은행 ATM 모습"></div>' 
};
const noticeTabs = Array.from(document.querySelectorAll('[data-notice]'));
function selectNotice(tab) {
 noticeTabs.forEach(button => { button.setAttribute('aria-selected', String(button === tab)); button.tabIndex = button === tab ? 0 : -1; });
 const panel = document.getElementById('noticePanel');
 panel.innerHTML = noticeContents[tab.dataset.notice];
 panel.setAttribute('aria-labelledby', tab.id);
}
noticeTabs.forEach((tab, index) => {
 tab.addEventListener('click', () => selectNotice(tab));
 tab.addEventListener('keydown', event => {
  let next;
  if(event.key === 'ArrowRight') next = (index + 1) % noticeTabs.length;
  if(event.key === 'ArrowLeft') next = (index + noticeTabs.length - 1) % noticeTabs.length;
  if(event.key === 'Home') next = 0;
  if(event.key === 'End') next = noticeTabs.length - 1;
  if(next !== undefined) { event.preventDefault(); selectNotice(noticeTabs[next]); noticeTabs[next].focus(); }
 });
});

selectNotice(noticeTabs[0]);
