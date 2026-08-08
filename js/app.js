/* ============================================================
   Site logic. Reads content from WEDDING (js/config.js) and
   talks to /api/rsvp for saving and reading responses.
   No need to edit this file to personalize the site.
   ============================================================ */

document.getElementById('heroEyebrow').textContent = "Together with their families";
document.getElementById('heroNames').innerHTML = WEDDING.partnerOne + '<span class="amp">&amp;</span>' + WEDDING.partnerTwo;
document.getElementById('heroDate').textContent = WEDDING.eventDate + " · " + WEDDING.venueName;
document.getElementById('footerNames').textContent = WEDDING.partnerOne + " & " + WEDDING.partnerTwo;
document.getElementById('footerDate').textContent = WEDDING.eventDate;

document.getElementById('detDate').textContent = WEDDING.eventDate;
document.getElementById('detTime').textContent = WEDDING.ceremonyTime;
document.getElementById('detVenue').textContent = WEDDING.venueName;
document.getElementById('detAddress').textContent = WEDDING.venueAddress;
document.getElementById('detDress').textContent = WEDDING.dressCode;
document.getElementById('detNote').textContent = WEDDING.note;
document.getElementById('rsvpDeadline').textContent = WEDDING.rsvpDeadline;
document.getElementById('mapLink').href = WEDDING.mapsUrl;

function buildICS(){
  const d = WEDDING.eventDateISO.replace(/-/g,'');
  const s = WEDDING.eventStartTime.replace(':','');
  const e = WEDDING.eventEndTime.replace(':','');
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT",
    "SUMMARY:" + WEDDING.partnerOne + " & " + WEDDING.partnerTwo + "'s Wedding",
    "DTSTART:" + d + "T" + s + "00",
    "DTEND:" + d + "T" + e + "00",
    "LOCATION:" + WEDDING.venueName + ", " + WEDDING.venueAddress,
    "DESCRIPTION:" + WEDDING.ceremonyTime,
    "END:VEVENT","END:VCALENDAR"
  ].join("\\n");
  return "data:text/calendar;charset=utf8," + encodeURIComponent(ics);
}
document.getElementById('calendarLink').href = buildICS();
document.getElementById('calendarLink').setAttribute('download','wedding-invite.ics');

const travelGrid = document.getElementById('travelGrid');
WEDDING.hotels.forEach(h=>{
  const c = document.createElement('div');
  c.className='travel-card';
  c.innerHTML = `<h3>${h.name}</h3><p>${h.detail}</p><a href="${h.link}" target="_blank" rel="noopener">View hotel &rarr;</a>`;
  travelGrid.appendChild(c);
});
const tn = document.createElement('div');
tn.className='travel-card';
tn.innerHTML = `<h3>${WEDDING.travelNote.name}</h3><p>${WEDDING.travelNote.detail}</p>`;
travelGrid.appendChild(tn);

const regRow = document.getElementById('registryRow');
WEDDING.registry.forEach(r=>{
  const a = document.createElement('a');
  a.className='registry-pill';
  a.href=r.link; a.target='_blank'; a.rel='noopener';
  a.innerHTML = `<div class="store serif">${r.store}</div><div class="note">${r.note}</div>`;
  regRow.appendChild(a);
});

const galGrid = document.getElementById('galleryGrid');
const leafSVG = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3"><path d="M12 21s-8-5.5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5.5-8 11-8 11z"/></svg>';
WEDDING.gallery.forEach(url=>{
  const f = document.createElement('div');
  if(url){
    f.className='gallery-frame';
    f.innerHTML = `<img src="${url}" alt="Wedding photo">`;
  } else {
    f.className='gallery-frame placeholder';
    f.innerHTML = leafSVG;
  }
  galGrid.appendChild(f);
});

const vine = document.getElementById('vineTrack');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting) vine.classList.add('revealed'); });
},{threshold:0.05});
io.observe(document.body);

// ---------- RSVP form ----------
const attendingInput = document.getElementById('fAttending');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const partyField = document.getElementById('partyField');

btnYes.addEventListener('click', ()=>{
  attendingInput.value='yes';
  btnYes.classList.add('active-yes'); btnNo.classList.remove('active-no');
  partyField.classList.add('open');
});
btnNo.addEventListener('click', ()=>{
  attendingInput.value='no';
  btnNo.classList.add('active-no'); btnYes.classList.remove('active-yes');
  partyField.classList.remove('open');
});

