import "./globals.css";
export const metadata = {
  title: "온결 · Wedding Studio",
  description: "우리의 시작을 담는 프라이빗 청첩장 스튜디오",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
