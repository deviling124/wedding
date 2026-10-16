import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedAttendance = new Set(["joyfully-accept", "regretfully-decline"]);

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inviteCode = clean(body.inviteCode, 80).toUpperCase();
    const firstName = clean(body.firstName, 80);
    const lastName = clean(body.lastName, 80);
    const email = clean(body.email, 180).toLowerCase();
    const attendance = clean(body.attendance, 40);
    const guestCount = Number(body.guestCount);
    const dietaryNotes = clean(body.dietary, 1000);
    const songRequest = clean(body.song, 180);

    if (!inviteCode || !firstName || !lastName || !email || !allowedAttendance.has(attendance) || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 4) {
      return NextResponse.json({ error: "Please complete the RSVP form with a valid invitation code." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const inviteCodeHash = createHash("sha256").update(inviteCode).digest("hex");
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id, max_guests")
      .eq("invite_code_hash", inviteCodeHash)
      .maybeSingle();
    if (householdError) throw householdError;
    if (!household) return NextResponse.json({ error: "That invitation code was not recognised." }, { status: 404 });
    if (guestCount > household.max_guests) return NextResponse.json({ error: `This invitation is for up to ${household.max_guests} guest${household.max_guests === 1 ? "" : "s"}.` }, { status: 400 });

    const { error } = await supabase.from("rsvps").upsert({
      household_id: household.id,
      first_name: firstName,
      last_name: lastName,
      email,
      attendance,
      guest_count: guestCount,
      dietary_notes: dietaryNotes || null,
      song_request: songRequest || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "household_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RSVP submission failed", error);
    return NextResponse.json({ error: "We could not save your RSVP right now. Please try again." }, { status: 500 });
  }
}