const form = document.getElementById('rsvpForm');
const formError = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  formError.style.display='none';

  // Honeypot: real guests never fill this hidden field. If it's
  // filled, a bot did it — silently pretend to succeed.
  if(document.getElementById('fWebsite').value.trim() !== ''){
    form.style.display='none';
    document.getElementById('confirmText').textContent = "Thank you!";
    document.getElementById('confirmBox').style.display='block';
    return;
  }

  const name = document.getElementById('fName').value.trim();
  const email = document.getElementById('fEmail').value.trim();
  const attending = attendingInput.value;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if(!name || !email){
    formError.textContent = "Please fill in your name and email.";
    formError.style.display='block';
    return;
  }
  if(!emailPattern.test(email)){
    formError.textContent = "That email address doesn't look right.";
    formError.style.display='block';
    return;
  }
  if(!attending){
    formError.textContent = "Let us know if you'll be joining us.";
    formError.style.display='block';
    return;
  }

  const payload = {
    name,
    attending,
    party: attending==='yes' ? (parseInt(document.getElementById('fParty').value)||1) : 0,
    dietary: document.getElementById('fDietary').value.trim(),
    email,
    message: document.getElementById('fMessage').value.trim()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try{
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      const body = await res.json().catch(()=>({}));
      throw new Error(body.error || 'Request failed');
    }

    form.style.display='none';
    document.getElementById('confirmText').textContent = attending==='yes'
      ? "We can't wait to celebrate with you, " + name.split(' ')[0] + "!"
      : "Thank you for letting us know — you'll be missed.";
    document.getElementById('confirmBox').style.display='block';
  }catch(err){
    formError.textContent = "Something went wrong sending your RSVP. Please try again.";
    formError.style.display='block';
    submitBtn.disabled = false;
    submitBtn.textContent = "Send RSVP";
  }
});

// ---------- Dashboard ----------
const dashOverlay = document.getElementById('dashOverlay');
document.getElementById('openDash').addEventListener('click', async ()=>{
  const pass = prompt("Dashboard passcode:");
  if(pass === null) return;
  dashOverlay.style.display='flex';
  await loadDashboard(pass);
});
document.getElementById('closeDash').addEventListener('click', ()=> dashOverlay.style.display='none');

async function loadDashboard(passcode){
  const wrap = document.getElementById('dashTableWrap');
  const statsWrap = document.getElementById('dashStats');
  wrap.innerHTML = '<div class="dash-empty">Loading responses…</div>';
  try{
    const res = await fetch('/api/rsvp', { headers: { 'x-passcode': passcode } });
    if(res.status === 401){
      wrap.innerHTML = '<div class="dash-empty">Wrong passcode.</div>';
      statsWrap.innerHTML = '';
      return;
    }
    if(res.status === 429){
      wrap.innerHTML = '<div class="dash-empty">Too many attempts — wait a minute and try again.</div>';
      statsWrap.innerHTML = '';
      return;
    }
    const data = await res.json();
    const entries = data.rsvps || [];

    if(entries.length===0){
      statsWrap.innerHTML='';
      wrap.innerHTML = '<div class="dash-empty">No replies yet — check back once invitations go out.</div>';
      return;
    }

    const attendingCount = entries.filter(e=>e.attending==='yes').length;
    const declineCount = entries.filter(e=>e.attending==='no').length;
    const totalGuests = entries.filter(e=>e.attending==='yes').reduce((s,e)=> s + (e.party||1), 0);

    statsWrap.innerHTML = `
      <div class="dash-stat"><div class="n serif">${entries.length}</div><div class="l">Replies</div></div>
      <div class="dash-stat"><div class="n serif">${attendingCount}</div><div class="l">Attending</div></div>
      <div class="dash-stat"><div class="n serif">${totalGuests}</div><div class="l">Total guests</div></div>
      <div class="dash-stat"><div class="n serif">${declineCount}</div><div class="l">Declined</div></div>
    `;

    let rows = entries.map(e=>`
      <tr>
        <td>${escapeHtml(e.name)}</td>
        <td>${e.attending==='yes' ? 'Attending' : 'Declined'}</td>
        <td>${e.attending==='yes' ? e.party : '—'}</td>
        <td>${escapeHtml(e.dietary||'—')}</td>
        <td>${escapeHtml(e.email)}</td>
        <td>${escapeHtml(e.message||'—')}</td>
      </tr>`).join('');

    wrap.innerHTML = `
      <table class="dash-table">
        <thead><tr><th>Name</th><th>Status</th><th>Party</th><th>Dietary</th><th>Email</th><th>Message</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }catch(err){
    wrap.innerHTML = '<div class="dash-empty">Could not load responses. Try again in a moment.</div>';
  }
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str||'';
  return d.innerHTML;
}
