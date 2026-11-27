import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { createInvitation, logout } from "../actions";
export default async function Dashboard() {
  const { db, user } = await requireUser();
  const { data, error } = await db
    .from("invitations")
    .select("id,slug,created_at")
    .order("created_at", { ascending: false });
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          온결 <small>STUDIO</small>
        </Link>
        <form action={logout}>
          <button>로그아웃</button>
        </form>
      </header>
      <main className="dashboard">
        <span className="eyebrow">YOUR WEDDING COLLECTION</span>
        <h1>나의 청첩장</h1>
        <p>{user.email} 님, 특별한 하루를 준비해 보세요.</p>
        <form action={createInvitation}>
          <button className="button">+ 새 청첩장 만들기</button>
        </form>
        {error ? (
          <p role="alert">
            목록을 불러오지 못했습니다. 마이그레이션과 연결을 확인해 주세요.
          </p>
        ) : (
          <div className="cards">
            {data?.map((item) => (
              <Link
                className="card"
                key={item.id}
                href={`/admin/invitations/${item.id}`}
              >
                <span className="eyebrow">DRAFT · 초안</span>
                <h2>{item.slug}</h2>
                <p>
                  {new Date(item.created_at).toLocaleDateString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}{" "}
                  생성
                </p>
                <span>이어서 편집하기 ↗</span>
              </Link>
            ))}
            {data?.length === 0 && (
              <p>아직 청첩장이 없습니다. 첫 번째 이야기를 만들어 보세요.</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
