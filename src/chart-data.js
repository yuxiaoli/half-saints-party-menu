import { eventDays } from './site.js';
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const CATEGORIES = ['Dayclubs', 'Nightclubs', 'After Parties'];
export function summarize(events) {
  const dated = events.filter(event => /\d{1,2}\/\d{1,2}/.test(event.dateText || ''));
  return {
    total: events.length,
    dated: dated.length,
    recurring: events.length - dated.length,
    weekdays: DAYS.map(day => dated.filter(event => eventDays(event.dateText).includes(day)).length),
    categories: CATEGORIES.map(category => events.filter(event => event.section === category).length),
    venues: [...new Set(events.map(event => event.venue || 'Venue not specified'))].map(name => ({ name, count: events.filter(event => (event.venue || 'Venue not specified') === name).length })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  };
}
export function freshness(menu, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  if (!menu.weekEnding) return { warning: true, label: 'Menu date unknown', explanation: 'The source did not specify a menu week. Collection time does not establish event dates.' };
  if (today > menu.weekEnding) return { warning: true, label: 'Past menu week', explanation: 'This menu week has ended. Showing the last successful snapshot, not claiming these events are upcoming.' };
  return { warning: false, label: 'Current menu week', explanation: 'Weekly source snapshot. Listings are not live availability or a guarantee of entry.' };
}
