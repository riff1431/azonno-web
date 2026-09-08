import { notFound } from "next/navigation";
import { isModuleEnabled } from "@/lib/settings/config-service";
import { SkincareQuizClient } from "./quiz-client";

export const metadata = {
  title: "Skincare Routine Finder — Blush & Budget",
  description: "Find your customized skincare routine tailored to your skin type in 60 seconds.",
};

export default async function SkincareQuizPage() {
  const enabled = await isModuleEnabled("skincare_quiz");
  if (!enabled) {
    notFound();
  }
  return <SkincareQuizClient />;
}
