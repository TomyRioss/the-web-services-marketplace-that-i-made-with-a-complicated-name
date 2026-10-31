import type { Metadata } from "next";
import { RegisterForm } from "@/app/register/RegisterForm";

export const metadata: Metadata = {
  title: "Registrarse",
  description: "Crea tu cuenta en Devta para descubrir y solicitar servicios de programación.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  return <RegisterForm googleError={Array.isArray(params.error) ? params.error[0] : params.error} />;
}
