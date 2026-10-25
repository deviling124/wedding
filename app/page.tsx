"use client";

import { FormEvent, useEffect, useState } from "react";

type FormState = {
  fullName: string;
  attendance: "joyfully-accept" | "regretfully-decline" | "";
  guests: string;
};

type DressRole = "Primary Sponsor" | "Secondary Sponsor" | "Guest";

const dressGuides: Record<DressRole, { title: string; copy: string }> = {
  "Primary Sponsor": {
    title: "Polished formal",
    copy: "Deep chocolate, espresso, or warm neutrals with a tailored silhouette. A jacket, dress, or elegant set will feel right for the ceremony.",
  },
  "Secondary Sponsor": {
    title: "Soft formal",
    copy: "Choose refined tailoring, a flowing dress, or a coordinated set in mocha, cappuccino, champagne, or another warm earthy tone.",
  },
  Guest: {
    title: "Garden formal",
    copy: "Think romantic, comfortable, and polished: colour, linen, soft tailoring, and dancing shoes encouraged.",
  },
};

type Countdown = { days: number; hours: number; minutes: number; seconds: number; complete: boolean };

const WEDDING_DATE = "2027-01-30T16:30:00+08:00";
const CEREMONY_MAP_URL = "https://www.google.com/maps/search/?api=1&query=Immaculate+Conception+Parish+Church%2C+Bauan%2C+Batangas";
const RECEPTION_MAP_URL = "https://www.google.com/maps/search/?api=1&query=Pramea+Grand+Pavilion%2C+Bauan%2C+Batangas";

function getCountdown(): Countdown {
  const remaining = Math.max(0, Date.parse(WEDDING_DATE) - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    complete: remaining === 0,
  };
}

const initialState: FormState = {
  fullName: "",
  attendance: "",
  guests: "1",
};

function AKMonogram() {
  return <img className="ak-monogram" src="/monogramAK.png" alt="Adrian and KC floral gold monogram" loading="eager" />;
}

function DressCodeIllustration() {
  return (
    <svg className="dress-illustration-svg" viewBox="0 0 260 260" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M58 62 78 46l18 16-8 14 7 132H42l7-132-8-14Z" />
      <path d="M78 46v45L58 62M78 91l18-29M65 112h26M65 133h26M65 154h26" />
      <circle cx="78" cy="120" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="78" cy="141" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="78" cy="162" r="2.2" fill="currentColor" stroke="none" />
      <path className="dress-gold" d="M174 46c-9 0-15 7-15 17 0 10 6 16 6 28-13 19-23 58-28 101h74c-5-43-15-82-28-101 0-12 6-18 6-28 0-10-6-17-15-17Z" />
      <path className="dress-gold" d="M165 91c5 7 13 7 18 0M137 192c22 5 52 5 74 0" />
      <path className="dress-line-soft" d="M26 214h208M26 214c7-5 13-8 20-8M234 214c-7-5-13-8-20-8" />
    </svg>
  );
}

function GalleryTile({ number, label, title, tone }: { number: string; label: string; title: string; tone: string }) {
  return (
    <article className={`gallery-frame ${tone}`}>
      <div className="gallery-frame-top"><span>0{number}</span><span className="gallery-glyph" aria-hidden="true">✦</span></div>
      <div className="gallery-caption"><div>{label}</div><h3>{title}</h3></div>
    </article>
  );
}

