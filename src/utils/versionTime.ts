/**
 * When a version was made, as shown next to its length: "Oct 12, 2026, 10:58".
 *
 * Every version carries the moment it was made (generatedAt). It is shown in
 * the local time of whoever looks at it: on the result screen the viewer's,
 * in an exported report the time of whoever exported it, written into the
 * file. 24-hour clock, so no "AM" or "PM" is needed.
 */
export function formatVersionTime(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  } catch {
    return '';
  }
}

/** The time zone those times are in: "America/Mexico City (UTC−06:00)". For the report, which may be read elsewhere. */
export function localTimeZoneLabel(date: Date = new Date()): string {
  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    zone = '';
  }
  const minutes = -date.getTimezoneOffset();
  const abs = Math.abs(minutes);
  const offset = `UTC${minutes >= 0 ? '+' : '−'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return zone ? `${zone.replace(/_/g, ' ')} (${offset})` : offset;
}
