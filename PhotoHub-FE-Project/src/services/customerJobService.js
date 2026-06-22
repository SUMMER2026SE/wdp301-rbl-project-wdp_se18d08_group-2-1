import axios from "axios";

const BASE_URL = "http://localhost:3000/api/customer/jobs";

const getAuthConfig = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  if (!isMultipart) headers["Content-Type"] = "application/json";
  return { headers };
};

export const customerJobService = {
  getMyJobPosts: async () => {
    const response = await axios.get(BASE_URL, getAuthConfig());
    return response.data;
  },

  createJobPost: async (formData) => {
    const response = await axios.post(BASE_URL, formData, getAuthConfig(true));
    return response.data;
  },

  uploadReferenceImages: async (jobId, formData) => {
    const response = await axios.post(
      `${BASE_URL}/${jobId}/images`,
      formData,
      getAuthConfig(true)
    );
    return response.data;
  },

  deleteJobPost: async (jobId) => {
    const response = await axios.delete(`${BASE_URL}/${jobId}`, getAuthConfig());
    return response.data;
  },

  closeJobPost: async (jobId) => {
    const response = await axios.patch(
      `${BASE_URL}/${jobId}/close`,
      {},
      getAuthConfig()
    );
    return response.data;
  },

  updateJobPost: async (jobId, formData) => {
    const response = await axios.put(`${BASE_URL}/${jobId}`, formData, getAuthConfig(true));
    return response.data;
  },
};
