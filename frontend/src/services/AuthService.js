import axiosInstance from "../config/apiEndpoints";

const fetchUser = async () => {
    const response = await axiosInstance.get()
}

export {fetchUser};