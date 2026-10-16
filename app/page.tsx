"use client";

import { FormEvent, useEffect, useState } from "react";

type FormState = {
  inviteCode: string;
  firstName: string;
  lastName: string;
  email: string;
  attendance: "joyfully-accept" | "regretfully-decline" | "";
  guests: string;
  dietary: string;
  song: string;
};

const initialState: FormState = {
  inviteCode: "",
  firstName: "",
  lastName: "",
  email: "",
  attendance: "",
  guests: "1",
  dietary: "",
  song: "",
};

function AKMonogram() {
  return (
    <svg className="ak-monogram" viewBox="0 0 100 100" role="img" aria-label="AK monogram">
      <circle className="ak-monogram-ring" cx="50" cy="50" r="43" />
      <text className="ak-monogram-a" x="28" y="68">A</text>
      <text className="ak-monogram-k" x="48" y="68">K</text>
      <path className="ak-monogram-line" d="M25 76h50" />
    </svg>
  );
}

export default function HomePage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    reveals.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (showEnvelope) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showEnvelope]);

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function openInvitation() {
    if (envelopeOpening) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowEnvelope(false);
      return;
    }
    setEnvelopeOpening(true);
    window.setTimeout(() => setShowEnvelope(false), 1500);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guestCount: Number(form.guests) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "We could not save your RSVP.");
      setStatus("success");
      setMessage("Thank you — your reply is tucked safely into our hearts. We’ll be in touch soon.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not save your RSVP.");
    }
  }

  return (
    <>
      {showEnvelope && (
        <button className={`envelope-overlay${envelopeOpening ? " opening" : ""}`} type="button" onClick={openInvitation} aria-label="Open invitation">
          <span className="envelope-box" aria-hidden="true">
            <span className="envelope-back" />
            <span className="envelope-card"><span className="envelope-card-mark"><AKMonogram /></span></span>
            <span className="envelope-pocket" />
            <span className="envelope-flap"><span className="envelope-seal"><AKMonogram /></span></span>
          </span>
          <span className="envelope-prompt">Tap to open your invitation</span>
        </button>
      )}
      <nav className="nav" aria-label="Main navigation">
        <a className="brand" href="#top">A <span className="amp">&amp;</span> K</a>
        <div className="nav-links"><a href="#details">Details</a><a href="#rsvp">RSVP</a><a href="#travel">Travel</a></div>
      </nav>
      <main id="top">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-seal"><AKMonogram /></div>
            <div className="eyebrow">Together with our families</div>
            <h1>Adrian <span className="amp">&amp;</span> KC</h1>
            <div className="hero-date">Saturday, 12 September 2027 &nbsp;·&nbsp; Singapore</div>
            <p className="hero-note">We’re getting married, and it would mean the world to have you with us for the weekend.</p>
            <a className="button" href="#rsvp">Please RSVP <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="section paper">
          <div className="intro reveal">
            <div className="quote">A little bit of forever starts with <span>you.</span></div>
            <div className="story-copy"><p>From late-night conversations to a life full of ordinary magic, we’re so grateful for every chapter that led us here. Now we’re making it official — with good food, happy tears, and the people we love most.</p><p>Keep scrolling for the details, and let us know if you can join the celebration.</p></div>
          </div>
        </section>

        <section className="section mist" id="details">
          <div className="section-head reveal"><div className="eyebrow">The weekend at a glance</div><h2>Come as you are.</h2><p>One beautiful evening, a long table under the lights, and plenty of time to catch up.</p></div>
          <div className="facts reveal">
            <div className="fact"><div className="label">When</div><strong>12 September 2027</strong><p>Ceremony begins at 4:30 PM</p></div>
            <div className="fact"><div className="label">Where</div><strong>The Glasshouse</strong><p>1 Garden Walk, Singapore</p></div>
            <div className="fact"><div className="label">Dress</div><strong>Garden formal</strong><p>Colour, linen, and dancing shoes encouraged</p></div>
          </div>
        </section>

        <section className="section paper">
          <div className="section-head reveal"><div className="eyebrow">The shape of the day</div><h2>Meet us under the trees.</h2></div>
          <div className="timeline reveal">
            <div className="event"><div className="event-time">4:00 PM</div><div><h3>Arrive &amp; exhale</h3><p>Welcome drinks, a little shade, and time to find your seat.</p></div></div>
            <div className="event"><div className="event-time">4:30 PM</div><div><h3>The ceremony</h3><p>Short, sweet, and hopefully only a little bit teary.</p></div></div>
            <div className="event"><div className="event-time">5:30 PM</div><div><h3>Drinks &amp; dinner</h3><p>Toasts, a long table, and the first of many dance-floor appearances.</p></div></div>
            <div className="event"><div className="event-time">9:30 PM</div><div><h3>One last song</h3><p>We’ll send you home with something sweet and very full hearts.</p></div></div>
          </div>
        </section>

        <section className="section mist" id="rsvp">
          <div className="rsvp-wrap reveal">
            <div className="rsvp-intro"><div className="eyebrow">Before we plan the table</div><h2>Will you join us?</h2><p>Please reply by 1 July 2027. Your invitation code is printed on your invitation.</p></div>
            <div className="rsvp-card">
              <form onSubmit={submit}>
                <label>Invitation code<input value={form.inviteCode} onChange={(e) => update("inviteCode", e.target.value)} required placeholder="ADRIAN-KC-01" autoCapitalize="characters" /></label>
                <div className="two"><label>First name<input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required autoComplete="given-name" placeholder="Adrian" /></label><label>Last name<input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required autoComplete="family-name" placeholder="KC" /></label></div>
                <label>Email address<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontSize: ".78rem", letterSpacing: ".05em", fontWeight: 700 }}>Your reply</legend><div className="radio-row"><label className="radio"><input type="radio" name="attendance" value="joyfully-accept" checked={form.attendance === "joyfully-accept"} onChange={(e) => update("attendance", e.target.value)} required /><span>Joyfully accept</span></label><label className="radio"><input type="radio" name="attendance" value="regretfully-decline" checked={form.attendance === "regretfully-decline"} onChange={(e) => update("attendance", e.target.value)} /><span>Regretfully decline</span></label></div></fieldset>
                <label>Number of guests<select value={form.guests} onChange={(e) => update("guests", e.target.value)}><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select></label>
                <label>Dietary notes <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span><textarea value={form.dietary} onChange={(e) => update("dietary", e.target.value)} placeholder="Vegetarian, allergies, or anything we should know" /></label>
                <label>Song request <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span><input value={form.song} onChange={(e) => update("song", e.target.value)} placeholder="The one that gets you dancing" /></label>
                <p className="form-note">Your invitation code keeps the RSVP private and helps us match your reply to the right household.</p>
                {status === "error" && <div className="error" role="alert">{message}</div>}
                <button className="button" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Saving RSVP…" : "Send RSVP →"}</button>
                {status === "success" && <div className="success show" role="status">{message}</div>}
              </form>
            </div>
          </div>
        </section>

        <section className="section paper" id="travel">
          <div className="section-head reveal"><div className="eyebrow">A few helpful things</div><h2>Make a weekend of it.</h2><p>For friends coming from near and far, here are three easy starting points.</p></div>
          <div className="travel reveal">
            <div className="travel-card"><div className="number">01</div><h3>Getting there</h3><p>The Glasshouse is a 15-minute taxi ride from the city centre. Ride-share drop-off is available at the main gate.</p></div>
            <div className="travel-card"><div className="number">02</div><h3>Where to stay</h3><p>We recommend choosing a hotel around Tiong Bahru or Robertson Quay for a relaxed mix of food, coffee, and river walks.</p></div>
            <div className="travel-card"><div className="number">03</div><h3>Questions?</h3><p>Send a note to <a href="mailto:hello@adrianandkc.example">hello@adrianandkc.example</a> and we’ll help however we can.</p></div>
          </div>
        </section>
      </main>
      <footer><h2>See you there.</h2><p>With love, Adrian &amp; KC</p></footer>
    </>
  );
}
