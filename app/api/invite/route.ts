import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isRsvpClosed } from "@/lib/rsvp-deadline";

export const runtime = "nodejs";

function hashInviteCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!code || code.length > 200) return NextResponse.json({ error: "This invitation link is not valid." }, { status: 404 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data: household, error } = await supabase
      .from("households")
      .select("id, display_name, max_guests")
      .eq("invite_code_hash", hashInviteCode(code))
      .maybeSingle();
    if (error) throw error;
    if (!household) return NextResponse.json({ error: "This invitation link is not valid." }, { status: 404 });

    const { data: existingReply, error: existingReplyError } = await supabase
      .from("rsvps")
      .select("id, full_name, guest_names, attendance, guest_count")
      .eq("household_id", household.id)
      .maybeSingle();
    if (existingReplyError) throw existingReplyError;

    return NextResponse.json({
      displayName: household.display_name,
      maxGuests: Number(household.max_guests),
      rsvpOpen: !isRsvpClosed(),
      hasResponded: Boolean(existingReply),
      existingResponse: existingReply ? {
        fullName: existingReply.full_name,
        guestNames: existingReply.guest_names,
        attendance: existingReply.attendance,
        guestCount: Number(existingReply.guest_count),
      } : null,
    });
  } catch (error) {
    console.error("Invitation lookup failed", error);
    return NextResponse.json({ error: "We could not check this invitation right now." }, { status: 500 });
  }
}

