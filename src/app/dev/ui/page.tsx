import { notFound } from "next/navigation";
import { UiPreview } from "@/components/ui/UiPreview";

export default function UiPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiPreview />;
}
