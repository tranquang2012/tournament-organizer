export const formatTournamentDate = (dateStr) => {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'TBD';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const deriveTournamentStatus = (t) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = t.tour_startdate ? new Date(t.tour_startdate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  const end = t.tour_enddate ? new Date(t.tour_enddate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  if (t.tour_status === 'completed') return 'Ended';
  if (start && start > now) return 'Upcoming';
  if (end && end < now) return 'Ended';
  if (start && (!end || end >= now)) return 'Ongoing';
  return 'Upcoming';
};

export const mapPublicTournamentToCard = (t) => ({
  id: t.tour_id,
  name: t.tour_name,
  startDate: formatTournamentDate(t.tour_startdate),
  endDate: formatTournamentDate(t.tour_enddate),
  status: deriveTournamentStatus(t),
  image: t.tour_banner || t.sport_banner,
  location: t.tour_locat,
  description: t.tour_descrip,
});

export const mapFavoriteToCard = (favorite) => {
  const t = favorite.tournament;
  if (!t) return null;
  return mapPublicTournamentToCard(t);
};
