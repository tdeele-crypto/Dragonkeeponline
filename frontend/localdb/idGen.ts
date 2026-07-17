/** Generates short, unique, locally-scoped IDs (replaces MongoDB ObjectIds).
 * Only needs to be unique within this device's local database. */
let counter = 0;

export function generateId(): string {
  counter = (counter + 1) % 46656; // 36^3
  const time = Date.now().toString(36);
  const seq = counter.toString(36).padStart(3, '0');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${time}${seq}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
