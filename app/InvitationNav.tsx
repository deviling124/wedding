"use client";

import { useEffect, useRef, useState } from "react";

const links = [["locations", "Map"], ["dresscode", "Dress code"], ["gifts", "Gift guide"], ["gallery", "Gallery"]];

export default function InvitationNav() {
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <nav className="nav" aria-label="Main navigation" ref={nav}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <a className="brand" href="#top" aria-label="Adrian and KC home" onClick={() => setOpen(false)}>
        <span className="brand-monogram"><img className="ak-monogram" src="/monogram.webp" alt="" width="360" height="240" /></span>
        <span className="brand-name">Adrian <i>&amp;</i> KC</span>
      </a>
      <button type="button" className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="section-links"
        onClick={() => setOpen(!open)}><span className="menu-lines" aria-hidden="true" />Menu</button>
      <div className={'nav-links' + (open ? ' is-open' : '')} id="section-links">
        {links.map(([id, label]) => <a key={id} href={'#' + id} onClick={() => setOpen(false)}>{label}</a>)}
      </div>
      <a className="nav-reply" href="#rsvp" onClick={() => setOpen(false)}>RSVP <span aria-hidden="true">↗</span></a>
    </nav>
  );
}

