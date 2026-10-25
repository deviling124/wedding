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
    const fullName = clean(body.fullName, 160);
    const attendance = clean(body.attendance, 40);
    const guestCount = Number(body.guestCount);

    if (!fullName || !allowedAttendance.has(attendance) || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 4) {
      return NextResponse.json({ error: "Please complete your name, reply, and guest count." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("rsvps").insert({
      full_name: fullName,
      household_id: null,
      first_name: null,
      last_name: null,
      email: null,
      attendance,
      guest_count: guestCount,
      dietary_notes: null,
      song_request: null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RSVP submission failed", error);
    return NextResponse.json({ error: "We could not save your RSVP right now. Please try again." }, { status: 500 });
  }
}

