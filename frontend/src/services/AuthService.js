import axios from "../config/apiEndpoints";
import { supabase } from "../config/supabaseClient";

const getUser = (inputId) => {
    return axios.get(`/api/users/${inputId}/profile`)
}

const getCurrentUserProfile = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
        throw new Error("User is not logged in");
    }

    return axios.get("/api/users/me/profile", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
}

export {
    getUser,
    getCurrentUserProfile
};
