document.querySelectorAll('.copy-account').forEach(button => {
 button.addEventListener('click', async () => {
  const status = document.getElementById('accountStatus');
  try { await navigator.clipboard.writeText(button.dataset.account); status.textContent = '시안용 가상 계좌번호를 복사했습니다.'; }
  catch { status.textContent = '시안용 계좌번호: ' + button.dataset.account; }
 });
});
