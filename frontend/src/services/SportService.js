import axios from "../config/apiEndpoints";
import { supabase } from "../config/supabaseClient";

const getSportInformation = async (sportId) => {
    return axios.get(`/api/sports/${sportId}`);
}

export {
    getSportInformation
}