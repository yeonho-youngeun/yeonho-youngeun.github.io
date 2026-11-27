// Only browser SDK identifiers are exposed. Never add server secrets here.
export async function GET() {
  return Response.json({
    naverClientId: process.env.NAVER_MAP_CLIENT_ID || '',
    kakaoJavascriptKey: process.env.KAKAO_JAVASCRIPT_KEY || '',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
