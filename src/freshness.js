export function freshness(weekEnding, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  if (!weekEnding) return { warning: true, label: 'Menu date unknown', explanation: 'The source did not specify a menu week. Collection time does not establish event dates.' };
  if (today > weekEnding) return { warning: true, label: 'Past menu week', explanation: 'This menu week has ended. Showing the last successful snapshot, not claiming these events are upcoming.' };
  return { warning: false, label: 'Current menu week', explanation: 'Weekly source snapshot. Listings are not live availability or a guarantee of entry.' };
}
