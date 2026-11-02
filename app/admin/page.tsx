import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { ExportButton } from "./ExportButton";
import { InvitationManager } from "./InvitationManager";
import { AdminTabs } from "./AdminTabs";

export const dynamic = "force-dynamic";

function householdLabel(value: unknown) {
  if (Array.isArray(value)) return (value[0] as { display_name?: string } | undefined)?.display_name ?? "—";
  return (value as { display_name?: string } | null)?.display_name ?? "—";
}

function householdGuestOf(value: unknown) {
  if (Array.isArray(value)) return (value[0] as { guest_of?: string | null } | undefined)?.guest_of ?? "—";
  return (value as { guest_of?: string | null } | null)?.guest_of ?? "—";
}

function guestName(value: { full_name?: string | null; first_name?: string | null; last_name?: string | null }) {
  return value.full_name || [value.first_name, value.last_name].filter(Boolean).join(" ") || "—";
}

function rsvpGuestNames(value: { guest_names?: unknown; full_name?: string | null; first_name?: string | null; last_name?: string | null }) {
  if (Array.isArray(value.guest_names) && value.guest_names.length) return value.guest_names.filter((name): name is string => typeof name === "string" && Boolean(name.trim()));
  return guestName(value).split(/,\s*/).filter(Boolean);
}

export default async function AdminPage() {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdminEmail(user.email)) return <main className="auth-shell"><div className="auth-card"><div className="eyebrow">Access denied</div><h1>Not an admin account.</h1><p className="story-copy">Add this email to the ADMIN_EMAILS environment variable before trying again.</p></div></main>;

  const supabase = createSupabaseAdminClient();
  const { data: rsvps, error } = await supabase
    .from("rsvps")
    .select("id, full_name, guest_names, first_name, last_name, email, attendance, guest_count, updated_at, households(display_name, guest_of)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const accepted = (rsvps ?? []).filter((rsvp) => rsvp.attendance === "joyfully-accept");
  const guestTotal = accepted.reduce((sum, rsvp) => sum + Number(rsvp.guest_count ?? 0), 0);

  return (
    <main className="admin-shell">
      <div className="admin-header">
        <div><div className="eyebrow">Private dashboard</div><h1>Guest list</h1><p>{accepted.length} accepted replies · {guestTotal} guests attending · {(rsvps ?? []).filter((rsvp) => rsvp.attendance === "regretfully-decline").length} declined</p></div>
        <div className="admin-actions"><ExportButton /><LogoutButton /></div>
      </div>
      <AdminTabs
        guestList={
          <div className="admin-table-wrap">
            {!rsvps?.length ? <div className="empty">No RSVPs yet. Your first reply will appear here.</div> : <table className="admin-table"><thead><tr><th>Guest</th><th>Invitation group</th><th>Guest of</th><th>Reply</th><th>Guests</th><th>Updated</th></tr></thead><tbody>{rsvps.flatMap((rsvp) => { const names = rsvpGuestNames(rsvp); return names.map((name, index) => <tr key={`${rsvp.id}-${index}`}><td><strong>{name}</strong>{index === 0 && rsvp.email && <small>{rsvp.email}</small>}</td>{index === 0 && <><td rowSpan={names.length}>{householdLabel(rsvp.households)}</td><td rowSpan={names.length}>{householdGuestOf(rsvp.households)}</td><td rowSpan={names.length}><span className={`status ${rsvp.attendance === "regretfully-decline" ? "declined" : ""}`}>{rsvp.attendance === "joyfully-accept" ? "Accepted" : "Declined"}</span></td><td rowSpan={names.length}>{rsvp.guest_count}</td><td rowSpan={names.length}>{new Date(rsvp.updated_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</td></>}</tr>); })}</tbody></table>}
          </div>
        }
        invitationLinks={<InvitationManager />}
      />
    </main>
  );
}

