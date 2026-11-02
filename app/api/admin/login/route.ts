import { NextResponse } from "next/server";
import { getAdminLoginEmail, isAdminEmail, isAdminUsername } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = text(body.identifier);
    const password = typeof body.password === "string" ? body.password : "";
    const email = isAdminUsername(identifier) ? getAdminLoginEmail() : identifier;

    if (!email || !password || (!isAdminUsername(identifier) && !email.includes("@"))) {
      return NextResponse.json({ error: "We could not sign you in. Check your username and password." }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !isAdminEmail(data.user.email)) {
      if (data.user) await supabase.auth.signOut();
      return NextResponse.json({ error: "We could not sign you in. Check your username and password." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 503 });
  }
}

