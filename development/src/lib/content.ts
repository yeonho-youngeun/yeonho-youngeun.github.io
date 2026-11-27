import { z } from "zod";
const name = z.string().trim().min(1, "이름을 입력해 주세요.").max(40);
export const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "영문 소문자, 숫자, 하이픈을 사용해 주세요.",
  );
export const sectionIds = [
  "schedule",
  "profiles",
  "interview",
  "gallery",
  "location",
  "guestbook",
  "photos",
  "contact",
  "accounts",
  "closing",
] as const;
export const contentSchema = z
  .object({
    schemaVersion: z.literal(1),
    basic: z
      .object({
        groom: name,
        bride: name,
        groomFather: z.string().max(40),
        groomMother: z.string().max(40),
        brideFather: z.string().max(40),
        brideMother: z.string().max(40),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .refine(
            (v) =>
              !isNaN(Date.parse(v)) &&
              new Date(v).toISOString().slice(0, 10) === v,
            "유효한 날짜를 입력해 주세요.",
          ),
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        venue: z.string().trim().min(1).max(120),
        address: z.string().max(250),
        invitation: z.string().max(3000),
      })
      .strict(),
    design: z
      .object({
        font: z.enum(["serif", "sans"]),
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        sections: z
          .array(
            z.object({ id: z.enum(sectionIds), visible: z.boolean() }).strict(),
          )
          .length(10)
          .refine((a) => new Set(a.map((s) => s.id)).size === 10),
      })
      .strict(),
  })
  .strict();
export type InvitationContent = z.infer<typeof contentSchema>;
export const saveSchema = z
  .object({
    id: z.uuid(),
    version: z.number().int().min(1),
    slug: slugSchema,
    content: contentSchema,
  })
  .strict();
export const initialContent: InvitationContent = {
  schemaVersion: 1,
  basic: {
    groom: "김도윤",
    bride: "이서연",
    groomFather: "김정호",
    groomMother: "박미경",
    brideFather: "이성훈",
    brideMother: "최은주",
    date: "2027-05-22",
    time: "12:30",
    venue: "더 채플 앳 청담",
    address: "서울특별시 강남구 선릉로 757",
    invitation:
      "서로의 계절이 되어 줄 두 사람이\n이제 같은 곳을 바라보며 걸어가려 합니다.\n우리의 시작에 함께해 주세요.",
  },
  design: {
    font: "serif",
    background: "#faf7f2",
    accent: "#8b705c",
    text: "#3c3630",
    sections: sectionIds.map((id) => ({ id, visible: true })),
  },
};
