const venueAddress = '서울특별시 구로구 새말로 97 신도림테크노마트 11층 그랜드볼룸홀';
document.getElementById('copyVenueAddress').addEventListener('click', async () => {
  const status = document.getElementById('venueCopyStatus');
  try {
    await navigator.clipboard.writeText(venueAddress);
    status.textContent = '주소를 복사했습니다.';
  } catch {
    status.textContent = '복사가 어려우면 아래 주소를 길게 눌러 복사해 주세요: ' + venueAddress;
  }
});

// Building location from the Techno Mart official website's map link.
const venuePosition = { lat: 37.5069735, lng: 126.8903193 };
function loadMapScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => reject(new Error('SDK timeout')), 15000);
    script.src = src; script.async = true;
    script.onload = () => { clearTimeout(timeout); resolve(); };
    script.onerror = () => { clearTimeout(timeout); reject(new Error('SDK load failed')); };
    document.head.append(script);
  });
}
const mapStatus = document.getElementById('mapStatus');
const naviStatus = document.getElementById('naviStatus');
const naviButton = document.getElementById('kakaoNavi');
window.navermap_authFailure = () => {
  console.warn('Naver map unavailable: check Web Dynamic Map activation and registered web domain.');
  mapStatus.textContent = '지도를 불러올 수 없습니다. 아래 네이버지도 버튼을 이용해 주세요.';
  document.getElementById('venueMap').hidden = true;
};
async function initializeVenueMap(clientId) {
  try {
    if (!clientId) throw new Error('Missing map configuration');
    await loadMapScript('https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' + encodeURIComponent(clientId));
    const position = new naver.maps.LatLng(venuePosition.lat, venuePosition.lng);
    const map = new naver.maps.Map('venueMap', {
      center: position, zoom: 16, zoomControl: true, scrollWheel: false,
      zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
    });
    new naver.maps.Marker({ position, map, title: '웨딩시티 신도림 · 11층 그랜드볼룸홀' });
    naver.maps.Event.once(map, 'init', () => { if (!document.getElementById('venueMap').hidden) mapStatus.textContent = ''; });
  } catch (error) {
    console.warn('Naver map initialization:', error.name, error.message);
    window.navermap_authFailure();
  }
}
async function initializeKakaoNavi(key) {
  try {
    if (!key) throw new Error('Missing navi configuration');
    await loadMapScript('https://t1.kakaocdn.net/kakao_js_sdk/2.8.5/kakao.min.js');
    Kakao.init(key);
    naviButton.disabled = false;
    naviButton.addEventListener('click', () => {
      try {
        Kakao.Navi.start({ name: '웨딩시티 신도림', x: venuePosition.lng, y: venuePosition.lat, coordType: 'wgs84' });
      } catch {
        naviStatus.textContent = '카카오내비를 열지 못했습니다. 네이버지도 버튼을 이용해 주세요.';
      }
    });
  } catch {
    naviStatus.textContent = '카카오내비 연결을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
}
(async () => {
  try {
    const response = await fetch('./map-config.json');
    if (!response.ok) throw new Error('Configuration unavailable');
    const config = await response.json();
    await Promise.allSettled([initializeVenueMap(config.naverClientId), initializeKakaoNavi(config.kakaoJavascriptKey)]);
  } catch {
    window.navermap_authFailure();
    naviStatus.textContent = '카카오내비 연결 준비 중입니다.';
  }
})();

const invitationCopy = document.querySelector('.invite-copy');
const copyObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    invitationCopy.classList.add('is-visible');
    copyObserver.disconnect();
  }
}, { threshold: 0.25 });
copyObserver.observe(invitationCopy);
