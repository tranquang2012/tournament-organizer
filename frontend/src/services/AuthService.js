import axios from "../config/apiEndpoints";
import { supabase } from "../config/supabaseClient";

const getUser = (inputId) => {
    return axios.get(`/api/users/${inputId}/profile`)
}

const getAccessToken = async (accessToken) => {
    if (accessToken) {
        return accessToken;
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    const token = data.session?.access_token;

    if (!token) {
        throw new Error("User is not logged in");
    }

    return token;
}

const withAuthHeader = (accessToken) => ({
    headers: {
        Authorization: `Bearer ${accessToken}`,
    },
})

const getAuthErrorMessage = (error) => {
    return error?.response?.data?.error?.message || error?.message || "Authentication failed";
}

const isDisabledAccountError = (error) => {
    return error?.response?.status === 403 && /disabled/i.test(getAuthErrorMessage(error));
}

const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
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
    const token = await getAccessToken(accessToken);

    return axios.get("/api/users/me/profile", withAuthHeader(token));
}

const updateCurrentUserProfile = async ({ fullName }, accessToken) => {
    const token = await getAccessToken(accessToken);

    return axios.patch(
        "/api/users/me/profile",
        { fullName },
        withAuthHeader(token),
    );
}

const uploadCurrentUserAvatar = async (file, accessToken) => {
    const token = await getAccessToken(accessToken);
    const dataUrl = await fileToDataUrl(file);

    return axios.post(
        "/api/users/me/avatar",
        { dataUrl },
        withAuthHeader(token),
    );
}

export {
    getUser,
    getCurrentUserProfile,
    updateCurrentUserProfile,
    uploadCurrentUserAvatar,
    normalizeRole,
    getAccessToken,
    withAuthHeader,
    getAuthErrorMessage,
    isDisabledAccountError
};