export default function HomePage() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [dressRole, setDressRole] = useState<DressRole>("Guest");

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

  useEffect(() => {
    setCountdown(getCountdown());
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
        <a className="brand" href="#top" aria-label="Adrian and KC home"><span className="brand-monogram"><AKMonogram /></span></a>
        <div className="nav-links"><a href="#details">Details</a><a href="#locations">Map</a><a href="#dresscode">Dress code</a><a href="#gallery">Gallery</a><a href="#rsvp">RSVP</a><a href="#travel">Travel</a></div>
      </nav>
      <main id="top">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-seal"><AKMonogram /></div>
            <div className="eyebrow">Together with our families</div>
            <h1>Adrian <span className="amp">&amp;</span> KC</h1>
            <div className="hero-date">Saturday, January 30, 2027</div>
            <div className="countdown" aria-live="polite" aria-label="Countdown to the wedding">
              <div className="countdown-intro">Counting down to our day</div>
              <div className="countdown-grid">
                {countdown ? <><div><strong>{countdown.days}</strong><span>Days</span></div><div><strong>{String(countdown.hours).padStart(2, "0")}</strong><span>Hours</span></div><div><strong>{String(countdown.minutes).padStart(2, "0")}</strong><span>Minutes</span></div><div><strong>{String(countdown.seconds).padStart(2, "0")}</strong><span>Seconds</span></div></> : <div className="countdown-loading">Preparing the countdown…</div>}
              </div>
            </div>
            <p className="hero-note">We’re getting married, and it would mean the world to have you with us for the weekend.</p>
            <a className="button" href="#rsvp">Reply to the invitation <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="section mist" id="details">
          <div className="section-head reveal"><div className="eyebrow">The weekend at a glance</div><h2>Come as you are.</h2><p>One beautiful evening, a long table under the lights, and plenty of time to catch up.</p></div>
          <div className="facts reveal">
            <div className="fact"><div className="label">When</div><strong>January 30, 2027</strong><p>Ceremony begins at 2:00 PM</p></div>
            <div className="fact"><div className="label">Ceremony</div><strong>Immaculate Conception Parish Church</strong><p>Bauan, Batangas · <a className="text-link" href={CEREMONY_MAP_URL} target="_blank" rel="noreferrer">Map ↗</a></p></div>
            <div className="fact"><div className="label">Reception</div><strong>Pramea Grand Pavilion</strong><p>Following the ceremony · <a className="text-link" href={RECEPTION_MAP_URL} target="_blank" rel="noreferrer">Map ↗</a></p></div>
            <div className="fact"><div className="label">Dress</div><strong>Garden formal</strong><p>Colour, linen, and dancing shoes encouraged</p></div>
          </div>
        </section>

        <section className="section paper">
          <div className="section-head reveal"><div className="eyebrow">The shape of the day</div><h2>Meet us under the trees.</h2></div>
          <div className="timeline reveal">
            <div className="event"><div className="event-time">1:30 PM</div><div><h3>Arrive &amp; exhale</h3><p>Arrive at Immaculate Conception Parish Church and find your seat before the ceremony.</p></div></div>
            <div className="event"><div className="event-time">2:00 PM</div><div><h3>The ceremony</h3><p>Short, sweet, and hopefully only a little bit teary.</p></div></div>
            <div className="event"><div className="event-time">After ceremony</div><div><h3>Celebrate together</h3><p>We’ll continue the celebration at Pramea Grand Pavilion.</p></div></div>
            <div className="event"><div className="event-time">Evening</div><div><h3>Dinner &amp; dancing</h3><p>Toasts, a long table, and the first of many dance-floor appearances.</p></div></div>
          </div>
        </section>

        <section className="section paper" id="locations">
          <div className="section-head reveal"><div className="eyebrow">Find your way</div><h2>Meet us here.</h2><p>Save these two locations for the day. Each link opens directions in Google Maps.</p></div>
          <div className="location-grid reveal">
            <article className="location-card">
              <div className="location-number">01</div>
              <div className="eyebrow">Ceremony · 2:00 PM</div>
              <h3>Immaculate Conception Parish Church</h3>
              <p>Bauan, Batangas</p>
              <a className="button secondary" href={CEREMONY_MAP_URL} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a>
            </article>
            <article className="location-card">
              <div className="location-number">02</div>
              <div className="eyebrow">Reception · After the ceremony</div>
              <h3>Pramea Grand Pavilion</h3>
              <p>Bauan, Batangas</p>
              <a className="button secondary" href={RECEPTION_MAP_URL} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a>
            </article>
          </div>
        </section>

        <section className="section mist" id="dresscode">
          <div className="section-head reveal"><div className="eyebrow">What to wear</div><h2>Dress with ease.</h2><p>A polished garden-formal look in the warm tones of our day.</p></div>
          <div className="dress-card reveal">
            <div className="dress-art"><DressCodeIllustration /></div>
            <div className="dress-copy">
              <div className="dress-value">Garden formal</div>
              <p>Think tailored, romantic, and comfortable enough for dinner, dancing, and a little wandering under the trees.</p>
              <div className="dress-role-options" role="group" aria-label="Dress code by role">
                {(Object.keys(dressGuides) as DressRole[]).map((role) => (
                  <button className={`dress-role${dressRole === role ? " selected" : ""}`} type="button" key={role} onClick={() => setDressRole(role)} aria-pressed={dressRole === role}>
                    {role}
                  </button>
                ))}
              </div>
              <div className="dress-role-guide" aria-live="polite">
                <div className="dress-role-label">For {dressRole}</div>
                <strong>{dressGuides[dressRole].title}</strong>
                <p>{dressGuides[dressRole].copy}</p>
              </div>
              <div className="dress-palette" aria-label="Suggested colour palette">
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#46352e" }} /><span>Espresso</span></div>
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#62473b" }} /><span>Chocolate</span></div>
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#8b7061" }} /><span>Mocha</span></div>
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#b69b89" }} /><span>Cappuccino</span></div>
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#d8c5a9" }} /><span>Champagne</span></div>
              </div>
              <div className="dress-notes"><p><strong>For everyone:</strong> Colour, linen, soft tailoring, and dancing shoes encouraged.</p><p><strong>A gentle note:</strong> Please leave white and ivory for the couple.</p></div>
            </div>
          </div>
        </section>

        <section className="section paper" id="gallery">
          <div className="section-head reveal"><div className="eyebrow">A few favorite details</div><h2>Before the big day.</h2><p>A little visual moodboard for the colour, light, and feeling we’re bringing to the weekend.</p></div>
          <div className="gallery-grid reveal">
            <GalleryTile number="1" label="The palette" title="Chocolate &amp; champagne" tone="gallery-chocolate" />
            <GalleryTile number="2" label="The setting" title="Under the trees" tone="gallery-cappuccino" />
            <GalleryTile number="3" label="The table" title="Long, warm evenings" tone="gallery-mocha" />
            <GalleryTile number="4" label="The feeling" title="A little bit of forever" tone="gallery-champagne" />
            <GalleryTile number="5" label="The details" title="Soft light &amp; gold" tone="gallery-espresso" />
            <GalleryTile number="6" label="The dance floor" title="One last song" tone="gallery-sand" />
          </div>
        </section>

        <section className="section mist" id="rsvp">
          <div className="rsvp-wrap reveal">
            <div className="rsvp-intro"><div className="eyebrow">Before we plan the table</div><h2>Will you join us?</h2><p>Please reply by 1 July 2027. We’re looking forward to celebrating with you.</p></div>
            <div className="rsvp-card">
              <form onSubmit={submit}>
                <label>Full name<input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required autoComplete="name" placeholder="Adrian Castillo" /></label>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontSize: ".78rem", letterSpacing: ".05em", fontWeight: 700 }}>Your reply</legend><div className="radio-row"><label className="radio"><input type="radio" name="attendance" value="joyfully-accept" checked={form.attendance === "joyfully-accept"} onChange={(e) => update("attendance", e.target.value)} required /><span>Joyfully accept</span></label><label className="radio"><input type="radio" name="attendance" value="regretfully-decline" checked={form.attendance === "regretfully-decline"} onChange={(e) => update("attendance", e.target.value)} /><span>Regretfully decline</span></label></div></fieldset>
                <label>Number of guests<select value={form.guests} onChange={(e) => update("guests", e.target.value)}><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select></label>
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
            <div className="travel-card"><div className="number">01</div><h3>Getting there</h3><p>Please arrive at Immaculate Conception Parish Church before 2:00 PM. The reception follows at Pramea Grand Pavilion.</p></div>
            <div className="travel-card"><div className="number">02</div><h3>Where to stay</h3><p>For guests traveling in, we’ll share nearby accommodation suggestions for Bauan and Batangas soon.</p></div>
            <div className="travel-card"><div className="number">03</div><h3>Questions?</h3><p>Send a note to <a href="mailto:hello@adrianandkc.example">hello@adrianandkc.example</a> and we’ll help however we can.</p></div>
          </div>
        </section>
      </main>
      <footer><h2>See you there.</h2><p>With love, Adrian &amp; KC</p></footer>
    </>
  );
}

