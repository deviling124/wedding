// The RSVP deadline ends at midnight Singapore time after December 31, 2026.
export const RSVP_DEADLINE_ISO = "2027-01-01T00:00:00+08:00";
export const RSVP_DEADLINE_LABEL = "December 31, 2026";

export function isRsvpClosed() {
  return Date.now() >= Date.parse(RSVP_DEADLINE_ISO);
}

