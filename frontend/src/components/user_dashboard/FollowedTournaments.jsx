import { useState, useEffect } from 'react';
import { listFavorites } from '../../services/FavoriteService';
import { mapFavoriteToCard } from '../../utils/tournamentCardMapper';
import TournamentCard from '../tournament_public/TournamentCard';
import notification from '../../assets/notification.png';

const FollowedTournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            setLoading(true);
            try {
                const favorites = await listFavorites();
                const mapped = favorites
                    .map(mapFavoriteToCard)
                    .filter(Boolean);
                setTournaments(mapped);
            } catch (err) {
                console.error('Failed to fetch favorite tournaments:', err);
                setTournaments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const handleFavoriteChange = (tournamentId, isFavorite) => {
        if (!isFavorite) {
            setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[300px]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#123836] rounded-full animate-spin" />
            </div>
        );
    }

    if (tournaments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px]">
                <img
                    src={notification}
                    alt="no-favorites"
                    className="w-[100px] h-[80px]"
                />
                <span className="text-[16px]">No favorite tournaments yet!</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 max-h-[360px] overflow-y-auto pr-1">
            {tournaments.map((tournament) => (
                <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    isFavorite={true}
                    onFavoriteChange={handleFavoriteChange}
                />
            ))}
        </div>
    );
};

export default FollowedTournaments;
