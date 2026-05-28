import axios from "../config/apiEndpoints";

const getUser = (inputId) => {
    return axios.get(`/api/users/${inputId}/profile`)
}

export {
    getUser
};