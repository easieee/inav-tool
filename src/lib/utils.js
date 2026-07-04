import { format, addDays } from 'date-fns';

/** Generate a short unique ID */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/** Format ISO date string to "Dec 25, 2024" */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'MMM dd, yyyy'); } catch { return dateStr; }
}

/** Format 24h "HH:MM" to "9:00 AM" */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Derive a technician's point total entirely from JobHistory.
 * Points are NEVER stored in the sheet — calculated on every render so
 * manual edits to the sheet have zero effect on the displayed score.
 *
 *   +3  per regular completed job where this tech was assigned
 *   +3  per back-job completion where this tech is the new assignee
 *   -5  for each back-job whose originalJobId points to a job where
 *        this tech was one of the original (failing) technicians
 */
export function calculateTechPoints(techId, jobHistory) {
  const byId = new Map(jobHistory.map(j => [j.id, j]));
  let pts = 0;

  for (const job of jobHistory) {
    const techs  = Array.isArray(job.technicianIds) ? job.technicianIds : [];
    const isBack = job.isBackJob === 'true';

    // Every completed job (regular or back-job) gives +3 to assigned techs
    if (techs.includes(techId)) pts += 3;

    // Back-job completion → penalise the original job's technicians
    if (isBack && job.originalJobId) {
      const orig = byId.get(job.originalJobId);
      if (orig) {
        const origTechs = Array.isArray(orig.technicianIds) ? orig.technicianIds : [];
        if (origTechs.includes(techId)) pts -= 5;
      }
    }
  }

  return pts;
}

/** Return today as "YYYY-MM-DD" */
export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Return array of Date objects: today + (count-1) following days */
export function getUpcomingDays(count = 7) {
  return Array.from({ length: count }, (_, i) => addDays(new Date(), i));
}

/** Clamp a value between min and max */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** Convert "HH:MM" to minutes since DAY_START (default 7 AM) */
export function timeToMinutes(timeStr, dayStart = 7) {
  const [h, m] = (timeStr || '07:00').split(':').map(Number);
  return (h - dayStart) * 60 + m;
}

/** Duration in minutes between two "HH:MM" strings */
export function durationMinutes(startTime, endTime) {
  const [sh, sm] = (startTime || '07:00').split(':').map(Number);
  const [eh, em] = (endTime || '08:00').split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}
