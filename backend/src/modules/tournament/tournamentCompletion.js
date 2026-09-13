const PLAYED_STATUSES = new Set(['completed', 'resolved', 'archived', 'bye']);

function isMatchPlayed(match) {
  if (!match) return false;
  if (match.winning_competitor_id) return true;
  if (match.is_draw === true) return true;
  return PLAYED_STATUSES.has(match.status);
}

function nextTourStatusFromMatches(tourStatus, matches) {
  const status = tourStatus || 'draft';
  if (status === 'draft') return 'draft';

  const list = Array.isArray(matches) ? matches : [];
  const allPlayed = list.length > 0 && list.every(isMatchPlayed);

  if (allPlayed && (status === 'ongoing' || status === 'paused')) {
    return 'completed';
  }
  if (status === 'completed') {
    return allPlayed ? 'completed' : 'ongoing';
  }
  return status;
}

module.exports = {
  PLAYED_STATUSES,
  isMatchPlayed,
  nextTourStatusFromMatches,
};
