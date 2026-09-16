import axios from "../config/apiEndpoints";

const getSportInformation = async (sportId) => {
    return axios.get(`/api/sports/${sportId}`);
}

const getAllSports = async () => {
    return axios.get(`/api/sports`);
}

export {
    getSportInformation,
    getAllSports
}
