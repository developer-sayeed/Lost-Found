import { LostItem } from '../types';

/**
 * Checks whether an item was handed over within the last 24 hours.
 * According to hotel operational policies, "Return to Store" is only permissible
 * within a 24-hour grace period following handover. After 24 hours, the option auto-hides.
 */
export const isWithinHandover24Hours = (item?: LostItem | null): boolean => {
  if (!item) return false;
  if (item.status !== 'Handed Over' && !item.handoverDetails) return false;

  // 1. Check timeline for exact handover timestamp
  if (item.timeline && Array.isArray(item.timeline)) {
    const handoverEvent = [...item.timeline].reverse().find(t =>
      t.actionType === 'handover' ||
      (t.action && t.action.toLowerCase().includes('handed over'))
    );
    if (handoverEvent?.timestamp) {
      const eventTime = new Date(handoverEvent.timestamp).getTime();
      if (!isNaN(eventTime)) {
        const diffMs = Date.now() - eventTime;
        return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
      }
    }
  }

  // 2. Check handoverDetails.handoverDate
  if (item.handoverDetails?.handoverDate) {
    const parsedDate = new Date(item.handoverDetails.handoverDate).getTime();
    if (!isNaN(parsedDate)) {
      const diffMs = Date.now() - parsedDate;
      return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
    }
  }

  // 3. Fallback to updatedAt timestamp if status is Handed Over
  if (item.status === 'Handed Over' && item.updatedAt) {
    const updatedTime = new Date(item.updatedAt).getTime();
    if (!isNaN(updatedTime)) {
      const diffMs = Date.now() - updatedTime;
      return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
    }
  }

  return false;
};
