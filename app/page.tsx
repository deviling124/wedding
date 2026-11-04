"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps, PointerEvent as ReactPointerEvent } from "react";
import EnvelopeCover from "./EnvelopeCover";
import InvitationNav from "./InvitationNav";
import ReplyForm from "./ReplyForm";

type DressRole = "Principal Sponsor" | "Secondary Sponsor" | "Guest";

type Countdown = { days: number; hours: number; minutes: number; seconds: number };

const WEDDING_DATE = "2027-01-30T14:00:00+08:00";
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
  };
}

function AKMonogram() {
  return <img className="ak-monogram" src="/monogram.webp" width="360" height="240" alt="Adrian and KC floral gold monogram" loading="eager" />;
}

type LoadedImageProps = ComponentProps<typeof Image>;

function LoadedImage({ className, onLoad, ...props }: LoadedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, [props.src]);

  return (
    <Image
      {...props}
      ref={imageRef}
      className={`${className ?? ""} image-load-state${loaded ? " is-loaded" : ""}`}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}

function MessengerIcon() {
  return (
    <svg className="messenger-icon-svg" viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M16 3C8.4 3 2.5 8.2 2.5 14.8c0 3.7 1.9 7 5 9.2v4.2l4.2-2.3c1.3.4 2.8.6 4.3.6 7.6 0 13.5-5.2 13.5-11.7S23.6 3 16 3Z" />
      <path fill="#0084ff" d="m8.5 18.4 5.1-5.5 2.7 2.4 5.1-2.7-5.2 5.6-2.7-2.4-5 2.6Z" />
    </svg>
  );
}

function GiftIllustration() {
  return (
    <Image
      className="gift-drawing"
      src="/gift-asset.png"
      alt=""
      width={1254}
      height={1254}
      sizes="(max-width: 760px) 270px, 360px"
    />
  );
}

const guestDressOptions = [
  {
    src: "/guest-dress-code.png",
    alt: "Guest attire: comfortable and elegant wedding attire in the wedding motif colors",
  },
  {
    src: "/guest-dress-code2.png",
    alt: "Guest attire option: casual T-shirts and pants in light and mocha tones",
    title: "Casual in wedding colors",
    copy: "Men: casual T-shirt and pants. Women: blouse and pants. Light, mocha, cappuccino, and champagne tones are welcome.",
  },
] as const;

const dressRoleImages: Record<Exclude<DressRole, "Guest">, { src: string; alt: string }> = {
  "Principal Sponsor": {
    src: "/principal-sponsor-dress-code.png",
    alt: "Principal sponsor dress code: long formal gown for ladies and traditional Barong Tagalog with black pants",
  },
  "Secondary Sponsor": {
    src: "/secondary-sponsor-dress-code.png",
    alt: "Secondary sponsor dress code: floor-length chocolate brown formal gown for ladies and chocolate brown formal suit for gentlemen",
  },
};

function DressCodeIllustration({ role, guestOptionIndex, onGuestOptionChange }: { role: DressRole; guestOptionIndex: number; onGuestOptionChange: (index: number) => void }) {
  const image = role === "Guest" ? guestDressOptions[guestOptionIndex] : dressRoleImages[role];
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    setLoaded(false);
    const imageElement = imageRef.current;
    if (imageElement?.complete && imageElement.naturalWidth > 0) setLoaded(true);
  }, [image.src]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swipeStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLImageElement>) => {
    if (swipeStartX.current === null) return;
    const distance = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(distance) < 45) return;
    const direction = distance < 0 ? 1 : -1;
    onGuestOptionChange((guestOptionIndex + direction + guestDressOptions.length) % guestDressOptions.length);
  };

  return (
    <div className="dress-slider">
      <img ref={imageRef} key={image.src} className={`dress-placeholder-image dress-poster-image image-load-state${loaded ? " is-loaded" : ""}${role === "Guest" ? " guest-swipe-image" : ""}`} src={image.src} alt={image.alt} loading="eager" draggable={false} onLoad={() => setLoaded(true)} onPointerDown={role === "Guest" ? handlePointerDown : undefined} onPointerUp={role === "Guest" ? handlePointerUp : undefined} onPointerCancel={() => { swipeStartX.current = null; }} />
      {role === "Guest" && (
        <div className="dress-slider-controls" aria-label="Guest dress code options">
          <button className="dress-slider-arrow" type="button" onClick={() => onGuestOptionChange((guestOptionIndex + guestDressOptions.length - 1) % guestDressOptions.length)} aria-label="Previous guest dress code option">‹</button>
          <div className="dress-slider-dots">
            {guestDressOptions.map((option, index) => (
              <button className={`dress-slider-dot${option.src === image.src ? " selected" : ""}`} type="button" key={option.src} aria-label={`Show guest dress code option ${index + 1}`} aria-pressed={option.src === image.src} onClick={() => onGuestOptionChange(index)} />
            ))}
          </div>
          <button className="dress-slider-arrow" type="button" onClick={() => onGuestOptionChange((guestOptionIndex + 1) % guestDressOptions.length)} aria-label="Next guest dress code option">›</button>
        </div>
      )}
    </div>
  );
}

