export function isStudioCancellationNotification(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as { type?: unknown }).type === 'class_cancelled'
  );
}
