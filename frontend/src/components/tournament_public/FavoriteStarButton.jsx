import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ConfirmationModal from '../common/ConfirmationModal';
import {
  addFavorite,
  removeFavorite,
  getFavoriteStatus,
} from '../../services/FavoriteService';

const FavoriteStarButton = ({
  tournamentId,
  isFavorite: isFavoriteProp,
  onFavoriteChange,
  className = '',
  iconClassName = 'text-[18px]',
}) => {
  const navigate = useNavigate();
  const { isLogin } = useAuth();
  const [favorite, setFavorite] = useState(isFavoriteProp ?? false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isFavoriteProp !== undefined) {
      setFavorite(isFavoriteProp);
    }
  }, [isFavoriteProp]);

  useEffect(() => {
    if (isFavoriteProp !== undefined || !isLogin || !tournamentId) return;

    let cancelled = false;

    const loadStatus = async () => {
      try {
        const status = await getFavoriteStatus(tournamentId);
        if (!cancelled) {
          setFavorite(Boolean(status?.is_favorite));
        }
      } catch (err) {
        console.error('Failed to load favorite status:', err);
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [tournamentId, isLogin, isFavoriteProp]);

  const handleRedirectToLogin = () => {
    navigate('/login');
  };

  const handleClick = async (e) => {
    e.stopPropagation();

    if (!isLogin) {
      setShowConfirm(true);
      return;
    }

    if (loading) return;

    const next = !favorite;
    setFavorite(next);
    setLoading(true);

    try {
      if (next) {
        await addFavorite(tournamentId);
      } else {
        await removeFavorite(tournamentId);
      }
      onFavoriteChange?.(tournamentId, next);
    } catch (err) {
      console.error('Failed to update favorite:', err);
      setFavorite(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConfirmationModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRedirectToLogin}
        title="Favourite Tournament"
        description="You need to login to add this tournament to your favorite list. Do you want to login now?"
        intent="info"
        confirmLabel="Sign In"
        cancelLabel="Continue With Guest"
      />
      <button
        type="button"
        className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleClick}
        disabled={loading}
        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <FontAwesomeIcon
          icon={faStar}
          className={`${iconClassName} transition-colors duration-300 ${
            favorite
              ? 'text-yellow-500 hover:text-yellow-500/50'
              : 'text-gray-400 hover:text-yellow-500/50'
          }`}
        />
      </button>
    </>
  );
};

export default FavoriteStarButton;
