import Editor from "@/components/Editor";
import { initialContent } from "@/lib/content";
export default function Demo() {
  return (
    <Editor
      initial={initialContent}
      initialSlug="doyoon-seoyeon"
      initialVersion={1}
    />
  );
}
