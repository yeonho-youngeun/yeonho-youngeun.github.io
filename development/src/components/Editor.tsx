"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  contentSchema,
  slugSchema,
  type InvitationContent,
} from "@/lib/content";
import { saveDraft } from "@/app/actions";
import InvitationRenderer from "./InvitationRenderer";
const menus = [
  "기본 정보",
  "오프닝 및 디자인",
  "신랑·신부 소개",
  "커플 인터뷰",
  "웨딩 갤러리",
  "위치 및 오시는 길",
  "방명록",
  "연락처 및 카카오톡",
  "계좌번호",
  "하객 사진 공유",
  "발행 설정",
];
const labels: Record<string, string> = {
  schedule: "일정",
  profiles: "프로필",
  interview: "인터뷰",
  gallery: "갤러리",
  location: "오시는 길",
  guestbook: "방명록",
  photos: "하객 사진",
  contact: "연락하기",
  accounts: "마음 전하기",
  closing: "클로징",
};
export default function Editor({
  id,
  initial,
  initialSlug,
  initialVersion,
}: {
  id?: string;
  initial: InvitationContent;
  initialSlug: string;
  initialVersion: number;
}) {
  const [content, setContent] = useState(initial),
    [slug, setSlug] = useState(initialSlug),
    [menu, setMenu] = useState(0),
    [tab, setTab] = useState("edit"),
    [status, setStatus] = useState(
      id ? "모든 변경사항 저장됨" : "데모 · 저장되지 않음",
    ),
    [dirty, setDirty] = useState(false),
    [conflict, setConflict] = useState(false),
    [saving, setSaving] = useState(false),
    [saveTick, setSaveTick] = useState(0);
  const version = useRef(initialVersion),
    busy = useRef(false),
    revision = useRef(0),
    blocked = useRef(false);
  const latest = useRef({ content, slug });
  latest.current = { content, slug };
  const mark = () => {
    revision.current++;
    setDirty(true);
    setStatus(id ? "저장되지 않은 변경사항" : "데모 · 저장되지 않음");
  };
  const change = (key: keyof InvitationContent["basic"], value: string) => {
    setContent((c) => ({ ...c, basic: { ...c.basic, [key]: value } }));
    mark();
  };
  const design = (patch: Partial<InvitationContent["design"]>) => {
    setContent((c) => ({ ...c, design: { ...c.design, ...patch } }));
    mark();
  };
  const save = useCallback(async () => {
    if (!id || busy.current || blocked.current) return;
    const snapshot = latest.current;
    const validation = contentSchema.safeParse(snapshot.content);
    const url = slugSchema.safeParse(snapshot.slug);
    if (!validation.success || !url.success) {
      setStatus(
        !validation.success
          ? validation.error.issues[0].message
          : !url.success
            ? url.error.issues[0].message
            : "입력값을 확인해 주세요.",
      );
      return;
    }
    const r = revision.current;
    busy.current = true;
    setSaving(true);
    setStatus("저장 중…");
    try {
      const result = await saveDraft({
        id,
        version: version.current,
        ...snapshot,
      });
      if (result.ok) {
        version.current = result.version;
        if (revision.current === r) {
          setDirty(false);
          setStatus("모든 변경사항 저장됨");
        } else {
          setStatus("저장되지 않은 변경사항");
          setSaveTick((t) => t + 1);
        }
      } else {
        setStatus(result.message);
        if (result.kind === "conflict") {
          blocked.current = true;
          setConflict(true);
        }
      }
    } catch {
      setStatus("연결이 끊겼습니다. 다시 저장해 주세요.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, [id]);
  useEffect(() => {
    if (!dirty || !id || conflict) return;
    const timer = setTimeout(() => void save(), 1000);
    return () => clearTimeout(timer);
  }, [content, slug, dirty, id, conflict, save, saveTick]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty && id) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, id]);
  const field = (
    key: keyof InvitationContent["basic"],
    label: string,
    type = "text",
  ) => (
    <label key={key}>
      {label}
      <input
        type={type}
        value={content.basic[key]}
        onChange={(e) => change(key, e.target.value)}
        maxLength={key === "address" ? 250 : 120}
      />
    </label>
  );
  const exportLocal = () => {
    const blob = new Blob([JSON.stringify(latest.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitation-draft-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="studio">
      <header className="topbar">
        <Link href={id ? "/admin" : "/"} className="brand">
          온결 <small>STUDIO</small>
        </Link>
        <div className="editor-title">
          우리의 청첩장 <span className="pill">초안</span>
        </div>
        <div className="save-area">
          <span role="status">{status}</span>
          <button
            className="button"
            disabled={!id || saving || conflict || !dirty}
            onClick={() => void save()}
          >
            임시저장
          </button>
        </div>
      </header>
      <div className="mobile-tabs">
        <button aria-pressed={tab === "edit"} onClick={() => setTab("edit")}>
          편집
        </button>
        <button
          aria-pressed={tab === "preview"}
          onClick={() => setTab("preview")}
        >
          미리보기
        </button>
      </div>
      <div className={`workspace show-${tab}`}>
        <aside className="menu">
          <div className="menu-heading">INVITATION EDITOR</div>
          {menus.map((name, i) => (
            <button
              key={name}
              className={menu === i ? "active" : ""}
              onClick={() => {
                setMenu(i);
                setTab("edit");
              }}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {name}
              <span className="menu-arrow">›</span>
            </button>
          ))}
          <div className="phase-note">
            PHASE 01
            <br />
            기본 정보와 디자인을 준비하는 단계입니다.
          </div>
        </aside>
        <main className="edit-panel">
          <div className="eyebrow">
            STEP {String(menu + 1).padStart(2, "0")}
          </div>
          <h1>{menus[menu]}</h1>
          <p className="subtitle">두 분의 이야기가 시작되는 곳.</p>
          {!id && (
            <div className="notice">
              체험용 편집기입니다. 변경사항은 저장되지 않으며, 새로고침하면
              초기화됩니다.
            </div>
          )}
          {conflict && (
            <div className="notice" role="alert">
              <p>{status}</p>
              <button onClick={exportLocal}>현재 내용 백업 다운로드</button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "저장하지 않은 내용을 버리고 최신 초안을 불러올까요?",
                    )
                  )
                    location.reload();
                }}
              >
                최신 초안 불러오기
              </button>
            </div>
          )}
          {menu === 0 && (
            <>
              <div className="form-section">
                <h2>주인공을 소개해 주세요</h2>
                <div className="field-grid">
                  {field("groom", "신랑 이름")}
                  {field("bride", "신부 이름")}
                </div>
              </div>
              <div className="form-section">
                <h2>양가 혼주</h2>
                <div className="field-grid">
                  {field("groomFather", "신랑 아버지")}
                  {field("groomMother", "신랑 어머니")}
                  {field("brideFather", "신부 아버지")}
                  {field("brideMother", "신부 어머니")}
                </div>
              </div>
              <div className="form-section">
                <h2>마음에 새길 하루</h2>
                <div className="field-grid">
                  {field("date", "예식 날짜", "date")}
                  {field("time", "예식 시간 (한국 시간)", "time")}
                </div>
                {field("venue", "예식장 이름")}
                {field("address", "예식장 주소")}
              </div>
              <div className="form-section">
                <h2>초대의 마음</h2>
                <label>
                  초대 문구
                  <textarea
                    rows={6}
                    maxLength={3000}
                    value={content.basic.invitation}
                    onChange={(e) => change("invitation", e.target.value)}
                  />
                </label>
                <label>
                  고유 URL
                  <input
                    value={slug}
                    maxLength={60}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      mark();
                    }}
                  />
                  <small>/i/{slug} · 발행 기능은 Phase 5에서 제공됩니다.</small>
                </label>
              </div>
            </>
          )}
          {menu === 1 && (
            <>
              <div className="form-section">
                <h2>청첩장의 분위기</h2>
                <label>
                  글꼴
                  <select
                    value={content.design.font}
                    onChange={(e) =>
                      design({ font: e.target.value as "serif" | "sans" })
                    }
                  >
                    <option value="serif">감성 명조</option>
                    <option value="sans">단정한 고딕</option>
                  </select>
                </label>
                {(["background", "accent", "text"] as const).map((key, i) => (
                  <label key={key}>
                    {["배경색", "강조색", "텍스트 색상"][i]}
                    <input
                      type="color"
                      value={content.design[key]}
                      onChange={(e) => design({ [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <div className="form-section">
                <h2>섹션 구성</h2>
                <p>
                  Phase 1 미리보기: 일정, 오시는 길, 클로징. 나머지 섹션은 후속
                  단계에서 연결됩니다.
                </p>
                {content.design.sections.map((s, i) => (
                  <div className="section-row" key={s.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={s.visible}
                        onChange={(e) =>
                          design({
                            sections: content.design.sections.map((x) =>
                              x.id === s.id
                                ? { ...x, visible: e.target.checked }
                                : x,
                            ),
                          })
                        }
                      />
                      {labels[s.id]}
                    </label>
                    <button
                      aria-label={`${labels[s.id]} 위로`}
                      disabled={i === 0}
                      onClick={() => {
                        const sections = [...content.design.sections];
                        [sections[i - 1], sections[i]] = [
                          sections[i],
                          sections[i - 1],
                        ];
                        design({ sections });
                      }}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`${labels[s.id]} 아래로`}
                      disabled={i === 9}
                      onClick={() => {
                        const sections = [...content.design.sections];
                        [sections[i + 1], sections[i]] = [
                          sections[i],
                          sections[i + 1],
                        ];
                        design({ sections });
                      }}
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>
              <div className="notice">
                GIF 업로드와 오프닝 연결은 Phase 2에서 구현합니다.
              </div>
            </>
          )}
          {menu === 5 && (
            <div className="form-section">
              <h2>예식 장소</h2>
              {field("venue", "예식장 이름")}
              {field("address", "예식장 주소")}
              <p className="notice">
                지도 및 교통 안내는 Phase 3에서 연결합니다.
              </p>
            </div>
          )}
          {![0, 1, 5].includes(menu) && (
            <div className="empty-state">
              <span>✧</span>
              <h2>다음 단계에서 만나요</h2>
              <p>
                이 메뉴는 Phase 1 구현 범위에 포함되지 않습니다.
                <br />
                현재는 기본 정보와 디자인을 편집할 수 있습니다.
              </p>
            </div>
          )}
        </main>
        <aside className="preview-panel">
          <div className="preview-heading">
            <span>LIVE PREVIEW</span>
            <span>모바일 · 390px</span>
          </div>
          <div className="phone">
            <div className="phone-bar">
              9:41 <span>● ▰</span>
            </div>
            <div className="phone-content">
              <InvitationRenderer content={content} />
            </div>
          </div>
          <p className="preview-note">입력한 내용이 실시간으로 반영됩니다.</p>
        </aside>
      </div>
    </div>
  );
}
