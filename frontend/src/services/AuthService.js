import axios from "../config/apiEndpoints";
import { supabase } from "../config/supabaseClient";

const getUser = (inputId) => {
    return axios.get(`/api/users/${inputId}/profile`)
}

const normalizeRole = (role) => {
    if (!role) return null;

    const normalized = String(role).trim().replace(/\s+/g, '_').toUpperCase();

    if (normalized === 'SUPERADMIN') return 'SUPER_ADMIN';
    if (normalized === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    if (normalized === 'ADMIN') return 'ADMIN';
    if (normalized === 'USER') return 'USER';

    return normalized;
}

const getCurrentUserProfile = async (accessToken) => {
    let token = accessToken;

    if (!token) {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        token = data.session?.access_token;
    }

    if (!token) {
        throw new Error("User is not logged in");
    }

    return axios.get("/api/users/me/profile", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export {
    getUser,
    getCurrentUserProfile,
    normalizeRole
};
