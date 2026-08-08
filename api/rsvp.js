const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Very simple in-memory rate limit for dashboard login attempts.
// Resets whenever the serverless function cold-starts, so it's a
// speed bump against casual guessing, not a hard guarantee — see
// README.md for a stronger option (Upstash/Vercel KV) if you want one.
const attempts = new Map();
function rateLimited(ip){
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 5;
  const rec = attempts.get(ip) || { count: 0, start: now };
  if (now - rec.start > windowMs) { rec.count = 0; rec.start = now; }
  rec.count += 1;
  attempts.set(ip, rec);
  return rec.count > max;
}

module.exports = async function handler(req, res) {
  // Save a new RSVP
  if (req.method === 'POST') {
    const { name, attending, party, dietary, email, message, fWebsite } = req.body || {};

    // Honeypot — bots that fill every field trip this. Pretend success.
    if (fWebsite && String(fWebsite).trim() !== '') {
      return res.status(200).json({ success: true });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Please enter a name.' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (attending !== 'yes' && attending !== 'no') {
      return res.status(400).json({ error: 'Please indicate whether you can attend.' });
    }

    const { error } = await supabase.from('rsvps').insert([{
      name: name.trim().slice(0, 200),
      attending,
      party: attending === 'yes' ? Math.max(1, Math.min(10, parseInt(party) || 1)) : 0,
      dietary: dietary ? String(dietary).trim().slice(0, 300) : null,
      email: email.trim().slice(0, 200),
      message: message ? String(message).trim().slice(0, 1000) : null
    }]);

    if (error) return res.status(500).json({ error: 'Could not save your RSVP. Please try again.' });
    return res.status(200).json({ success: true });
  }

  // Read all RSVPs (for the couple's dashboard) — requires passcode
  if (req.method === 'GET') {
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    if (rateLimited(ip)) {
      return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
    }

    const passcode = req.headers['x-passcode'];
    if (!process.env.DASHBOARD_PASSCODE || passcode !== process.env.DASHBOARD_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Could not load responses.' });
    return res.status(200).json({ rsvps: data });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end('Method not allowed');
};
