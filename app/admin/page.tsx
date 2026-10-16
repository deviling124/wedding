import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

function householdLabel(value: unknown) {
  if (Array.isArray(value)) return (value[0] as { display_name?: string } | undefined)?.display_name ?? "—";
  return (value as { display_name?: string } | null)?.display_name ?? "—";
}

export default async function AdminPage() {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdminEmail(user.email)) return <main className="auth-shell"><div className="auth-card"><div className="eyebrow">Access denied</div><h1>Not an admin account.</h1><p className="story-copy">Add this email to the ADMIN_EMAILS environment variable before trying again.</p></div></main>;

  const supabase = createSupabaseAdminClient();
  const { data: rsvps, error } = await supabase
    .from("rsvps")
    .select("id, first_name, last_name, email, attendance, guest_count, dietary_notes, song_request, updated_at, households(display_name)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const accepted = (rsvps ?? []).filter((rsvp) => rsvp.attendance === "joyfully-accept");
  const guestTotal = accepted.reduce((sum, rsvp) => sum + Number(rsvp.guest_count ?? 0), 0);

  return (
    <main className="admin-shell">
      <div className="admin-header">
        <div><div className="eyebrow">Private dashboard</div><h1>Guest list</h1><p>{accepted.length} accepted households · {guestTotal} guests attending · {(rsvps ?? []).filter((rsvp) => rsvp.attendance === "regretfully-decline").length} declined</p></div>
        <LogoutButton />
      </div>
      <div className="admin-table-wrap">
        {!rsvps?.length ? <div className="empty">No RSVPs yet. Your first reply will appear here.</div> : <table className="admin-table"><thead><tr><th>Guest</th><th>Household</th><th>Reply</th><th>Guests</th><th>Notes</th><th>Updated</th></tr></thead><tbody>{rsvps.map((rsvp) => <tr key={rsvp.id}><td><strong>{rsvp.first_name} {rsvp.last_name}</strong><br /><span className="form-note">{rsvp.email}</span></td><td>{householdLabel(rsvp.households)}</td><td><span className={`status ${rsvp.attendance === "regretfully-decline" ? "declined" : ""}`}>{rsvp.attendance === "joyfully-accept" ? "Accepted" : "Declined"}</span></td><td>{rsvp.guest_count}</td><td>{[rsvp.dietary_notes, rsvp.song_request].filter(Boolean).join(" · ") || "—"}</td><td>{new Date(rsvp.updated_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</td></tr>)}</tbody></table>}
      </div>
    </main>
  );
}
