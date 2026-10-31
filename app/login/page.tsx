import type { Metadata } from "next";
import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Inicia sesión en tu cuenta de Devta.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  return <LoginForm googleError={Array.isArray(params.error) ? params.error[0] : params.error} />;
}
