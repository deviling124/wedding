"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type InviteDraft = {
  displayName: string;
  maxGuests: string;
  guestOf: string;
  code: string;
  suggestedCode: string;
};

type CreatedInvite = {
  id: string;
  displayName: string;
  maxGuests: number;
  guestOf: string | null;
  code: string | null;
  link: string | null;
  legacy?: boolean;
  status?: string;
  guestCount?: number | null;
  updatedAt?: string | null;
};

type LinkFilter = "all" | "pending" | "accepted" | "declined";

const guestOfOptions = ["Adrian", "KC"];

function suggestedCode(name: string, index: number) {
  const cleaned = name.normalize("NFKD").replace(/[^a-zA-Z0-9\s_-]/g, "").trim();
  return (cleaned ? cleaned.replace(/[\s_-]+/g, "-") : `GUEST-${index + 1}`).toUpperCase().slice(0, 56);
}

function newDraft(index: number): InviteDraft {
  const code = suggestedCode("", index);
  return { displayName: "", maxGuests: "1", guestOf: "Adrian", code, suggestedCode: code };
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function InvitationManager() {
  const [drafts, setDrafts] = useState<InviteDraft[]>([newDraft(0)]);
  const [links, setLinks] = useState<CreatedInvite[]>([]);
  const [created, setCreated] = useState<CreatedInvite[]>([]);
  const [siteOrigin, setSiteOrigin] = useState("");
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingLimit, setEditingLimit] = useState("1");
  const [editingGuestOf, setEditingGuestOf] = useState("");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSiteOrigin(window.location.origin);
    loadLinks();
  }, []);

  async function loadLinks() {
    try {
      const response = await fetch("/api/admin/invitations");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load invitation links.");
      setLinks(body.invites);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load invitation links.");
    } finally {
      setLoadingLinks(false);
    }
  }

  function updateDraft(index: number, updates: Partial<InviteDraft>) {
    setDrafts(current => current.map((draft, draftIndex) => draftIndex === index ? { ...draft, ...updates } : draft));
  }

  function updateName(index: number, displayName: string) {
    setDrafts(current => current.map((draft, draftIndex) => {
      if (draftIndex !== index) return draft;
      const nextSuggestion = suggestedCode(displayName, index);
      return { ...draft, displayName, code: draft.code === draft.suggestedCode ? nextSuggestion : draft.code, suggestedCode: nextSuggestion };
    }));
  }

  function addDraft() {
    setDrafts(current => [...current, newDraft(current.length)]);
  }

  function removeDraft(index: number) {
    setDrafts(current => current.length === 1 ? current : current.filter((_, draftIndex) => draftIndex !== index));
  }

  function previewLink(code: string) {
    return code && siteOrigin ? `${siteOrigin}/?invite=${encodeURIComponent(code)}` : "";
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (!rows.length) {
      setMessage("That CSV file did not contain any rows.");
      return;
    }
    const normalizedHeaders = rows[0].map(cell => cell.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
    const hasHeader = normalizedHeaders.some(header => header.includes("guest or household") || header.includes("maximum guests") || header === "invitation code" || header === "guest of");
    const headers = hasHeader ? normalizedHeaders : [];
    const nameIndex = hasHeader ? Math.max(0, headers.findIndex(header => header.includes("guest or household") || header === "name" || header.includes("guest name"))) : 0;
    const limitIndex = hasHeader ? Math.max(0, headers.findIndex(header => header.includes("maximum guests") || header === "limit" || header.includes("guest limit"))) : 1;
    const codeIndex = hasHeader ? Math.max(0, headers.findIndex(header => header === "invitation code" || header === "code")) : 2;
    const guestOfIndex = hasHeader ? headers.findIndex(header => header === "guest of" || header.includes("invited by")) : 3;
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const imported = dataRows.map((row, index) => {
      const displayName = row[nameIndex] ?? "";
      const code = (row[codeIndex] ?? "").toUpperCase() || suggestedCode(displayName, index);
      const guestOf = guestOfOptions.includes(row[guestOfIndex] ?? "") ? row[guestOfIndex] : "Adrian";
      return { displayName, maxGuests: row[limitIndex] || "1", guestOf, code, suggestedCode: code };
    }).filter(row => row.displayName || row.code);
    setDrafts(imported.length ? imported : [newDraft(0)]);
    setMessage(`${imported.length} invitation row${imported.length === 1 ? "" : "s"} imported. Review them before creating links.`);
  }

  function startEditing(invite: CreatedInvite) {
    setEditingId(invite.id);
    setEditingName(invite.displayName);
    setEditingLimit(String(invite.maxGuests));
    setEditingGuestOf(invite.guestOf ?? "");
  }

  async function saveInvite(id: string) {
    setMessage("");
    try {
      const response = await fetch("/api/admin/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, displayName: editingName, maxGuests: Number(editingLimit), guestOf: editingGuestOf }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not update the invitation.");
      setLinks(current => current.map(invite => invite.id === id ? { ...invite, displayName: body.displayName, maxGuests: body.maxGuests, guestOf: body.guestOf } : invite));
      setEditingId(null);
      setMessage("Invitation updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the invitation.");
    }
  }

  async function createInvites() {
    setMessage("");
    setCreated([]);
    const invites = drafts.map(draft => ({ displayName: draft.displayName.trim(), maxGuests: Number(draft.maxGuests), guestOf: draft.guestOf, code: draft.code.trim() }));
    if (invites.some(invite => !invite.displayName || !invite.guestOf || !invite.code)) {
      setMessage("Add a guest name, Guest of choice, and invitation code to every row.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invites }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not create invitations.");
      setCreated(body.invites);
      setDrafts([newDraft(0)]);
      await loadLinks();
      setMessage(`${body.invites.length} unique link${body.invites.length === 1 ? "" : "s"} created.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create invitations.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(link: string | null) {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setMessage("Link copied.");
  }

  function downloadCsv() {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Guest or household", "Guest of", "Invitation code", "Maximum guests", "Status", "Guests attending", "RSVP link", "Updated"],
      ...links.map(invite => [invite.displayName, invite.guestOf ?? "", invite.code, invite.maxGuests, invite.status, invite.guestCount ?? "", invite.link, invite.updatedAt ?? ""]),
    ];
    const csv = rows.map(row => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wedding-invitation-links.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const visibleLinks = links.filter(invite => linkFilter === "all" || invite.status?.toLowerCase() === linkFilter);

  return (
    <section className="invitation-manager">
      <div className="eyebrow">Guest invitations</div>
      <h2>Create unique RSVP links</h2>
      <p>Add each guest or household below. We’ll suggest an invitation code and link; you can edit the code before creating it.</p>
      <div className="invite-draft-list">
        {drafts.map((draft, index) => {
          const link = previewLink(draft.code.trim());
          return (
            <div className="invite-draft" key={index}>
              <div className="invite-draft-heading"><strong>Invitation {index + 1}</strong>{drafts.length > 1 && <button type="button" className="remove-invite" onClick={() => removeDraft(index)}>Remove</button>}</div>
              <div className="invite-draft-fields">
                <label>Guest or household name<input value={draft.displayName} onChange={event => updateName(index, event.target.value)} placeholder="Castillo family" /></label>
                <label>Guest of<select value={draft.guestOf} onChange={event => updateDraft(index, { guestOf: event.target.value })}>{guestOfOptions.map(option => <option value={option} key={option}>{option}</option>)}</select></label>
                <label>Maximum guests<select value={draft.maxGuests} onChange={event => updateDraft(index, { maxGuests: event.target.value })}>{Array.from({ length: 20 }, (_, number) => number + 1).map(number => <option value={number} key={number}>{number} {number === 1 ? "guest" : "guests"}</option>)}</select></label>
                <label>Invitation code<input value={draft.code} onChange={event => updateDraft(index, { code: event.target.value.toUpperCase() })} placeholder="CASTILLO-2027" /></label>
              </div>
              <label className="suggested-link-field">Suggested RSVP link<input value={link} readOnly placeholder="Enter a name and code to preview the link" onFocus={event => event.currentTarget.select()} /></label>
            </div>
          );
        })}
      </div>
      <div className="invite-draft-actions"><button type="button" className="copy-link" onClick={addDraft}>+ Add another guest</button><label className="copy-link import-csv-button">Import CSV<input ref={fileInput} type="file" accept=".csv,text/csv" onChange={importCsv} /></label><button className="button" type="button" onClick={createInvites} disabled={saving}>{saving ? "Creating links…" : "Create invitation links"} <span aria-hidden="true">→</span></button></div>
      {message && <p className="form-note" role="status">{message}</p>}
      {created.length > 0 && <div className="created-invites">{created.map(invite => <div className="created-invite" key={invite.id}><div><strong>{invite.displayName}</strong><small>Guest of {invite.guestOf} · {invite.code} · Up to {invite.maxGuests} {invite.maxGuests === 1 ? "guest" : "guests"}</small></div><button type="button" className="copy-link" onClick={() => copyLink(invite.link)}>Copy link</button><input value={invite.link ?? ""} readOnly aria-label={`RSVP link for ${invite.displayName}`} onFocus={event => event.currentTarget.select()} /></div>)}</div>}
      <div className="invitation-links-header"><h3>All invitation links</h3><div className="invitation-links-tools"><label className="invitation-filter">Show<select value={linkFilter} onChange={event => setLinkFilter(event.target.value as LinkFilter)} aria-label="Filter invitation links"><option value="all">All invitations</option><option value="pending">Not yet replied</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></label><button type="button" className="copy-link" onClick={downloadCsv} disabled={!links.length}>Export CSV</button></div></div>
      {loadingLinks ? <p className="form-note">Loading invitation links…</p> : !links.length ? <p className="form-note">No invitation links yet.</p> : !visibleLinks.length ? <p className="form-note">No invitations match this filter.</p> : <div className="invitation-links-table-wrap"><table className="invitation-links-table"><thead><tr><th>Guest or household</th><th>Guest of</th><th>Code</th><th>Limit</th><th>Status</th><th>Link</th><th>Actions</th></tr></thead><tbody>{visibleLinks.map(invite => <tr key={invite.id}><td>{editingId === invite.id ? <input className="invite-edit-name" value={editingName} onChange={event => setEditingName(event.target.value)} aria-label="Guest or household name" /> : <strong>{invite.displayName}</strong>}</td><td>{editingId === invite.id ? <select value={editingGuestOf} onChange={event => setEditingGuestOf(event.target.value)} aria-label="Guest of"><option value="">Select</option>{guestOfOptions.map(option => <option value={option} key={option}>{option}</option>)}</select> : invite.guestOf ? `Guest of ${invite.guestOf}` : "—"}</td><td><code>{invite.code ?? "Legacy code unavailable"}</code></td><td>{editingId === invite.id ? <div className="invite-edit-actions"><select value={editingLimit} onChange={event => setEditingLimit(event.target.value)}>{Array.from({ length: 20 }, (_, number) => number + 1).map(number => <option value={number} key={number}>{number}</option>)}</select><button type="button" className="copy-link" onClick={() => saveInvite(invite.id)}>Save</button><button type="button" className="copy-link" onClick={() => setEditingId(null)}>Cancel</button></div> : invite.maxGuests}</td><td><span className={`status ${invite.status === "Declined" ? "declined" : ""}`}>{invite.legacy ? "Legacy link" : invite.status}</span></td><td><button type="button" className="copy-link" onClick={() => copyLink(invite.link)} disabled={!invite.link}>{invite.link ? "Copy" : "Unavailable"}</button></td><td>{editingId !== invite.id && <button type="button" className="copy-link" onClick={() => startEditing(invite)}>Edit</button>}</td></tr>)}</tbody></table></div>}
    </section>
  );
}

