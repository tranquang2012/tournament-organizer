/**
 * Bracket & Match Formatting Logic
 */

export const generateMatchLabels = (matches, format, { style = 'bracket' } = {}) => {
  if (!matches || !Array.isArray(matches)) return {};

  const sorted = [...matches].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return String(a.match_id).localeCompare(String(b.match_id));
  });

  let wbCount = 0;
  let lbCount = 0;
  let singleCount = 0;
  const matchNames = {};

  sorted.forEach((m) => {
    const gName = m.group_name || '';
    let matchName;

    if (format === 'double_elimination') {
      if (gName === 'Grand Final') {
        matchName = style === 'card' ? 'GRAND FINAL' : 'Grand Final';
      } else if (gName === 'Lower Bracket') {
        lbCount++;
        matchName = style === 'card' ? `LB ${lbCount}` : `LB Match ${lbCount}`;
      } else {
        wbCount++;
        matchName = style === 'card' ? `WB ${wbCount}` : `WB Match ${wbCount}`;
      }
    } else if (format === 'single_elimination') {
      if (gName === 'Consolation Final') {
        matchName = style === 'card' ? 'CONSOLATION FINAL' : 'Consolation Final';
      } else {
        singleCount++;
        matchName = style === 'card' ? String(singleCount) : `Match ${singleCount}`;
      }
    } else {
      singleCount++;
      matchName = style === 'card' ? String(singleCount) : `Match ${singleCount}`;
    }

    matchNames[m.match_id] = matchName;
  });

  return matchNames;
};

export const mapMatchNode = (m, matchNames, isIndividual, defaultLogos = {}, format = null) => {
  const { logo1, logo2, playerDefaultLogo } = defaultLogos;

  let state = 'SCHEDULED';
  if (m.status === 'completed' || m.status === 'resolved' || m.status === 'bye') {
    state = 'DONE';
  } else if (m.status === 'running') {
    state = 'ONGOING';
  }

  const participants = [];
  const comp1 = m.competitors?.find((c) => c.comp_id === m.competitor1_id);
  const comp2 = m.competitors?.find((c) => c.comp_id === m.competitor2_id);
  const result1 = m.results?.find((r) => r.comp_id === m.competitor1_id);
  const result2 = m.results?.find((r) => r.comp_id === m.competitor2_id);
  const isCompleted = m.status === 'completed' || m.status === 'resolved';

  if (m.competitor1_id) {
    participants.push({
      id: String(m.competitor1_id),
      name: comp1?.comp_name || 'TBD',
      logo: comp1?.comp_logo || (comp1?.comp_size === 1 || isIndividual ? playerDefaultLogo : logo1),
      isWinner: m.winning_competitor_id === m.competitor1_id,
      resultText: result1 ? String(result1.score) : '0',
      status: isCompleted ? 'PLAYED' : undefined,
    });
  }

  if (m.competitor2_id) {
    participants.push({
      id: String(m.competitor2_id),
      name: comp2?.comp_name || 'TBD',
      logo: comp2?.comp_logo || (comp2?.comp_size === 1 || isIndividual ? playerDefaultLogo : logo2),
      isWinner: m.winning_competitor_id === m.competitor2_id,
      resultText: result2 ? String(result2.score) : '0',
      status: isCompleted ? 'PLAYED' : undefined,
    });
  }

  while (participants.length < 2) {
    const idx = participants.length;
    participants.push({
      id: `tbd-${m.match_id}-${idx}`,
      name: m.status === 'bye' ? 'BYE' : 'TBD',
      logo: m.status === 'bye' ? null : (isIndividual ? playerDefaultLogo : (idx === 0 ? logo1 : logo2)),
      isWinner: false,
      resultText: '0',
      status: undefined,
    });
  }

  const gName = m.group_name || '';
  let roundLabel = String(m.round);
  if (format === 'double_elimination' || gName === 'Grand Final' || gName === 'Lower Bracket') {
    if (gName === 'Grand Final') {
      roundLabel = 'Grand Final';
    } else if (gName === 'Lower Bracket') {
      roundLabel = `LB Round ${m.round}`;
    } else {
      roundLabel = `WB Round ${m.round}`;
    }
  }

  return {
    id: String(m.match_id),
    name: matchNames[m.match_id] || `Match ${m.match_id}`,
    nextMatchId: m.next_winner_match_id ? String(m.next_winner_match_id) : null,
    nextLooserMatchId: m.next_loser_match_id ? String(m.next_loser_match_id) : null,
    tournamentRoundText: roundLabel,
    startTime: m.scheduled_start ? new Date(m.scheduled_start).toLocaleDateString() : 'TBD',
    state,
    participants,
  };
};

export const transformBackendMatchesToBracket = (backendMatches, format, isIndividual, defaultLogos = {}) => {
  if (!backendMatches || !Array.isArray(backendMatches)) {
    return format === 'double_elimination' ? { upper: [], lower: [] } : [];
  }

  const matchNames = generateMatchLabels(backendMatches, format, { style: 'bracket' });

  if (format === 'double_elimination') {
    const upper = [];
    const lower = [];

    backendMatches.forEach((m) => {
      const mapped = mapMatchNode(m, matchNames, isIndividual, defaultLogos, format);
      const stageLower = (m.stage || '').toLowerCase();
      const groupLower = (m.group_name || '').toLowerCase();
      const isLoserBracket =
        stageLower.includes('lb') ||
        stageLower.includes('loser') ||
        groupLower.includes('loser') ||
        groupLower.includes('lower');

      if (isLoserBracket) {
        lower.push(mapped);
      } else {
        upper.push(mapped);
      }
    });

    return { upper, lower };
  }

  return backendMatches.map((m) => mapMatchNode(m, matchNames, isIndividual, defaultLogos, format));
};

export const mapMatchForCard = (m, matchNumberMap, isIndividual, defaultLogos = {}) => {
  const { logo1, logo2, playerDefaultLogo } = defaultLogos;
  const comp1 = m.competitors?.find((c) => c.comp_id === m.competitor1_id);
  const comp2 = m.competitors?.find((c) => c.comp_id === m.competitor2_id);
  const result1 = m.results?.find((r) => r.comp_id === m.competitor1_id);
  const result2 = m.results?.find((r) => r.comp_id === m.competitor2_id);

  let status = 'Upcoming';
  if (m.status === 'completed' || m.status === 'resolved' || m.status === 'bye') {
    status = 'Completed';
  } else if (m.status === 'running') {
    status = 'Ongoing';
  } else if (m.status === 'paused') {
    status = 'Paused';
  }

  return {
    id: m.match_id,
    matchNumber: matchNumberMap[m.match_id] || m.match_id,
    status,
    team1: {
      name: comp1?.comp_name || (m.status === 'bye' ? 'BYE' : 'TBD'),
      logo: comp1?.comp_logo || (isIndividual ? playerDefaultLogo : logo1),
      score: result1 ? result1.score : 0,
    },
    team2: {
      name: comp2?.comp_name || (m.status === 'bye' ? 'BYE' : 'TBD'),
      logo: comp2?.comp_logo || (isIndividual ? playerDefaultLogo : logo2),
      score: result2 ? result2.score : 0,
    },
  };
};
