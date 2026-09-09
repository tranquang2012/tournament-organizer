/**
 * Date and schedule formatting utilities
 */

export const formatTournamentDate = (dateStr) => {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBD';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatScoringSchedule = (scheduledStart) => {
  if (!scheduledStart) return null;
  const d = new Date(scheduledStart);
  if (isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
};

export const parseScheduleFields = (scheduledStart, scheduledEnd) => {
  let date = '';
  let startTime = '';
  let endTime = '';

  if (scheduledStart) {
    const sd = new Date(scheduledStart);
    if (!isNaN(sd.getTime())) {
      const year = sd.getFullYear();
      const month = String(sd.getMonth() + 1).padStart(2, '0');
      const day = String(sd.getDate()).padStart(2, '0');
      date = `${year}-${month}-${day}`;
      startTime = `${String(sd.getHours()).padStart(2, '0')}:${String(sd.getMinutes()).padStart(2, '0')}`;
    }
  }

  if (scheduledEnd) {
    const ed = new Date(scheduledEnd);
    if (!isNaN(ed.getTime())) {
      endTime = `${String(ed.getHours()).padStart(2, '0')}:${String(ed.getMinutes()).padStart(2, '0')}`;
    }
  }

  return { date, startTime, endTime };
};
