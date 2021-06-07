import { DateTime } from 'luxon';

export const formatDate = (timestamp: string, timzezone: string) => {
  const serverTime = DateTime.fromISO(timestamp, { setZone: true });
  return serverTime.setZone(timzezone).toLocaleString(DateTime.DATETIME_FULL);
};

