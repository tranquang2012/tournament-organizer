import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPencil, faBell, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth';

//import component


const FollowedTournaments = () => {

    const { profile: userData } = useAuth()

    return (
        <div>
            No tournament
        </div>
    );
};

export default FollowedTournaments;