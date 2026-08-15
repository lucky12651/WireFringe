export const REPORT_REASONS = [
  'Spam or advertising',
  'Harassment or hate',
  'Misinformation',
  'Off-topic',
  'Other',
];

export function reportReasonCategory(reason) {
  const text = String(reason || '').trim();
  if (!text) return '';
  const match = REPORT_REASONS.find(
    (item) => text === item || text.startsWith(`${item}:`) || text.startsWith(`${item} —`)
  );
  return match || 'Other';
}