type GalleryItem = { number: string; imageSrc: string };

const galleryItems: GalleryItem[] = [
  { number: "1", imageSrc: "/gallery-placeholder.png" },
  { number: "2", imageSrc: "/gallery-placeholder.png" },
  { number: "3", imageSrc: "/gallery-placeholder.png" },
  { number: "4", imageSrc: "/gallery-placeholder.png" },
  { number: "5", imageSrc: "/gallery-placeholder.png" },
  { number: "6", imageSrc: "/gallery-placeholder.png" },
];

function GalleryTile({ number, imageSrc, onOpen }: GalleryItem & { onOpen: () => void }) {
  return (
    <article className="gallery-frame">
      <button className="gallery-button" type="button" onClick={onOpen} aria-label={`Open couple photo ${number}`}>
        <LoadedImage className="gallery-image" src={imageSrc} alt="A placeholder photo of Adrian and KC" fill sizes="(max-width: 760px) 50vw, 33vw" />
      </button>
    </article>
  );
}

function WeddingCountdown() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  useEffect(() => {
    setCountdown(getCountdown());
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="countdown" role="timer" aria-live="off" aria-label="Countdown to the wedding">
      <div className="countdown-intro">Counting down to our day</div>
      <div className="countdown-grid">
        {countdown ? (["days", "hours", "minutes", "seconds"] as const).map(unit => (
          <div key={unit}>
            <strong>{unit === "days" ? countdown.days : String(countdown[unit]).padStart(2, "0")}</strong>
            <span>{unit}</span>
          </div>
        )) : <div className="countdown-loading">Preparing the countdown…</div>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const heroTitle = useRef<HTMLHeadingElement>(null);
  const [dressRole, setDressRole] = useState<DressRole>("Guest");
  const [guestDressIndex, setGuestDressIndex] = useState(0);
  const [activeGallery, setActiveGallery] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01 },
    );

    reveals.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (showEnvelope || activeGallery) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showEnvelope, activeGallery]);

  useEffect(() => {
    if (!activeGallery) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveGallery(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeGallery]);

  useEffect(() => {
    if (!showEnvelope) {
      const hash = window.location.hash.slice(1);
      const destination = hash ? document.getElementById(hash) : null;
      if (destination) {
        destination.focus({ preventScroll: true });
        destination.scrollIntoView({ behavior: "instant" });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        heroTitle.current?.focus({ preventScroll: true });
      }
    }
  }, [showEnvelope]);
  useEffect(() => {
    if (!envelopeOpening) return;
    const timer = window.setTimeout(() => setShowEnvelope(false), 1700);
    return () => window.clearTimeout(timer);
  }, [envelopeOpening]);

  function openInvitation() {
    if (envelopeOpening) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowEnvelope(false);
      return;
    }
    setEnvelopeOpening(true);
  }

  return (
    <>
      {showEnvelope && (
        <EnvelopeCover opening={envelopeOpening} onOpen={openInvitation} />
      )}
      <div className="invitation" inert={showEnvelope || Boolean(activeGallery)}>
      <a className="skip-link" href="#top">Skip to invitation</a>
      <InvitationNav />
      <main id="top" tabIndex={-1}>
        <section className={'hero' + (showEnvelope ? '' : ' is-open')} aria-labelledby="names">
          <div className="hero-botanicals" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-seal"><AKMonogram /></div>
            <div className="eyebrow ruled">Together with our families</div>
            <h1 id="names" tabIndex={-1} ref={heroTitle}>Adrian <span className="amp">&amp;</span> KC</h1>
            <div className="hero-details">
              <time className="hero-date" dateTime="2027-01-30">Saturday, January 30, 2027</time>
              <a className="hero-venue" href="#locations">Immaculate Conception Parish Church<br />Bauan, Batangas · 2:00 PM</a>
            </div>
            <p className="hero-note">We’re getting married, and it would mean the world to have you with us for the weekend.</p>
            <a className="button" href="#rsvp">Reply to the invitation <span aria-hidden="true">→</span></a>
          </div>
        </section>
        <WeddingCountdown />

        <section className="section paper">
          <div className="section-head reveal"><div className="eyebrow">The shape of the day</div><h2>From ceremony to celebration.</h2></div>
          <div className="timeline reveal">
            <div className="event"><div className="event-time">1:30 PM</div><div><h3>Arrive &amp; exhale</h3><p>Arrive at Immaculate Conception Parish Church and find your seat before the ceremony.</p></div></div>
            <div className="event"><div className="event-time">2:00 PM</div><div><h3>The ceremony</h3><p>Short, sweet, and hopefully only a little bit teary.</p></div></div>
            <div className="event"><div className="event-time">After ceremony</div><div><h3>Celebrate together</h3><p>We’ll continue the celebration at Pramea Grand Pavilion.</p></div></div>
            <div className="event"><div className="event-time">Evening</div><div><h3>Dinner &amp; toasts</h3><p>Toasts, dinner, and an evening together.</p></div></div>
          </div>
        </section>

        <section className="section paper" id="locations" tabIndex={-1}>
          <div className="section-head reveal"><div className="eyebrow">Find your way</div><h2>Meet us here.</h2><p>Save these two locations for the day. Each link opens directions in Google Maps.</p></div>
          <div className="location-grid reveal">
            <article className="location-card">
              <div className="location-photo"><LoadedImage src="/immaculate-church.png" alt="Immaculate Conception Parish Church" fill sizes="(max-width: 760px) 100vw, 50vw" /></div>
              <div className="location-card-content">
                <div className="location-number">01</div>
                <div className="eyebrow">Ceremony · 2:00 PM</div>
                <h3>Immaculate Conception Parish Church</h3>
                <p>Bauan, Batangas</p>
                <a className="button secondary" href={CEREMONY_MAP_URL} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a>
              </div>
            </article>
            <article className="location-card">
              <div className="location-photo"><LoadedImage src="/grand-pramea.jpg" alt="Pramea Grand Pavilion reception venue exterior" fill sizes="(max-width: 760px) 100vw, 50vw" /></div>
              <div className="location-card-content">
                <div className="location-number">02</div>
                <div className="eyebrow">Reception · After the ceremony</div>
                <h3>Pramea Grand Pavilion</h3>
                <p>Bauan, Batangas</p>
                <a className="button secondary" href={RECEPTION_MAP_URL} target="_blank" rel="noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a>
              </div>
            </article>
          </div>
        </section>

        <section className="section mist" id="dresscode" tabIndex={-1}>
          <div className="section-head reveal"><div className="eyebrow">What to wear</div><h2>Dress for the celebration.</h2><p>A polished look for an elegant indoor reception in the warm tones of our day.</p></div>
          <div className="dress-card reveal">
            <div className="dress-art"><DressCodeIllustration role={dressRole} guestOptionIndex={guestDressIndex} onGuestOptionChange={setGuestDressIndex} /></div>
            <div className="dress-copy">
              <div className="dress-value">Reception attire</div>
              <p>Think tailored, comfortable, and elegant enough for dinner and conversation.</p>
              <div className="dress-role-options" role="group" aria-label="Dress code by role">
                {(["Principal Sponsor", "Secondary Sponsor", "Guest"] as DressRole[]).map((role) => (
                  <button className={`dress-role${dressRole === role ? " selected" : ""}`} type="button" key={role} onClick={() => setDressRole(role)} aria-pressed={dressRole === role}>
                    {role}
                  </button>
                ))}
              </div>
              <div className="dress-palette" aria-label="Suggested colour palette">
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#62473b" }} /><span>Chocolate</span></div>
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#8b7061" }} /><span>Mocha</span></div>
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#b69b89" }} /><span>Cappuccino</span></div>
                <div className="dress-swatch"><span className="dress-swatch-dot" style={{ background: "#d8c5a9" }} /><span>Champagne</span></div>
              </div>
              <div className="dress-notes">
                <p className="dress-gentle-note"><strong>A gentle note</strong><span>Please leave white and ivory for the couple.</span></p>
              </div>
            </div>
          </div>
        </section>

        <section className="section paper" id="gallery" tabIndex={-1}>
          <div className="section-head reveal"><div className="eyebrow">The two of us</div><h2>A little more us.</h2><p>A few photos of the two of us, from the everyday moments to the ones we’ll always remember.</p></div>
          <div className="gallery-grid reveal">
            {galleryItems.map((gallery) => <GalleryTile key={gallery.number} {...gallery} onOpen={() => setActiveGallery(gallery)} />)}
          </div>
        </section>

        <section className="section mist gift-guide-section" id="gifts" tabIndex={-1}>
          <div className="gift-guide-layout reveal">
            <div className="section-head gift-guide-head">
              <div className="eyebrow">A little note from us</div>
              <h2>Gift guide.</h2>
              <p>Your presence is the greatest gift, but should you wish to contribute, a monetary gift will help us build our future together.</p>
            </div>
            <div className="gift-guide-art"><GiftIllustration /></div>
          </div>
        </section>

        <section className="section paper" id="rsvp" tabIndex={-1}>
          <div className="rsvp-wrap reveal">
            <div className="rsvp-intro"><div className="eyebrow">Before we plan the table</div><h2>Will you join us?</h2><p>Please reply by December 31, 2026. We’re looking forward to celebrating with you.</p></div>
            <div className="rsvp-card">
              <ReplyForm />
            </div>
          </div>
        </section>

        <section className="section mist contact-section" id="contact" tabIndex={-1}>
          <div className="contact-panel reveal">
            <div className="contact-copy"><div className="eyebrow">Questions?</div><h2>We’re here to help.</h2><p>Send us a message anytime. We’ll be happy to help with anything about the day.</p></div>
            <div className="messenger-links" aria-label="Contact us on Messenger">
              <a className="messenger-card" href="http://m.me/john.adrian124" target="_blank" rel="noreferrer"><span className="messenger-icon"><MessengerIcon /></span><span className="messenger-card-copy"><small>Message</small><strong>Adrian</strong></span><span className="messenger-arrow" aria-hidden="true">↗</span></a>
              <a className="messenger-card" href="http://m.me/yzakath" target="_blank" rel="noreferrer"><span className="messenger-icon"><MessengerIcon /></span><span className="messenger-card-copy"><small>Message</small><strong>KC</strong></span><span className="messenger-arrow" aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

      </main>
      <footer><h2>See you there.</h2><p>With love, Adrian &amp; KC</p></footer>
      </div>
      {activeGallery && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Couple photo preview" onClick={(event) => { if (event.target === event.currentTarget) setActiveGallery(null); }}>
          <div className="gallery-lightbox-card">
            <button className="gallery-lightbox-close" type="button" autoFocus onClick={() => setActiveGallery(null)} aria-label="Close photo preview">
              Close <span aria-hidden="true">×</span>
            </button>
            <div className="gallery-lightbox-media">
              <LoadedImage src={activeGallery.imageSrc} alt="A placeholder photo of Adrian and KC" fill sizes="(max-width: 760px) 92vw, 860px" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
