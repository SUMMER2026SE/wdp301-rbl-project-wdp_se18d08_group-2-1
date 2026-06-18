import axios from "axios";

const API = "http://localhost:3000/api";

// Helper để lấy token
const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// upload images
export const uploadImages = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const res = await axios.post(`${API}/upload/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

// create package
export const createPackage = async (payload) => {
  const res = await axios.post(`${API}/packages`, payload, getHeaders());
  return res.data;
};

// GET my packages (Có hỗ trợ filter)
// Usage: getMyPackages({ categoryIds: ['id1'], styleTagIds: ['id2'] })
export const getMyPackages = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.categoryIds?.length) params.append("categoryIds", filters.categoryIds.join(","));
  if (filters.styleTagIds?.length) params.append("styleTagIds", filters.styleTagIds.join(","));

  const res = await axios.get(`${API}/packages/my?${params.toString()}`, getHeaders());
  return res.data;
};

// Get detail
export const getPackageDetail = async (packageId) => {
  const res = await axios.get(`${API}/packages/${packageId}`, getHeaders());
  return res.data;
};

// --- MỚI: Update, Toggle, Delete ---

// Update package
export const updatePackage = async (packageId, payload) => {
  const res = await axios.put(`${API}/packages/${packageId}`, payload, getHeaders());
  return res.data;
};

// Toggle status (Active <-> Inactive)
export const toggleStatusPackage = async (packageId) => {
  const res = await axios.patch(`${API}/packages/${packageId}/toggle-status`, {}, getHeaders());
  return res.data;
};

// Soft delete
export const softDeletePackage = async (packageId) => {
  const res = await axios.delete(`${API}/packages/${packageId}`, getHeaders());
  return res.data;
};