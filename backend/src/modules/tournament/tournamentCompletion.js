const PLAYED_STATUSES = new Set(['completed', 'resolved', 'archived', 'bye']);

function isMatchPlayed(match) {
  if (!match) return false;
  if (match.winning_competitor_id) return true;
  if (match.is_draw === true) return true;
  return PLAYED_STATUSES.has(match.status);
}

function hasHybridStageTwo(matches) {
  return (Array.isArray(matches) ? matches : []).some((match) => match?.stage === 'stage_2');
}

function nextTourStatusFromMatches(tourStatus, matches, { format } = {}) {
  const status = tourStatus || 'draft';
  if (status === 'draft') return 'draft';

  const list = Array.isArray(matches) ? matches : [];
  const allPlayed = list.length > 0 && list.every(isMatchPlayed);
  const hybridWaitingOnStageTwo = format === 'hybrid' && !hasHybridStageTwo(list);
  const finished = allPlayed && !hybridWaitingOnStageTwo;
  const alreadyEnded = status === 'ended' || status === 'completed';

  if (finished && (status === 'ongoing' || status === 'paused' || alreadyEnded)) {
    return 'ended';
  }
  if (alreadyEnded) {
    return finished ? 'ended' : 'ongoing';
  }
  return status;
}

module.exports = {
  PLAYED_STATUSES,
  isMatchPlayed,
  nextTourStatusFromMatches,
};
