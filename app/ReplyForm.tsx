"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

export default function ReplyForm() {
  const [fullName, setFullName] = useState("");
  const [attendance, setAttendance] = useState("");
  const [guests, setGuests] = useState("1");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const receipt = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const acceptInput = useRef<HTMLInputElement>(null);
  const nameMissing = attempted && !fullName.trim();
  const replyMissing = attempted && !attendance;

  useEffect(() => {
    if (saved) receipt.current?.focus();
  }, [saved]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || saved) return;
    setAttempted(true);
    setError("");
    if (!fullName.trim() || !attendance) {
      (fullName.trim() ? acceptInput : nameInput).current?.focus();
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), attendance, guests, guestCount: Number(guests) }),
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
      <h3 ref={receipt} tabIndex={-1}>Thank you, {fullName.trim()}.</h3>
      <p>{attendance === "joyfully-accept"
        ? "We’re so glad you’ll be there. We can’t wait to celebrate with you."
        : "You’ll be with us in spirit. Thank you for sending your love."}</p>
      <p className="receipt-signature">With love, Adrian &amp; KC</p>
    </div>
  );

  return (
    <form className="reply-form" onSubmit={submit} noValidate aria-busy={saving}>
      <fieldset className="reply-fields" disabled={saving}>
        <label htmlFor="full-name">Full name <small>(required)</small></label>
        <input id="full-name" ref={nameInput} value={fullName} onChange={e => setFullName(e.target.value)}
          required maxLength={160} autoComplete="name" placeholder="Your first and last name"
          aria-invalid={nameMissing} aria-describedby={nameMissing ? "name-error" : undefined} />
        {nameMissing && <p className="field-error" id="name-error">Please add your name so we know who’s replying.</p>}
        <fieldset className="attendance-options" aria-describedby={replyMissing ? "reply-error" : undefined}>
          <legend>Your reply <small>(required)</small></legend>
          <div className="radio-row">
            {[["joyfully-accept", "Joyfully accept"], ["regretfully-decline", "Regretfully decline"]].map(([value, label], i) => (
              <label className="radio" key={value}>
                <input type="radio" name="attendance" value={value} ref={i === 0 ? acceptInput : undefined}
                  required checked={attendance === value} onChange={() => setAttendance(value)}
                  aria-invalid={replyMissing} aria-describedby={replyMissing ? "reply-error" : undefined} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {replyMissing && <p className="field-error" id="reply-error">Please let us know whether you’ll be joining us.</p>}
        <label htmlFor="guest-count">Number of guests</label>
        <select id="guest-count" value={guests} onChange={e => setGuests(e.target.value)}>
          {[1, 2, 3, 4].map(n => <option value={n} key={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
        </select>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={saving}>{saving ? "Saving RSVP…" : "Send RSVP"} <span aria-hidden="true">→</span></button>
    </form>
  );
}
