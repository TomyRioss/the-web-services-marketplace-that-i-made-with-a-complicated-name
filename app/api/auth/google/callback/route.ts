import { randomUUID } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ensurePocketBaseAdmin, pbFilterValue } from "@/lib/pocketbase";
import type { Role } from "@/lib/data-types";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function failureRedirect(request: NextRequest, source: string, error: string) {
  const destination = source === "login" ? "/login" : "/register";
  return NextResponse.redirect(new URL(`${destination}?error=${error}`, request.url));
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const source = cookieStore.get("google_oauth_source")?.value === "login" ? "login" : "register";
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  const nonce = cookieStore.get("google_oauth_nonce")?.value;
  const verifier = cookieStore.get("google_oauth_verifier")?.value;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const providerError = request.nextUrl.searchParams.get("error");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  for (const name of ["google_oauth_state", "google_oauth_nonce", "google_oauth_verifier", "google_oauth_source"]) {
    cookieStore.delete(name);
  }

  if (providerError || !code || !state || !expectedState || state !== expectedState || !nonce || !verifier) {
    return failureRedirect(request, source, "google_failed");
  }
  if (!clientId || !clientSecret) {
    return failureRedirect(request, source, "google_unconfigured");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) throw new Error("Google token exchange failed");

    const tokenData = (await tokenResponse.json()) as { id_token?: string };
    if (!tokenData.id_token) throw new Error("Google returned no ID token");

    const { payload } = await jwtVerify(tokenData.id_token, googleJwks, {
      audience: clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });
    if (payload.nonce !== nonce || payload.email_verified !== true) {
      throw new Error("Google identity was not verified");
    }

    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!email) throw new Error("Google returned no email address");

    const pb = await ensurePocketBaseAdmin();
    const matches = await pb.collection("ttmcobuild_profiles").getList(1, 1, {
      filter: `email:lower = ${pbFilterValue(email)}`,
    });
    let profile = matches.items[0];

    if (!profile) {
      const now = new Date().toISOString();
      try {
        profile = await pb.collection("ttmcobuild_profiles").create({
          email,
          passwordHash: await hashPassword(randomUUID() + randomUUID()),
          fullName: typeof payload.name === "string" ? payload.name : "",
          phone: "",
          role: "CLIENTE",
          createdAt: now,
          updatedAt: now,
        });
      } catch {
        const existing = await pb.collection("ttmcobuild_profiles").getList(1, 1, {
          filter: `email:lower = ${pbFilterValue(email)}`,
        });
        profile = existing.items[0];
        if (!profile) throw new Error("Could not create Google profile");
      }
    }

    await createSession({ userId: profile.id, role: profile.role as Role });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return failureRedirect(request, source, "google_failed");
  }
}
