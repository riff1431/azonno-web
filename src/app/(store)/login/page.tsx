import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/storefront/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Blush & Budget account.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
