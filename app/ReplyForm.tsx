"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { RSVP_DEADLINE_LABEL } from "@/lib/rsvp-deadline";

type InviteDetails = {
  displayName: string;
  maxGuests: number;
  rsvpOpen: boolean;
  hasResponded: boolean;
  existingResponse: { fullName: string; guestNames: string[] | null; attendance: string; guestCount: number } | null;
};

export default function ReplyForm() {
  const [guestNames, setGuestNames] = useState([""]);
  const [attendance, setAttendance] = useState("");
  const [guests, setGuests] = useState("1");
  const [inviteCode, setInviteCode] = useState("");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const receipt = useRef<HTMLHeadingElement>(null);
  const nameInputs = useRef<Array<HTMLInputElement | null>>([]);
  const acceptInput = useRef<HTMLInputElement>(null);
  const guestCount = Number(guests);
  const guestLimit = invite?.maxGuests ?? 4;
  const nameMissing = attempted && guestNames.some(name => !name.trim());
  const replyMissing = attempted && !attendance;

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("invite")?.trim() ?? "";
    if (!code) {
      setInviteChecked(true);
      return;
    }
    setInviteCode(code);
    setInviteLoading(true);
    fetch(`/api/invite?code=${encodeURIComponent(code)}`)
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "This invitation link is not valid.");
        return body as InviteDetails;
      })
      .then(details => {
        setInvite(details);
        if (details.existingResponse) {
          const names = details.existingResponse.guestNames?.filter(Boolean) ?? details.existingResponse.fullName.split(/,\s*/).filter(Boolean);
          setGuestNames(names.length ? names : [""]);
          setAttendance(details.existingResponse.attendance);
          setGuests(String(details.existingResponse.guestCount));
        }
      })
      .catch(error => setInviteError(error instanceof Error ? error.message : "This invitation link is not valid."))
      .finally(() => {
        setInviteLoading(false);
        setInviteChecked(true);
      });
  }, []);

  function namesForSubmission() {
    return guestNames.map(name => name.trim()).filter(Boolean).join(", ");
  }

  function updateGuestCount(value: string) {
    const nextCount = Number(value);
    setGuests(value);
    setGuestNames(current => Array.from({ length: nextCount }, (_, index) => current[index] ?? ""));
  }

  function updateAttendance(value: string) {
    setAttendance(value);
    if (value === "regretfully-decline") {
      setGuests("1");
      setGuestNames(current => [current[0] ?? ""]);
    }
  }

  useEffect(() => {
    if (saved) receipt.current?.focus();
  }, [saved]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || saved) return;
    setAttempted(true);
    setError("");
    const firstMissingName = guestNames.findIndex(name => !name.trim());
    if (firstMissingName !== -1 || !attendance) {
      if (firstMissingName !== -1) nameInputs.current[firstMissingName]?.focus();
      else acceptInput.current?.focus();
      return;
    }
    const fullName = namesForSubmission();
    setSaving(true);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, guestNames: guestNames.map(name => name.trim()), attendance, guests, guestCount, inviteCode }),
      });
      if (!response.ok || !(await response.json()).ok) throw new Error();
      setSaved(true);
    } catch {
      setError("We couldn’t confirm your reply just now. Your details are still here. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) return (
    <div className="reply-receipt">
      <div className="eyebrow">Reply received</div>
      <h3 ref={receipt} tabIndex={-1}>Thank you, {namesForSubmission()}.</h3>
      <p>{attendance === "joyfully-accept"
        ? "We’re so glad you’ll be there. We can’t wait to celebrate with you."
        : "You’ll be with us in spirit. Thank you for sending your love."}</p>
      <p className="receipt-signature">With love, Adrian &amp; KC</p>
    </div>
  );

  if (!inviteChecked || inviteLoading) return <div className="reply-lock"><div className="eyebrow">Checking your invitation</div><p>Please wait while we verify your RSVP link.</p></div>;
  if (!inviteCode) return <div className="reply-lock"><div className="eyebrow">Private RSVP</div><h3>Your invitation link is required.</h3><p>Please open the personal RSVP link included with your invitation to reply.</p></div>;
  if (inviteError || !invite) return <div className="reply-lock"><div className="eyebrow">RSVP link unavailable</div><h3>We couldn’t verify this invitation.</h3><p>{inviteError || "Please use the personal RSVP link from your invitation."}</p></div>;
  if (!invite.rsvpOpen) return <div className="reply-lock"><div className="eyebrow">RSVPs are closed</div><h3>The RSVP deadline has passed.</h3><p>We accepted replies through {RSVP_DEADLINE_LABEL}. Thank you for understanding.</p></div>;

  return (
    <form className="reply-form" onSubmit={submit} noValidate aria-busy={saving}>
      {invite && <p className="invite-welcome">Replying for <strong>{invite.displayName}</strong>. This invitation includes up to {invite.maxGuests} {invite.maxGuests === 1 ? "guest" : "guests"}.</p>}
      {invite.hasResponded && <p className="form-note" role="status">This RSVP was already submitted. Sending again will update the existing reply.</p>}
      {inviteLoading && <p className="form-note" role="status">Checking your invitation…</p>}
      {inviteError && <p className="error" role="alert">{inviteError}</p>}
      <fieldset className="reply-fields" disabled={saving || inviteLoading || Boolean(inviteError)}>
        <div className="guest-names-heading">
          <div className="reply-field-label">Full name <small>(required)</small></div>
          <p>Tell us who’s included in this reply.</p>
        </div>
        <div className="guest-name-list">
          {guestNames.map((name, index) => {
            const inputId = index === 0 ? "full-name" : `guest-name-${index + 1}`;
            const missing = attempted && !name.trim();
            return (
              <div className="guest-name-field" key={inputId}>
                <label htmlFor={inputId}>{index === 0 ? "Your full name" : `Guest ${index + 1} full name`}</label>
                <input id={inputId} ref={element => { nameInputs.current[index] = element; }} value={name}
                  onChange={event => setGuestNames(current => current.map((currentName, nameIndex) => nameIndex === index ? event.target.value : currentName))}
                  required maxLength={160} autoComplete={index === 0 ? "name" : "off"}
                  placeholder={index === 0 ? "Your first and last name" : "Guest’s first and last name"}
                  aria-invalid={missing} aria-describedby={missing ? "name-error" : undefined} />
              </div>
            );
          })}
        </div>
        {nameMissing && <p className="field-error" id="name-error">Please add a full name for everyone included in this reply.</p>}
        <fieldset className="attendance-options" aria-describedby={replyMissing ? "reply-error" : undefined}>
          <legend>Your reply <small>(required)</small></legend>
          <div className="radio-row">
            {[["joyfully-accept", "Joyfully accept"], ["regretfully-decline", "Regretfully decline"]].map(([value, label], i) => (
              <label className="radio" key={value}>
                <input type="radio" name="attendance" value={value} ref={i === 0 ? acceptInput : undefined}
                  required checked={attendance === value} onChange={() => updateAttendance(value)}
                  aria-invalid={replyMissing} aria-describedby={replyMissing ? "reply-error" : undefined} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {replyMissing && <p className="field-error" id="reply-error">Please let us know whether you’ll be joining us.</p>}
        {attendance === "joyfully-accept" && (
          <div className="guest-count-field">
            <label htmlFor="guest-count">Number of guests</label>
            <select id="guest-count" value={guests} onChange={event => updateGuestCount(event.target.value)}>
              {Array.from({ length: guestLimit }, (_, index) => index + 1).map(n => <option value={n} key={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
            </select>
          </div>
        )}
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={saving}>{saving ? "Saving RSVP…" : "Send RSVP"} <span aria-hidden="true">→</span></button>
    </form>
  );
}

