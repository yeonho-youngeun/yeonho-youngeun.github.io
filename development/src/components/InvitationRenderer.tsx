import type { InvitationContent } from "@/lib/content";
export default function InvitationRenderer({
  content,
}: {
  content: InvitationContent;
}) {
  const { basic: b, design: d } = content;
  const date = new Date(`${b.date}T${b.time}:00+09:00`);
  const valid = !isNaN(date.getTime());
  return (
    <article
      className={`invitation font-${d.font}`}
      style={
        {
          background: d.background,
          color: d.text,
          "--accent": d.accent,
        } as React.CSSProperties
      }
    >
      <div className="invite-cover">
        <span className="eyebrow">THE BEGINNING OF OUR FOREVER</span>
        <div className="botanical" aria-hidden="true">
          ❧
        </div>
        <p className="cover-caption">함께 맞이하는, 모든 계절</p>
        <h1>
          {b.groom || "신랑"}
          <i>&</i>
          {b.bride || "신부"}
        </h1>
        <div className="fine-line" />
        <p>
          {b.date.replaceAll("-", ".")} · {b.time}
        </p>
        <p>{b.venue}</p>
        <span className="cover-foot">WE INVITE YOU TO OUR WEDDING</span>
      </div>
      <section>
        <span className="eyebrow">INVITATION</span>
        <h2>소중한 당신을 초대합니다</h2>
        <p className="invitation-copy">{b.invitation}</p>
        <div className="parents">
          <p>
            {[b.groomFather, b.groomMother].filter(Boolean).join(" · ")}{" "}
            <small>의 아들</small> <strong>{b.groom}</strong>
          </p>
          <p>
            {[b.brideFather, b.brideMother].filter(Boolean).join(" · ")}{" "}
            <small>의 딸</small> <strong>{b.bride}</strong>
          </p>
        </div>
      </section>
      {d.sections
        .filter((s) => s.visible)
        .map((s) =>
          s.id === "schedule" ? (
            <section key={s.id}>
              <span className="eyebrow">WEDDING DAY</span>
              <h2>
                {valid
                  ? date.toLocaleDateString("ko-KR", {
                      timeZone: "Asia/Seoul",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })
                  : "날짜를 입력해 주세요"}
              </h2>
              <p>
                {b.time} · {b.venue}
              </p>
            </section>
          ) : s.id === "location" ? (
            <section key={s.id}>
              <span className="eyebrow">LOCATION</span>
              <h2>{b.venue}</h2>
              <p>{b.address}</p>
            </section>
          ) : s.id === "closing" ? (
            <section key={s.id}>
              <span className="botanical" aria-hidden="true">
                ❧
              </span>
              <p>우리의 시작을 함께해 주셔서 감사합니다.</p>
              <p>
                {b.groom} · {b.bride}
              </p>
            </section>
          ) : null,
        )}
    </article>
  );
}
