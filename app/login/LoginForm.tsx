"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { signIn, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { BrandLogo } from "@/components/BrandLogo";

const initialState: AuthState = { error: null };
const inputClassName =
  "h-11 rounded-md border-white/20 bg-transparent px-3 text-sm placeholder:text-white/45 focus-visible:border-[#C9E94F] focus-visible:ring-1 focus-visible:ring-[#C9E94F]/30";

export function LoginForm({ googleError }: { googleError?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const authError = googleError === "google_unconfigured"
    ? "El acceso con Google todavía no está configurado."
    : googleError === "google_failed"
      ? "No pudimos completar el acceso con Google. Inténtalo otra vez."
      : null;

  function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("password");
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#191919] px-4 pt-8 pb-10 text-white sm:pt-12">
      <div className="mt-20 mb-auto flex w-full flex-col items-center py-0 sm:mt-6">
        <Link href="/" aria-label="Devta, inicio" className="mb-7">
          <BrandLogo size="large" />
        </Link>

        <h1 className="mb-6 text-center font-heading text-lg font-medium sm:text-xl">
          Iniciar sesión
        </h1>

        <section className="w-full max-w-[440px] rounded-xl border border-white/10 bg-[#222222] px-6 py-7 sm:px-8 sm:py-8">
          <div className="mx-auto flex w-full max-w-[376px] flex-col">
            {step === "email" ? (
              <>
                <Link
                  href="/api/auth/google?source=login"
                  className="flex h-10 items-center justify-center gap-3 rounded-md border border-white/25 px-3 text-sm font-medium text-white transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9E94F]"
                >
                  <FcGoogle aria-hidden="true" className="size-[18px]" />
                  Continuar con Google
                </Link>

                <div className="my-8 flex items-center gap-3 text-xs text-white/65" aria-hidden="true">
                  <span className="h-px flex-1 bg-white/20" />
                  o
                  <span className="h-px flex-1 bg-white/20" />
                </div>

                <form onSubmit={continueWithEmail} className="flex flex-col gap-5">
                  <div>
                    <Label className="sr-only" htmlFor="email">Correo electrónico</Label>
                    <Input
                      className={inputClassName}
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Tu dirección de correo electrónico"
                    />
                  </div>
                  {authError && <p className="text-sm text-red-200" role="alert">{authError}</p>}
                  <Button type="submit" className="h-10 w-full rounded-md bg-[#C9E94F] font-sans text-sm text-[#191919] hover:bg-[#C9E94F]">
                    Continuar con correo electrónico
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-white/70">
                  ¿No tienes una cuenta?{" "}
                  <Link href="/register" className="font-semibold text-[#C9E94F] hover:underline">Crear cuenta</Link>
                </p>
              </>
            ) : (
              <>
                <p className="mb-5 text-center text-sm text-white/70">
                  Ingresa la contraseña de <span className="text-white">{email}</span>.
                </p>
                <form action={formAction} className="flex flex-col gap-3">
                  <input type="hidden" name="email" value={email} />
                  <div>
                    <Label className="sr-only" htmlFor="password">Contraseña</Label>
                    <PasswordInput className={inputClassName} id="password" name="password" required autoComplete="current-password" autoFocus placeholder="Tu contraseña" />
                  </div>
                  {state.error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200" role="alert">{state.error}</p>}
                  <Button type="submit" disabled={pending} className="mt-2 h-11 w-full rounded-md bg-[#C9E94F] font-sans text-sm text-[#191919] hover:bg-[#C9E94F]">
                    {pending ? "Ingresando..." : "Iniciar sesión"}
                  </Button>
                </form>
                <button type="button" onClick={() => setStep("email")} className="mt-5 self-center text-sm text-white/70 underline underline-offset-4 hover:text-white">
                  Cambiar correo electrónico
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      <nav aria-label="Información legal" className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-xs text-white/75">
        <Link href="/terminos-y-condiciones" className="hover:text-white hover:underline">Términos y condiciones</Link>
        <span aria-hidden="true">y</span>
        <Link href="/politica-de-privacidad" className="hover:text-white hover:underline">Política de privacidad</Link>
      </nav>
    </main>
  );
}
