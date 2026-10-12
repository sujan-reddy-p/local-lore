const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" });
const clockFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

export function bayAreaDate(date) {
  return dayFormatter.format(date);
}

/** Return an instant only when the sourced local clock is unambiguous and exists. */
export function bayAreaInstant(date, clock) {
  const naive = Date.parse(`${date}T${clock}:00Z`);
  if (!Number.isFinite(naive)) return null;
  const offsets = new Set();
  for (const delta of [-43_200_000, 43_200_000]) {
    const instant = naive + delta;
    const parts = Object.fromEntries(clockFormatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]));
    offsets.add(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)) - instant);
  }
  const matches = [];
  for (const offset of offsets) {
    const instant = new Date(naive - offset);
    const parts = Object.fromEntries(clockFormatter.formatToParts(instant).map(({ type, value }) => [type, value]));
    if (`${parts.year}-${parts.month}-${parts.day}` === date && `${parts.hour}:${parts.minute}` === clock) matches.push(instant.toISOString());
  }
  return matches.length === 1 ? matches[0] : null;
}
