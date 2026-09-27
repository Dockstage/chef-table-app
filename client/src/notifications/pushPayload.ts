export type StudioCancellationNotification = {
  type: 'class_cancelled';
  bookingId: string;
  reason: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedKeys = new Set(['type', 'bookingId', 'reason']);

export function parseStudioCancellationNotification(
  data: unknown,
): StudioCancellationNotification | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;

  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) return null;
  if (record.type !== 'class_cancelled') return null;
  if (typeof record.bookingId !== 'string' || !uuidPattern.test(record.bookingId)) return null;
  if (typeof record.reason !== 'string') return null;

  const reason = record.reason.trim();
  if (reason.length === 0 || record.reason.length > 500) return null;
  return { type: 'class_cancelled', bookingId: record.bookingId, reason };
}

export function isStudioCancellationNotification(
  data: unknown,
): data is StudioCancellationNotification {
  return parseStudioCancellationNotification(data) !== null;
}
