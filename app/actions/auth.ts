"use server";

import { redirect } from "next/navigation";
import { ensurePocketBaseAdmin, pbFilterValue } from "@/lib/pocketbase";
import type { Role } from "@/lib/data-types";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, clearSession } from "@/lib/auth/session";
import { isValidPhoneNumber } from "@/lib/auth/phone";

export type AuthState = {
  error: string | null;
  values?: { email?: string; fullName?: string; phone?: string };
  token?: string;
};

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const values = { email, fullName, phone };
  const token = crypto.randomUUID();

  if (!fullName) return { error: "Ingresá tu nombre completo.", values, token };
  if (!isValidPhoneNumber(phone)) return { error: "Ingresá un número de teléfono válido.", values, token };
  if (!email) return { error: "Ingresá tu email.", values, token };
  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres.", values, token };
  }

  let userId: string;
  try {
    const pb = await ensurePocketBaseAdmin();
    const existing = await pb.collection("ttmcobuild_profiles").getList(1, 1, {
      filter: `email:lower = ${pbFilterValue(email)}`,
    });
    if (existing.totalItems) return { error: "Ese email ya está registrado.", values, token };

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const profile = await pb.collection("ttmcobuild_profiles").create({
      email,
      passwordHash,
      fullName,
      phone,
      role: "CLIENTE",
      createdAt: now,
      updatedAt: now,
    });

    userId = profile.id;
  } catch (error) {
    console.error("No se pudo completar el registro en PocketBase.", error);
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo en unos minutos.", values, token };
  }

  await createSession({ userId, role: "CLIENTE" });
  redirect("/dashboard");
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const values = { email };
  const token = crypto.randomUUID();

  if (!email || !password) return { error: "Ingresá tu email y contraseña.", values, token };

  const pb = await ensurePocketBaseAdmin();
  const matches = await pb.collection("ttmcobuild_profiles").getList(1, 1, {
    filter: `email:lower = ${pbFilterValue(email)}`,
  });
  const profile = matches.items[0];
  if (!profile) return { error: "Email o contraseña incorrectos.", values, token };

  const valid = await verifyPassword(password, profile.passwordHash);
  if (!valid) return { error: "Email o contraseña incorrectos.", values, token };

  await createSession({ userId: profile.id, role: profile.role as Role });
  redirect("/dashboard");
}

export async function signOut() {
  await clearSession();
  redirect("/login");
}


