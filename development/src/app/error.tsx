"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="welcome">
      <h1>잠시 문제가 발생했습니다.</h1>
      <p>연결 및 데이터베이스 설정을 확인해 주세요.</p>
      <button className="button" onClick={reset}>
        다시 시도
      </button>
    </main>
  );
}
