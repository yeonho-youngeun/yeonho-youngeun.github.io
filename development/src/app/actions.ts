"use server";
import { redirect } from "next/navigation";
import { requireUser, serverClient, configured } from "@/lib/supabase/server";
import { initialContent, saveSchema } from "@/lib/content";
export async function login(form: FormData) {
  if (!configured()) redirect("/");
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  if (email.length > 254 || password.length > 1024) redirect("/login?error=1");
  const db = await serverClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=1");
  redirect("/admin");
}
export async function logout() {
  const { db } = await requireUser();
  await db.auth.signOut();
  redirect("/login");
}
export async function createInvitation() {
  const { db } = await requireUser();
  const slug = "wedding-" + crypto.randomUUID().slice(0, 12);
  const { data, error } = await db.rpc("create_invitation", {
    p_slug: slug,
    p_content: initialContent,
  });
  if (error)
    throw new Error("청첩장 생성에 실패했습니다. DB 설정을 확인해 주세요.");
  redirect(`/admin/invitations/${data}`);
}
export async function saveDraft(
  input: unknown,
): Promise<
  | { ok: true; version: number }
  | { ok: false; kind: "validation" | "conflict" | "error"; message: string }
> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      kind: "validation",
      message: parsed.error.issues[0].message,
    };
  const { db } = await requireUser();
  const p = parsed.data;
  const { data, error } = await db.rpc("save_invitation_draft", {
    p_id: p.id,
    p_version: p.version,
    p_slug: p.slug,
    p_content: p.content,
  });
  if (error)
    return {
      ok: false,
      kind: error.code === "40001" ? "conflict" : "error",
      message:
        error.code === "40001"
          ? "다른 창에서 변경되었습니다. 현재 내용을 복사한 뒤 최신 초안을 불러와 주세요."
          : error.code === "23505"
            ? "이미 사용 중인 URL입니다."
            : "저장에 실패했습니다. 권한 또는 연결을 확인해 주세요.",
    };
  return { ok: true, version: data };
}
