import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

export const runtime = "nodejs";

function hashInviteCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

type PendingInvite = {
  displayName: string;
  maxGuests: number;
  code: string;
  guestOf: string;
  invite_code_hash: string;
};

const allowedGuestOf = new Set(["Adrian", "KC"]);

function cleanGuestOf(value: unknown) {
  const guestOf = typeof value === "string" ? value.trim() : "";
  return allowedGuestOf.has(guestOf) ? guestOf : "";
}

async function requireAdmin() {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user && isAdminEmail(user.email) ? user : null;
}

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data: households, error } = await supabase
      .from("households")
      .select("id, display_name, max_guests, guest_of, invite_code, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = (households ?? []).map(household => household.id);
    const { data: replies, error: repliesError } = ids.length
      ? await supabase.from("rsvps").select("household_id, attendance, guest_count, updated_at").in("household_id", ids)
      : { data: [], error: null };
    if (repliesError) throw repliesError;
    const replyByHousehold = new Map((replies ?? []).map(reply => [reply.household_id, reply]));
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      invites: (households ?? []).map(household => {
        const reply = replyByHousehold.get(household.id);
        return {
          id: household.id,
          displayName: household.display_name,
          maxGuests: household.max_guests,
          guestOf: household.guest_of ?? null,
          code: household.invite_code ?? null,
          link: household.invite_code ? `${origin}/?invite=${encodeURIComponent(household.invite_code)}` : null,
          legacy: !household.invite_code,
          createdAt: household.created_at,
          status: reply ? (reply.attendance === "joyfully-accept" ? "Accepted" : "Declined") : "Pending",
          guestCount: reply?.guest_count ?? null,
          updatedAt: reply?.updated_at ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("Invitation list failed", error);
    return NextResponse.json({ error: "We could not load the invitation links right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const rows = Array.isArray(body.invites) ? body.invites : [];
    if (!rows.length || rows.length > 100) return NextResponse.json({ error: "Add between 1 and 100 invitations." }, { status: 400 });

    const invites: PendingInvite[] = rows.map((row: { displayName?: unknown; maxGuests?: unknown; code?: unknown; guestOf?: unknown }) => {
      const displayName = typeof row.displayName === "string" ? row.displayName.trim().slice(0, 160) : "";
      const maxGuests = Number(row.maxGuests);
      const code = typeof row.code === "string" ? row.code.trim().toUpperCase() : "";
      const guestOf = cleanGuestOf(row.guestOf);
      return { displayName, maxGuests, code, guestOf, invite_code_hash: hashInviteCode(code) };
    });
    if (invites.some(invite => !invite.displayName || !invite.guestOf || !invite.code || !/^[A-Z0-9][A-Z0-9_-]{2,63}$/.test(invite.code) || !Number.isInteger(invite.maxGuests) || invite.maxGuests < 1 || invite.maxGuests > 20)) {
      return NextResponse.json({ error: "Each invitation needs a name, Guest of choice, guest limit from 1 to 20, and a code using letters, numbers, hyphens, or underscores." }, { status: 400 });
    }
    if (new Set(invites.map(invite => invite.code)).size !== invites.length) return NextResponse.json({ error: "Invitation codes must be unique." }, { status: 409 });

    const supabase = createSupabaseAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("households")
      .select("invite_code")
      .in("invite_code", invites.map(invite => invite.code));
    if (existingError) throw existingError;
    if (existing?.length) return NextResponse.json({ error: `This invitation code already exists: ${existing[0].invite_code}` }, { status: 409 });
    const { data, error } = await supabase
      .from("households")
      .insert(invites.map(({ displayName, maxGuests, guestOf, invite_code_hash, code }: PendingInvite) => ({
        display_name: displayName,
        max_guests: maxGuests,
        guest_of: guestOf,
        invite_code_hash,
        invite_code: code,
      })))
      .select("id, display_name, max_guests");
    if (error) throw error;

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      invites: (data ?? []).map((household, index) => ({
        id: household.id,
        displayName: household.display_name,
        maxGuests: household.max_guests,
        guestOf: invites[index].guestOf,
        code: invites[index].code,
        link: `${origin}/?invite=${encodeURIComponent(invites[index].code)}`,
      })),
    });
  } catch (error) {
    console.error("Invitation creation failed", error);
    return NextResponse.json({ error: "We could not create those invitations right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 160) : "";
    const maxGuests = Number(body.maxGuests);
    const guestOf = cleanGuestOf(body.guestOf);
    if (!id || !displayName || !guestOf || !Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) {
      return NextResponse.json({ error: "Add a name, Guest of choice, and choose a guest limit from 1 to 20." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: existingReply, error: replyError } = await supabase
      .from("rsvps")
      .select("guest_count")
      .eq("household_id", id)
      .maybeSingle();
    if (replyError) throw replyError;
    if (existingReply && Number(existingReply.guest_count) > maxGuests) {
      return NextResponse.json({ error: `This invitation already has ${existingReply.guest_count} guests attending. Choose a limit of at least ${existingReply.guest_count}.` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("households")
      .update({ display_name: displayName, max_guests: maxGuests, guest_of: guestOf })
      .eq("id", id)
      .select("id, display_name, max_guests, guest_of")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    return NextResponse.json({ id: data.id, displayName: data.display_name, maxGuests: data.max_guests, guestOf: data.guest_of });
  } catch (error) {
    console.error("Invitation update failed", error);
    return NextResponse.json({ error: "We could not update this invitation right now." }, { status: 500 });
  }
}

