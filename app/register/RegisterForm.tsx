"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { signUp, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { BrandLogo } from "@/components/BrandLogo";
import CursorGrid from "@/components/ui/CursorGrid";
import { isValidPhoneNumber } from "@/lib/auth/phone";

const initialState: AuthState = { error: null };
const inputClassName =
  "h-11 rounded-md border-white/20 bg-transparent px-3 text-sm placeholder:text-white/45 focus-visible:border-[#C9E94F] focus-visible:ring-1 focus-visible:ring-[#C9E94F]/30";

export function RegisterForm({ googleError }: { googleError?: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [step, setStep] = useState<"email" | "details">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const authError = googleError === "google_unconfigured"
    ? "El acceso con Google todavía no está configurado."
    : googleError === "google_account_not_found"
      ? "No encontramos esa cuenta. Completá tus datos para registrarte."
      : googleError === "google_failed"
        ? "No pudimos completar el acceso con Google. Inténtalo otra vez."
        : null;

  function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      setPhoneError("Ingresá un teléfono válido, con código de área.");
      return;
    }
    setPhoneError(null);
    setStep("details");
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#191919] px-4 pt-8 pb-10 text-white sm:pt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:grid-rows-[1fr_auto] lg:items-center lg:gap-x-[clamp(3rem,7vw,8rem)] lg:px-[clamp(3rem,8vw,8rem)] lg:py-8">
      <aside aria-labelledby="register-promo-title" className="relative hidden min-h-[calc(100svh-4rem)] w-full min-w-0 flex-col justify-center self-stretch border-r border-white/10 pr-10 lg:row-span-2 lg:flex xl:pr-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <CursorGrid
            cellSize={44}
            color="#C9E94F"
            gridColor="#C9E94F"
            radius={132}
            maxOpacity={0.38}
            fillOpacity={0.035}
            gridOpacity={0.045}
            spotlight={0.62}
            clickPulse
            edgeFade={0.42}
            intro={false}
            dpr={1}
          />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/4 size-80 rounded-full bg-[#C9E94F]/[0.06] blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <h2 id="register-promo-title" className="max-w-lg text-4xl font-semibold leading-[1.13] tracking-[-0.035em] xl:text-5xl">
            Tu próximo proyecto <span className="text-[#C9E94F]">empieza acá.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/65 xl:text-lg">
            Desarrollo web, automatización y tiendas online con alcance, precio y plazo claros desde el inicio.
          </p>

          <section aria-label="Servicios de Devta" className="mt-10 max-w-[540px] rounded-2xl border border-white/10 bg-[#111]/80 p-6 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.9)]">
            <p className="text-sm font-semibold text-white/90">Encontrá el servicio para tu negocio</p>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {["Programación web", "Automatización", "Tiendas online"].map((service) => (
                <li key={service} className="rounded-lg border border-white/10 bg-white/[0.035] px-3.5 py-2.5 text-sm text-white/75">
                  {service}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-white/55">
              Compará opciones y coordiná directamente con quien desarrolla tu proyecto.
            </p>
          </section>
        </div>
      </aside>

      <div className="mt-20 mb-auto flex w-full flex-col items-center py-0 sm:mt-6 lg:col-start-2 lg:row-start-1 lg:my-0 lg:justify-self-center lg:py-10">
        <Link href="/" aria-label="Devta, inicio" className="mb-7">
          <BrandLogo size="large" />
        </Link>

        <h1 className="mb-6 text-center font-sans text-lg font-medium sm:text-xl">
          Crear cuenta
        </h1>

        <section className="w-full max-w-[440px] rounded-xl border border-white/10 bg-[#222222] px-6 py-7 sm:px-8 sm:py-8">
          <div className="mx-auto flex w-full max-w-[376px] flex-col">
            {step === "email" ? (
              <>
                <form action="/api/auth/google" method="post" onSubmit={() => setPhoneError(null)}>
                  <input type="hidden" name="source" value="register" />
                  <button type="submit" className="flex h-10 w-full items-center justify-center gap-3 rounded-md border border-white/25 px-3 text-sm font-medium text-white transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9E94F]">
                    <FcGoogle aria-hidden="true" className="size-[18px]" />
                    Continuar con Google
                  </button>
                </form>

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
                  <div>
                    <Label className="sr-only" htmlFor="phone">Teléfono</Label>
                    <Input
                      className={inputClassName}
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setPhoneError(null);
                      }}
                      placeholder="Tu teléfono, con código de área"
                    />
                  </div>
                  {phoneError && <p className="text-sm text-red-200" role="alert">{phoneError}</p>}
                  {authError && (
                    <p className="text-sm text-red-200" role="alert">{authError}</p>
                  )}
                  <Button
                    type="submit"
                    className="h-10 w-full rounded-md bg-[#C9E94F] font-sans text-sm text-[#191919] hover:bg-[#C9E94F]"
                  >
                    Continuar con correo electrónico
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-white/70">
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/login" className="font-semibold text-[#C9E94F] hover:underline">
                    Iniciar sesión
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p className="mb-5 text-center text-sm text-white/70">
                  Completa tus datos para crear la cuenta de <span className="text-white">{email}</span>.
                </p>
                <form action={formAction} className="flex flex-col gap-3">
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="phone" value={phone} />
                  <div>
                    <Label className="sr-only" htmlFor="fullName">Nombre completo</Label>
                    <Input className={inputClassName} id="fullName" name="fullName" required autoComplete="name" autoFocus placeholder="Tu nombre completo" />
                  </div>

                  <div>
                    <Label className="sr-only" htmlFor="password">Contraseña</Label>
                    <PasswordInput className={inputClassName} id="password" name="password" required minLength={6} autoComplete="new-password" placeholder="Contraseña, mínimo 6 caracteres" />
                  </div>
                  {state.error && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200" role="alert">
                      {state.error}
                    </p>
                  )}
                  <Button type="submit" disabled={pending} className="mt-2 h-11 w-full rounded-md bg-[#C9E94F] font-sans text-sm text-[#191919] hover:bg-[#C9E94F]">
                    {pending ? "Creando cuenta..." : "Crear cuenta"}
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

      <nav aria-label="Información legal" className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-xs text-white/75 lg:col-start-2 lg:row-start-2 lg:mt-4 lg:pb-2">
        <span className="hidden lg:inline">Al crear una cuenta, aceptás nuestros</span>
        <Link href="/terminos-y-condiciones" className="hover:text-white hover:underline">Términos y condiciones</Link>
        <span aria-hidden="true" className="lg:hidden">y</span>
        <span className="hidden lg:inline">y la</span>
        <Link href="/politica-de-privacidad" className="hover:text-white hover:underline">Política de privacidad</Link>
      </nav>
    </main>
  );
}
