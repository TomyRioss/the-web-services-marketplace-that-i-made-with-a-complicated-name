import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isValidPhoneNumber } from "@/lib/auth/phone";

const COOKIE_AGE = 10 * 60;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const source = formData.get("source") === "login" ? "login" : "register";
  const phone = String(formData.get("phone") ?? "").trim();
  const returnPath = source === "login" ? "/login" : "/register";

  if (source === "register" && !isValidPhoneNumber(phone)) {
    return NextResponse.redirect(new URL(`${returnPath}?error=phone_required`, request.url), 303);
  }

  const cookieStore = await cookies();
  if (source === "register") {
    cookieStore.set("google_oauth_phone", phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_AGE,
    });
  } else {
    cookieStore.delete("google_oauth_phone");
  }

  return NextResponse.redirect(new URL(`/api/auth/google?source=${source}`, request.url), 303);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const source = request.nextUrl.searchParams.get("source") === "login" ? "login" : "register";
  const returnPath = source === "login" ? "/login" : "/register";
  const cookieStore = await cookies();
  if (source === "register" && !isValidPhoneNumber(cookieStore.get("google_oauth_phone")?.value)) {
    return NextResponse.redirect(new URL(`${returnPath}?error=phone_required`, request.url));
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`${returnPath}?error=google_unconfigured`, request.url));
  }

  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_AGE,
  };

  cookieStore.set("google_oauth_state", state, cookieOptions);
  cookieStore.set("google_oauth_nonce", nonce, cookieOptions);
  cookieStore.set("google_oauth_verifier", verifier, cookieOptions);
  cookieStore.set("google_oauth_source", source, cookieOptions);

  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  return NextResponse.redirect(authorizationUrl);
}
