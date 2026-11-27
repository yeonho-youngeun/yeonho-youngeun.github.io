import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { contentSchema } from "@/lib/content";
import Editor from "@/components/Editor";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireUser();
  const { data, error } = await db
    .from("invitation_drafts")
    .select("content,version,slug")
    .eq("invitation_id", id)
    .maybeSingle();
  if (error) throw new Error("초안 조회에 실패했습니다.");
  if (!data) notFound();
  const parsed = contentSchema.safeParse(data.content);
  if (!parsed.success) throw new Error("지원하지 않는 초안 형식입니다.");
  return (
    <Editor
      id={id}
      initial={parsed.data}
      initialSlug={data.slug}
      initialVersion={data.version}
    />
  );
}
