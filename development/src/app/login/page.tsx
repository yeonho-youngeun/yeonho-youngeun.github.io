import { login } from "../actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await searchParams;
  return (
    <main className="welcome">
      <span className="eyebrow">ONGYEOL STUDIO</span>
      <h1>다시 만나 반가워요.</h1>
      <p>Supabase에 등록된 관리자 계정으로 로그인하세요.</p>
      <form action={login} className="login-form">
        <label>
          이메일
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          비밀번호
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        {p.error && <p role="alert">로그인 정보를 확인해 주세요.</p>}
        <button className="button">로그인</button>
      </form>
    </main>
  );
}
