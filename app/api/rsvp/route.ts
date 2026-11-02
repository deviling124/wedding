import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";
import { isRsvpClosed } from "@/lib/rsvp-deadline";

export const runtime = "nodejs";

const allowedAttendance = new Set(["joyfully-accept", "regretfully-decline"]);

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hashInviteCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  try {
    if (isRsvpClosed()) {
      return NextResponse.json({ error: "RSVPs closed on December 31, 2026." }, { status: 410 });
    }

    const body = await request.json();
    const attendance = clean(body.attendance, 40);
    const guestCount = Number(body.guestCount);
    const inviteCode = clean(body.inviteCode, 200);
    const submittedNames = Array.isArray(body.guestNames)
      ? body.guestNames.map((name: unknown) => clean(name, 160)).filter(Boolean)
      : [clean(body.fullName, 700)].filter(Boolean);
    const fullName = submittedNames.join(", ");

    if (!inviteCode) return NextResponse.json({ error: "A personal invitation link is required to RSVP." }, { status: 403 });
    if (!fullName || submittedNames.length !== guestCount || !allowedAttendance.has(attendance) || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      return NextResponse.json({ error: "Please complete your name, reply, and guest count." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    let householdId: string | null = null;
    let maxGuests = 4;
    if (inviteCode) {
      const { data: household, error: householdError } = await supabase
        .from("households")
        .select("id, max_guests")
        .eq("invite_code_hash", hashInviteCode(inviteCode))
        .maybeSingle();
      if (householdError) throw householdError;
      if (!household) return NextResponse.json({ error: "This invitation link is not valid." }, { status: 404 });
      householdId = household.id;
      maxGuests = Number(household.max_guests);
      if (attendance === "regretfully-decline" && guestCount !== 1) {
        return NextResponse.json({ error: "A declined invitation must include one name." }, { status: 400 });
      }
      if (attendance === "joyfully-accept" && guestCount > maxGuests) {
        return NextResponse.json({ error: `This invitation allows up to ${maxGuests} guests.` }, { status: 400 });
      }
    }

    const { error } = await supabase.from("rsvps").upsert({
      full_name: fullName,
      guest_names: submittedNames,
      household_id: householdId,
      first_name: null,
      last_name: null,
      email: null,
      attendance,
      guest_count: attendance === "regretfully-decline" ? 1 : guestCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: "household_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RSVP submission failed", error);
    return NextResponse.json({ error: "We could not save your RSVP right now. Please try again." }, { status: 500 });
  }
}

