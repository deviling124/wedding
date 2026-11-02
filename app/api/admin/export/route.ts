import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function guestName(value: { full_name?: string | null; first_name?: string | null; last_name?: string | null }) {
  return value.full_name || [value.first_name, value.last_name].filter(Boolean).join(" ") || "";
}

function guestNames(value: {
  guest_names?: unknown;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}) {
  if (Array.isArray(value.guest_names)) {
    const names = value.guest_names.filter((name): name is string => typeof name === "string" && Boolean(name.trim()));
    if (names.length) return names;
  }

  return guestName(value).split(/,\s*/).map((name) => name.trim()).filter(Boolean);
}

function householdGuestOf(value: unknown) {
  if (Array.isArray(value)) return (value[0] as { guest_of?: string | null } | undefined)?.guest_of ?? "";
  return (value as { guest_of?: string | null } | null)?.guest_of ?? "";
}

export async function GET() {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: "You are not allowed to export RSVPs." }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  const { data: rsvps, error } = await supabase
    .from("rsvps")
    .select("guest_names, full_name, first_name, last_name, email, attendance, guest_count, updated_at, households(guest_of)")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("RSVP export failed", error);
    return NextResponse.json({ error: "We could not export the RSVP list." }, { status: 500 });
  }

  const rows = [
    ["Guest", "Guest of", "Email", "Reply", "Guests", "Updated"],
    ...(rsvps ?? []).flatMap((rsvp) => guestNames(rsvp).map((name) => [
      name,
      householdGuestOf(rsvp.households),
      rsvp.email ?? "",
      rsvp.attendance === "joyfully-accept" ? "Accepted" : "Declined",
      rsvp.guest_count ?? "",
      rsvp.updated_at ?? "",
    ])),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const filename = `wedding-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\ufeff${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

