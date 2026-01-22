const keyForUser = (userId: string) => `dismissed_notifications:${userId}`;

const MAX_IDS = 200;

export function getDismissedNotificationIds(userId: string): Set<string> {
  try {
    if (typeof window === "undefined") return new Set();
    const raw = window.localStorage.getItem(keyForUser(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v) => typeof v === "string"));
  } catch {
    return new Set();
  }
}

export function dismissNotificationIds(userId: string, ids: string[]) {
  try {
    if (typeof window === "undefined") return;
    if (!ids?.length) return;

    const existing = getDismissedNotificationIds(userId);
    for (const id of ids) existing.add(id);

    const arr = Array.from(existing);
    const capped = arr.length > MAX_IDS ? arr.slice(arr.length - MAX_IDS) : arr;
    window.localStorage.setItem(keyForUser(userId), JSON.stringify(capped));
  } catch {
    // ignore
  }
}
