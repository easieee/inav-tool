/**
 * Date helpers for the SIM Manager tool.
 * Ported from inav-sim-manager/src/utils/date.ts
 */

export function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Set times to midnight to calculate pure day differences
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculates remaining days from regular load balance.
 * Expired after 90 days.
 * 90 days count down starts from loadDate.
 */
export function calculateRegularBalanceDaysRemaining(loadDateStr) {
  if (!loadDateStr) return 0;
  const loadDate = new Date(loadDateStr);
  const today = new Date();

  const elapsed = getDaysBetween(loadDate, today);
  const remaining = 90 - elapsed;
  return remaining < 0 ? 0 : remaining;
}

/**
 * Calculates days remaining for a promo given its expiration date.
 */
export function calculatePromoDaysRemaining(promoExpStr) {
  if (!promoExpStr) return 0;
  const expDate = new Date(promoExpStr);
  const today = new Date();
  const remaining = getDaysBetween(today, expDate);
  return remaining < 0 ? 0 : remaining;
}

/**
 * Calculates days remaining for the platform subscription.
 */
export function calculatePlatformDaysRemaining(expirationOfSubsStr) {
  if (!expirationOfSubsStr) return 0;
  const expDate = new Date(expirationOfSubsStr);
  const today = new Date();
  const remaining = getDaysBetween(today, expDate);
  return remaining < 0 ? 0 : remaining;
}

/**
 * Formats a date into YYYY-MM-DD
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Calculates a future date by adding days
 */
export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Determines if a SIM has an alert within the 3-day threshold.
 * Returns an array of { type: 'regular'|'promo'|'platform', daysLeft, label }
 */
export function getSimExpiryAlerts(sim) {
  const alerts = [];

  if (sim.loadDate) {
    const regDays = calculateRegularBalanceDaysRemaining(sim.loadDate);
    if (regDays <= 3 && regDays > 0) {
      alerts.push({
        type: 'regular',
        daysLeft: regDays,
        label: `Regular balance expires in ${regDays} days`
      });
    } else if (regDays === 0) {
      alerts.push({
        type: 'regular',
        daysLeft: 0,
        label: `Regular balance is expired/deactivated (90+ days)`
      });
    }
  }

  if (sim.promoExp) {
    const promoDays = calculatePromoDaysRemaining(sim.promoExp);
    if (promoDays <= 3 && promoDays > 0) {
      alerts.push({
        type: 'promo',
        daysLeft: promoDays,
        label: `Promo expires in ${promoDays} days`
      });
    } else if (promoDays === 0 && new Date(sim.promoExp) < new Date()) {
      alerts.push({
        type: 'promo',
        daysLeft: 0,
        label: `Promo has expired`
      });
    }
  }

  if (sim.expirationOfSubs) {
    const platformDays = calculatePlatformDaysRemaining(sim.expirationOfSubs);
    if (platformDays <= 3 && platformDays > 0) {
      alerts.push({
        type: 'platform',
        daysLeft: platformDays,
        label: `Platform subscription expires in ${platformDays} days`
      });
    } else if (platformDays === 0) {
      alerts.push({
        type: 'platform',
        daysLeft: 0,
        label: `Platform subscription has expired`
      });
    }
  }

  return alerts;
}
